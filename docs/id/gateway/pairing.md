---
read_when:
    - Mengimplementasikan persetujuan pemasangan Node tanpa UI macOS
    - Menambahkan alur CLI untuk menyetujui Node jarak jauh
    - Memperluas protokol Gateway dengan pengelolaan Node
summary: 'Persetujuan kapabilitas Node: cara node mendapatkan akses perintah setelah pemasangan perangkat'
title: Pemasangan Node
x-i18n:
    generated_at: "2026-07-12T14:15:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 753b01681fa9be17df853b63210f54374d054a6dde37746a3b5fda69073af71d
    source_path: gateway/pairing.md
    workflow: 16
---

Pemasangan Node memiliki dua lapisan, yang keduanya disimpan pada rekaman perangkat yang dipasangkan dalam basis data status SQLite milik Gateway:

- **Pemasangan perangkat** (peran `node`) membatasi handshake `connect`. Lihat
  [Persetujuan otomatis perangkat berdasarkan CIDR tepercaya](#trusted-cidr-device-auto-approval)
  di bawah dan [Pemasangan saluran](/id/channels/pairing).
- **Persetujuan kapabilitas Node** (`node.pair.*`) membatasi kapabilitas/perintah
  yang dideklarasikan dan boleh diekspos oleh Node yang terhubung. Gateway
  adalah sumber kebenaran; UI (aplikasi macOS, Control UI) merupakan antarmuka
  yang menyetujui atau menolak permintaan tertunda.

Penyimpanan pemasangan Node mandiri sebelumnya (`nodes/paired.json` dengan token
per Node, dihentikan dari jalur koneksi pada Januari 2026) telah dihapus:
Gateway menggabungkan semua baris yang tersisa ke dalam rekaman perangkat satu
kali saat dimulai dan mengarsipkan berkas lama dengan akhiran `.migrated`.
Dukungan bridge TCP lama telah dihapus.

## Cara kerja persetujuan kapabilitas

1. Node terhubung ke WS Gateway (pemasangan perangkat membatasi langkah ini).
2. Gateway membandingkan cakupan kapabilitas/perintah yang dideklarasikan dengan
   cakupan yang disetujui; cakupan baru atau yang diperluas menyimpan
   **permintaan tertunda** pada rekaman perangkat dan memancarkan
   `node.pair.requested`.
3. Anda menyetujui atau menolak permintaan tersebut (CLI atau UI).
4. Hingga disetujui, perintah Node tetap difilter; persetujuan mengekspos
   cakupan yang dideklarasikan, dengan tetap tunduk pada kebijakan perintah
   normal.

Permintaan tertunda kedaluwarsa secara otomatis **5 menit setelah percobaan
ulang terakhir Node** — Node yang aktif menyambung kembali mempertahankan satu
permintaan tertundanya tetap aktif, alih-alih membuat permintaan baru (dan
perintah persetujuan) pada setiap percobaan.

## Alur kerja CLI (cocok tanpa antarmuka grafis)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` menampilkan Node yang dipasangkan/terhubung beserta
kapabilitasnya.

## Permukaan API (protokol Gateway)

Peristiwa:

- `node.pair.requested` - dipancarkan saat permintaan tertunda baru dibuat.
- `node.pair.resolved` - dipancarkan saat permintaan disetujui, ditolak, atau
  kedaluwarsa.

Metode:

- `node.pair.list` - mencantumkan Node yang tertunda dan dipasangkan
  (`operator.pairing`).
- `node.pair.approve` - menyetujui permintaan tertunda.
- `node.pair.reject` - menolak permintaan tertunda.
- `node.pair.remove` - menghapus Node yang dipasangkan. Tindakan ini mencabut
  peran `node` perangkat dalam penyimpanan perangkat terpasang, menghapus
  permukaan Node yang disetujui bersamanya, serta membatalkan/memutus sesi
  perangkat dengan peran Node tersebut. Perangkat **dengan peran campuran**
  (misalnya yang juga memiliki `operator`) mempertahankan barisnya dan hanya
  kehilangan peran `node`; baris perangkat yang hanya memiliki peran Node
  dihapus. Otorisasi: `operator.pairing` dapat menghapus baris Node
  non-operator; pemanggil dengan token perangkat yang mencabut peran Node
  **miliknya sendiri** pada perangkat dengan peran campuran juga memerlukan
  `operator.admin`.
- `node.rename` - mengganti nama tampilan Node terpasang yang terlihat oleh
  operator.

Dihapus pada 2026.7: `node.pair.request` dan `node.pair.verify`. Permintaan
tertunda dibuat oleh Gateway itu sendiri saat Node terhubung, dan token mandiri
per Node yang dilayani keduanya sudah tidak ada; autentikasi Node menggunakan
token pemasangan perangkat.

Catatan:

- Penyambungan ulang dengan cakupan yang tidak berubah menggunakan kembali
  permintaan tertunda; permintaan berulang memperbarui metadata Node yang
  tersimpan dan snapshot terbaru perintah yang dideklarasikan serta masuk
  daftar izin agar dapat dilihat operator.
- Tingkat cakupan operator dan pemeriksaan saat persetujuan dirangkum dalam
  [Cakupan operator](/id/gateway/operator-scopes).
- `node.pair.approve` menggunakan perintah yang dideklarasikan dalam permintaan
  tertunda untuk memberlakukan cakupan persetujuan tambahan:
  - permintaan tanpa perintah: `operator.pairing`
  - permintaan perintah non-eksekusi: `operator.pairing` + `operator.write`
  - permintaan `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Persetujuan pemasangan Node merekam permukaan kapabilitas tepercaya. Persetujuan ini **tidak** mengunci permukaan perintah Node aktif untuk setiap Node.

- Perintah Node aktif berasal dari apa yang dideklarasikan Node saat terhubung,
  yang difilter oleh kebijakan perintah Node global milik Gateway
  (`gateway.nodes.allowCommands` dan `denyCommands`).
- Kebijakan izin dan konfirmasi `system.run` per Node berada pada Node di
  `exec.approvals.node.*`, bukan dalam rekaman pemasangan.

</Warning>

## Pembatasan perintah Node (2026.3.31+)

<Warning>
**Perubahan yang merusak kompatibilitas:** mulai `2026.3.31`, perintah Node dinonaktifkan hingga pemasangan Node disetujui. Pemasangan perangkat saja tidak lagi cukup untuk mengekspos perintah Node yang dideklarasikan.
</Warning>

Saat Node terhubung untuk pertama kali, pemasangan diminta secara otomatis.
Hingga permintaan tersebut disetujui, semua perintah Node tertunda dari Node
tersebut difilter dan tidak akan dieksekusi. Setelah pemasangan disetujui,
perintah yang dideklarasikan Node menjadi tersedia, dengan tetap tunduk pada
kebijakan perintah normal.

Artinya:

- Node yang sebelumnya hanya mengandalkan pemasangan perangkat untuk mengekspos
  perintah kini juga harus menyelesaikan pemasangan Node.
- Perintah yang diantrekan sebelum persetujuan pemasangan akan dibuang, bukan
  ditunda.

## Batas kepercayaan peristiwa Node (2026.3.31+)

<Warning>
**Perubahan yang merusak kompatibilitas:** proses yang berasal dari Node kini tetap berada pada permukaan tepercaya yang dipersempit.
</Warning>

Ringkasan yang berasal dari Node dan peristiwa sesi terkait dibatasi pada
permukaan tepercaya yang dimaksudkan. Alur yang digerakkan oleh notifikasi atau
dipicu Node, yang sebelumnya mengandalkan akses alat host atau sesi yang lebih
luas, mungkin perlu disesuaikan. Penguatan ini mencegah peristiwa Node
meningkatkan akses menjadi akses alat tingkat host melebihi batas kepercayaan
yang diizinkan bagi Node tersebut.

Pembaruan keberadaan Node yang persisten mengikuti batas identitas yang sama:
peristiwa `node.presence.alive` hanya diterima dari sesi perangkat Node yang
terautentikasi, dan hanya memperbarui metadata pemasangan jika identitas
perangkat/Node sudah dipasangkan. Nilai `client.id` yang dideklarasikan sendiri
tidak cukup untuk menulis status terakhir terlihat.

## Persetujuan otomatis perangkat yang diverifikasi melalui SSH (bawaan)

Pemasangan perangkat `role: node` pertama kali dari alamat privat/CGNAT
disetujui secara otomatis ketika Gateway dapat **membuktikan kepemilikan mesin
melalui SSH**: Gateway terhubung kembali ke host pemasangan (`BatchMode`,
`StrictHostKeyChecking=yes`), menjalankan `openclaw node identity --json` di
sana, dan hanya menyetujui jika ID perangkat jarak jauh dan kunci publik sama
persis dengan permintaan tertunda. Kecocokan kunci inilah yang membuatnya aman:
keterjangkauan saja tidak pernah menghasilkan persetujuan, sehingga sesama
penyewa NAT, pengguna lain pada host bersama, dan pemalsuan LAN semuanya akan
dialihkan ke perintah konfirmasi normal.

Diaktifkan secara bawaan. Persyaratan agar mekanisme ini berjalan:

- Pengguna proses Gateway (atau `sshVerify.user`) dapat melakukan SSH ke host
  Node secara noninteraktif (kunci/agen; SSH Tailscale juga dapat digunakan),
  dan kunci host sudah dipercaya.
- `openclaw` dapat ditemukan pada `PATH` jarak jauh untuk `sh -lc`
  noninteraktif.
- IP yang terhubung adalah alamat privat, ULA, link-local, atau CGNAT langsung
  (tanpa proksi dan bukan local loopback), atau cocok dengan `sshVerify.cidrs`
  jika ditetapkan.
- Ambang kelayakannya sama dengan persetujuan CIDR tepercaya: hanya pemasangan
  Node baru tanpa cakupan; peningkatan, browser, Control UI, dan WebChat selalu
  menampilkan perintah konfirmasi.

Saat pemeriksaan berjalan, klien Node diminta untuk terus mencoba kembali
(`wait_then_retry`) alih-alih berhenti guna menunggu persetujuan manual; jika
pemeriksaan gagal, percobaan berikutnya kembali ke alur perintah konfirmasi
normal. Target yang gagal mendapat masa tunggu singkat (5 menit setelah
ketidakcocokan kunci).

Perangkat yang disetujui merekam `approvedVia: "ssh-verified"` dan permukaan
kapabilitas pertama yang dideklarasikannya disetujui dalam langkah yang sama —
kecocokan kunci telah membuktikan bahwa Node berjalan di bawah akun operator
pada mesin milik operator, yang merupakan klaim yang sama dengan persetujuan
kapabilitas manual. Peningkatan permukaan berikutnya tetap menampilkan perintah
konfirmasi.

Perkuat atau nonaktifkan:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        // Disable entirely:
        sshVerify: false,
        // ...or scope/tune the probe:
        // sshVerify: { user: "me", identity: "~/.ssh/probe", timeoutMs: 7000, cidrs: ["10.0.0.0/8"] },
      },
    },
  },
}
```

## Persetujuan otomatis (aplikasi macOS)

Aplikasi macOS dapat mencoba **persetujuan senyap** atas permintaan kapabilitas
Node ketika:

- permintaan ditandai `silent` (Gateway menandai permukaan kapabilitas pertama
  sebagai senyap ketika pemasangan perangkat disetujui secara noninteraktif),
  dan
- aplikasi dapat memverifikasi koneksi SSH ke host Gateway menggunakan pengguna
  yang sama.

Jika persetujuan senyap gagal, aplikasi kembali ke perintah konfirmasi normal
Approve/Reject.

## Persetujuan otomatis perangkat berdasarkan CIDR tepercaya

Pemasangan perangkat WS untuk `role: node` tetap manual secara bawaan. Untuk
jaringan Node privat tempat Gateway telah memercayai jalur jaringan, operator
dapat mengaktifkannya dengan CIDR eksplisit atau IP yang tepat:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Batas keamanan:

- Dinonaktifkan ketika `gateway.nodes.pairing.autoApproveCidrs` tidak
  ditetapkan.
- Tidak ada mode persetujuan otomatis menyeluruh untuk LAN atau jaringan
  privat; persetujuan otomatis yang diverifikasi melalui SSH (di atas)
  memerlukan kecocokan kriptografis kunci perangkat, bukan hanya kedekatan
  jaringan.
- Hanya permintaan pemasangan perangkat `role: node` baru tanpa cakupan yang
  diminta yang memenuhi syarat.
- Klien operator, browser, Control UI, dan WebChat tetap manual.
- Peningkatan peran, cakupan, metadata, dan kunci publik tetap manual.
- Jalur header proksi tepercaya local loopback pada host yang sama tidak
  memenuhi syarat karena jalur tersebut dapat dipalsukan oleh pemanggil lokal.

## Pembersihan penggantian pemasangan senyap

Persetujuan noninteraktif merekam asalnya pada baris perangkat terpasang:
persetujuan kebijakan lokal pada host yang sama sebagai `silent`, persetujuan
Node berdasarkan CIDR tepercaya sebagai `trusted-cidr`, dan persetujuan Node
yang diverifikasi melalui SSH sebagai `ssh-verified`. Klien yang direktori
statusnya bersifat sementara (direktori utama sementara, kontainer, sandbox per
proses) membuat pasangan kunci perangkat baru pada setiap proses, dan setiap
proses dipasangkan kembali secara senyap sebagai perangkat yang benar-benar
baru — tanpa pembersihan, daftar perangkat terpasang bertambah satu baris usang
per proses.

Ketika Gateway secara senyap menyetujui pemasangan perangkat **lokal**, Gateway
menghentikan rekaman lama yang disetujui sebagai `silent`, yang termasuk dalam
klaster klien yang sama (cocok berdasarkan `clientId`, `clientMode`, dan nama
tampilan) serta sedang tidak terhubung. Klien lokal berjalan pada host Gateway
itu sendiri, sehingga kunci klaster tidak mungkin cocok dengan mesin lain.
Baris yang dihentikan langsung kehilangan tokennya; setiap entri pemasangan
Node lama yang cocok dihapus dan peristiwa penghapusan `node.pair.resolved`
disiarkan.

Batasan:

- Hanya rekaman yang persetujuan terakhirnya berasal dari lokal pada host yang
  sama (`silent`) yang memenuhi syarat, baik sebagai pemicu maupun target.
  Pemasangan berdasarkan CIDR tepercaya dan yang diverifikasi melalui SSH
  melintasi host, tempat metadata tampilan bukan merupakan identitas mesin,
  sehingga tidak pernah dihapus secara otomatis — gunakan pembersihan Control
  UI atau `openclaw nodes remove` untuk pemasangan tersebut.
- Pemasangan yang disetujui pemilik dan melalui kode QR/penyiapan (bootstrap)
  tidak pernah dihapus secara otomatis. Rekaman yang disetujui sebelum
  pencatatan asal tersedia tetap dilindungi, bahkan setelah persetujuan senyap
  berikutnya untuk ID perangkat yang sama.
- Perangkat yang sedang terhubung dilewati, sehingga sesi lokal bersamaan dengan
  direktori status terpisah mempertahankan tokennya selama aktif. Rekaman yang
  disetujui dalam satu menit terakhir juga dilewati agar handshake pemasangan
  yang berlangsung bersamaan tidak dapat saling menghentikan sebelum koneksinya
  terdaftar.
- Klien yang terpengaruh bersifat lokal berdasarkan konstruksinya, sehingga akan
  dipasangkan kembali secara senyap pada koneksi berikutnya.

## Persetujuan otomatis peningkatan metadata

Saat perangkat yang sudah dipasangkan terhubung kembali hanya dengan perubahan
metadata yang tidak sensitif (misalnya nama tampilan atau petunjuk platform
klien), OpenClaw memperlakukannya sebagai `metadata-upgrade`. Persetujuan
otomatis senyap bersifat terbatas: hanya berlaku untuk penyambungan ulang lokal
tepercaya non-browser yang telah membuktikan kepemilikan kredensial lokal atau
bersama, termasuk penyambungan ulang aplikasi native pada host yang sama
setelah perubahan metadata versi OS. Klien browser/Control UI dan klien jarak
jauh tetap menggunakan alur persetujuan ulang eksplisit. Peningkatan cakupan
(baca menjadi tulis/admin) dan perubahan kunci publik **tidak** memenuhi syarat
untuk persetujuan otomatis `metadata-upgrade`; keduanya tetap menjadi
permintaan persetujuan ulang eksplisit.

## Pembantu pemasangan QR

`/pair qr` merender payload pemasangan sebagai media terstruktur agar klien
seluler dan peramban dapat memindainya secara langsung.

Menghapus perangkat juga membersihkan setiap permintaan pemasangan tertunda
yang sudah usang untuk id perangkat tersebut, sehingga `nodes pending` tidak
menampilkan baris yatim setelah pencabutan.

## Lokalitas dan header yang diteruskan

Pemasangan Gateway menganggap koneksi sebagai local loopback hanya jika soket
mentah dan setiap bukti proksi hulu sama-sama menyetujuinya. Jika permintaan
tiba melalui local loopback tetapi membawa bukti header `Forwarded`,
`X-Forwarded-*`, atau `X-Real-IP`, bukti header yang diteruskan tersebut
membatalkan klaim lokalitas local loopback, dan jalur pemasangan memerlukan
persetujuan eksplisit alih-alih secara diam-diam menganggap permintaan sebagai
koneksi dari host yang sama. Lihat
[Autentikasi Proksi Tepercaya](/id/gateway/trusted-proxy-auth) untuk aturan yang
setara pada autentikasi operator.

## Penyimpanan (lokal, privat)

Status pemasangan berada dalam catatan perangkat yang dipasangkan di basis data
status SQLite bersama pada direktori status Gateway (bawaan `~/.openclaw`):

- `~/.openclaw/state/openclaw.sqlite` (perangkat yang dipasangkan dengan
  autentikasi perangkat, permukaan Node yang disetujui, permintaan permukaan
  tertunda, permintaan pemasangan perangkat tertunda, dan token bootstrap)

Jika Anda mengganti `OPENCLAW_STATE_DIR`, basis data akan ikut berpindah.
Gateway yang ditingkatkan dari rilis dengan penyimpanan JSON akan mengimpornya
saat mulai dan meninggalkan arsip `devices/*.json.migrated` serta
`nodes/*.json.migrated`.

Catatan keamanan:

- Token perangkat adalah rahasia; perlakukan basis data status sebagai data
  sensitif.
- Rotasi token perangkat menggunakan `openclaw devices rotate` /
  `device.token.rotate`.

## Perilaku transportasi

- Transportasi bersifat **tanpa status**; transportasi tidak menyimpan
  keanggotaan.
- Jika Gateway luring atau pemasangan dinonaktifkan, Node tidak dapat
  dipasangkan.
- Dalam mode jarak jauh, pemasangan dilakukan terhadap penyimpanan Gateway
  jarak jauh.

## Terkait

- [Pemasangan saluran](/id/channels/pairing)
- [CLI Node](/id/cli/nodes)
- [CLI perangkat](/id/cli/devices)
