---
read_when:
    - Mengimplementasikan atau memperbarui klien WS Gateway
    - Men-debug ketidakcocokan protokol atau kegagalan koneksi
    - Membuat ulang skema/model protokol
summary: 'Protokol WebSocket Gateway: handshake, frame, versioning'
title: Protokol Gateway
x-i18n:
    generated_at: "2026-07-16T18:06:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cc92cfed4cf1bcc7b9499d90eef9f9225a89c0e6a71bb6230bb416f8f6884b5
    source_path: gateway/protocol.md
    workflow: 16
---

Protokol WS Gateway adalah bidang kontrol tunggal dan transportasi node untuk
OpenClaw. Klien operator dan node (CLI, UI web, aplikasi macOS, node iOS/Android,
node headless) terhubung melalui WebSocket dan mendeklarasikan **peran** serta **cakupan** saat
handshake.

## Transportasi dan pembingkaian

- WebSocket, frame teks, payload JSON.
- Frame pertama **harus** berupa permintaan `connect`.
- Frame prapenghubungan dibatasi hingga 64 KiB (`MAX_PREAUTH_PAYLOAD_BYTES`). Setelah
  handshake, ikuti `hello-ok.policy.maxPayload` dan
  `hello-ok.policy.maxBufferedBytes`. Jika diagnostik diaktifkan, frame masuk yang terlalu besar
  dan buffer keluar yang lambat memancarkan peristiwa `payload.large` sebelum
  gateway menutup koneksi atau membuang frame. Peristiwa ini memuat `surface`, ukuran
  byte, batas, dan kode alasan yang aman, tetapi tidak pernah memuat isi pesan, konten
  lampiran, byte frame mentah, token, cookie, atau rahasia.

Bentuk frame:

- Permintaan: `{type:"req", id, method, params}`
- Respons: `{type:"res", id, ok, payload|error}`
- Peristiwa: `{type:"event", event, payload, seq?, stateVersion?}`

Metode yang menimbulkan efek samping memerlukan kunci idempotensi (lihat skema).

## Handshake

Gateway mengirim tantangan prapenghubungan:

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
`canvas`) ke URL terhosting dengan cakupan; URL tersebut dapat kedaluwarsa, sehingga node memanggil
`node.pluginSurface.refresh` dengan `{ "surface": "canvas" }` untuk mendapatkan entri baru.
Jalur `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh` yang tidak digunakan lagi
tidak didukung; gunakan permukaan plugin.
`appliedConfigHash` opsional milik snapshot adalah revisi konfigurasi sumber yang telah diselesaikan
dan diterima oleh runtime Gateway aktif. Klien dapat membandingkannya dengan
`config.get.configRevisionHash` untuk menentukan apakah konfigurasi tersimpan yang lebih baru masih
memerlukan mulai ulang. `config.get.hash` tetap menjadi revisi file root mentah yang digunakan oleh
pelindung konflik penulisan konfigurasi.

Selagi gateway masih menyelesaikan sidecar startup, `connect` dapat mengembalikan
galat `UNAVAILABLE` yang dapat dicoba ulang dengan `details.reason: "startup-sidecars"` dan
`retryAfterMs`. Coba ulang dalam anggaran koneksi Anda alih-alih menganggapnya sebagai
kegagalan handshake terminal.

Ketika token perangkat diterbitkan, `hello-ok.auth` menambahkannya:

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
kode penyiapan dasar yang berhasil mengembalikan token node utama serta satu
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

Serah-terima operator ini sengaja dibatasi: cukup untuk memulai perulangan
operator seluler dan penyiapan native, termasuk `operator.talk.secrets` untuk pembacaan
konfigurasi Talk, tetapi tanpa cakupan mutasi pemasangan dan tanpa `operator.admin`. Akses
pemasangan/admin yang lebih luas memerlukan alur pemasangan atau token terpisah yang disetujui. Persistenkan
`hello-ok.auth.deviceTokens` hanya ketika autentikasi bootstrap dijalankan melalui
transportasi tepercaya (`wss://` atau pemasangan loopback/lokal).

Klien backend dalam proses yang sama dan tepercaya (`client.id: "gateway-client"`,
`client.mode: "backend"`) dapat menghilangkan `device` pada koneksi loopback langsung saat
melakukan autentikasi dengan token/kata sandi gateway bersama. Jalur ini disediakan
untuk RPC bidang kontrol internal (mis. pembaruan sesi subagen) dan mencegah
dasar pemasangan CLI/perangkat yang kedaluwarsa menghalangi pekerjaan backend lokal. Klien jarak jauh,
berasal dari browser, node, serta klien token perangkat/identitas perangkat eksplisit tetap
melalui pemeriksaan pemasangan dan peningkatan cakupan normal.

### Peran worker dan protokol tertutup

Worker cloud menggunakan ingress loopback khusus melalui terowongan SSH milik gateway
dengan kunci host yang disematkan. Ingress ini hanya menerima identitas worker dan tidak pernah meneruskan
autentikasi umum, peristiwa node, RPC operator, atau metode plugin. `connect` yang ketat
memverifikasi kredensial berumur pendek yang di-hash saat disimpan dan terikat pada lingkungan, hash
bundel, epoch pemilik, versi set RPC, kedaluwarsa, serta satu sesi nullable; pemeriksaan ini
secara terpisah memeriksa versi dan set fitur saat ini. Keberhasilan mengembalikan
`worker-hello-ok` minimal; negosiasi fitur tidak bergantung pada versi protokol
umum. Frame tetap di bawah 64 KiB, kecuali frame `worker.inference.start` yang
dinegosiasikan dapat mencapai 25 MiB. Daftar izin tertutup berisi `worker.heartbeat`,
`worker.transcript.commit`, `worker.live-event`, `worker.inference.start`, dan
`worker.inference.cancel`.

Commit transkrip menggunakan fencing epoch pemilik, pengikatan sesi milik gateway,
compare-and-swap leaf dasar, dan pemutaran ulang urutan yang tahan lama; gateway menghasilkan
entri transkrip dan ID induk melalui penulis sesi normal. Kepemilikan dan
kedaluwarsa diperiksa ulang pada setiap RPC.

### Kemampuan klien

Klien operator dapat mengiklankan kemampuan opsional di `connect.params.caps`:

- `tool-events`: menerima peristiwa siklus hidup alat terstruktur.
- `inline-widgets`: dapat merender hasil alat widget sebaris yang dihosting.

Kemampuan klien menggambarkan klien yang terhubung, bukan otorisasi. Alat agen dapat mendeklarasikan kemampuan yang diperlukan; Gateway menghilangkan alat tersebut kecuali setiap persyaratan muncul dalam `caps` milik klien asal. Eksekusi yang berasal dari channel tidak memiliki kemampuan klien Gateway, sehingga alat yang dibatasi kemampuan tidak tersedia meskipun kebijakan alat secara eksplisit mengizinkannya.

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

Node mendeklarasikan klaim kemampuan saat terhubung:

- `caps`: kategori tingkat tinggi seperti `camera`, `canvas`, `screen`,
  `location`, `voice`, `talk`.
- `commands`: daftar izin perintah untuk pemanggilan.
- `permissions`: sakelar terperinci (mis. `screen.record`, `camera.capture`).

Gateway memperlakukan hal tersebut sebagai klaim dan memberlakukan daftar izin di sisi server.

## Peran dan cakupan

Untuk model cakupan operator lengkap, pemeriksaan saat persetujuan, dan semantik
rahasia bersama, lihat [Cakupan operator](/id/gateway/operator-scopes).

Peran:

- `operator`: klien bidang kontrol (CLI/UI/otomatisasi).
- `node`: host kemampuan (camera/screen/canvas/system.run).
- `worker`: host eksekusi cloud pada protokol worker khusus yang tertutup.

Cakupan operator (`src/gateway/operator-scopes.ts`), set tertutup lengkap:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` dengan `includeSecrets: true` memerlukan `operator.talk.secrets` (atau
`operator.admin`). Ketika rahasia disertakan, baca kredensial penyedia Talk aktif
dari `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
tetap berbentuk sumber dan dapat berupa objek SecretRef atau string yang disunting.

Metode RPC gateway yang didaftarkan plugin dapat meminta cakupan operatornya sendiri,
tetapi prefiks inti yang dicadangkan ini selalu diresolusikan menjadi `operator.admin`
(`src/shared/gateway-method-policy.ts`): `config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`.

Cakupan metode hanyalah gerbang pertama. Beberapa perintah garis miring yang dicapai melalui
`chat.send` menerapkan pemeriksaan tingkat perintah yang lebih ketat: penulisan persisten `/config set` dan
`/config unset` memerlukan `operator.admin` bahkan untuk klien gateway yang
sudah memiliki cakupan operator lebih rendah.

`node.pair.approve` memiliki pemeriksaan cakupan tambahan saat persetujuan di atas cakupan
metode dasar (`operator.pairing`), berdasarkan `commands` yang dideklarasikan oleh
permintaan tertunda (`src/infra/node-pairing-authz.ts`):

| Perintah yang dideklarasikan                                                                                                  | Cakupan yang diperlukan                 |
| ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| tidak ada                                                                                                                     | `operator.pairing`                      |
| perintah biasa                                                                                                                | `operator.pairing` + `operator.write` |
| mencakup `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir`, atau `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

### Caps/commands/permissions (node)

Node mendeklarasikan klaim kemampuan saat terhubung:

- `caps`: kategori kemampuan tingkat tinggi seperti `camera`, `canvas`, `screen`,
  `location`, `voice`, dan `talk`.
- `commands`: daftar izin perintah untuk pemanggilan.
- `permissions`: sakelar terperinci (mis. `screen.record`, `camera.capture`).

Gateway memperlakukan ini sebagai **klaim** dan memberlakukan daftar izin di sisi server.
Node yang terhubung dapat memublikasikan deskriptor Plugin atau alat MCP opsional
yang terlihat oleh agen dengan `node.pluginTools.update` setelah berhasil terhubung atau
terhubung kembali. Host Node headless dimulai ulang untuk menerapkan perubahan
inventaris MCP deklaratif. Metode pembaruan ini adalah satu-satunya jalur publikasi; deskriptor alat Plugin tidak diterima dalam
parameter `connect`. Setiap deskriptor harus menggunakan `name` alat yang aman bagi penyedia dan menyebutkan
`command` dalam daftar izin perintah Node saat ini. Gateway memercayai metadata
deskriptor dari Node yang dipasangkan, memfilter deskriptor di luar cakupan perintah
yang disetujui, menghapusnya saat Node terputus, dan menolak upaya operator
untuk mengubah katalog Node lain. Atur `gateway.nodes.pluginTools.enabled: false`
untuk mengabaikan deskriptor yang dipublikasikan Node.

Host Node yang terhubung memublikasikan katalog pengganti skill lengkapnya dengan
`node.skills.update`. Metode peran Node ini adalah satu-satunya jalur publikasi skill
Node; skill tidak diterima dalam parameter `connect`. Setiap deskriptor berisi
nama yang aman, deskripsi, dan konten `SKILL.md` yang dibatasi. Gateway mengurai
konten tersebut dengan pemuat skill normal, menyertakannya dalam snapshot skill agen
selama Node terhubung, dan menghapusnya saat terputus. Atur
`gateway.nodes.skills.enabled: false` untuk mengabaikan skill yang dipublikasikan Node.

## Kehadiran

- `system-presence` mengembalikan entri yang dikunci berdasarkan identitas perangkat, termasuk
  `deviceId`, `roles`, dan `scopes`, sehingga UI dapat menampilkan satu baris per perangkat bahkan
  saat perangkat terhubung sebagai operator sekaligus Node.
- `node.list` menyertakan `lastSeenAtMs` dan `lastSeenReason` opsional. Node yang terhubung
  melaporkan waktu koneksi saat ini dengan alasan `connect`; Node yang dipasangkan juga dapat
  melaporkan kehadiran latar belakang yang persisten melalui peristiwa Node tepercaya.

Node macOS native juga dapat mengirim peristiwa `node.presence.activity` terautentikasi
dengan waktu diam input yang dibatasi. Gateway menentukan stempel waktu aktivitas berdasarkan
waktunya sendiri, mengekspos Mac terhubung yang paling mutakhir melalui `node.list` dan
`node.describe`, serta menyiarkan pembaruan `node.presence` kepada klien dengan cakupan baca.
Lihat [Kehadiran komputer aktif](/nodes/presence) untuk perilaku pemilihan, privasi, konteks
model, dan perutean notifikasi.

### Peristiwa aktif latar belakang Node

Node memanggil `node.event` dengan `event: "node.presence.alive"` untuk mencatat bahwa
Node yang dipasangkan aktif selama proses bangun di latar belakang, tanpa menandainya sebagai terhubung:

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` adalah enum tertutup: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, `connect`. Nilai yang tidak dikenal dinormalisasi menjadi
`background` (`src/shared/node-presence.ts`). Peristiwa hanya dipertahankan untuk
sesi perangkat Node terautentikasi; sesi tanpa perangkat atau yang tidak dipasangkan mengembalikan
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
sebagai RPC yang diterima, bukan persistensi kehadiran yang tahan lama.

## Pencakupan peristiwa siaran

Peristiwa siaran yang didorong server dibatasi berdasarkan cakupan agar sesi
dengan cakupan pemasangan atau khusus Node tidak menerima konten sesi secara pasif
(`src/gateway/server-broadcast.ts`):

- Frame obrolan, agen, dan hasil alat (peristiwa `agent` yang dialirkan, peristiwa
  hasil alat) memerlukan setidaknya `operator.read`. Sesi tanpa cakupan tersebut melewati
  frame ini sepenuhnya.
- Siaran `plugin.*` yang ditentukan Plugin secara default dibatasi untuk `operator.write` atau
  `operator.admin`; entri eksplisit seperti
  `plugin.approval.requested` / `plugin.approval.resolved` menggunakan
  `operator.approvals` sebagai gantinya.
- Peristiwa status/transportasi (`heartbeat`, `presence`, `tick`, siklus hidup
  terhubung/terputus) tetap tidak dibatasi agar kondisi transportasi dapat diamati oleh setiap
  sesi terautentikasi.
- Keluarga peristiwa siaran yang tidak dikenal dibatasi berdasarkan cakupan secara default (gagal-tertutup),
  kecuali pengendali terdaftar secara eksplisit melonggarkannya.

Setiap koneksi klien menyimpan nomor urut per kliennya sendiri, sehingga siaran
tetap diurutkan secara monoton pada soket tersebut, bahkan ketika klien yang berbeda melihat
subset aliran peristiwa terfilter cakupan yang berbeda.

## Keluarga metode RPC

`hello-ok.features.methods` adalah daftar penemuan konservatif yang dibangun dari
`src/gateway/server-methods-list.ts` ditambah ekspor metode Plugin/kanal
yang dimuat — ini bukan dump yang dihasilkan dari setiap metode, dan beberapa metode (misalnya
`push.test`, `web.login.start`, `web.login.wait`, `sessions.usage`)
sengaja dikecualikan dari penemuan meskipun merupakan metode nyata yang dapat
dipanggil. Perlakukan ini sebagai penemuan fitur, bukan enumerasi lengkap
`src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistem dan identitas">
    - `health` mengembalikan snapshot kondisi Gateway yang tersimpan dalam cache atau baru saja diperiksa.
    - `diagnostics.stability` mengembalikan pencatat stabilitas diagnostik terkini yang dibatasi: nama peristiwa, jumlah, ukuran byte, pembacaan memori, status antrean/sesi, nama kanal/Plugin, id sesi. Tidak ada teks obrolan, isi Webhook, keluaran alat, isi permintaan/respons mentah, token, cookie, atau rahasia. Memerlukan `operator.read`.
    - `status` mengembalikan ringkasan Gateway bergaya `/status`; bidang sensitif hanya untuk klien operator dengan cakupan admin.
    - `gateway.identity.get` mengembalikan identitas perangkat Gateway yang digunakan oleh alur relai dan pemasangan.
    - `system-presence` mengembalikan snapshot kehadiran saat ini untuk perangkat operator/Node yang terhubung.
    - `system-event` menambahkan peristiwa sistem dan dapat memperbarui/menyiarkan konteks kehadiran.
    - `last-heartbeat` mengembalikan peristiwa Heartbeat terakhir yang dipertahankan.
    - `set-heartbeats` mengaktifkan atau menonaktifkan pemrosesan Heartbeat pada Gateway.
    - `gateway.suspend.prepare` membuat sewa penangguhan kooperatif singkat hanya ketika pekerjaan Gateway yang dilacak sedang menganggur. `gateway.suspend.status` memeriksa sewa tersebut, dan `gateway.suspend.resume` melepaskannya setelah pencairan atau operasi host yang dibatalkan.

  </Accordion>

  <Accordion title="Model dan penggunaan">
    - `models.list` mengembalikan katalog model yang diizinkan saat runtime. Lihat tampilan "`models.list`" di bawah.
    - `usage.status` mengembalikan ringkasan jendela penggunaan penyedia/kuota tersisa.
    - `usage.cost` mengembalikan ringkasan agregat penggunaan biaya untuk suatu rentang tanggal. Teruskan `agentId` untuk satu agen, atau `agentScope: "all"` untuk mengagregasi agen yang dikonfigurasi.
    - `doctor.memory.status` mengembalikan kesiapan memori vektor / embedding yang tersimpan dalam cache untuk ruang kerja agen default aktif. Teruskan `{ "probe": true }` atau `{ "deep": true }` hanya untuk ping eksplisit ke penyedia embedding langsung. Teruskan `{ "agentId": "agent-id" }` untuk membatasi statistik penyimpanan Dreaming ke satu ruang kerja agen; jika dihilangkan, ruang kerja Dreaming yang dikonfigurasi akan diagregasi.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts`, dan `doctor.memory.dedupeDreamDiary` menerima `{ "agentId": "agent-id" }` opsional; jika dihilangkan, semuanya beroperasi pada ruang kerja agen default yang dikonfigurasi.
    - `doctor.memory.remHarness` mengembalikan pratinjau harness REM hanya-baca yang dibatasi untuk klien bidang kontrol jarak jauh, termasuk jalur ruang kerja, cuplikan memori, markdown berlandaskan yang dirender, dan kandidat promosi mendalam. Memerlukan `operator.read`.
    - `sessions.usage` mengembalikan ringkasan penggunaan per sesi. Teruskan `agentId` untuk satu agen, atau `agentScope: "all"` untuk mencantumkan agen yang dikonfigurasi bersama-sama.
      Kedua metode penggunaan menerima `mode: "specific"` dengan `timeZone` IANA untuk batas dan kelompok hari kalender yang memperhitungkan DST. `utcOffset` tetap didukung untuk klien lama dan sebagai fallback ketika runtime Gateway tidak mengenali zona yang diminta.
    - `sessions.usage.timeseries` mengembalikan penggunaan deret waktu untuk satu sesi.
    - `sessions.usage.logs` mengembalikan entri log penggunaan untuk satu sesi.

  </Accordion>

  <Accordion title="Kanal dan pembantu masuk">
    - `channels.status` mengembalikan ringkasan status kanal/Plugin bawaan + terbundel.
    - `channels.logout` mengeluarkan akun dari kanal/akun tertentu jika kanal mendukungnya.
    - `web.login.start` memulai alur masuk QR/web untuk penyedia kanal web saat ini yang mendukung QR.
    - `web.login.wait` menunggu alur tersebut selesai dan memulai kanal jika berhasil.
    - `push.test` mengirim push APNs pengujian ke Node iOS terdaftar.
    - `voicewake.get` mengembalikan pemicu kata pengaktifan yang tersimpan.
    - `voicewake.set` memperbarui pemicu kata pengaktifan dan menyiarkan perubahannya.

  </Accordion>

  <Accordion title="Pengelolaan Plugin">
    - `plugins.list` (`operator.read`) mengembalikan inventaris Plugin yang terinstal beserta pilihan resmi yang dikurasi secara lokal, diagnostik, dan apakah mode instalasi saat ini mengizinkan perubahan.
    - `plugins.search` (`operator.read`) mencari keluarga Plugin kode dan Plugin bundel ClawHub yang dapat diinstal. Teruskan `query` yang tidak kosong dan `limit` opsional dari 1 hingga 100.
    - `plugins.install` (`operator.admin`) menginstal entri katalog resmi dengan `{ source: "official", pluginId }` atau paket ClawHub dengan `{ source: "clawhub", packageName, version?, acknowledgeClawHubRisk? }`. Instalasi ClawHub mempertahankan pemeriksaan kepercayaan, integritas, dan kebijakan instalasi Gateway. Instalasi yang berhasil memerlukan Gateway dimulai ulang.
    - `plugins.setEnabled` (`operator.admin`) mengubah kebijakan aktif satu Plugin yang terinstal dengan `{ pluginId, enabled }`. Respons mencakup entri katalog yang diperbarui, metadata mulai ulang, dan setiap peringatan pemilihan slot.
    - `plugins.uninstall` (`operator.admin`) menghapus satu Plugin yang diinstal secara eksternal dengan `{ pluginId }`: referensi konfigurasi, catatan instalasi, dan berkas terkelola. Plugin terbundel tidak dapat dihapus instalasinya, hanya dapat dinonaktifkan. Respons mencantumkan tindakan penghapusan dan selalu memerlukan Gateway dimulai ulang.

  </Accordion>

  <Accordion title="Perpesanan dan log">
    - `send` adalah RPC pengiriman keluar langsung untuk pengiriman yang ditargetkan ke kanal/akun/utas di luar runner obrolan.
    - `logs.tail` mengembalikan bagian akhir log berkas Gateway yang dikonfigurasi dengan kontrol kursor/batas dan byte maksimum.

  </Accordion>

  <Accordion title="Terminal operator">
    - `terminal.open` memulai PTY host untuk `agentId` yang ditentukan secara eksplisit atau agen default dan mengembalikan agen yang telah diresolusi, direktori kerja, shell, serta status pembatasan.
    - `terminal.input`, `terminal.resize`, dan `terminal.close` hanya beroperasi pada sesi yang dimiliki oleh koneksi pemanggil.
    - `terminal.upload` menerima satu file base64 hingga 16 MiB, menempatkannya di direktori sementara privat selama 24 jam pada Gateway sesi atau host node yang dipasangkan, lalu mengembalikan jalur absolutnya. Pemanggil tetap harus menempelkan atau menggunakan jalur tersebut dengan cara lain; RPC tidak pernah menulis input terminal atau menjalankan perintah.
    - Peristiwa `terminal.data` dan `terminal.exit` hanya dialirkan ke koneksi yang memiliki sesi.
    - Sesi yang koneksinya terputus akan dilepas, bukan dihentikan: sesi tetap dapat disambungkan kembali selama `gateway.terminal.detachedSessionTimeoutSeconds` (default 300; `0` memulihkan penghentian saat koneksi terputus), sementara output terbaru terakumulasi dalam buffer sisi server yang dibatasi.
    - `terminal.list` mengembalikan sesi yang dapat disambungkan; `terminal.attach` mengikat ulang sesi aktif atau terlepas ke koneksi pemanggil dan mengembalikan buffer pemutaran ulang (pengambilalihan bergaya tmux — pemilik aktif sebelumnya menerima `terminal.exit` dengan alasan `detached`); `terminal.text` membaca buffer sebagai teks biasa tanpa menyambungkan.
    - Setiap metode terminal memerlukan `operator.admin`; `gateway.terminal.enabled` harus secara eksplisit bernilai true. Agen yang sepenuhnya berada dalam sandbox ditolak, dan perubahan kebijakan agen menutup PTY yang ada maupun yang sedang diproses, termasuk yang terlepas.

  </Accordion>

  <Accordion title="Percakapan dan TTS">
    - `talk.catalog` mengembalikan katalog penyedia Percakapan hanya-baca untuk ucapan, transkripsi streaming, dan suara waktu nyata: id penyedia kanonis, alias registri, label, status konfigurasi, hasil `ready` tingkat grup opsional, id model/suara yang diekspos, mode kanonis, transportasi, strategi otak, serta tanda audio/kapabilitas waktu nyata, tanpa mengembalikan rahasia penyedia atau mengubah konfigurasi global. Gateway saat ini menetapkan `ready` setelah menerapkan pemilihan penyedia runtime; anggap ketiadaannya sebagai belum terverifikasi pada Gateway lama.
    - `talk.config` mengembalikan payload konfigurasi Percakapan yang efektif; `includeSecrets` memerlukan `operator.talk.secrets` (atau `operator.admin`).
    - `talk.session.create` membuat sesi Percakapan milik Gateway untuk `realtime/gateway-relay`, `transcription/gateway-relay`, atau `stt-tts/managed-room`. Untuk `stt-tts/managed-room`, pemanggil `operator.write` yang meneruskan `sessionKey` juga harus meneruskan `spawnedBy` untuk visibilitas kunci sesi terbatas; pembuatan `sessionKey` tanpa cakupan dan `brain: "direct-tools"` memerlukan `operator.admin`.
    - `talk.session.join` memvalidasi token sesi ruang terkelola, memancarkan `session.ready` atau `session.replaced` sesuai kebutuhan, dan mengembalikan metadata ruang/sesi beserta peristiwa Percakapan terbaru, tanpa pernah mengembalikan token teks biasa atau hash-nya.
    - `talk.session.appendAudio` menambahkan audio input PCM base64 ke sesi relai waktu nyata dan transkripsi milik Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn`, dan `talk.session.cancelTurn` mengendalikan siklus hidup giliran ruang terkelola dengan penolakan giliran kedaluwarsa sebelum status dihapus.
    - `talk.session.cancelOutput` menghentikan output audio asisten, terutama untuk interupsi berpagar VAD dalam sesi relai Gateway.
    - `talk.session.submitToolResult` menyelesaikan pemanggilan alat penyedia yang dipancarkan oleh sesi relai waktu nyata milik Gateway. Permintaan menunggu sinyal penyelesaian asinkron apa pun yang diekspos oleh jembatan penyedia; pengiriman yang gagal mempertahankan eksekusi tertaut tetap aktif dan tidak memancarkan peristiwa hasil alat yang berhasil. Teruskan `options: { willContinue: true }` untuk output alat sementara atau `options: { suppressResponse: true }` ketika jembatan penyedia mengiklankan dukungan penekanan dan hasilnya tidak boleh memulai respons lain.
    - `talk.session.steer` mengirimkan kontrol suara eksekusi aktif ke sesi Percakapan berbasis agen milik Gateway: `{ sessionId, text, mode? }`, dengan `mode` berupa `status`, `steer`, `cancel`, atau `followup`; mode yang tidak dicantumkan diklasifikasikan dari teks yang diucapkan.
    - `talk.session.close` menutup sesi relai, transkripsi, atau ruang terkelola milik Gateway dan memancarkan peristiwa terminal Percakapan.
    - `talk.mode` menetapkan/menyiarkan status mode Percakapan saat ini untuk klien WebChat/Control UI.
    - `talk.client.create` membuat sesi penyedia waktu nyata milik klien menggunakan `webrtc` atau `provider-websocket`, sementara Gateway memiliki konfigurasi, kredensial, instruksi, dan kebijakan alat.
    - `talk.client.toolCall` memungkinkan transportasi waktu nyata milik klien meneruskan pemanggilan alat penyedia ke kebijakan Gateway. Alat pertama yang didukung adalah `openclaw_agent_consult`; klien mendapatkan id eksekusi dan menunggu peristiwa siklus hidup obrolan normal sebelum mengirimkan hasil alat khusus penyedia.
    - `talk.client.steer` mengirimkan kontrol suara eksekusi aktif untuk transportasi waktu nyata milik klien. Gateway meresolusi eksekusi tertanam yang aktif dari `sessionKey` dan mengembalikan hasil diterima/ditolak yang terstruktur alih-alih mengabaikan pengarahan secara diam-diam.
    - `talk.event` adalah saluran tunggal peristiwa Percakapan untuk adaptor waktu nyata, transkripsi, STT/TTS, ruang terkelola, telefoni, dan rapat.
    - `talk.speak` menyintesis ucapan melalui penyedia ucapan Percakapan yang aktif.
    - `tts.status` mengembalikan status pengaktifan TTS, penyedia aktif, penyedia cadangan, dan status konfigurasi penyedia.
    - `tts.providers` mengembalikan inventaris penyedia TTS yang terlihat.
    - `tts.enable` dan `tts.disable` mengaktifkan atau menonaktifkan status preferensi TTS.
    - `tts.setProvider` memperbarui penyedia TTS pilihan.
    - `tts.convert` menjalankan konversi teks ke ucapan satu kali.
    - `tts.speak` (`operator.write`) merender `text` yang tidak kosong dengan rantai penyedia TTS umum yang dikonfigurasi dan mengembalikan satu klip utuh secara inline sebagai `audioBase64`, beserta metadata `provider` dan `outputFormat`, `mimeType`, serta `fileExtension` opsional. Berbeda dengan `tts.convert`, metode ini tidak mengembalikan jalur lokal Gateway; berbeda dengan `talk.speak`, metode ini tidak memerlukan penyedia Percakapan. Teks di atas `messages.tts.maxTextLength` mengembalikan `INVALID_REQUEST`; kegagalan sintesis mengembalikan `UNAVAILABLE`.

  </Accordion>

  <Accordion title="Rahasia, konfigurasi, pembaruan, dan wisaya">
    - `secrets.reload` meresolusi ulang SecretRef aktif dan menukar status rahasia runtime hanya jika seluruh proses berhasil.
    - `secrets.resolve` meresolusi penetapan rahasia target perintah untuk sekumpulan perintah/target tertentu.
    - `config.get` mengembalikan snapshot konfigurasi pada disk saat ini, `hash` file akar mentah, `configRevisionHash` yang telah diresolusi, dan `appliedConfigHash` opsional untuk revisi teresolusi yang diterima oleh runtime Gateway aktif.
    - `config.set` menulis payload konfigurasi yang telah divalidasi.
    - `config.patch` menggabungkan pembaruan konfigurasi parsial. Penggantian array destruktif memerlukan jalur yang terpengaruh dalam `replacePaths`; array bersarang di bawah entri array menggunakan jalur `[]` seperti `agents.list[].skills`.
    - `config.apply` memvalidasi dan mengganti seluruh payload konfigurasi.
    - `config.schema` mengembalikan payload skema konfigurasi aktif yang digunakan oleh alat Control UI dan CLI: skema, `uiHints`, versi, metadata pembuatan, serta metadata skema Plugin dan saluran jika dapat dimuat. Payload ini mencakup metadata `title` / `description` dari label/teks bantuan yang sama dengan UI, termasuk cabang komposisi objek bersarang, karakter pengganti, item array, dan `anyOf` / `oneOf` / `allOf` ketika dokumentasi bidang yang cocok tersedia.
    - `config.schema.lookup` mengembalikan payload pencarian yang dibatasi jalur untuk satu jalur konfigurasi: jalur ternormalisasi, node skema dangkal, petunjuk yang cocok beserta `hintPath`, `reloadKind` opsional, dan ringkasan turunan langsung untuk penelusuran mendalam UI/CLI. `reloadKind` adalah salah satu dari `restart`, `hot`, atau `none` (`src/config/schema.ts`) dan mencerminkan perencana pemuatan ulang konfigurasi Gateway untuk jalur yang diminta. Node skema pencarian mempertahankan dokumentasi yang terlihat oleh pengguna dan bidang validasi umum (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, batas numerik/string/array/objek, `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Ringkasan turunan mengekspos `key`, `path` yang dinormalisasi, `type`, `required`, `hasChildren`, `reloadKind` opsional, serta `hint` / `hintPath` yang cocok.
    - `update.run` menjalankan alur pembaruan Gateway dan menjadwalkan mulai ulang hanya jika pembaruan berhasil; pemanggil yang memiliki sesi dapat menyertakan `continuationMessage` agar saat dimulai, satu giliran agen tindak lanjut dilanjutkan melalui antrean kelanjutan mulai ulang. Pembaruan pengelola paket dan pembaruan checkout git yang diawasi dari bidang kontrol menggunakan serah terima layanan terkelola yang terpisah, alih-alih mengganti pohon paket atau mengubah output checkout/build di dalam Gateway aktif. Serah terima yang dimulai mengembalikan `ok: true` dengan `result.reason: "managed-service-handoff-started"` dan `handoff.status: "started"`; serah terima yang tidak tersedia atau gagal mengembalikan `ok: false` dengan `managed-service-handoff-unavailable` atau `managed-service-handoff-failed`, beserta `handoff.command` ketika pembaruan shell manual diperlukan. Tidak tersedia berarti OpenClaw tidak memiliki batas supervisor yang aman atau identitas layanan yang persisten, seperti `OPENCLAW_SYSTEMD_UNIT` untuk systemd. Selama serah terima yang telah dimulai, sentinel mulai ulang dapat melaporkan `stats.reason: "restart-health-pending"` untuk sesaat; kelanjutan ditunda hingga CLI memverifikasi Gateway yang telah dimulai ulang dan menulis sentinel akhir `ok`.
    - `update.status` menyegarkan dan mengembalikan sentinel mulai ulang pembaruan terbaru, termasuk versi yang berjalan setelah mulai ulang jika tersedia.
    - `wizard.start`, `wizard.next`, `wizard.status`, dan `wizard.cancel` mengekspos wisaya orientasi awal melalui RPC WS.

  </Accordion>

  <Accordion title="Pembantu agen dan ruang kerja">
    - `agents.list` mengembalikan entri agen yang dikonfigurasi, termasuk metadata model dan runtime efektif.
    - `agents.create`, `agents.update`, dan `agents.delete` mengelola rekaman agen dan pengawatan ruang kerja.
    - `agents.files.list`, `agents.files.get`, dan `agents.files.set` mengelola berkas ruang kerja bootstrap yang diekspos untuk agen.
    - `audit.activity.list` mengembalikan buku besar aktivitas berversi yang hanya berisi metadata; `audit.list` tetap menjadi RPC proses/alat yang aman untuk kompatibilitas.
    - `agents.workspace.list` dan `agents.workspace.get` (`operator.read`) menyediakan penelusuran berpaginasi dan hanya-baca atas direktori ruang kerja agen untuk klien dalam domain operator tepercaya yang dijelaskan dalam [Cakupan operator](/id/gateway/operator-scopes). Permintaan hanya menerima jalur yang relatif terhadap ruang kerja; pembacaan tetap dibatasi pada akar ruang kerja yang telah di-realpath (pelolosan melalui symlink dan hardlink ditolak), dibatasi ukurannya, dan terbatas pada teks UTF-8 serta jenis gambar umum (base64). Respons tidak mengekspos jalur ruang kerja host. Tidak ada operasi tulis dalam namespace ini.
    - `tasks.list`, `tasks.get`, dan `tasks.cancel` mengekspos buku besar tugas Gateway kepada klien SDK dan operator. Lihat [RPC buku besar tugas](#task-ledger-rpcs) di bawah.
    - `artifacts.list`, `artifacts.get`, dan `artifacts.download` mengekspos ringkasan dan unduhan artefak yang berasal dari transkrip untuk cakupan `sessionKey`, `runId`, atau `taskId` yang eksplisit. Kueri proses dan tugas menentukan sesi pemilik di sisi server dan hanya mengembalikan media transkrip dengan asal-usul yang cocok; sumber URL yang tidak aman atau lokal mengembalikan unduhan yang tidak didukung alih-alih mengambilnya di sisi server.
    - `environments.list` dan `environments.status` mempertahankan penemuan lingkungan lokal Gateway dan Node. Worker cloud yang dikonfigurasi dan rekaman persisten yang ditinggalkan oleh profil sebelumnya menambahkan metadata `worker` dengan `providerId`, `leaseId` opsional, `state`, `ageMs`, `idleMs` opsional, dan `attachedSessionIds`. Status siklus hidup worker adalah `requested`, `provisioning`, `bootstrapping`, `ready`, `attached`, `idle`, `draining`, `destroying`, `destroyed`, `failed`, dan `orphaned`.
    - `environments.create` (`{ profileId, idempotencyKey }`) menyediakan worker dari profil penyedia Plugin yang dikonfigurasi; percobaan ulang dengan kunci yang sama menggunakan kembali operasi persisten. `environments.destroy` (`{ environmentId }`) meminta penghentian idempoten atas lingkungan worker persisten. Keduanya memerlukan `operator.admin`, merupakan penulisan bidang kontrol, dan mengembalikan bentuk ringkasan lingkungan yang sama dengan yang digunakan oleh respons status.
    - `agent.identity.get` mengembalikan identitas asisten efektif untuk agen atau sesi.
    - `agent.wait` menunggu hingga proses selesai dan mengembalikan snapshot terminal jika tersedia.

  </Accordion>

  <Accordion title="Kontrol sesi">
    - `sessions.list` mengembalikan indeks sesi saat ini, termasuk metadata `agentRuntime` per baris ketika backend runtime agen dikonfigurasi. Ketika penempatan worker cloud diaktifkan atau terdapat status pemulihan persisten, baris sesi juga menyertakan status `placement` tertutup (`local`, `requested`, `provisioning`, `syncing`, `starting`, `active`, `draining`, `reconciling`, `reclaimed`, atau `failed`) beserta bidang lingkungan, epoch pemilik, ruang kerja, bundel, kursor ACK, atau pemulihan yang spesifik untuk status tersebut.
    - `sessions.subscribe` dan `sessions.unsubscribe` mengaktifkan atau menonaktifkan langganan peristiwa perubahan sesi untuk klien WS saat ini.
    - `sessions.messages.subscribe` dan `sessions.messages.unsubscribe` mengaktifkan atau menonaktifkan langganan peristiwa transkrip/pesan untuk satu sesi. Teruskan `includeApprovals: true` agar juga menerima peristiwa siklus hidup `session.approval` yang telah disanitasi untuk persetujuan yang audiens tersimpannya mencakup sesi yang persis sama dan yang pengikatan peninjaunya mengotorisasi klien pelanggan. Respons langganan kemudian menyertakan `approvalReplay` tertunda yang dibatasi; nilai ini bersifat otoritatif ketika `truncated` bernilai false. Keikutsertaan berlaku per panggilan langganan, tidak menetap: berlangganan ulang ke sesi yang sama tanpa `includeApprovals: true` menghapus langganan persetujuan yang ada. Selain otoritas pembacaan sesi normal, keikutsertaan ini memerlukan `operator.admin`, atau `operator.approvals` pada perangkat yang dipasangkan.
    - `sessions.preview` mengembalikan pratinjau transkrip yang dibatasi untuk kunci sesi tertentu.
    - `sessions.describe` mengembalikan satu baris sesi Gateway untuk kunci sesi yang persis sama.
    - `sessions.resolve` menentukan atau mengkanoniskan target sesi.
    - `sessions.create` membuat entri sesi baru. Nilai `model` dan `thinkingLevel` opsional mempertahankan penggantian model dan penalaran awal secara atomik. `worktree: true` menyediakan worktree terkelola; `worktreeBaseRef`/`worktreeName` opsional memilih ref dasar dan nama cabang, sedangkan `execNode` (`operator.admin`) mengikat eksekusi sesi ke host Node. Worktree yang dibuat disertakan kembali dalam hasil dan dipertahankan pada baris sesi (`worktree: { id, branch, repoRoot }`). Ketika entri berhasil dibuat tetapi `chat.send` awal yang tersarang ditolak, hasil yang berhasil menyertakan `runStarted: false` dan `runError`; klien dapat mempertahankan prompt dan mencoba kembali menggunakan kunci sesi yang dikembalikan.
    - `sessions.dispatch` (`operator.admin`) memindahkan sesi OpenClaw lokal yang sudah ada dengan worktree terkelola milik sesi ke profil worker cloud yang dikonfigurasi. Teruskan `{ key, profileId, agentId? }`. Metode ini tidak tersedia ketika tidak ada profil worker yang dikonfigurasi, menutup penerimaan giliran lokal sebelum menuntaskan pekerjaan aktif, dan hanya kembali setelah penempatan mencapai kepemilikan worker `active`. Pengiriman bersifat satu arah; penarikan kembali dari worker ke lokal bukan bagian dari RPC ini.
    - `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename`, dan `sessions.groups.delete` mengelola katalog grup sesi khusus milik Gateway (nama + urutan tampilan). Keanggotaan tetap berada pada bidang `category` setiap sesi; penggantian nama dan penghapusan memperbarui sesi anggota di sisi server.
    - `sessions.send` mengirim pesan ke sesi yang sudah ada.
    - `sessions.steer` adalah varian interupsi-dan-arahkan untuk sesi aktif.
    - `sessions.abort` membatalkan pekerjaan aktif untuk sebuah sesi. Teruskan `key` beserta `runId` opsional, atau hanya `runId` untuk proses aktif yang dapat ditentukan oleh Gateway ke sebuah sesi.
    - `sessions.patch` memperbarui metadata/penggantian sesi dan melaporkan model kanonis yang telah ditentukan beserta `agentRuntime` efektif.
    - `sessions.reset`, `sessions.delete`, dan `sessions.compact` melakukan pemeliharaan sesi.
    - `sessions.get` mengembalikan baris sesi tersimpan secara lengkap.
    - Eksekusi obrolan tetap menggunakan `chat.history`, `chat.send`, `chat.abort`, dan `chat.inject`. `chat.history` dinormalisasi untuk tampilan bagi klien UI: tag direktif sebaris dihapus dari teks yang terlihat, payload XML pemanggilan alat dalam teks biasa (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok pemanggilan alat yang terpotong) serta token kontrol model ASCII/lebar-penuh yang bocor dihapus, baris asisten yang hanya berisi token senyap (`NO_REPLY` / `no_reply` persis) dihilangkan, dan baris yang terlalu besar dapat diganti dengan placeholder.
    - `chat.message.get` adalah pembaca pesan lengkap terbatas yang bersifat aditif untuk satu entri transkrip yang terlihat. Teruskan `sessionKey`, `agentId` opsional ketika pemilihan sesi dicakup oleh agen, dan `messageId` transkrip yang sebelumnya ditampilkan melalui `chat.history`; Gateway mengembalikan proyeksi yang dinormalisasi untuk tampilan yang sama tanpa batas pemotongan riwayat ringan ketika entri tersimpan masih tersedia dan tidak terlalu besar.
    - `chat.toolTitles` mengembalikan judul tujuan singkat untuk pemanggilan alat yang dirender dalam Control UI (secara batch, maksimum 24 item dengan masukan yang dibatasi). Fitur ini bersifat opsional melalui `gateway.controlUi.toolTitles` (secara default nonaktif); Gateway yang dinonaktifkan menjawab `{ titles: {}, disabled: true }` tanpa pemanggilan model agar klien berhenti meminta. Ketika diaktifkan, judul menggunakan perutean model utilitas standar: `utilityModel` yang dikonfigurasi secara eksplisit (keputusan operator yang, seperti semua tugas utilitas, dapat mengirim konten tugas terbatas kepada penyedia yang dipilih), atau jika tidak ada, default model kecil yang dideklarasikan penyedia sesi agar tidak ada tujuan pengiriman data baru yang muncul secara implisit; `utilityModel` kosong menonaktifkannya sepenuhnya. Judul tidak pernah beralih ke model utama sebagai fallback. Hasil disimpan dalam cache di basis data status per agen dengan kunci nama alat + masukan, sehingga tampilan berulang tidak pernah menagihkan kembali pemanggilan yang sama.
    - `chat.send` menerima `fastMode: "auto"` satu giliran untuk menggunakan mode cepat bagi pemanggilan model yang dimulai sebelum batas otomatis, lalu memulai percobaan ulang, fallback, hasil alat, atau pemanggilan lanjutan setelahnya tanpa mode cepat. Batas tersebut secara default adalah 60 detik (`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`) dan dapat dikonfigurasi per model dengan `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Pemanggil `chat.send` dapat meneruskan `fastAutoOnSeconds` satu giliran untuk mengganti batas tersebut bagi permintaan itu. Teruskan `queueMode` (`steer`, `followup`, `collect`, atau `interrupt`) untuk mengganti mode antrean tersimpan hanya bagi permintaan ini; tindakan pengarahan Control UI yang eksplisit menggunakan `queueMode: "steer"`.

  </Accordion>

  <Accordion title="Pemasangan perangkat dan token perangkat">
    - `device.pair.list` mengembalikan perangkat yang dipasangkan, baik yang tertunda maupun yang disetujui.
    - `device.pair.setupCode` membuat kode penyiapan seluler dan, secara default, URL data QR PNG. Ini memerlukan `operator.admin` dan sengaja tidak disertakan dalam penemuan yang diiklankan. Hasilnya menyertakan `setupCode`, `qrDataUrl` opsional, `gatewayUrl`, label nonrahasia `auth`, dan `urlSource`.
    - `device.pair.approve`, `device.pair.reject`, dan `device.pair.remove` mengelola rekaman pemasangan perangkat.
    - `device.pair.rename` menetapkan label operator (`{ deviceId, label }`) yang diutamakan daripada nama tampilan yang dilaporkan klien dan tetap bertahan setelah perbaikan atau persetujuan ulang perangkat.
    - `device.token.rotate` merotasi token perangkat yang dipasangkan dalam batas peran yang disetujui dan cakupan pemanggilnya.
    - `device.token.revoke` mencabut token perangkat yang dipasangkan dalam batas peran yang disetujui dan cakupan pemanggilnya.

    Kode penyiapan menyematkan kredensial bootstrap berumur pendek. Klien tidak boleh
    mencatat atau mempertahankannya setelah alur pemasangan selesai.

  </Accordion>

  <Accordion title="Penyandingan Node, pemanggilan, dan pekerjaan tertunda">
    - `node.pair.list`, `node.pair.approve`, `node.pair.reject`, dan `node.pair.remove` mencakup persetujuan kapabilitas Node. `node.pair.request` dan `node.pair.verify` dihapus pada 2026.7 bersama penyimpanan penyandingan Node mandiri; permintaan tertunda dibuat oleh Gateway saat Node terhubung.
    - `node.list` dan `node.describe` mengembalikan status Node yang diketahui/terhubung.
    - `node.rename` memperbarui label Node yang telah disandingkan.
    - `node.invoke` meneruskan perintah ke Node yang terhubung.
    - `node.invoke.result` mengembalikan hasil untuk permintaan pemanggilan.
    - `mcp.tools.call.v1` adalah perintah host Node tanpa antarmuka untuk memanggil alat MCP lokal Node yang telah dikonfigurasi. Perintah ini diteruskan melalui `node.invoke`, mengharuskan Node mendeklarasikan perintah tersebut, dan tetap tunduk pada persetujuan penyandingan serta `gateway.nodes.denyCommands`.
    - `node.event` membawa peristiwa yang berasal dari Node kembali ke Gateway.
    - `node.pluginTools.update` adalah satu-satunya jalur publikasi untuk mengganti deskriptor alat Plugin/MCP milik Node terhubung yang terlihat oleh agen; parameter `connect` tidak membawanya.
    - `node.pending.pull` dan `node.pending.ack` adalah API antrean Node terhubung.
    - `node.pending.enqueue` dan `node.pending.drain` mengelola pekerjaan tertunda yang persisten untuk Node luring/terputus.

  </Accordion>

  <Accordion title="Kelompok persetujuan">
    - `approval.get` dan `approval.resolve` adalah metode persetujuan persisten yang tidak bergantung pada jenis (cakupan `operator.approvals`). `approval.get` mengembalikan proyeksi terminal tertunda atau tersimpan yang telah disanitasi dengan `urlPath` yang stabil; `approval.resolve` menerima ID persetujuan kanonis, `kind` eksplisit, dan keputusan, menerapkan resolusi jawaban pertama yang menang, serta selalu mengembalikan hasil kanonis yang tercatat.
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, dan `exec.approval.resolve` mencakup permintaan persetujuan eksekusi satu kali beserta pencarian/pemutaran ulang persetujuan tertunda. Semuanya merupakan adaptor batas protokol di atas registri persetujuan persisten yang sama.
    - `exec.approval.waitDecision` menunggu satu persetujuan eksekusi tertunda dan mengembalikan keputusan akhir (atau `null` saat waktu habis).
    - `exec.approvals.get` dan `exec.approvals.set` mengelola rekam keadaan kebijakan persetujuan eksekusi Gateway.
    - `exec.approvals.node.get` dan `exec.approvals.node.set` mengelola kebijakan persetujuan eksekusi lokal Node melalui perintah relai Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, dan `plugin.approval.resolve` mencakup alur persetujuan yang ditentukan Plugin.

  </Accordion>

  <Accordion title="Otomatisasi, Skills, dan alat">
    - Otomatisasi: `wake` menjadwalkan injeksi teks pembangun segera atau pada Heartbeat berikutnya; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` mengelola pekerjaan terjadwal.
    - `cron.run` tetap menjadi RPC bergaya pengantrean untuk eksekusi manual. Klien yang memerlukan semantik penyelesaian harus membaca `runId` yang dikembalikan dan melakukan polling terhadap `cron.runs`.
    - `cron.runs` menerima filter `runId` opsional yang tidak kosong agar klien dapat mengikuti satu eksekusi manual yang diantrekan tanpa berlomba dengan entri riwayat lain untuk pekerjaan yang sama.
    - Skills dan alat: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`. Lihat [Metode pembantu operator](#operator-helper-methods) di bawah.

  </Accordion>
</AccordionGroup>

### Kelompok peristiwa umum

- `chat`: pembaruan obrolan UI seperti `chat.inject` dan peristiwa obrolan lain
  yang hanya ada dalam transkrip. Dalam protokol v4, payload delta membawa `deltaText`; `message` tetap
  menjadi rekam keadaan asisten kumulatif. Penggantian nonawalan menetapkan
  `replace=true` dan menggunakan `deltaText` sebagai teks pengganti.
- `session.message`, `session.operation`, `session.tool`: pembaruan transkrip, operasi sesi
  yang sedang berlangsung, dan aliran peristiwa untuk sesi yang dilanggani.
- `session.approval`: kebenaran persetujuan tertunda dan terminal yang telah disanitasi untuk
  pelanggan sesi persis yang secara eksplisit ikut serta. Persetujuan turunan menggunakan
  audiens leluhur yang dipersistenkan; peristiwa tidak pernah mengubah transkrip atau membangunkan agen.
- `sessions.changed`: indeks atau metadata sesi berubah.
- `presence`: pembaruan rekam keadaan kehadiran sistem.
- `tick`: peristiwa penjaga koneksi/keaktifan berkala.
- `health`: pembaruan rekam keadaan kesehatan Gateway.
- `heartbeat`: pembaruan aliran peristiwa Heartbeat.
- `cron`: peristiwa perubahan eksekusi/pekerjaan Cron.
- `shutdown`: pemberitahuan penghentian Gateway.
- `node.pair.requested` / `node.pair.resolved`: siklus hidup penyandingan Node.
- `node.invoke.request`: siaran permintaan pemanggilan Node.
- `device.pair.requested` / `device.pair.resolved`: siklus hidup perangkat yang disandingkan.
- `voicewake.changed`: konfigurasi pemicu kata pembangun berubah.
- `exec.approval.requested` / `exec.approval.resolved`: siklus hidup persetujuan
  eksekusi.
- `plugin.approval.requested` / `plugin.approval.resolved`: siklus hidup persetujuan
  Plugin.

### Metode pembantu Node

Node dapat memanggil `skills.bins` untuk mengambil daftar terkini berkas eksekusi skill
guna pemeriksaan izin otomatis.

## RPC buku besar audit

`audit.activity.list` memberi klien operator tampilan stabil dari terbaru ke terlama atas metadata
siklus hidup eksekusi agen, tindakan alat, dan pesan yang ikut serta. Ini memerlukan
`operator.read`. Kueri mengecualikan catatan yang lebih lama dari 30 hari, dan buku besar
SQLite bersama dibatasi hingga 100,000 catatan. Baris kedaluwarsa dihapus saat
Gateway dimulai, pemeliharaan setiap jam, dan penulisan berikutnya. Lihat
[Riwayat audit](/gateway/audit) untuk model data dan semantik privasi.

- Parameter: `agentId`, `sessionKey`, atau `runId` persis yang opsional; `kind` opsional
  (`"agent_run"`, `"tool_action"`, atau `"message"`); `status` opsional
  (`"started"`, `"succeeded"`, `"failed"`, `"cancelled"`, `"timed_out"`,
  `"blocked"`, atau `"unknown"`); `direction` pesan opsional (`"inbound"` atau
  `"outbound"`) dan `channel` persis; batas milidetik Unix inklusif `after` / `before`
  yang opsional; `limit` opsional dari `1` hingga `500`; dan string
  `cursor` opsional dari halaman sebelumnya.
- Hasil: `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.

Union hasil V1 bernama memiliki skema terpisah untuk eksekusi agen, tindakan alat, pesan masuk,
dan pesan keluar. Diskriminator `eventType` masing-masing adalah
`agent_run`, `tool_action`, `inbound_message`, atau `outbound_message`; `kind` dan
`direction` pesan tetap tersedia untuk pemfilteran dan tampilan. Setiap peristiwa memiliki
`schemaVersion: 1` bilangan bulat. Referensi identitas pesan menggunakan format
`hmac-sha256:v1:<32 hex key id>:<64 hex digest>` persis; ID aktor pengirim kanal
menggunakan format yang sama.

Semua varian memerlukan `eventType`, `schemaVersion`, `eventId`, `sequence`,
`sourceSequence`, `occurredAt`, `kind`, `action`, `status`, `actor`, dan
`redaction`. Bidang varian adalah:

| `eventType`        | Bidang wajib                                                       | Bidang opsional                                                                                                                 |
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
  `unknown`, karena efek samping eksternal tidak dapat disangkal.
- `deliveryKind`: `text`, `media`, atau `other`; `failureStage`:
  `platform_send`, `queue`, atau `unknown`.

Bidang terminal saling berkorelasi, bukan opsional secara independen:

| Varian           | Pemetaan terminal                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Eksekusi agen    | `started` tidak memiliki `errorCode`; setiap status selesai yang bukan sukses memerlukan kode `run_*` yang sesuai.                                                                 |
| Tindakan alat    | `started` dan berhasil tidak memiliki `errorCode`; setiap status selesai lainnya memerlukan kode `tool_*` yang sesuai.                                                       |
| Pesan masuk      | berhasil = `completed`; diblokir = `skipped`; gagal = `failed` ditambah `message_processing_failed`. `reasonCode`, jika ada, harus termasuk dalam kelompok terminal tersebut. |
| Pesan keluar     | berhasil = `sent`; diblokir = `suppressed` ditambah `reasonCode`; gagal = `failed` ditambah `errorCode` dan `failureStage`; tidak diketahui = `unknown` ditambah `failureStage`.      |

Setiap peristiwa aktivitas mencakup id peristiwa yang stabil, urutan ledger monotonik,
urutan peristiwa sumber, stempel waktu, pelaku, tindakan, status, bilangan bulat
`schemaVersion: 1`, dan `redaction: "metadata_only"`. Catatan proses dan alat
memerlukan asal-usul agen dan proses serta dapat mencakup asal-usul sesi. Catatan pesan
dapat mencakup id agen dan proses, tetapi secara sengaja tidak pernah mencakup
`sessionKey` atau `sessionId`; oleh karena itu, filter kueri `sessionKey` hanya berlaku untuk
baris proses dan alat. Peristiwa alat dapat mencakup id panggilan alat dan nama alat.

Catatan pesan menggunakan `message.inbound.processed` atau
`message.outbound.finished` serta menambahkan arah, saluran, jenis percakapan,
hasil yang dinormalisasi, serta jenis pengiriman, tahap kegagalan, durasi,
jumlah hasil, kode alasan, dan pseudonim akun/percakapan/pesan/target berkunci
yang bersifat lokal untuk instalasi dan opsional. Pseudonim ini membantu
korelasi, tetapi bukan anonimisasi: basis data status memuat kuncinya,
sedangkan ekspor RPC dan CLI tidak. Ledger tidak menyimpan prompt, isi pesan,
argumen alat, hasil alat, keluaran perintah, atau teks kesalahan mentah.
Nilai `sessionKey` proses/alat tetap berupa metadata korelasi mentah dan dapat menyematkan
id akun platform atau rekan; catatan pesan tidak menyertakan kunci sesi.

Untuk baris masuk, `durationMs` mengukur pengiriman inti hingga kondisi terminalnya dan
`resultCount` menghitung muatan alat, blok, dan balasan antrean yang telah difinalisasi. Untuk
baris keluar, `durationMs` mencakup kepemilikan pengiriman hingga pengakuan,
surat mati, atau rekonsiliasi (termasuk waktu tunggu dalam antrean), dan `resultCount`
menghitung pengiriman fisik platform yang teridentifikasi. `deliveryKind`, jika ada,
menjelaskan muatan efektif setelah hook dan perenderan; baris yang disupresi atau
ambigu akibat crash tidak menyertakannya.

Cakupan pesan saat ini mencakup pesan masuk yang diterima dan mencapai pengiriman inti,
termasuk hasil duplikat/terminal inti. Cakupan keluar menulis
satu baris terminal per muatan balasan logis asli yang mencapai pengiriman persisten
bersama; pemotongan menjadi bagian-bagian dan fan-out adaptor diagregasikan dalam `resultCount`. Pengiriman
yang dapat dicoba ulang atau ambigu dalam antrean hanya dicatat setelah pengakuan, surat
mati, atau rekonsiliasi. Jalur lokal Plugin dan pengiriman langsung yang melewati
batas bersama tersebut belum tercakup. Antrean pekerja berbatas bersifat upaya terbaik
dan dapat menghilangkan catatan saat terjadi kegagalan atau kejenuhan, sehingga permukaan ini bukan
arsip kepatuhan tanpa kehilangan data.

Perekaman diaktifkan secara default dan dikendalikan oleh
[`audit.enabled`](/id/gateway/configuration-reference#audit). Perekaman pesan
dikendalikan secara terpisah oleh `audit.messages` dan secara default bernilai `"off"`. Saat
perekaman dinonaktifkan, `audit.activity.list` tetap menyajikan catatan yang ditulis
sebelumnya hingga kedaluwarsa.

Skema permintaan, hasil, dan `AuditEvent` untuk `audit.list` yang telah dirilis tetap
tidak berubah dan hanya mengembalikan catatan proses agen dan tindakan alat. Klien
operator baru harus memanggil `audit.activity.list` ketika Gateway mengiklankannya. Gateway
lama dapat melaporkan `unknown method: audit.activity.list` atau, karena
otorisasi mendahului pencarian metode dalam versi yang telah dirilis, `missing scope:
operator.admin` untuk permintaan dengan cakupan baca. Perlakukan yang terakhir sebagai ketiadaan metode
hanya ketika metode tersebut tidak diiklankan. Klien kemudian dapat mencoba kembali `audit.list`
hanya ketika filternya tidak memerlukan dukungan jenis pesan, arah, atau saluran.

Gunakan [`openclaw audit`](/id/cli/audit) untuk kueri teks dan ekspor JSON berbatas.

## RPC buku besar tugas

Klien operator memeriksa dan membatalkan catatan tugas latar belakang Gateway melalui
RPC buku besar tugas (`packages/gateway-protocol/src/schema/tasks.ts`). RPC ini
mengembalikan ringkasan tugas yang telah disanitasi, bukan status runtime mentah.

- `tasks.list` memerlukan `operator.read`.
  - Parameter: `status` opsional (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"`, atau `"timed_out"`) atau array berisi status tersebut,
    `agentId` opsional, `sessionKey` opsional, `limit` opsional dari `1` hingga
    `500`, dan string `cursor` opsional.
  - Hasil: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` memerlukan `operator.read`.
  - Parameter: `{ "taskId": string }`.
  - Hasil: `{ "task": TaskSummary }`.
  - ID tugas yang tidak ditemukan mengembalikan bentuk kesalahan tidak ditemukan dari Gateway.
- `tasks.cancel` memerlukan `operator.write`.
  - Parameter: `{ "taskId": string, "reason"?: string }`.
  - Hasil: `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` melaporkan apakah buku besar memiliki tugas yang cocok. `cancelled`
    melaporkan apakah runtime menerima atau mencatat pembatalan.

`TaskSummary` mencakup `id`, `status`, dan metadata opsional: `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, stempel waktu, kemajuan,
ringkasan terminal, dan teks kesalahan yang telah disanitasi. `agentId` mengidentifikasi agen
yang menjalankan tugas; `sessionKey` dan `ownerKey` mempertahankan konteks
pemohon dan kontrol.

## Metode pembantu operator

- `commands.list` (`operator.read`) mengambil inventaris perintah runtime untuk
  suatu agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca ruang kerja agen default.
  - `scope` mengontrol permukaan yang ditargetkan oleh `name` utama: `text` mengembalikan
    token perintah teks utama tanpa `/` di awal; `native` dan jalur
    `both` default mengembalikan nama native yang mempertimbangkan penyedia jika tersedia.
  - `textAliases` membawa alias garis miring yang persis seperti `/model` dan `/m`.
  - `nativeName` membawa nama perintah native yang mempertimbangkan penyedia jika
    tersedia.
  - `provider` bersifat opsional dan hanya memengaruhi penamaan native serta ketersediaan perintah
    Plugin native.
  - `includeArgs=false` menghilangkan metadata argumen berseri dari respons.
- `tools.catalog` (`operator.read`) mengambil katalog alat runtime untuk suatu
  agen. Respons mencakup alat yang dikelompokkan dan metadata asal:
  - `source`: `core` atau `plugin`
  - `pluginId`: pemilik Plugin jika `source="plugin"`
  - `optional`: apakah alat Plugin bersifat opsional
- `tools.effective` (`operator.read`) mengambil inventaris alat yang efektif saat runtime
  untuk suatu sesi.
  - `sessionKey` wajib diisi.
  - Gateway memperoleh konteks runtime tepercaya dari sesi di sisi server
    alih-alih menerima konteks autentikasi atau pengiriman yang diberikan pemanggil.
  - Respons adalah proyeksi inventaris aktif yang berasal dari server dan tercakup dalam sesi,
    termasuk alat inti, Plugin, saluran, dan server MCP yang telah ditemukan.
  - `tools.effective` bersifat hanya-baca untuk MCP: ini dapat memproyeksikan katalog MCP
    sesi aktif melalui kebijakan alat akhir, tetapi tidak membuat runtime MCP,
    menghubungkan transpor, atau menerbitkan `tools/list`. Jika tidak ada katalog aktif yang cocok,
    respons dapat menyertakan pemberitahuan seperti `mcp-not-yet-connected`,
    `mcp-not-yet-listed`, atau `mcp-stale-catalog`.
  - Entri alat efektif menggunakan `source="core"`, `source="plugin"`,
    `source="channel"`, atau `source="mcp"`.
- `tools.invoke` (`operator.write`) menjalankan satu alat yang tersedia melalui
  jalur kebijakan Gateway yang sama seperti `/tools/invoke`.
  - `name` wajib diisi. `args`, `sessionKey`, `agentId`, `confirm`, dan
    `idempotencyKey` bersifat opsional.
  - Jika `sessionKey` dan `agentId` sama-sama ada, agen sesi yang ditentukan
    harus cocok dengan `agentId`.
  - Pembungkus inti khusus pemilik seperti `cron`, `gateway`, dan `nodes` memerlukan
    identitas pemilik/admin (`operator.admin`) meskipun `tools.invoke` sendiri
    adalah `operator.write`.
  - Respons adalah amplop yang ditujukan untuk SDK dengan `ok`, `toolName`, `output`
    opsional, dan bidang `error` bertipe. Penolakan persetujuan atau kebijakan mengembalikan
    `ok:false` dalam muatan alih-alih melewati alur kebijakan alat Gateway.
- `skills.status` (`operator.read`) mengambil inventaris skill yang terlihat untuk suatu
  agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca ruang kerja agen default.
  - Respons mencakup kelayakan, persyaratan yang belum terpenuhi, pemeriksaan konfigurasi,
    dan opsi penginstalan yang telah disanitasi tanpa mengekspos nilai rahasia mentah.
- `skills.search` dan `skills.detail` (`operator.read`) mengembalikan metadata
  penemuan ClawHub.
- `skills.upload.begin`, `skills.upload.chunk`, dan `skills.upload.commit`
  (`operator.admin`) menyiapkan arsip skill privat sebelum menginstalnya. Ini
  adalah jalur unggah admin terpisah untuk klien tepercaya, bukan alur
  penginstalan skill ClawHub normal, dan dinonaktifkan secara default kecuali
  `skills.install.allowUploadedArchives` diaktifkan.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    membuat unggahan yang terikat pada slug dan nilai pemaksaan tersebut.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` menambahkan byte pada
    offset terdekode yang tepat.
  - `skills.upload.commit({ uploadId, sha256? })` memverifikasi ukuran akhir dan
    SHA-256. Commit hanya menyelesaikan unggahan; tindakan ini tidak menginstal skill.
  - Arsip skill yang diunggah adalah arsip zip yang berisi akar `SKILL.md`. Nama
    direktori internal arsip tidak pernah menentukan target penginstalan.
- `skills.install` (`operator.admin`) memiliki tiga mode:
  - Mode ClawHub: `{ source: "clawhub", slug, version?, force? }` menginstal
    folder skill ke dalam direktori `skills/` di ruang kerja agen default.
  - Mode unggah: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    menginstal unggahan yang telah di-commit ke dalam direktori `skills/<slug>`
    di ruang kerja agen default. Slug dan nilai pemaksaan harus cocok dengan
    permintaan `skills.upload.begin` asli. Ditolak kecuali
    `skills.install.allowUploadedArchives` diaktifkan; pengaturan ini tidak
    memengaruhi penginstalan ClawHub.
  - Mode penginstal Gateway: `{ name, installId, timeoutMs? }` menjalankan tindakan
    `metadata.openclaw.install` yang dideklarasikan pada host Gateway. Klien lama mungkin
    masih mengirim `dangerouslyForceUnsafeInstall`; bidang ini tidak digunakan lagi,
    diterima hanya untuk kompatibilitas protokol, dan diabaikan. Gunakan
    `security.installPolicy` untuk keputusan penginstalan yang dimiliki operator.
- `skills.update` (`operator.admin`) memiliki dua mode:
  - Mode ClawHub memperbarui satu slug yang dilacak atau semua penginstalan ClawHub yang dilacak di
    ruang kerja agen default.
  - Mode konfigurasi menambal nilai `skills.entries.<skillKey>` seperti `enabled`,
    `apiKey`, dan `env`.

### Tampilan `models.list`

`models.list` menerima parameter `view` opsional
(`src/agents/model-catalog-visibility.ts`):

- Dihilangkan atau `"default"`: jika `agents.defaults.models` dikonfigurasi,
  responsnya adalah katalog yang diizinkan, termasuk model yang ditemukan secara dinamis
  untuk entri `provider/*`. Jika tidak, responsnya adalah katalog Gateway
  lengkap.
- `"configured"`: perilaku berukuran pemilih. Jika `agents.defaults.models`
  dikonfigurasi, konfigurasi tersebut tetap diutamakan, termasuk penemuan dalam lingkup penyedia untuk
  entri `provider/*`. Tanpa daftar izin, respons menggunakan entri
  `models.providers.<provider>.models` yang eksplisit, dan beralih ke katalog
  lengkap hanya jika tidak ada baris model yang dikonfigurasi.
- `"provider-config"`: inventaris `models.providers.*.models` yang dibuat oleh sumber,
  terlepas dari daftar izin pemilih. Baris mencakup kemampuan model publik dan
  ketersediaan yang mempertimbangkan rute, tetapi tidak menyertakan titik akhir penyedia, materi autentikasi, dan
  konfigurasi permintaan runtime.
- `"all"`: katalog Gateway lengkap, melewati `agents.defaults.models`. Gunakan untuk
  UI diagnostik/penemuan, bukan pemilih model biasa.

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
  `sessionKey` antara persiapan dan penerusan `system.run` final yang disetujui,
  Gateway menolak eksekusi alih-alih memercayai muatan yang telah diubah.

## Fallback pengiriman agen

- Permintaan `agent` dapat menyertakan `deliver=true` untuk meminta pengiriman keluar.
- `bestEffortDeliver=false` (nilai default) mempertahankan perilaku ketat: target pengiriman yang tidak dapat diselesaikan atau
  hanya untuk internal mengembalikan `INVALID_REQUEST`.
- `bestEffortDeliver=true` mengizinkan fallback ke eksekusi hanya sesi ketika tidak ada
  rute eksternal yang dapat digunakan untuk pengiriman yang dapat diselesaikan (misalnya sesi internal/webchat
  atau konfigurasi multisaluran yang ambigu).
- Hasil final `agent` dapat menyertakan `result.deliveryStatus` ketika pengiriman
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
  rentang N-1 yang sama. Autentikasi perangkat, pemasangan, cakupan, kebijakan perintah, dan persetujuan
  eksekusi tidak berubah oleh rentang kompatibilitas ini. Kemampuan dan perintah Node
  yang dimiliki Plugin tidak tersedia hingga Node ditingkatkan ke protokol saat ini
  karena permukaan yang dihostingnya bukan bagian dari kontrak N-1.
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
| Batas waktu praautentikasi / tantangan koneksi | `15_000` ms                                           | `packages/gateway-client/src/timeouts.ts` (env `OPENCLAW_HANDSHAKE_TIMEOUT_MS` dapat menaikkan anggaran server/klien yang dipasangkan) |
| Backoff penyambungan ulang awal           | `1_000` ms                                            | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                      |
| Backoff penyambungan ulang maksimum       | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                      |
| Batas coba ulang cepat setelah penutupan token perangkat | `250` ms                                              | `packages/gateway-client/src/client.ts`                                                                                   |
| Masa tenggang penghentian paksa sebelum `terminate()` | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| Batas waktu default `stopAndWait()`    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| Interval tick default (sebelum `hello-ok`) | `30_000` ms                                           | `packages/gateway-client/src/client.ts`                                                                                   |
| Penutupan batas waktu tick                | kode `4000` ketika keheningan melebihi `tickIntervalMs * 2` | `packages/gateway-client/src/client.ts`                                                                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                         |

Server mengumumkan `policy.tickIntervalMs`,
`policy.maxPayload`, dan `policy.maxBufferedBytes` yang efektif dalam `hello-ok`; klien
harus mematuhi nilai tersebut, bukan nilai default sebelum jabat tangan.

Klien referensi membiarkan permintaan terbatas menggunakan tenggat yang dikonfigurasi sendiri ketika
setiap permintaan tertunda memilikinya. Permintaan `expectFinal` tanpa
`timeoutMs` terbatas, permintaan apa pun dengan `timeoutMs: null`, atau campuran permintaan
terbatas dan tanpa batas mempertahankan pengawas tick tetap aktif. Jika peristiwa masuk dan
respons tetap senyap melewati ambang batas waktu tick, klien menutup
soket dengan kode `4000`, menolak setiap permintaan tertunda, dan menyambung kembali. Klien
tidak memutar ulang permintaan yang ditolak setelah tersambung kembali.

## Autentikasi

- Autentikasi Gateway dengan rahasia bersama menggunakan `connect.params.auth.token` atau
  `connect.params.auth.password`, bergantung pada
  `gateway.auth.mode` yang dikonfigurasi (`"none" | "token" | "password" | "trusted-proxy"`).
- Mode yang membawa identitas seperti Tailscale Serve (`gateway.auth.allowTailscale: true`)
  atau `gateway.auth.mode: "trusted-proxy"` non-loopback memenuhi pemeriksaan autentikasi
  koneksi dari header permintaan, bukan dari `connect.params.auth.*`.
- `gateway.auth.mode: "none"` dengan ingress privat melewati autentikasi koneksi rahasia bersama
  sepenuhnya; jangan paparkan mode tersebut pada ingress publik/tidak tepercaya.
- Setelah pemasangan, Gateway menerbitkan token perangkat yang dibatasi pada peran +
  cakupan koneksi, yang dikembalikan dalam `hello-ok.auth.deviceToken`. Klien harus
  menyimpannya setelah setiap koneksi berhasil.
- Koneksi ulang dengan token perangkat tersimpan tersebut juga harus menggunakan kembali
  kumpulan cakupan yang disetujui dan tersimpan untuk token tersebut. Ini mempertahankan akses baca/probe/status
  yang telah diberikan dan mencegah koneksi ulang diam-diam menyusut menjadi cakupan
  implisit yang lebih sempit dan khusus admin.
- Penyusunan autentikasi koneksi sisi klien (`selectConnectAuth` dalam
  `packages/gateway-client/src/client.ts`):
  - `auth.password` bersifat ortogonal dan selalu diteruskan ketika ditetapkan.
  - `auth.token` diisi berdasarkan urutan prioritas: token bersama eksplisit terlebih dahulu,
    lalu `deviceToken` eksplisit, kemudian token per perangkat yang tersimpan (dikunci berdasarkan
    `deviceId` + `role`).
  - `auth.bootstrapToken` dikirim hanya ketika tidak satu pun opsi di atas menghasilkan
    `auth.token`. Token bersama atau token perangkat apa pun yang berhasil ditemukan akan meniadakannya.
  - Promosi otomatis token perangkat tersimpan pada percobaan ulang satu kali
    `AUTH_TOKEN_MISMATCH` dibatasi hanya untuk endpoint tepercaya: loopback,
    atau `wss://` dengan `tlsFingerprint` yang disematkan. `wss://` publik tanpa penyematan
    tidak memenuhi syarat.
- Bootstrap kode penyiapan bawaan mengembalikan
  `hello-ok.auth.deviceToken` Node utama beserta token operator berbatas dalam
  `hello-ok.auth.deviceTokens` untuk serah-terima seluler tepercaya. Token operator
  mencakup `operator.talk.secrets` untuk pembacaan konfigurasi Talk native, tetapi
  tidak mencakup cakupan mutasi pemasangan dan `operator.admin`.
- Saat bootstrap kode penyiapan non-baseline menunggu persetujuan,
  detail `PAIRING_REQUIRED` mencakup `recommendedNextStep: "wait_then_retry"`,
  `retryable: true`, dan `pauseReconnect: false`. Terus lakukan koneksi ulang dengan
  token bootstrap yang sama hingga permintaan disetujui atau token menjadi
  tidak valid.
- Simpan `hello-ok.auth.deviceTokens` hanya ketika koneksi menggunakan autentikasi bootstrap
  melalui transport tepercaya seperti `wss://` atau pemasangan loopback/lokal.
- Jika klien memberikan `deviceToken` eksplisit atau `scopes` eksplisit,
  kumpulan cakupan yang diminta pemanggil tersebut tetap menjadi acuan; cakupan tersimpan hanya
  digunakan kembali ketika klien menggunakan kembali token per perangkat yang tersimpan.
- Token perangkat dapat dirotasi/dicabut melalui `device.token.rotate` dan
  `device.token.revoke` (memerlukan `operator.pairing`). Merotasi atau mencabut token
  Node atau peran non-operator lainnya juga memerlukan `operator.admin`.
- `device.token.rotate` mengembalikan metadata rotasi. Ini menyertakan kembali token
  pembawa pengganti hanya untuk panggilan dari perangkat yang sama dan telah diautentikasi dengan
  token perangkat tersebut, sehingga klien yang hanya menggunakan token dapat menyimpan penggantinya sebelum
  melakukan koneksi ulang. Rotasi bersama/admin tidak menyertakan kembali token pembawa.
- Penerbitan, rotasi, dan pencabutan token tetap dibatasi pada kumpulan peran yang disetujui
  dan tercatat dalam entri pemasangan perangkat tersebut; mutasi token tidak dapat memperluas atau
  menargetkan peran perangkat yang tidak pernah diberikan oleh persetujuan pemasangan.
- Untuk sesi token perangkat terpasang, pengelolaan perangkat dibatasi pada diri sendiri kecuali
  pemanggil juga memiliki `operator.admin`: pemanggil non-admin hanya dapat mengelola
  token operator untuk entri perangkatnya sendiri. Pengelolaan token Node dan
  token non-operator lainnya hanya dapat dilakukan oleh admin, bahkan untuk perangkat pemanggil sendiri.
- `device.token.rotate` dan `device.token.revoke` juga memeriksa kumpulan cakupan
  token operator target terhadap cakupan sesi pemanggil saat ini.
  Pemanggil non-admin tidak dapat merotasi atau mencabut token operator dengan cakupan lebih luas daripada yang
  telah mereka miliki.
- Kegagalan autentikasi mencakup `error.details.code` beserta petunjuk pemulihan:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep`: salah satu dari `retry_with_device_token`,
    `update_auth_configuration`, `update_auth_credentials`,
    `wait_then_retry`, `review_auth_configuration`
    (`packages/gateway-protocol/src/connect-error-details.ts`).
- Perilaku klien untuk `AUTH_TOKEN_MISMATCH`:
  - Klien tepercaya dapat mencoba satu percobaan ulang berbatas dengan token per perangkat
    yang tersimpan dalam cache.
  - Jika percobaan ulang tersebut gagal, hentikan loop koneksi ulang otomatis dan tampilkan panduan
    tindakan operator.
- `AUTH_SCOPE_MISMATCH` berarti token perangkat dikenali, tetapi tidak
  mencakup peran/cakupan yang diminta. Jangan tampilkan ini sebagai token yang salah; minta
  operator memasangkan ulang atau menyetujui kontrak cakupan yang lebih sempit/luas.

## Identitas dan pemasangan perangkat

- Node harus menyertakan identitas perangkat yang stabil (`device.id`) yang berasal dari
  sidik jari pasangan kunci.
- Gateway menerbitkan token per perangkat + peran.
- Persetujuan pemasangan diperlukan untuk ID perangkat baru kecuali
  persetujuan otomatis lokal diaktifkan.
- Persetujuan otomatis pemasangan berpusat pada koneksi loopback lokal langsung.
- OpenClaw juga memiliki jalur koneksi mandiri backend/lokal-kontainer yang sempit untuk
  alur pembantu rahasia bersama tepercaya.
- Koneksi tailnet atau LAN pada host yang sama tetap diperlakukan sebagai koneksi jarak jauh untuk pemasangan
  dan memerlukan persetujuan.
- Klien WS biasanya menyertakan identitas `device` selama `connect` (operator +
  Node). Satu-satunya pengecualian operator tanpa perangkat adalah jalur kepercayaan eksplisit:
  - `gateway.controlUi.allowInsecureAuth=true` untuk kompatibilitas HTTP tidak aman
    khusus localhost.
  - autentikasi Control UI operator `gateway.auth.mode: "trusted-proxy"` yang berhasil.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (akses darurat, penurunan
    keamanan yang parah).
  - RPC backend `gateway-client` loopback langsung pada jalur pembantu internal
    yang dicadangkan.
- Penghilangan identitas perangkat berdampak pada cakupan. Ketika koneksi operator
  tanpa perangkat diizinkan melalui jalur kepercayaan eksplisit, OpenClaw
  tetap menghapus cakupan yang dideklarasikan sendiri menjadi kumpulan kosong kecuali jalur tersebut memiliki
  pengecualian preservasi cakupan yang disebutkan. Metode yang dibatasi cakupan kemudian gagal dengan
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` adalah jalur preservasi cakupan
  akses darurat Control UI. Jalur ini tidak memberikan cakupan kepada backend khusus
  sembarang atau klien WebSocket berbentuk CLI.
- Jalur pembantu backend `gateway-client` loopback langsung yang dicadangkan mempertahankan
  cakupan hanya untuk RPC bidang kontrol lokal internal; ID backend khusus
  tidak menerima pengecualian ini.
- Semua koneksi harus menandatangani nonce `connect.challenge` yang diberikan server.

### Diagnostik migrasi autentikasi perangkat

Untuk klien lama yang masih menggunakan perilaku penandatanganan sebelum tantangan, `connect`
mengembalikan kode detail `DEVICE_AUTH_*` di bawah `error.details.code` dengan
`error.details.reason` yang stabil.

Kegagalan migrasi umum:

| Pesan                       | details.code                     | details.reason           | Arti                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klien menghilangkan `device.nonce` (atau mengirimkannya kosong). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klien menandatangani dengan nonce usang/salah.     |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload tanda tangan tidak cocok dengan payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Stempel waktu yang ditandatangani berada di luar simpangan yang diizinkan. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` tidak cocok dengan sidik jari kunci publik. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonikalisasi kunci publik gagal.          |

Target migrasi:

- Selalu tunggu `connect.challenge`.
- Tandatangani payload v2 yang mencakup nonce server.
- Kirim nonce yang sama dalam `connect.params.device.nonce`.
- Payload tanda tangan yang disarankan adalah `v3`
  (`buildDeviceAuthPayloadV3` dalam `packages/gateway-client/src/device-auth.ts`),
  yang mengikat `platform` dan `deviceFamily` selain
  bidang perangkat/klien/peran/cakupan/token/nonce.
- Tanda tangan lama `v2` tetap diterima untuk kompatibilitas, tetapi penyematan
  metadata perangkat terpasang tetap mengendalikan kebijakan perintah saat koneksi ulang.

## TLS dan penyematan

- TLS didukung untuk koneksi WS (konfigurasi `gateway.tls`).
- Klien dapat secara opsional menyematkan sidik jari sertifikat Gateway melalui
  `gateway.remote.tlsFingerprint` atau CLI `--tls-fingerprint`.

## Cakupan

Protokol ini mengekspos API Gateway lengkap: status, kanal, model, obrolan,
agen, sesi, Node, persetujuan, dan lainnya. Permukaan tepatnya ditentukan oleh
skema TypeBox yang diekspor ulang dari `packages/gateway-protocol/src/schema.ts`.

## Terkait

- [Protokol bridge](/id/gateway/bridge-protocol)
- [Panduan operasional Gateway](/id/gateway)
