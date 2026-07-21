---
read_when:
    - Mengimplementasikan atau memperbarui klien WS Gateway
    - Men-debug ketidakcocokan protokol atau kegagalan koneksi
    - Membuat ulang skema/model protokol
summary: 'Protokol WebSocket Gateway: jabat tangan, frame, pembuatan versi'
title: Protokol Gateway
x-i18n:
    generated_at: "2026-07-21T12:33:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8b02b9366ca5ebfff8add001386fd56297a97d1d6932eea89745fc6e903f8a12
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway protokol WS adalah bidang kontrol tunggal dan transportasi Node untuk
OpenClaw. Klien operator dan Node (CLI, UI web, aplikasi macOS, Node iOS/Android,
Node headless) terhubung melalui WebSocket dan mendeklarasikan **peran** serta **cakupan** saat
handshake.

## Paket npm

Paket-paket ini disertakan dalam rangkaian rilis OpenClaw. Selama peluncuran awal,
npm mungkin mengembalikan `E404` hingga rilis pertama yang memuat paket dipublikasikan.

- [`@openclaw/gateway-protocol`](https://www.npmjs.com/package/@openclaw/gateway-protocol)
  memublikasikan skema, validator, tipe TypeScript, pembantu frame dan galat yang
  ringan, serta konstanta versi. Tarball-nya menyertakan kontrak yang dapat dibaca mesin
  [`protocol.schema.json`](https://unpkg.com/@openclaw/gateway-protocol/protocol.schema.json)
  yang dihasilkan.
- [`@openclaw/gateway-client`](https://www.npmjs.com/package/@openclaw/gateway-client)
  memublikasikan klien Node referensi dan titik masuk yang aman untuk peramban di
  `@openclaw/gateway-client/browser`.

Untuk panduan siklus hidup aplikasi, lihat
[Membangun klien Gateway](https://docs.openclaw.ai/gateway/clients). Untuk aplikasi
yang mengawasi Gateway sebagai proses anak, lihat
[Menyematkan OpenClaw](https://docs.openclaw.ai/gateway/embedding).

## Transportasi dan framing

- WebSocket, frame teks, payload JSON.
- Frame pertama **harus** berupa permintaan `connect`.
- Frame prapenyambungan dibatasi hingga 64 KiB (`MAX_PREAUTH_PAYLOAD_BYTES`). Setelah
  handshake, ikuti `hello-ok.policy.maxPayload` dan
  `hello-ok.policy.maxBufferedBytes`. Dengan diagnostik diaktifkan, frame
  masuk yang terlalu besar dan buffer keluar yang lambat memancarkan peristiwa `payload.large` sebelum
  gateway menutup atau membuang frame. Peristiwa ini membawa `surface`, ukuran
  byte, batas, dan kode alasan yang aman, tetapi tidak pernah memuat isi pesan, konten
  lampiran, byte frame mentah, token, cookie, atau rahasia.

Bentuk frame:

- Permintaan: `{type:"req", id, method, params}`
- Respons: `{type:"res", id, ok, payload|error}`
- Peristiwa: `{type:"event", event, payload, seq?, stateVersion?}`

Galat respons menggunakan `{ code, message, details?, retryable?, retryAfterMs? }`.
Klien sebaiknya membuat percabangan berdasarkan `code` dan `details.code`; `message` tetap dapat dibaca manusia
dan dapat berubah, kecuali jika catatan kompatibilitas menyatakan sebaliknya. Kegagalan
otorisasi tingkat metode menggunakan `code: "FORBIDDEN"` tingkat atas dengan detail
cakupan yang tidak tersedia secara terstruktur:

- Cakupan tidak tersedia: `{ code: "MISSING_SCOPE", missingScope, requiredScopes }`.
  `requiredScopes` adalah kumpulan lengkap cakupan yang diketahui untuk operasi yang diminta.
  Pesan lama `missing scope: <scope>` dipertahankan untuk klien lama.

Klien sebaiknya membaca `details` terlebih dahulu dan menggunakan pesan lama hanya sebagai fallback
kompatibilitas. `readMissingScopeError` dan `readMissingScopeErrorDetails` diekspor dari
`@openclaw/gateway-protocol/gateway-error-details`; klien gateway yang aman untuk peramban
mengekspornya kembali dari `@openclaw/gateway-client/browser`.

Skema diekspor sebagai `GatewayErrorDetailsSchema`,
`MissingScopeErrorDetailsSchema` dari `@openclaw/gateway-protocol/schema`.
Kegagalan cakupan HTTP mencerminkan objek `MISSING_SCOPE` di bawah `error.details` dan
menggunakan status HTTP `403`.

Metode yang menimbulkan efek samping memerlukan kunci idempotensi (lihat skema).

## Handshake

Gateway mengirimkan tantangan prapenyambungan:

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
melaporkan peran/cakupan yang dinegosiasikan meskipun tidak ada token perangkat yang diterbitkan (bentuk
di atas). `pluginSurfaceUrls` bersifat opsional dan memetakan nama permukaan plugin (mis.
`canvas`) ke URL terhosting dengan cakupan; URL tersebut dapat kedaluwarsa, sehingga Node memanggil
`node.pluginSurface.refresh` dengan `{ "surface": "canvas" }` untuk mendapatkan entri baru.
Jalur `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh`
yang tidak digunakan lagi tidak didukung; gunakan permukaan plugin.
`appliedConfigHash` opsional pada snapshot adalah revisi konfigurasi sumber yang telah diuraikan
dan diterima oleh runtime Gateway aktif. Klien dapat membandingkannya dengan
`config.get.configRevisionHash` untuk menentukan apakah konfigurasi tersimpan yang lebih baru masih
memerlukan mulai ulang. `config.get.hash` tetap menjadi revisi berkas akar mentah yang digunakan oleh
pelindung konflik penulisan konfigurasi.

Saat gateway masih menyelesaikan sidecar startup, `connect` dapat mengembalikan
galat `UNAVAILABLE` yang dapat dicoba ulang dengan `details.reason: "startup-sidecars"` dan
`retryAfterMs`. Coba ulang dalam anggaran koneksi Anda, alih-alih menganggapnya sebagai
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

Bootstrap kode QR/penyiapan bawaan adalah jalur serah terima seluler. Koneksi
kode penyiapan dasar yang berhasil mengembalikan satu token Node utama ditambah satu
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

Serah terima operator ini sengaja dibatasi: cukup untuk memulai loop
operator seluler dan penyiapan native, termasuk `operator.talk.secrets` untuk pembacaan
konfigurasi Talk, tetapi tanpa cakupan mutasi pemasangan dan tanpa `operator.admin`. Akses
pemasangan/admin yang lebih luas memerlukan pemasangan atau alur token terpisah yang disetujui. Persistenkan
`hello-ok.auth.deviceTokens` hanya ketika autentikasi bootstrap dijalankan melalui
transportasi tepercaya (`wss://` atau pemasangan loopback/lokal).

Klien backend dalam proses yang sama dan tepercaya (`client.id: "gateway-client"`,
`client.mode: "backend"`) dapat menghilangkan `device` pada koneksi loopback langsung saat
melakukan autentikasi dengan token/kata sandi gateway bersama. Jalur ini disediakan
untuk RPC bidang kontrol internal (mis. pembaruan sesi subagen) dan mencegah
dasar pemasangan CLI/perangkat yang usang memblokir pekerjaan backend lokal. Klien jarak jauh,
berasal dari peramban, Node, dan klien token perangkat/identitas perangkat eksplisit tetap
melalui pemeriksaan pemasangan serta peningkatan cakupan normal.

### Peran worker dan protokol tertutup

Worker cloud menggunakan ingress loopback khusus melalui tunnel SSH milik gateway
dengan kunci host yang disematkan. Ingress ini hanya menerima identitas worker dan tidak pernah meneruskan
autentikasi umum, peristiwa Node, RPC operator, atau metode plugin. `connect` yang ketat
memverifikasi kredensial berumur pendek dengan hash saat tersimpan yang terikat pada lingkungan, hash
bundel, epoch pemilik, versi kumpulan RPC, kedaluwarsa, dan satu sesi yang dapat bernilai null; secara
terpisah, kredensial ini memeriksa versi dan kumpulan fitur saat ini. Keberhasilan mengembalikan
`worker-hello-ok` minimal; negosiasi fitur tidak bergantung pada versi protokol umum.
Ukuran frame tetap di bawah 64 KiB, kecuali frame `worker.inference.start`
yang dinegosiasikan dapat mencapai 25 MiB. Daftar izin tertutup berisi `worker.heartbeat`,
`worker.transcript.commit`, `worker.live-event`, `worker.inference.start`, dan
`worker.inference.cancel`.

Commit transkrip menggunakan fencing epoch pemilik, pengikatan sesi milik gateway,
compare-and-swap daun dasar, serta pemutaran ulang urutan yang tahan lama; gateway menghasilkan
entri transkrip dan ID induk melalui penulis sesi normal. Kepemilikan dan
kedaluwarsa diperiksa ulang pada setiap RPC.

### Kapabilitas klien

Klien operator dapat mengiklankan kapabilitas opsional dalam `connect.params.caps`:

- `tool-events`: menerima peristiwa siklus hidup alat yang terstruktur.
- `inline-widgets`: dapat merender hasil alat widget inline yang dihosting.

Kapabilitas klien menjelaskan klien yang terhubung, bukan otorisasi. Alat agen dapat mendeklarasikan kapabilitas yang diperlukan; Gateway menghilangkan alat tersebut kecuali setiap persyaratan muncul dalam `caps` milik klien asal. Eksekusi yang berasal dari saluran tidak memiliki kapabilitas klien Gateway, sehingga alat yang dibatasi kapabilitas tidak tersedia meskipun kebijakan alat secara eksplisit mengizinkannya.

### Contoh koneksi Node

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

Node mendeklarasikan klaim kapabilitas saat koneksi:

- `caps`: kategori tingkat tinggi seperti `camera`, `canvas`, `screen`,
  `location`, `voice`, `talk`.
- `commands`: daftar izin perintah untuk pemanggilan.
- `permissions`: sakelar terperinci (mis. `screen.record`, `camera.capture`).

Gateway memperlakukan ini sebagai klaim dan memberlakukan daftar izin di sisi server.

## Peran dan cakupan

Untuk model cakupan operator lengkap, pemeriksaan saat persetujuan, dan semantik
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
tetapi prefiks inti yang dicadangkan ini selalu diuraikan menjadi `operator.admin`
(`src/shared/gateway-method-policy.ts`): `config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`.

Cakupan metode hanyalah gerbang pertama. Beberapa perintah garis miring yang dicapai melalui
`chat.send` menerapkan pemeriksaan tingkat perintah yang lebih ketat: penulisan persisten `/config set` dan
`/config unset` memerlukan `operator.admin`, bahkan untuk klien gateway yang
sudah memiliki cakupan operator yang lebih rendah.

`node.pair.approve` memiliki pemeriksaan cakupan tambahan saat persetujuan di atas cakupan
metode dasar (`operator.pairing`), berdasarkan `commands`
(`src/infra/node-pairing-authz.ts`) yang dideklarasikan oleh permintaan tertunda:

| Perintah yang dideklarasikan                                                                                                 | Cakupan yang diperlukan                   |
| ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| tidak ada                                                                                                                     | `operator.pairing`                        |
| perintah biasa                                                                                                                | `operator.pairing` + `operator.write` |
| mencakup `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir`, atau `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

### Kapabilitas/perintah/izin (node)

Node mendeklarasikan klaim kapabilitas saat terhubung:

- `caps`: kategori kapabilitas tingkat tinggi seperti `camera`, `canvas`, `screen`,
  `location`, `voice`, dan `talk`.
- `commands`: daftar izin perintah untuk pemanggilan.
- `permissions`: pengaturan terperinci (misalnya `screen.record`, `camera.capture`).

Gateway memperlakukan ini sebagai **klaim** dan memberlakukan daftar izin di sisi server.
Node yang terhubung dapat menerbitkan deskriptor Plugin atau alat MCP opsional yang terlihat oleh agen
dengan `node.pluginTools.update` setelah berhasil terhubung atau
terhubung kembali. Host node tanpa antarmuka memulai ulang untuk menerapkan perubahan inventaris MCP
deklaratif. Metode pembaruan ini adalah satu-satunya jalur penerbitan; deskriptor alat Plugin tidak diterima dalam
parameter `connect`. Setiap deskriptor harus menggunakan `name` alat yang aman bagi penyedia dan menyebutkan
`command` dalam daftar izin perintah node saat ini. Gateway memercayai metadata deskriptor
dari node yang dipasangkan, memfilter deskriptor di luar permukaan perintah yang disetujui,
menghapusnya saat node terputus, dan menolak upaya operator
untuk mengubah katalog node lain. Atur `gateway.nodes.pluginTools.enabled: false`
untuk mengabaikan deskriptor yang diterbitkan node.

Host node yang terhubung menerbitkan katalog pengganti skill lengkapnya dengan
`node.skills.update`. Metode peran node ini adalah satu-satunya jalur penerbitan skill
node; skill tidak diterima dalam parameter `connect`. Setiap deskriptor berisi
nama yang aman, deskripsi, dan konten `SKILL.md` yang dibatasi. Gateway mengurai
konten tersebut dengan pemuat Skills normal, menyertakannya dalam snapshot Skills agen
selama node terhubung, dan menghapusnya saat terputus. Atur
`gateway.nodes.skills.enabled: false` untuk mengabaikan Skills yang diterbitkan node.

## Kehadiran

- `system-presence` mengembalikan entri yang dikunci berdasarkan identitas perangkat, termasuk
  `deviceId`, `roles`, dan `scopes`, sehingga UI dapat menampilkan satu baris per perangkat bahkan
  ketika perangkat terhubung sebagai operator dan node sekaligus.
- `node.list` mencakup `lastSeenAtMs` dan `lastSeenReason` opsional. Node yang terhubung
  melaporkan waktu koneksi saat ini dengan alasan `connect`; node yang dipasangkan juga dapat
  melaporkan kehadiran latar belakang yang persisten melalui peristiwa node tepercaya.

Node macOS native juga dapat mengirim peristiwa `node.presence.activity` yang diautentikasi
dengan waktu input tidak aktif yang dibatasi. Gateway memperoleh stempel waktu aktivitas menggunakan
waktunya sendiri, mengekspos Mac terhubung yang paling baru melalui `node.list` dan
`node.describe`, serta menyiarkan pembaruan `node.presence` kepada klien dengan cakupan baca.
Lihat [Kehadiran komputer aktif](/id/nodes/presence) untuk perilaku pemilihan, privasi, konteks
model, dan perutean notifikasi.

### Peristiwa node tetap aktif di latar belakang

Node memanggil `node.event` dengan `event: "node.presence.alive"` untuk mencatat bahwa
node yang dipasangkan aktif selama pembangkitan latar belakang, tanpa menandainya sebagai terhubung:

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` adalah enum tertutup: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, `connect`. Nilai yang tidak dikenal dinormalisasi menjadi
`background` (`src/shared/node-presence.ts`). Peristiwa hanya dipersistenkan untuk
sesi perangkat node yang diautentikasi; sesi tanpa perangkat atau tidak dipasangkan mengembalikan
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

Gateway lama mungkin hanya mengembalikan `{ "ok": true }` untuk `node.event`; perlakukan hal tersebut
sebagai RPC yang diakui, bukan persistensi kehadiran yang tahan lama.

## Pencakupan peristiwa siaran

Peristiwa siaran yang didorong server dibatasi berdasarkan cakupan sehingga sesi yang
hanya memiliki cakupan pemasangan atau node tidak menerima konten sesi secara pasif
(`src/gateway/server-broadcast.ts`):

- Bingkai percakapan, agen, dan hasil alat (peristiwa `agent` yang dialirkan, peristiwa
  hasil alat) memerlukan setidaknya `operator.read`. Sesi yang tidak memilikinya melewati
  bingkai ini sepenuhnya.
- Siaran `plugin.*` yang ditentukan Plugin secara default dibatasi untuk `operator.write` atau
  `operator.admin`; entri eksplisit seperti
  `plugin.approval.requested` / `plugin.approval.resolved` menggunakan
  `operator.approvals` sebagai gantinya.
- Peristiwa status/transportasi (`heartbeat`, `presence`, `tick`, siklus hidup
  sambung/putus) tetap tidak dibatasi agar kesehatan transportasi dapat diamati oleh setiap
  sesi yang diautentikasi.
- Keluarga peristiwa siaran yang tidak dikenal dibatasi berdasarkan cakupan secara default (gagal-tertutup)
  kecuali pengendali terdaftar secara eksplisit melonggarkannya.

Setiap koneksi klien mempertahankan nomor urut per kliennya sendiri, sehingga siaran
tetap diurutkan secara monoton pada soket tersebut meskipun klien yang berbeda melihat
subset aliran peristiwa terfilter cakupan yang berbeda.

## Keluarga metode RPC

`hello-ok.features.methods` adalah daftar penemuan konservatif yang dibuat dari
`src/gateway/server-methods-list.ts` ditambah ekspor metode Plugin/saluran
yang dimuat—ini bukan dump yang dihasilkan dari setiap metode, dan beberapa metode (misalnya
`push.test`, `web.login.start`, `web.login.wait`, `sessions.usage`)
sengaja dikecualikan dari penemuan meskipun merupakan metode nyata yang dapat
dipanggil. Perlakukan ini sebagai penemuan fitur, bukan enumerasi lengkap
`src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistem dan identitas">
    - `health` mengembalikan snapshot kesehatan Gateway yang tersimpan dalam cache atau baru diperiksa.
    - `diagnostics.stability` mengembalikan pencatat stabilitas diagnostik terbaru yang dibatasi: nama peristiwa, jumlah, ukuran byte, pembacaan memori, status antrean/sesi, nama saluran/Plugin, id sesi. Tidak ada teks percakapan, isi Webhook, keluaran alat, isi permintaan/respons mentah, token, cookie, atau rahasia. Memerlukan `operator.read`.
    - `status` mengembalikan ringkasan Gateway bergaya `/status`; bidang sensitif hanya untuk klien operator dengan cakupan admin.
    - `gateway.identity.get` mengembalikan identitas perangkat Gateway yang digunakan oleh alur relai dan pemasangan.
    - `system-presence` mengembalikan snapshot kehadiran saat ini untuk perangkat operator/node yang terhubung.
    - `system-event` menambahkan peristiwa sistem dan dapat memperbarui/menyiarkan konteks kehadiran.
    - `last-heartbeat` mengembalikan peristiwa Heartbeat persisten terbaru.
    - `set-heartbeats` mengaktifkan atau menonaktifkan pemrosesan Heartbeat pada Gateway.
    - `gateway.suspend.prepare` membuat sewa penangguhan kooperatif singkat hanya ketika pekerjaan Gateway yang dilacak sedang tidak aktif. `gateway.suspend.status` memeriksa sewa tersebut, dan `gateway.suspend.resume` melepaskannya setelah pencairan atau operasi host yang dibatalkan.

  </Accordion>

  <Accordion title="Model dan penggunaan">
    - `models.list` mengembalikan katalog model yang diizinkan runtime. Lihat "tampilan `models.list`" di bawah.
    - `usage.status` mengembalikan ringkasan jendela penggunaan penyedia/kuota tersisa.
    - `usage.cost` mengembalikan ringkasan penggunaan biaya gabungan untuk suatu rentang tanggal. Teruskan `agentId` untuk satu agen, atau `agentScope: "all"` untuk menggabungkan agen yang dikonfigurasi.
    - `doctor.memory.status` mengembalikan kesiapan memori vektor/embedding yang tersimpan dalam cache untuk ruang kerja agen default aktif. Teruskan `{ "probe": true }` atau `{ "deep": true }` hanya untuk ping eksplisit ke penyedia embedding aktif. Teruskan `{ "agentId": "agent-id" }` untuk membatasi statistik penyimpanan Dreaming ke satu ruang kerja agen; jika dihilangkan, statistik ruang kerja Dreaming yang dikonfigurasi akan digabungkan.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts`, dan `doctor.memory.dedupeDreamDiary` menerima `{ "agentId": "agent-id" }` opsional; jika dihilangkan, metode tersebut beroperasi pada ruang kerja agen default yang dikonfigurasi.
    - `doctor.memory.remHarness` mengembalikan pratinjau harness REM hanya-baca yang dibatasi untuk klien bidang kontrol jarak jauh, termasuk jalur ruang kerja, cuplikan memori, markdown berdasar yang dirender, dan kandidat promosi mendalam. Memerlukan `operator.read`.
    - `sessions.usage` mengembalikan ringkasan penggunaan per sesi. Teruskan `agentId` untuk satu agen, atau `agentScope: "all"` untuk mencantumkan agen yang dikonfigurasi bersama-sama.
      Kedua metode penggunaan menerima `mode: "specific"` dengan `timeZone` IANA untuk batas dan kelompok hari kalender yang mempertimbangkan DST. `utcOffset` tetap didukung untuk klien lama dan sebagai cadangan ketika runtime Gateway tidak mengenali zona yang diminta.
    - `sessions.usage.timeseries` mengembalikan penggunaan deret waktu untuk satu sesi.
    - `sessions.usage.logs` mengembalikan entri log penggunaan untuk satu sesi.

  </Accordion>

  <Accordion title="Saluran dan pembantu login">
    - `channels.status` mengembalikan ringkasan status saluran/Plugin bawaan + terpaket.
    - `channels.logout` mengeluarkan akun dari saluran/akun tertentu jika saluran mendukungnya.
    - `web.login.start` memulai alur login QR/web untuk penyedia saluran web saat ini yang mendukung QR.
    - `web.login.wait` menunggu alur tersebut selesai dan memulai saluran jika berhasil.
    - `push.test` mengirim push APNs pengujian ke node iOS terdaftar.
    - `voicewake.get` mengembalikan pemicu kata aktivasi yang tersimpan.
    - `voicewake.set` memperbarui pemicu kata aktivasi dan menyiarkan perubahan.

  </Accordion>

  <Accordion title="Pengelolaan Plugin">
    - `plugins.list` (`operator.read`) mengembalikan inventaris Plugin yang terinstal beserta pilihan resmi yang dikurasi secara lokal, diagnostik, dan apakah mode instalasi saat ini mengizinkan perubahan.
    - `plugins.search` (`operator.read`) mencari keluarga Plugin kode dan Plugin bundel ClawHub yang dapat diinstal. Teruskan `query` yang tidak kosong dan `limit` opsional dari 1 hingga 100.
    - `plugins.install` (`operator.admin`) menginstal entri katalog resmi dengan `{ source: "official", pluginId }` atau paket ClawHub dengan `{ source: "clawhub", packageName, version?, acknowledgeClawHubRisk? }`. Instalasi ClawHub mempertahankan pemeriksaan kepercayaan, integritas, dan kebijakan instalasi Gateway. Instalasi yang berhasil memerlukan mulai ulang Gateway.
    - `plugins.setEnabled` (`operator.admin`) mengubah kebijakan pengaktifan satu Plugin yang terinstal dengan `{ pluginId, enabled }`. Respons mencakup entri katalog yang diperbarui, metadata mulai ulang, dan peringatan pemilihan slot.
    - `plugins.uninstall` (`operator.admin`) menghapus satu Plugin yang diinstal secara eksternal dengan `{ pluginId }`: referensi konfigurasi, catatan instalasi, dan file terkelola. Plugin terpaket tidak dapat dihapus instalasinya, hanya dapat dinonaktifkan. Respons mencantumkan tindakan penghapusan dan selalu memerlukan mulai ulang Gateway.

  </Accordion>

  <Accordion title="Pesan dan log">
    - `send` adalah RPC pengiriman keluar langsung untuk pengiriman yang menargetkan kanal/akun/utas di luar runner chat.
    - `logs.tail` mengembalikan bagian akhir log berkas Gateway yang dikonfigurasi dengan kontrol kursor/batas dan byte maksimum.

  </Accordion>

  <Accordion title="Terminal operator">
    - `terminal.open` memulai PTY host untuk `agentId` eksplisit atau agen default dan mengembalikan agen yang ditetapkan, direktori kerja, shell, dan status pembatasan.
    - `terminal.input`, `terminal.resize`, dan `terminal.close` hanya beroperasi pada sesi yang dimiliki oleh koneksi pemanggil.
    - `terminal.upload` menerima satu berkas base64 hingga 16 MiB, menempatkannya di direktori sementara privat selama 24 jam pada Gateway sesi atau host node yang dipasangkan, dan mengembalikan jalur absolut. Pemanggil tetap harus menempelkan atau menggunakan jalur tersebut dengan cara lain; RPC tidak pernah menulis masukan terminal atau menjalankan perintah.
    - Peristiwa `terminal.data` dan `terminal.exit` hanya dialirkan ke koneksi yang memiliki sesi.
    - Sesi yang koneksinya terputus akan dilepaskan, bukan dihentikan: sesi tersebut tetap dapat disambungkan kembali selama `gateway.terminal.detachedSessionTimeoutSeconds` (default 300; `0` memulihkan penghentian saat koneksi terputus), sementara keluaran terbaru terakumulasi dalam buffer sisi server yang dibatasi.
    - `terminal.list` mengembalikan sesi yang dapat disambungkan; `terminal.attach` mengikat ulang sesi aktif atau yang dilepaskan ke koneksi pemanggil dan mengembalikan buffer pemutaran ulang (pengambilalihan bergaya tmux — pemilik aktif sebelumnya menerima `terminal.exit` dengan alasan `detached`); `terminal.text` membaca buffer sebagai teks biasa tanpa menyambungkan.
    - Setiap metode terminal memerlukan `operator.admin`; `gateway.terminal.enabled` harus secara eksplisit bernilai true. Agen yang sepenuhnya berada dalam sandbox ditolak, dan perubahan kebijakan agen menutup PTY yang ada maupun yang sedang diproses, termasuk yang dilepaskan.

  </Accordion>

  <Accordion title="Percakapan dan TTS">
    - `talk.catalog` mengembalikan katalog penyedia Percakapan hanya-baca untuk ucapan, transkripsi streaming, dan suara waktu nyata: id penyedia kanonis, alias registri, label, status konfigurasi, hasil `ready` tingkat grup opsional, id model/suara yang diekspos, mode kanonis, transportasi, strategi otak, serta flag audio/kapabilitas waktu nyata, tanpa mengembalikan rahasia penyedia atau mengubah konfigurasi global. Gateway saat ini menetapkan `ready` setelah menerapkan pemilihan penyedia runtime; anggap ketiadaannya sebagai belum terverifikasi pada Gateway lama.
    - `talk.config` mengembalikan payload konfigurasi Percakapan yang berlaku; `includeSecrets` memerlukan `operator.talk.secrets` (atau `operator.admin`).
    - `talk.session.create` membuat sesi Percakapan milik Gateway untuk `realtime/gateway-relay`, `transcription/gateway-relay`, atau `stt-tts/managed-room`. Untuk `stt-tts/managed-room`, pemanggil `operator.write` yang meneruskan `sessionKey` juga harus meneruskan `spawnedBy` untuk visibilitas kunci sesi tercakup; pembuatan `sessionKey` tanpa cakupan dan `brain: "direct-tools"` memerlukan `operator.admin`.
    - `talk.session.join` memvalidasi token sesi ruang terkelola, memancarkan `session.ready` atau `session.replaced` sesuai kebutuhan, dan mengembalikan metadata ruang/sesi beserta peristiwa Percakapan terbaru, tanpa pernah mengembalikan token teks biasa atau hash-nya.
    - `talk.session.appendAudio` menambahkan audio masukan PCM base64 ke sesi relai waktu nyata dan transkripsi milik Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn`, dan `talk.session.cancelTurn` mengendalikan siklus hidup giliran ruang terkelola dengan penolakan giliran kedaluwarsa sebelum status dihapus.
    - `talk.session.cancelOutput` menghentikan keluaran audio asisten, terutama untuk interupsi yang dibatasi VAD dalam sesi relai Gateway.
    - `talk.session.submitToolResult` menyelesaikan pemanggilan alat penyedia yang dipancarkan oleh sesi relai waktu nyata milik Gateway. Permintaan menunggu sinyal penyelesaian asinkron apa pun yang diekspos oleh jembatan penyedia; pengiriman yang gagal mempertahankan proses terkait tetap aktif dan tidak memancarkan peristiwa hasil alat yang berhasil. Teruskan `options: { willContinue: true }` untuk keluaran alat sementara atau `options: { suppressResponse: true }` saat jembatan penyedia mengiklankan dukungan supresi dan hasil tidak boleh memulai respons lain.
    - `talk.session.steer` mengirimkan kontrol suara proses aktif ke sesi Percakapan berbasis agen milik Gateway: `{ sessionId, text, mode? }`, dengan `mode` berupa `status`, `steer`, `cancel`, atau `followup`; mode yang dihilangkan diklasifikasikan dari teks yang diucapkan.
    - `talk.session.close` menutup sesi relai, transkripsi, atau ruang terkelola milik Gateway dan memancarkan peristiwa Percakapan terminal.
    - `talk.mode` menetapkan/menyiarkan status mode Percakapan saat ini untuk klien WebChat/Control UI.
    - `talk.client.create` membuat atau melanjutkan sesi penyedia waktu nyata milik klien menggunakan `webrtc` atau `provider-websocket`, sementara Gateway memiliki kredensial, instruksi, kebijakan alat, dan `voiceSessionId` yang dikembalikan. Klien meneruskan `sessionKey` dan menggunakan kembali `voiceSessionId` saat mengganti transportasi penyedia selama satu panggilan.
    - `talk.client.transcript` menambahkan satu item `{ role, text }` yang telah difinalisasi ke sesi agen normal. `entryId` yang diwajibkan bersifat idempoten dalam `voiceSessionId`; percobaan ulang tidak menduplikasi pesan transkrip.
    - `talk.client.close` menutup sesi suara logis setelah penulisan transkrip yang tertunda. Penutupan bersifat idempoten dan dapat mengirimkan ringkasan panggilan khusus-mutasi ke kanal non-WebChat terakhir sesi.
    - `talk.client.toolCall` memungkinkan transportasi waktu nyata milik klien meneruskan pemanggilan alat penyedia ke kebijakan Gateway. Alat pertama yang didukung adalah `openclaw_agent_consult`; klien mendapatkan id proses dan menunggu peristiwa siklus hidup chat normal sebelum mengirimkan hasil alat khusus penyedia. Tindakan berdampak tinggi yang terikat suara mengembalikan `VOICE_CONFIRMATION_REQUIRED:<id>` hingga ucapan pengguna berikutnya yang telah difinalisasi secara eksplisit mengonfirmasi tindakan tersebut dan konsultasi berikutnya memasok `confirmationId`.
    - `talk.client.steer` mengirimkan kontrol suara proses aktif untuk transportasi waktu nyata milik klien. Gateway menetapkan proses tertanam yang aktif dari `sessionKey` dan mengembalikan hasil diterima/ditolak yang terstruktur alih-alih membuang pengarahan secara diam-diam.
    - `talk.event` adalah kanal peristiwa Percakapan tunggal untuk adaptor waktu nyata, transkripsi, STT/TTS, ruang terkelola, telefoni, dan rapat.
    - `talk.speak` menyintesis ucapan melalui penyedia ucapan Percakapan yang aktif.
    - `tts.status` mengembalikan status pengaktifan TTS, penyedia aktif, penyedia cadangan, dan status konfigurasi penyedia.
    - `tts.providers` mengembalikan inventaris penyedia TTS yang terlihat.
    - `tts.enable` dan `tts.disable` mengalihkan status preferensi TTS.
    - `tts.setProvider` memperbarui penyedia TTS pilihan.
    - `tts.convert` menjalankan konversi teks-ke-ucapan satu kali.
    - `tts.speak` (`operator.write`) merender `text` yang tidak kosong dengan rantai penyedia TTS umum yang dikonfigurasi dan mengembalikan satu klip utuh secara inline sebagai `audioBase64`, beserta `provider` dan metadata opsional `outputFormat`, `mimeType`, serta `fileExtension`. Tidak seperti `tts.convert`, metode ini tidak mengembalikan jalur lokal Gateway; tidak seperti `talk.speak`, metode ini tidak memerlukan penyedia Percakapan. Teks di atas `messages.tts.maxTextLength` mengembalikan `INVALID_REQUEST`; kegagalan sintesis mengembalikan `UNAVAILABLE`.

  </Accordion>

  <Accordion title="Rahasia, konfigurasi, pembaruan, dan wisaya">
    - `secrets.reload` menetapkan ulang SecretRef aktif dan memublikasikan status runtime yang mengenali pemilik secara atomik. Kegagalan pemilik yang memenuhi syarat dapat dipublikasikan sebagai degradasi dingin atau kedaluwarsa dengan `warningCount`; kegagalan ketat atau yang tidak dipetakan menolak pemuatan ulang dan mempertahankan snapshot aktif.
    - `secrets.resolve` menetapkan penugasan rahasia target perintah untuk kumpulan perintah/target tertentu.
    - `config.get` mengembalikan snapshot konfigurasi pada disk saat ini, `hash` berkas root mentah, `configRevisionHash` yang ditetapkan, dan `appliedConfigHash` opsional untuk revisi yang ditetapkan dan diterima oleh runtime Gateway aktif.
    - `config.set` menulis payload konfigurasi yang telah divalidasi.
    - `config.patch` menggabungkan pembaruan konfigurasi parsial. Penggantian array yang destruktif memerlukan jalur yang terdampak dalam `replacePaths`; array bersarang di bawah entri array menggunakan jalur `[]` seperti `agents.list[].skills`.
    - `config.apply` memvalidasi + mengganti payload konfigurasi lengkap.
    - `config.schema` mengembalikan payload skema konfigurasi langsung yang digunakan oleh Control UI dan alat CLI: skema, `uiHints`, versi, metadata pembuatan, serta metadata skema Plugin + kanal bila dapat dimuat. Payload ini mencakup metadata `title` / `description` dari teks label/bantuan yang sama dengan UI, termasuk cabang komposisi objek bersarang, wildcard, item array, dan `anyOf` / `oneOf` / `allOf` saat dokumentasi kolom yang cocok tersedia.
    - `config.schema.lookup` mengembalikan payload pencarian tercakup jalur untuk satu jalur konfigurasi: jalur yang dinormalisasi, node skema dangkal, petunjuk yang cocok + `hintPath`, `reloadKind` opsional, dan ringkasan anak langsung untuk penelusuran UI/CLI. `reloadKind` adalah salah satu dari `restart`, `hot`, atau `none` (`src/config/schema.ts`) dan mencerminkan perencana pemuatan ulang konfigurasi Gateway untuk jalur yang diminta. Node skema pencarian mempertahankan dokumentasi yang ditampilkan kepada pengguna dan kolom validasi umum (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, batas numerik/string/array/objek, `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Ringkasan anak mengekspos `key`, `path` yang dinormalisasi, `type`, `required`, `hasChildren`, `reloadKind` opsional, beserta `hint` / `hintPath` yang cocok.
    - `update.run` menjalankan alur pembaruan Gateway dan menjadwalkan mulai ulang hanya jika pembaruan berhasil; pemanggil yang memiliki sesi dapat menyertakan `continuationMessage` agar proses awal melanjutkan satu giliran agen tindak lanjut melalui antrean kelanjutan mulai ulang. Pembaruan pengelola paket dan pembaruan checkout git yang diawasi dari bidang kontrol menggunakan serah-terima layanan terkelola yang dilepaskan, alih-alih mengganti hierarki paket atau mengubah keluaran checkout/build di dalam Gateway yang aktif. Serah-terima yang dimulai mengembalikan `ok: true` dengan `result.reason: "managed-service-handoff-started"` dan `handoff.status: "started"`. `update.run` konkuren kedua yang ditangani oleh proses Gateway yang sama mengembalikan `ok: false` dengan `result.reason: "managed-service-handoff-already-running"` dan `handoff.status: "already-running"`; kelanjutannya tidak diterima sehingga pemanggil dapat mencoba lagi setelah pembaruan aktif selesai. Pembaru CLI mandiri dan proses Gateway pengganti berada di luar perlindungan lokal-proses ini. Serah-terima yang tidak tersedia atau gagal mengembalikan `ok: false` dengan `managed-service-handoff-unavailable` atau `managed-service-handoff-failed`, beserta `handoff.command` ketika pembaruan shell manual diperlukan. Tidak tersedia berarti OpenClaw tidak memiliki batas supervisor yang aman atau identitas layanan persisten, seperti `OPENCLAW_SYSTEMD_UNIT` untuk systemd. Selama serah-terima yang telah dimulai, sentinel mulai ulang dapat secara singkat melaporkan `stats.reason: "restart-health-pending"`; kelanjutan ditunda hingga CLI memverifikasi Gateway yang telah dimulai ulang dan menulis sentinel akhir `ok`.
    - `update.status` menyegarkan dan mengembalikan sentinel mulai ulang pembaruan terbaru, termasuk versi yang berjalan setelah mulai ulang jika tersedia.
    - `wizard.start`, `wizard.next`, `wizard.status`, dan `wizard.cancel` mengekspos wisaya orientasi awal melalui RPC WS.

  </Accordion>

  <Accordion title="Pembantu agen dan ruang kerja">
    - `agents.list` mengembalikan entri agen yang terlihat oleh Gateway, termasuk metadata model/runtime efektif dan `kind` semantik opsional (`agent` atau `system`). Klien mengiklankan kapabilitas handshake `agent-kind` untuk menerima daftar lengkap bertipe; klien tanpa kapabilitas tersebut tetap menggunakan daftar lama yang aman untuk pemilih tanpa baris sistem. Klien yang memahami jenis mengecualikan baris `system` dari pemilih biasa, tetapi tetap menyertakannya dalam tampilan diagnostik. Gateway v4 yang lebih lama dapat mengembalikan baris tanpa `kind`.
    - `agents.create`, `agents.update`, dan `agents.delete` mengelola catatan agen dan pengkabelan ruang kerja.
    - `agents.files.list`, `agents.files.get`, dan `agents.files.set` mengelola file ruang kerja bootstrap yang diekspos untuk agen.
    - `audit.activity.list` mengembalikan buku besar aktivitas berversi yang hanya berisi metadata; `audit.list` tetap menjadi RPC proses/alat yang aman untuk kompatibilitas.
    - `agents.workspace.list` dan `agents.workspace.get` (`operator.read`) menyediakan penelusuran berpaginasi hanya-baca atas direktori ruang kerja agen bagi klien dalam domain operator tepercaya yang dijelaskan di [Cakupan operator](/id/gateway/operator-scopes). Permintaan hanya menerima jalur relatif terhadap ruang kerja; pembacaan tetap dibatasi pada root ruang kerja yang telah di-realpath (pelolosan melalui symlink dan hardlink ditolak), dibatasi ukurannya, dan terbatas pada teks UTF-8 serta jenis gambar umum (base64). Respons tidak mengekspos jalur ruang kerja host. Tidak ada operasi tulis dalam namespace ini.
    - `tasks.list`, `tasks.get`, dan `tasks.cancel` mengekspos buku besar tugas Gateway kepada klien SDK dan operator. Lihat [RPC buku besar tugas](#task-ledger-rpcs) di bawah.
    - `artifacts.list`, `artifacts.get`, dan `artifacts.download` mengekspos ringkasan dan unduhan artefak yang diturunkan dari transkrip untuk cakupan `sessionKey`, `runId`, atau `taskId` yang eksplisit. Kueri proses dan tugas menentukan sesi pemilik di sisi server dan hanya mengembalikan media transkrip dengan asal-usul yang cocok; sumber URL yang tidak aman atau lokal mengembalikan unduhan yang tidak didukung alih-alih mengambilnya di sisi server.
    - `environments.list` dan `environments.status` mempertahankan penemuan lingkungan lokal Gateway dan Node. Worker cloud yang dikonfigurasi dan catatan tahan lama yang ditinggalkan oleh profil sebelumnya menambahkan metadata `worker` dengan `providerId`, `leaseId` opsional, `state`, `ageMs`, `idleMs` opsional, dan `attachedSessionIds`. Status siklus hidup worker adalah `requested`, `provisioning`, `bootstrapping`, `ready`, `attached`, `idle`, `draining`, `destroying`, `destroyed`, `failed`, dan `orphaned`.
    - `environments.create` (`{ profileId, idempotencyKey }`) menyediakan worker dari profil penyedia plugin yang dikonfigurasi; percobaan ulang dengan kunci yang sama menggunakan kembali operasi tahan lama tersebut. `environments.destroy` (`{ environmentId }`) meminta pembongkaran idempoten atas lingkungan worker tahan lama. Keduanya memerlukan `operator.admin`, merupakan penulisan bidang kontrol, dan mengembalikan bentuk ringkasan lingkungan yang sama dengan yang digunakan oleh respons status.
    - `agent.identity.get` mengembalikan identitas asisten efektif untuk agen atau sesi.
    - `agent.wait` menunggu proses selesai dan mengembalikan snapshot terminal jika tersedia.

  </Accordion>

  <Accordion title="Kontrol sesi">
    - `sessions.list` mengembalikan indeks sesi saat ini, termasuk metadata `agentRuntime` per baris ketika backend runtime agen dikonfigurasi. Saat penempatan worker cloud diaktifkan atau status pemulihan tahan lama tersedia, baris sesi juga menyertakan status `placement` tertutup (`local`, `requested`, `provisioning`, `syncing`, `starting`, `active`, `draining`, `reconciling`, `reclaimed`, atau `failed`) beserta bidang lingkungan, epoch pemilik, ruang kerja, bundel, kursor ACK, atau pemulihan yang spesifik untuk status tersebut.
    - `sessions.subscribe` dan `sessions.unsubscribe` mengaktifkan atau menonaktifkan langganan peristiwa perubahan sesi untuk klien WS saat ini.
    - `sessions.messages.subscribe` dan `sessions.messages.unsubscribe` mengaktifkan atau menonaktifkan langganan peristiwa transkrip/pesan untuk satu sesi. Teruskan `includeApprovals: true` agar juga menerima peristiwa siklus hidup `session.approval` yang telah disanitasi untuk persetujuan yang audiens tersimpannya mencakup sesi tersebut secara persis dan yang pengikatan peninjaunya mengizinkan klien pelanggan. Respons langganan kemudian menyertakan `approvalReplay` tertunda yang dibatasi; nilai tersebut bersifat otoritatif saat `truncated` bernilai false. Keikutsertaan ini berlaku per panggilan langganan, bukan persisten: berlangganan ulang ke sesi yang sama tanpa `includeApprovals: true` menghapus langganan persetujuan yang sudah ada. Selain otoritas baca sesi normal, keikutsertaan ini memerlukan `operator.admin`, atau `operator.approvals` pada perangkat yang dipasangkan.
    - `sessions.preview` mengembalikan pratinjau transkrip terbatas untuk kunci sesi tertentu.
    - `sessions.describe` mengembalikan satu baris sesi Gateway untuk kunci sesi yang persis.
    - `sessions.resolve` menentukan atau mengkanoniskan target sesi.
    - `sessions.create` membuat entri sesi baru. Nilai `model` dan `thinkingLevel` opsional menyimpan penggantian awal model dan penalaran secara atomik. `worktree: true` menyediakan worktree terkelola; `worktreeBaseRef`/`worktreeName` opsional memilih ref dasar dan nama cabang, dan `execNode` (`operator.admin`) mengikat eksekusi sesi ke host Node. Worktree yang dibuat dicerminkan dalam hasil dan disimpan pada baris sesi (`worktree: { id, branch, repoRoot }`). Ketika entri berhasil dibuat tetapi `chat.send` awal bertingkatnya ditolak, hasil yang berhasil menyertakan `runStarted: false` dan `runError`; klien dapat mempertahankan prompt dan mencoba kembali menggunakan kunci sesi yang dikembalikan. Pemanggil yang meneruskan `parentSessionKey` dengan `emitCommandHooks: true` juga harus mendeklarasikan disposisi siklus hidup anak yang berbeda: `succeedsParent: true` mengakhiri induk dengan `session_end`, sedangkan `false` mempertahankan induk tetap aktif dan hanya memancarkan `session_start` milik anak. Menghilangkan `succeedsParent` mempertahankan perilaku peralihan induk lama untuk klien yang sudah ada. Disposisi tersebut memerlukan tautan induk dan hook perintah; fork tidak dapat menyelesaikan induknya dengan sukses. Perilaku reset di tempat untuk sesi utama tidak berubah karena tidak ada anak terpisah yang dibuat.
    - `sessions.dispatch` (`operator.admin`) memindahkan sesi OpenClaw lokal yang sudah ada dengan worktree terkelola milik sesi ke profil worker cloud yang dikonfigurasi. Teruskan `{ key, profileId, agentId? }`. Metode ini tidak tersedia ketika tidak ada profil worker yang dikonfigurasi, menutup penerimaan giliran lokal sebelum menguras pekerjaan aktif, dan hanya kembali setelah penempatan mencapai kepemilikan worker `active`. Pengiriman bersifat satu arah; penarikan kembali dari worker ke lokal bukan bagian dari RPC ini.
    - `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename`, dan `sessions.groups.delete` mengelola katalog grup sesi khusus milik Gateway (nama + urutan tampilan). Keanggotaan tetap berada di bidang `category` setiap sesi; penggantian nama dan penghapusan memperbarui sesi anggota di sisi server.
    - `sessions.send` mengirim pesan ke sesi yang sudah ada.
    - `sessions.steer` adalah varian interupsi-dan-arahkan untuk sesi aktif.
    - `sessions.abort` membatalkan pekerjaan aktif untuk suatu sesi. Teruskan `key` beserta `runId` opsional, atau hanya `runId` untuk proses aktif yang dapat ditentukan oleh Gateway ke suatu sesi.
    - `sessions.patch` memperbarui metadata/penggantian sesi serta melaporkan model kanonis yang telah ditentukan beserta `agentRuntime` efektif.
    - `sessions.reset`, `sessions.delete`, dan `sessions.compact` melakukan pemeliharaan sesi.
    - `sessions.get` mengembalikan baris sesi tersimpan secara lengkap.
    - Eksekusi chat tetap menggunakan `chat.history`, `chat.send`, `chat.abort`, dan `chat.inject`. `chat.history` dinormalisasi untuk tampilan bagi klien UI: tag direktif sebaris dihapus dari teks yang terlihat, payload XML panggilan alat berbentuk teks biasa (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok panggilan alat yang terpotong) serta token kontrol model ASCII/lebar penuh yang bocor dihapus, baris asisten yang hanya berisi token senyap (`NO_REPLY` / `no_reply` secara persis) dihilangkan, dan baris yang terlalu besar dapat diganti dengan placeholder.
    - `chat.message.get` adalah pembaca pesan lengkap terbatas yang bersifat aditif untuk satu entri transkrip yang terlihat. Teruskan `sessionKey`, `agentId` opsional ketika pemilihan sesi dibatasi pada agen, dan `messageId` transkrip yang sebelumnya ditampilkan melalui `chat.history`; Gateway mengembalikan proyeksi ternormalisasi untuk tampilan yang sama tanpa batas pemotongan riwayat ringan ketika entri tersimpan masih tersedia dan tidak terlalu besar.
    - `chat.toolTitles` mengembalikan judul tujuan singkat untuk panggilan alat yang dirender di Control UI (secara batch, maksimum 24 item dengan masukan terbatas). Fitur ini diaktifkan melalui keikutsertaan `gateway.controlUi.toolTitles` (secara default nonaktif); Gateway yang dinonaktifkan menjawab `{ titles: {}, disabled: true }` tanpa panggilan model agar klien berhenti meminta. Saat diaktifkan, judul menggunakan perutean model utilitas standar: `utilityModel` yang dikonfigurasi secara eksplisit (keputusan operator yang, seperti semua tugas utilitas, dapat mengirim konten tugas terbatas kepada penyedia yang dipilih), atau default model kecil yang dideklarasikan oleh penyedia sesi sehingga tidak ada tujuan keluar baru yang muncul secara implisit; `utilityModel` kosong menonaktifkannya sepenuhnya. Judul tidak pernah beralih ke model utama sebagai cadangan. Hasil disimpan dalam cache di basis data status per agen dengan kunci berupa nama alat + masukan, sehingga tampilan berulang tidak pernah menagihkan ulang panggilan yang sama.
    - `chat.send` menerima `fastMode: "auto"` satu giliran untuk menggunakan mode cepat bagi panggilan model yang dimulai sebelum batas otomatis, lalu memulai panggilan percobaan ulang, cadangan, hasil alat, atau lanjutan setelahnya tanpa mode cepat. Batas tersebut secara default adalah 60 detik (`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`) dan dapat dikonfigurasi per model dengan `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Pemanggil `chat.send` dapat meneruskan `fastAutoOnSeconds` satu giliran untuk mengganti batas bagi permintaan tersebut. Teruskan `queueMode` (`steer`, `followup`, `collect`, atau `interrupt`) untuk mengganti mode antrean tersimpan hanya bagi permintaan ini; tindakan pengarahan Control UI yang eksplisit menggunakan `queueMode: "steer"`.

  </Accordion>

  <Accordion title="Pemasangan perangkat dan token perangkat">
    - `device.pair.list` mengembalikan perangkat terpasang yang tertunda dan disetujui.
    - `device.pair.setupCode` membuat kode penyiapan seluler dan, secara default, URL data QR PNG. Tindakan ini memerlukan `operator.admin` dan sengaja tidak disertakan dalam penemuan yang diiklankan. Hasilnya menyertakan `setupCode`, `qrDataUrl` opsional, `gatewayUrl`, label `auth` yang tidak bersifat rahasia, dan `urlSource`.
    - `device.pair.approve`, `device.pair.reject`, dan `device.pair.remove` mengelola catatan pemasangan perangkat.
    - `device.pair.rename` menetapkan label operator (`{ deviceId, label }`) yang lebih diutamakan daripada nama tampilan yang dilaporkan klien dan tetap bertahan setelah perbaikan perangkat atau persetujuan ulang.
    - `device.token.rotate` merotasi token perangkat terpasang dalam batas peran yang disetujui dan cakupan pemanggilnya.
    - `device.token.revoke` mencabut token perangkat terpasang dalam batas peran yang disetujui dan cakupan pemanggilnya.

    Kode penyiapan menyematkan kredensial bootstrap berumur pendek. Klien tidak boleh
    mencatat atau menyimpannya setelah alur pemasangan selesai.

  </Accordion>

  <Accordion title="Pemasangan Node, pemanggilan, dan pekerjaan tertunda">
    - `node.pair.list`, `node.pair.approve`, `node.pair.reject`, dan `node.pair.remove` mencakup persetujuan kapabilitas Node. `node.pair.request` dan `node.pair.verify` dihapus pada 2026.7 bersama penyimpanan pemasangan Node mandiri; permintaan tertunda dibuat oleh Gateway saat Node terhubung.
    - `node.list` dan `node.describe` mengembalikan status Node yang diketahui/terhubung.
    - `node.rename` memperbarui label Node yang telah dipasangkan.
    - `node.invoke` meneruskan perintah ke Node yang terhubung.
    - `node.invoke.result` mengembalikan hasil untuk permintaan pemanggilan.
    - `mcp.tools.call.v1` adalah perintah host Node tanpa antarmuka grafis untuk memanggil alat MCP lokal Node yang telah dikonfigurasi. Perintah ini diteruskan melalui `node.invoke`, mengharuskan Node mendeklarasikan perintah tersebut, dan tetap tunduk pada persetujuan pemasangan serta `gateway.nodes.denyCommands`.
    - `node.event` membawa peristiwa yang berasal dari Node kembali ke Gateway.
    - `node.pluginTools.update` adalah satu-satunya jalur publikasi untuk mengganti deskriptor alat plugin/MCP milik Node terhubung yang terlihat oleh agen; parameter `connect` tidak membawanya.
    - `node.pending.pull` dan `node.pending.ack` adalah API antrean Node terhubung.
    - `node.pending.enqueue` dan `node.pending.drain` mengelola pekerjaan tertunda yang persisten untuk Node luring/terputus.

  </Accordion>

  <Accordion title="Kelompok persetujuan">
    - `approval.history` mengembalikan persetujuan terminal dari yang terbaru yang disimpan selama 30 hari untuk permintaan eksekusi, plugin, dan agen sistem (cakupan `operator.approvals`). Metode ini mendukung paginasi kursor beserta filter jenis opsional; persetujuan tertunda bukan baris riwayat.
    - `approval.get` dan `approval.resolve` adalah metode persetujuan persisten yang tidak bergantung pada jenis (cakupan `operator.approvals`). `approval.get` mengembalikan proyeksi terminal tertunda atau tersimpan yang telah disanitasi dengan `urlPath` yang stabil; `approval.resolve` menerima ID persetujuan kanonis, `kind` eksplisit, dan keputusan, menerapkan penyelesaian berdasarkan jawaban pertama, serta selalu mengembalikan hasil kanonis yang tercatat.
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, dan `exec.approval.resolve` mencakup permintaan persetujuan eksekusi sekali pakai beserta pencarian/pemutaran ulang persetujuan tertunda. Semuanya merupakan adaptor batas protokol di atas registri persetujuan persisten yang sama.
    - `exec.approval.waitDecision` menunggu satu persetujuan eksekusi tertunda dan mengembalikan keputusan akhir (atau `null` saat batas waktu tercapai).
    - `exec.approvals.get` dan `exec.approvals.set` mengelola snapshot kebijakan persetujuan eksekusi Gateway.
    - `exec.approvals.node.get` dan `exec.approvals.node.set` mengelola kebijakan persetujuan eksekusi lokal Node melalui perintah relai Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, dan `plugin.approval.resolve` mencakup alur persetujuan yang ditentukan plugin.

  </Accordion>

  <Accordion title="Perintah Control UI">
    - `ui.command` memungkinkan pemanggil `operator.write` mengirim perintah tata letak dan navigasi bertipe ke klien Control UI terhubung yang mengiklankan kapabilitas `ui-commands`.
    - Perintah mencakup pemisahan/penutupan/fokus panel, visibilitas bilah samping, visibilitas dan dok panel terminal/peramban, serta navigasi sesi.
    - Protokol v1 sengaja menyebarkan perintah ke setiap Control UI terhubung yang memiliki kapabilitas tersebut. Jika tidak ada yang terhubung, permintaan gagal dengan `UNAVAILABLE`, alih-alih berpura-pura bahwa tata letak telah berubah.

  </Accordion>

  <Accordion title="Otomatisasi, Skills, dan alat">
    - Otomatisasi: `wake` menjadwalkan injeksi teks pengaktifan segera atau pada Heartbeat berikutnya; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` mengelola pekerjaan terjadwal.
    - `cron.run` tetap menjadi RPC bergaya antrekan untuk eksekusi manual. Klien yang memerlukan semantik penyelesaian harus membaca `runId` yang dikembalikan dan melakukan polling terhadap `cron.runs`.
    - `cron.runs` menerima filter `runId` opsional yang tidak kosong agar klien dapat mengikuti satu eksekusi manual yang diantrekan tanpa berlomba dengan entri riwayat lain untuk tugas yang sama.
    - Skills dan alat: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`. Lihat [Metode pembantu operator](#operator-helper-methods) di bawah ini.

  </Accordion>
</AccordionGroup>

### Kelompok peristiwa umum

- `chat`: pembaruan obrolan UI seperti `chat.inject` dan peristiwa obrolan lain yang hanya ada dalam transkrip. Dalam protokol v4, payload delta membawa `deltaText`; `message` tetap menjadi
  snapshot kumulatif asisten. Penggantian nonprefiks menetapkan
  `replace=true` dan menggunakan `deltaText` sebagai teks pengganti.
- `session.message`, `session.operation`, `session.tool`: pembaruan transkrip, operasi sesi yang sedang berlangsung,
  dan aliran peristiwa untuk sesi yang dilanggani.
- `session.approval`: status sebenarnya persetujuan tertunda dan terminal yang telah disanitasi untuk
  pelanggan sesi persis yang secara eksplisit ikut serta. Persetujuan turunan menggunakan
  audiens leluhur yang dipersistenkan; peristiwa tidak pernah mengubah transkrip atau membangunkan agen.
- `sessions.changed`: indeks atau metadata sesi berubah.
- `presence`: pembaruan snapshot keberadaan sistem.
- `tick`: peristiwa keepalive/keaktifan berkala.
- `health`: pembaruan snapshot kesehatan Gateway.
- `heartbeat`: pembaruan aliran peristiwa Heartbeat.
- `cron`: peristiwa perubahan eksekusi/tugas Cron.
- `shutdown`: notifikasi penonaktifan Gateway.
- `node.pair.requested` / `node.pair.resolved`: siklus hidup pemasangan Node.
- `node.invoke.request`: penyiaran permintaan pemanggilan Node.
- `device.pair.requested` / `device.pair.resolved`: siklus hidup perangkat yang dipasangkan.
- `voicewake.changed`: konfigurasi pemicu kata aktivasi berubah.
- `config.changed`: penulisan konfigurasi dipersistenkan (payload membawa jalur konfigurasi,
  hash snapshot baru, dan stempel waktu—tidak pernah membawa isi konfigurasi). Berada dalam cakupan baca operator;
  klien menyegarkan melalui `config.get`.
- `exec.approval.requested` / `exec.approval.resolved`: siklus hidup persetujuan
  eksekusi.
- `plugin.approval.requested` / `plugin.approval.resolved`: siklus hidup persetujuan
  plugin.

### Metode pembantu Node

Node dapat memanggil `skills.bins` untuk mengambil daftar executable Skills saat ini
untuk pemeriksaan izin otomatis.

## RPC buku besar audit

`audit.activity.list` memberikan kepada klien operator tampilan stabil dari yang terbaru atas metadata
siklus hidup eksekusi agen, tindakan alat, dan pesan yang disertakan secara opsional. Metode ini memerlukan
`operator.read`. Kueri mengecualikan catatan yang berusia lebih dari 30 hari, dan buku besar
SQLite bersama dibatasi hingga 100,000 catatan. Baris kedaluwarsa dihapus saat
Gateway dimulai, pemeliharaan setiap jam, dan penulisan berikutnya. Lihat
[Riwayat audit](/id/gateway/audit) untuk model data dan semantik privasi.

- Parameter: `agentId`, `sessionKey`, atau `runId` persis yang bersifat opsional; `kind` opsional
  (`"agent_run"`, `"tool_action"`, atau `"message"`); `status` opsional
  (`"started"`, `"succeeded"`, `"failed"`, `"cancelled"`, `"timed_out"`,
  `"blocked"`, atau `"unknown"`); `direction` pesan opsional (`"inbound"` atau
  `"outbound"`) dan `channel` persis; batas milidetik Unix inklusif `after` / `before`
  yang bersifat opsional; `limit` opsional dari `1` hingga `500`; dan
  string `cursor` opsional dari halaman sebelumnya.
- Hasil: `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.

Union hasil V1 bernama memiliki skema terpisah untuk eksekusi agen, tindakan alat, pesan masuk,
dan pesan keluar. Diskriminator `eventType` masing-masing adalah
`agent_run`, `tool_action`, `inbound_message`, atau `outbound_message`; `kind` dan
`direction` pesan tetap tersedia untuk pemfilteran dan tampilan. Setiap peristiwa memiliki
`schemaVersion: 1` bilangan bulat. Referensi identitas pesan menggunakan format
`hmac-sha256:v1:<32 hex key id>:<64 hex digest>` yang persis; ID aktor pengirim kanal
menggunakan format yang sama.

Semua varian mewajibkan `eventType`, `schemaVersion`, `eventId`, `sequence`,
`sourceSequence`, `occurredAt`, `kind`, `action`, `status`, `actor`, dan
`redaction`. Bidang varian adalah:

| `eventType`        | Bidang wajib                                                      | Bidang opsional                                                                                                                 |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `agent_run`        | `agentId`, `runId`; `kind: "agent_run"`                           | `sessionKey`, `sessionId`, `errorCode`                                                                                          |
| `tool_action`      | `agentId`, `runId`; `kind: "tool_action"`                         | `sessionKey`, `sessionId`, `toolCallId`, `toolName`, `errorCode`                                                                |
| `inbound_message`  | `direction: "inbound"`, `channel`, `conversationKind`, `outcome`  | `agentId`, `runId`, `durationMs`, `resultCount`, referensi identitas, `reasonCode`, `errorCode`                                 |
| `outbound_message` | `direction: "outbound"`, `channel`, `conversationKind`, `outcome` | `agentId`, `runId`, `durationMs`, `resultCount`, referensi identitas, `reasonCode`, `deliveryKind`, `failureStage`, `errorCode` |

Enum pesan tertutup adalah:

- `conversationKind`: `direct`, `group`, `channel`, atau `unknown`.
- `outcome` masuk: `completed`, `skipped`, atau `failed`; `reasonCode` opsional:
  `duplicate`, `reply_operation_active`,
  `reply_operation_aborted`, `fast_abort`, `plugin_bound_handled`,
  `plugin_bound_unavailable`, `plugin_bound_declined`, `plugin_bound_error`,
  `before_dispatch_handled`, `acp_dispatch_completed`, `acp_dispatch_failed`,
  `acp_dispatch_empty`, atau `acp_dispatch_aborted`.
- `outcome` keluar: `sent`, `suppressed`, `failed`, atau `unknown`; `reasonCode` opsional:
  `cancelled_by_message_sending_hook`,
  `cancelled_by_reply_payload_sending_hook`,
  `empty_after_message_sending_hook`, `empty_after_reply_payload_sending_hook`,
  atau `no_visible_payload`. Adaptor yang tidak mengembalikan identitas platform adalah
  `unknown`, karena efek samping eksternal tidak dapat dibuktikan tidak terjadi.
- `deliveryKind`: `text`, `media`, atau `other`; `failureStage`:
  `platform_send`, `queue`, atau `unknown`.

Bidang terminal saling berkorelasi, bukan opsional secara independen:

| Varian           | Pemetaan terminal                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Eksekusi agen    | `started` tidak memiliki `errorCode`; setiap status selesai yang bukan berhasil memerlukan kode `run_*` yang sesuai.                                                                 |
| Tindakan alat    | `started` dan berhasil tidak memiliki `errorCode`; setiap status selesai lainnya memerlukan kode `tool_*` yang sesuai.                                                       |
| Pesan masuk      | berhasil = `completed`; diblokir = `skipped`; gagal = `failed` ditambah `message_processing_failed`. `reasonCode`, jika ada, harus termasuk dalam keluarga terminal tersebut. |
| Pesan keluar     | berhasil = `sent`; diblokir = `suppressed` ditambah `reasonCode`; gagal = `failed` ditambah `errorCode` dan `failureStage`; tidak diketahui = `unknown` ditambah `failureStage`.      |

Setiap peristiwa aktivitas mencakup id peristiwa yang stabil, urutan ledger monotonik,
urutan peristiwa sumber, stempel waktu, pelaku, tindakan, status, bilangan bulat
`schemaVersion: 1`, dan `redaction: "metadata_only"`. Rekaman eksekusi dan alat
memerlukan asal-usul agen dan eksekusi serta dapat mencakup asal-usul sesi. Rekaman
pesan dapat mencakup id agen dan eksekusi, tetapi secara sengaja tidak pernah mencakup
`sessionKey` atau `sessionId`; karena itu, filter kueri `sessionKey` hanya berlaku untuk
baris eksekusi dan alat. Peristiwa alat dapat mencakup id panggilan alat dan nama alat.

Rekaman pesan menggunakan `message.inbound.processed` atau
`message.outbound.finished` dan menambahkan arah, saluran, jenis percakapan,
hasil yang dinormalisasi, serta jenis pengiriman, tahap kegagalan, durasi,
jumlah hasil, kode alasan, dan pseudonim akun/percakapan/pesan/target
berkunci yang bersifat lokal untuk instalasi dan opsional. Pseudonim ini membantu
korelasi, tetapi bukan anonimisasi: basis data status berisi kuncinya,
sedangkan ekspor RPC dan CLI tidak. Ledger tidak menyimpan prompt, isi pesan,
argumen alat, hasil alat, keluaran perintah, atau teks kesalahan mentah.
Nilai `sessionKey` eksekusi/alat tetap berupa metadata korelasi mentah dan dapat menyematkan
id akun platform atau rekan; rekaman pesan tidak menyertakan kunci sesi.

Untuk baris masuk, `durationMs` mengukur pengiriman inti hingga terminalnya dan
`resultCount` menghitung muatan alat, pemblokiran, dan balasan dalam antrean yang telah difinalisasi. Untuk
baris keluar, `durationMs` mencakup kepemilikan pengiriman hingga pengakuan,
surat mati, atau rekonsiliasi (termasuk waktu tunggu dalam antrean), dan `resultCount`
menghitung pengiriman fisik platform yang teridentifikasi. `deliveryKind`, jika ada,
menjelaskan muatan efektif setelah hook dan perenderan; baris yang disupresi atau
ambigu akibat crash tidak menyertakannya.

Cakupan pesan saat ini mencakup pesan masuk yang diterima dan mencapai
pengiriman inti, termasuk hasil duplikat/terminal inti. Cakupan keluar menulis
satu baris terminal per muatan balasan logis asli yang mencapai pengiriman
bersama yang tahan lama; pemotongan dan fan-out adaptor diagregasikan dalam `resultCount`. Pengiriman
dalam antrean yang dapat dicoba ulang atau ambigu hanya dicatat setelah pengakuan, surat
mati, atau rekonsiliasi. Jalur lokal Plugin dan pengiriman langsung yang melewati
batas bersama tersebut belum dicakup. Antrean pekerja terbatas bersifat upaya terbaik
dan dapat menghilangkan rekaman saat terjadi kegagalan atau kejenuhan, sehingga permukaan ini bukan
arsip kepatuhan tanpa kehilangan data.

Pencatatan aktif secara default dan dikendalikan oleh
[`audit.enabled`](/id/gateway/configuration-reference#audit). Pencatatan pesan
dikendalikan secara terpisah oleh `audit.messages` dan secara default bernilai `"off"`. Saat
pencatatan dinonaktifkan, `audit.activity.list` tetap menyajikan rekaman yang ditulis
sebelumnya hingga kedaluwarsa.

Skema permintaan, hasil, dan `AuditEvent` dari `audit.list` yang dirilis tetap
tidak berubah dan hanya mengembalikan rekaman eksekusi agen dan tindakan alat. Klien
operator baru harus memanggil `audit.activity.list` saat Gateway mengiklankannya. Gateway
lama dapat melaporkan `unknown method: audit.activity.list` atau, karena
otorisasi mendahului pencarian metode dalam versi yang dirilis, `missing scope:
operator.admin` terhadap permintaan dengan cakupan baca. Perlakukan yang terakhir sebagai ketiadaan metode
hanya jika metode tersebut tidak diiklankan. Klien kemudian dapat mencoba ulang `audit.list`
hanya jika filternya tidak memerlukan dukungan jenis pesan, arah, atau saluran.

Gunakan [`openclaw audit`](/id/cli/audit) untuk kueri teks dan ekspor JSON terbatas.

## RPC ledger tugas

Klien operator memeriksa dan membatalkan rekaman tugas latar belakang gateway melalui
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
  - `textAliases` membawa alias garis miring yang persis seperti `/model` dan `/m`.
  - `nativeName` membawa nama perintah native yang mempertimbangkan penyedia jika
    tersedia.
  - `provider` bersifat opsional dan hanya memengaruhi penamaan native serta ketersediaan perintah
    Plugin native.
  - `includeArgs=false` menghilangkan metadata argumen yang diserialisasi dari respons.
- `tools.catalog` (`operator.read`) mengambil katalog alat runtime untuk sebuah
  agen. Respons mencakup alat yang dikelompokkan dan metadata asal:
  - `source`: `core` atau `plugin`
  - `pluginId`: pemilik Plugin ketika `source="plugin"`
  - `optional`: apakah alat Plugin bersifat opsional
- `tools.effective` (`operator.read`) mengambil inventaris alat yang berlaku efektif saat runtime
  untuk sebuah sesi.
  - `sessionKey` wajib diisi.
  - Gateway memperoleh konteks runtime tepercaya dari sesi di sisi server
    alih-alih menerima konteks autentikasi atau pengiriman yang diberikan pemanggil.
  - Respons merupakan proyeksi inventaris aktif yang berasal dari server dan tercakup pada sesi,
    termasuk alat inti, Plugin, saluran, dan server MCP yang telah ditemukan.
  - `tools.effective` bersifat hanya-baca untuk MCP: ini dapat memproyeksikan katalog MCP
    sesi yang telah siap melalui kebijakan alat akhir, tetapi tidak membuat runtime MCP,
    menghubungkan transportasi, atau menerbitkan `tools/list`. Jika tidak ada katalog siap yang
    cocok, respons dapat menyertakan pemberitahuan seperti `mcp-not-yet-connected`,
    `mcp-not-yet-listed`, atau `mcp-stale-catalog`.
  - Entri alat efektif menggunakan `source="core"`, `source="plugin"`,
    `source="channel"`, atau `source="mcp"`.
- `tools.invoke` (`operator.write`) memanggil satu alat yang tersedia melalui
  jalur kebijakan Gateway yang sama seperti `/tools/invoke`.
  - `name` wajib diisi. `args`, `sessionKey`, `agentId`, `confirm`, dan
    `idempotencyKey` bersifat opsional.
  - Jika `sessionKey` dan `agentId` sama-sama ada, agen sesi yang diresolusikan
    harus cocok dengan `agentId`.
  - Pembungkus inti khusus pemilik seperti `cron`, `gateway`, dan `nodes` memerlukan
    identitas pemilik/admin (`operator.admin`) meskipun `tools.invoke` sendiri
    adalah `operator.write`.
  - Respons merupakan amplop yang ditujukan untuk SDK dengan bidang `ok`, `toolName`, `output`
    opsional, dan `error` bertipe. Penolakan persetujuan atau kebijakan mengembalikan
    `ok:false` dalam muatan alih-alih melewati Pipeline kebijakan alat
    Gateway.
- `skills.status` (`operator.read`) mengambil inventaris Skills yang terlihat untuk sebuah
  agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca ruang kerja agen default.
  - Respons mencakup kelayakan, persyaratan yang belum terpenuhi, pemeriksaan konfigurasi,
    dan opsi instalasi yang disanitasi tanpa mengekspos nilai rahasia mentah.
- `skills.search` dan `skills.detail` (`operator.read`) mengembalikan metadata
  penemuan ClawHub.
- `skills.upload.begin`, `skills.upload.chunk`, dan `skills.upload.commit`
  (`operator.admin`) menyiapkan arsip skill privat sebelum menginstalnya. Ini
  adalah jalur unggah admin terpisah untuk klien tepercaya, bukan alur instalasi
  skill ClawHub normal, dan dinonaktifkan secara default kecuali
  `skills.install.allowUploadedArchives` diaktifkan.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    membuat unggahan yang terikat pada slug dan nilai force tersebut.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` menambahkan byte pada
    offset terdekode yang persis.
  - `skills.upload.commit({ uploadId, sha256? })` memverifikasi ukuran akhir dan
    SHA-256. Commit hanya menyelesaikan unggahan; tindakan ini tidak menginstal skill.
  - Arsip skill yang diunggah adalah arsip zip yang berisi akar `SKILL.md`. Nama
    direktori internal arsip tidak pernah menentukan target instalasi.
- `skills.install` (`operator.admin`) memiliki tiga mode:
  - Mode ClawHub: `{ source: "clawhub", slug, version?, force? }` menginstal sebuah
    folder skill ke direktori `skills/` pada ruang kerja agen default.
  - Mode unggah: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    menginstal unggahan yang telah di-commit ke direktori `skills/<slug>`
    pada ruang kerja agen default. Slug dan nilai force harus cocok dengan
    permintaan `skills.upload.begin` awal. Ditolak kecuali
    `skills.install.allowUploadedArchives` diaktifkan; pengaturan ini tidak
    memengaruhi instalasi ClawHub.
  - Mode penginstal Gateway: `{ name, installId, timeoutMs? }` menjalankan tindakan
    `metadata.openclaw.install` yang dideklarasikan pada host Gateway. Klien lama mungkin
    masih mengirim `dangerouslyForceUnsafeInstall`; bidang ini tidak digunakan lagi,
    hanya diterima untuk kompatibilitas protokol, dan diabaikan. Gunakan
    `security.installPolicy` untuk keputusan instalasi yang dimiliki operator.
- `skills.update` (`operator.admin`) memiliki dua mode:
  - Mode ClawHub memperbarui satu slug terlacak atau semua instalasi ClawHub terlacak di
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
  dikonfigurasi, ini tetap diprioritaskan, termasuk penemuan yang tercakup pada penyedia untuk
  entri `provider/*`. Tanpa daftar izin, respons menggunakan entri
  `models.providers.<provider>.models` eksplisit, dengan kembali ke katalog
  lengkap hanya ketika tidak ada baris model yang dikonfigurasi.
- `"provider-config"`: inventaris `models.providers.*.models` yang ditulis oleh sumber,
  terlepas dari daftar izin pemilih. Baris mencakup kapabilitas model publik dan
  ketersediaan yang mempertimbangkan rute, tetapi menghilangkan endpoint penyedia, materi autentikasi, dan
  konfigurasi permintaan runtime.
- `"all"`: katalog Gateway lengkap, melewati `agents.defaults.modelPolicy.allow`. Gunakan untuk
  UI diagnostik/penemuan, bukan pemilih model normal.

## Persetujuan eksekusi

- Ketika permintaan eksekusi memerlukan persetujuan, Gateway menyiarkan
  `exec.approval.requested`.
- Klien operator menyelesaikannya dengan memanggil `exec.approval.resolve` (memerlukan
  `operator.approvals`).
- Untuk `host=node`, `exec.approval.request` harus menyertakan `systemRunPlan`
  (metadata `argv`/`cwd`/`rawCommand`/sesi kanonis). Permintaan tanpa
  `systemRunPlan` ditolak.
- Setelah disetujui, panggilan `node.invoke system.run` yang diteruskan menggunakan kembali
  `systemRunPlan` kanonis tersebut sebagai konteks perintah/cwd/sesi yang otoritatif.
- Jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau
  `sessionKey` di antara persiapan dan penerusan `system.run` yang akhirnya disetujui,
  Gateway menolak eksekusi alih-alih memercayai muatan yang telah diubah.

## Fallback pengiriman agen

- Permintaan `agent` dapat menyertakan `deliver=true` untuk meminta pengiriman keluar.
- `bestEffortDeliver=false` (default) mempertahankan perilaku ketat: target pengiriman yang
  tidak dapat diresolusikan atau hanya internal mengembalikan `INVALID_REQUEST`.
- `bestEffortDeliver=true` mengizinkan fallback ke eksekusi khusus sesi ketika tidak ada
  rute eksternal yang dapat dikirimi yang bisa diresolusikan (misalnya sesi internal/webchat
  atau konfigurasi multi-saluran yang ambigu).
- Hasil akhir `agent` dapat menyertakan `result.deliveryStatus` ketika pengiriman
  diminta, menggunakan status `sent`, `suppressed`, `partial_failed`, dan
  `failed` yang sama seperti yang didokumentasikan untuk
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
  eksekusi tidak berubah oleh jendela kompatibilitas ini. Kapabilitas dan perintah Node
  milik Plugin tidak diberikan hingga Node ditingkatkan ke protokol saat ini
  karena permukaan yang di-host bukan bagian dari kontrak N-1.
- Skema dan model dihasilkan dari definisi TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Konstanta klien

Implementasi klien referensi berada di `packages/gateway-client/src/`
(OpenClaw membungkusnya melalui fasad tipis `src/gateway/client.ts`). Nilai
default ini stabil di seluruh protokol v4 dan merupakan dasar yang diharapkan untuk
klien pihak ketiga.

| Konstanta                                 | Default                                               | Sumber                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_NODE_PROTOCOL_VERSION`               | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_PROBE_PROTOCOL_VERSION`              | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| Batas waktu permintaan (per RPC)          | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`requestTimeoutMs`)                                                              |
| Batas waktu praautentikasi / tantangan koneksi | `15_000` ms                                           | `packages/gateway-client/src/timeouts.ts` (env `OPENCLAW_HANDSHAKE_TIMEOUT_MS` dapat menaikkan anggaran server/klien yang berpasangan) |
| Backoff koneksi ulang awal                | `1_000` ms                                            | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                      |
| Backoff koneksi ulang maksimum            | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                      |
| Batas retry cepat setelah penutupan token perangkat | `250` ms                                              | `packages/gateway-client/src/client.ts`                                                                                   |
| Masa tenggang penghentian paksa sebelum `terminate()` | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| Batas waktu default `stopAndWait()`    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| Interval tick default (sebelum `hello-ok`) | `30_000` ms                                           | `packages/gateway-client/src/client.ts`                                                                                   |
| Penutupan karena batas waktu tick         | kode `4000` ketika periode tanpa aktivitas melampaui `tickIntervalMs * 2` | `packages/gateway-client/src/client.ts`                                                                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                         |

Server mengumumkan `policy.tickIntervalMs`,
`policy.maxPayload`, dan `policy.maxBufferedBytes` efektif dalam `hello-ok`; klien
harus mengikuti nilai tersebut, bukan default sebelum handshake.

Klien referensi mengizinkan permintaan terbatas memiliki tenggat terkonfigurasinya ketika
setiap permintaan tertunda memilikinya. Permintaan `expectFinal` tanpa
`timeoutMs` terbatas, permintaan apa pun dengan `timeoutMs: null`, atau campuran permintaan
terbatas dan tanpa batas membuat watchdog tick tetap aktif. Jika event masuk dan
respons tetap tidak ada hingga melewati ambang batas waktu tick, klien menutup
soket dengan kode `4000`, menolak setiap permintaan tertunda, dan menghubungkan ulang. Klien
tidak memutar ulang permintaan yang ditolak setelah menghubungkan ulang.

## Autentikasi

- Autentikasi Gateway dengan rahasia bersama menggunakan `connect.params.auth.token` atau
  `connect.params.auth.password`, bergantung pada
  `gateway.auth.mode` yang dikonfigurasi (`"none" | "token" | "password" | "trusted-proxy"`).
- Mode yang memuat identitas seperti Tailscale Serve (`gateway.auth.allowTailscale: true`)
  atau `gateway.auth.mode: "trusted-proxy"` non-loopback memenuhi pemeriksaan
  autentikasi koneksi dari header permintaan, bukan dari `connect.params.auth.*`.
- `gateway.auth.mode: "none"` ingress privat sepenuhnya melewati autentikasi koneksi dengan rahasia bersama;
  jangan mengekspos mode tersebut pada ingress publik/tidak tepercaya.
- Setelah pemasangan, Gateway menerbitkan token perangkat yang cakupannya dibatasi pada
  peran + cakupan koneksi, yang dikembalikan dalam `hello-ok.auth.deviceToken`. Klien harus
  menyimpannya setelah setiap koneksi yang berhasil.
- Saat menghubungkan ulang dengan token perangkat tersimpan tersebut, gunakan kembali juga
  kumpulan cakupan tersimpan yang telah disetujui untuk token itu. Hal ini mempertahankan akses baca/probe/status
  yang telah diberikan dan mencegah koneksi ulang secara diam-diam menyusut menjadi cakupan
  implisit yang lebih sempit dan khusus admin.
- Penyusunan autentikasi koneksi di sisi klien (`selectConnectAuth` dalam
  `packages/gateway-client/src/client.ts`):
  - `auth.password` bersifat ortogonal dan selalu diteruskan ketika ditetapkan.
  - `auth.token` diisi berdasarkan urutan prioritas: token bersama eksplisit terlebih dahulu,
    kemudian `deviceToken` eksplisit, lalu token per perangkat tersimpan (dikunci berdasarkan
    `deviceId` + `role`).
  - `auth.bootstrapToken` dikirim hanya jika tidak satu pun dari hal di atas menghasilkan
    `auth.token`. Token bersama atau token perangkat apa pun yang berhasil ditentukan akan menonaktifkannya.
  - Promosi otomatis token perangkat tersimpan pada retry satu kali
    `AUTH_TOKEN_MISMATCH` dibatasi hanya untuk endpoint tepercaya: loopback,
    atau `wss://` dengan `tlsFingerprint` yang dipasangi pin. `wss://` publik tanpa pin
    tidak memenuhi syarat.
- Bootstrap kode penyiapan bawaan mengembalikan
  `hello-ok.auth.deviceToken` Node utama beserta token operator terbatas dalam
  `hello-ok.auth.deviceTokens` untuk penyerahan seluler tepercaya. Token operator
  menyertakan `operator.talk.secrets` untuk pembacaan konfigurasi Talk native, tetapi
  mengecualikan cakupan mutasi pemasangan dan `operator.admin`.
- Saat bootstrap kode penyiapan non-baseline menunggu persetujuan,
  detail `PAIRING_REQUIRED` mencakup `recommendedNextStep: "wait_then_retry"`,
  `retryable: true`, dan `pauseReconnect: false`. Terus hubungkan ulang dengan
  token bootstrap yang sama hingga permintaan disetujui atau token menjadi
  tidak valid.
- Simpan `hello-ok.auth.deviceTokens` hanya ketika koneksi menggunakan autentikasi
  bootstrap pada transport tepercaya seperti `wss://` atau pemasangan loopback/lokal.
- Jika klien memberikan `deviceToken` eksplisit atau `scopes` eksplisit,
  kumpulan cakupan yang diminta pemanggil tersebut tetap menjadi acuan; cakupan yang di-cache hanya
  digunakan kembali ketika klien menggunakan kembali token per perangkat yang tersimpan.
- Token perangkat dapat dirotasi/dicabut melalui `device.token.rotate` dan
  `device.token.revoke` (memerlukan `operator.pairing`). Merotasi atau mencabut token
  Node atau peran non-operator lainnya juga memerlukan `operator.admin`.
- `device.token.rotate` mengembalikan metadata rotasi. Metadata tersebut menyertakan token
  bearer pengganti hanya untuk panggilan dari perangkat yang sama yang telah diautentikasi dengan
  token perangkat tersebut, sehingga klien yang hanya menggunakan token dapat menyimpan penggantinya sebelum
  menghubungkan ulang. Rotasi bersama/admin tidak menyertakan token bearer.
- Penerbitan, rotasi, dan pencabutan token tetap dibatasi pada kumpulan peran
  yang disetujui dan tercatat dalam entri pemasangan perangkat tersebut; mutasi token tidak dapat memperluas atau
  menargetkan peran perangkat yang tidak pernah diberikan oleh persetujuan pemasangan.
- Untuk sesi token perangkat terpasang, pengelolaan perangkat terbatas pada diri sendiri kecuali
  pemanggil juga memiliki `operator.admin`: pemanggil non-admin hanya dapat mengelola
  token operator untuk entri perangkatnya sendiri. Pengelolaan token Node dan
  non-operator lainnya hanya untuk admin, bahkan untuk perangkat pemanggil sendiri.
- `device.token.rotate` dan `device.token.revoke` juga memeriksa kumpulan cakupan
  token operator target terhadap cakupan sesi pemanggil saat ini.
  Pemanggil non-admin tidak dapat merotasi atau mencabut token operator yang cakupannya lebih luas daripada
  yang telah mereka miliki.
- Kegagalan autentikasi mencakup `error.details.code` beserta petunjuk pemulihan:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep`: salah satu dari `retry_with_device_token`,
    `update_auth_configuration`, `update_auth_credentials`,
    `wait_then_retry`, `review_auth_configuration`
    (`packages/gateway-protocol/src/connect-error-details.ts`).
- Perilaku klien untuk `AUTH_TOKEN_MISMATCH`:
  - Klien tepercaya dapat mencoba satu retry terbatas dengan token per perangkat
    yang di-cache.
  - Jika retry tersebut gagal, hentikan loop koneksi ulang otomatis dan tampilkan panduan
    tindakan operator.
- `AUTH_SCOPE_MISMATCH` berarti token perangkat dikenali tetapi tidak
  mencakup peran/cakupan yang diminta. Jangan menampilkannya sebagai token yang salah; minta
  operator untuk memasangkan ulang atau menyetujui kontrak cakupan yang lebih sempit/luas.

## Identitas dan pemasangan perangkat

- Node harus menyertakan identitas perangkat stabil (`device.id`) yang berasal dari
  fingerprint pasangan kunci.
- Gateway menerbitkan token per perangkat + peran.
- Persetujuan pemasangan diperlukan untuk ID perangkat baru kecuali
  persetujuan otomatis lokal diaktifkan.
- Persetujuan otomatis pemasangan berpusat pada koneksi loopback lokal langsung.
- OpenClaw juga memiliki jalur koneksi mandiri backend/kontainer-lokal yang sempit untuk
  alur helper rahasia bersama tepercaya.
- Koneksi tailnet atau LAN pada host yang sama tetap diperlakukan sebagai koneksi jarak jauh untuk pemasangan
  dan memerlukan persetujuan.
- Klien WS biasanya menyertakan identitas `device` selama `connect` (operator +
  Node). Satu-satunya pengecualian operator tanpa perangkat adalah jalur kepercayaan eksplisit:
  - `gateway.controlUi.allowInsecureAuth=true` untuk kompatibilitas
    HTTP tidak aman khusus localhost.
  - autentikasi Control UI operator `gateway.auth.mode: "trusted-proxy"` yang berhasil.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, penurunan
    keamanan yang parah).
  - RPC backend `gateway-client` loopback langsung pada jalur helper internal
    yang dicadangkan.
- Menghilangkan identitas perangkat memiliki konsekuensi terhadap cakupan. Ketika koneksi
  operator tanpa perangkat diizinkan melalui jalur kepercayaan eksplisit, OpenClaw
  tetap mengosongkan cakupan yang dideklarasikan sendiri kecuali jalur tersebut memiliki
  pengecualian preservasi cakupan bernama. Metode yang dibatasi cakupan kemudian gagal dengan
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` adalah jalur preservasi cakupan
  break-glass Control UI. Jalur ini tidak memberikan cakupan kepada klien WebSocket
  backend kustom atau berbentuk CLI secara sembarang.
- Jalur helper backend `gateway-client` loopback langsung yang dicadangkan mempertahankan
  cakupan hanya untuk RPC bidang kontrol lokal internal; ID backend kustom tidak
  menerima pengecualian ini.
- Semua koneksi harus menandatangani nonce `connect.challenge` yang disediakan server.

### Diagnostik migrasi autentikasi perangkat

Untuk klien lama yang masih menggunakan perilaku penandatanganan sebelum tantangan, `connect`
mengembalikan kode detail `DEVICE_AUTH_*` di bawah `error.details.code` dengan
`error.details.reason` yang stabil.

Kegagalan migrasi umum:

| Pesan                       | details.code                     | details.reason           | Arti                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klien tidak menyertakan `device.nonce` (atau mengirimkannya kosong). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klien menandatangani dengan nonce yang kedaluwarsa/salah. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload tanda tangan tidak cocok dengan payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Stempel waktu yang ditandatangani berada di luar toleransi penyimpangan yang diizinkan. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` tidak cocok dengan sidik jari kunci publik. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonisasi kunci publik gagal.              |

Target migrasi:

- Selalu tunggu `connect.challenge`.
- Tandatangani payload v2 yang menyertakan nonce server.
- Kirim nonce yang sama dalam `connect.params.device.nonce`.
- Payload tanda tangan yang disarankan adalah `v3`
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

Protokol ini mengekspos API Gateway lengkap: status, saluran, model, obrolan,
agen, sesi, node, persetujuan, dan lainnya. Permukaan persisnya ditentukan oleh
skema TypeBox yang diekspor ulang dari `packages/gateway-protocol/src/schema.ts`.

## Terkait

- [Membangun klien Gateway](https://docs.openclaw.ai/gateway/clients)
- [Menyematkan OpenClaw](https://docs.openclaw.ai/gateway/embedding)
- [Protokol bridge](/id/gateway/bridge-protocol)
- [Panduan operasional Gateway](/id/gateway)
