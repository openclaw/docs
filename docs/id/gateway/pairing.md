---
read_when:
    - Mengimplementasikan persetujuan pemasangan Node tanpa UI macOS
    - Menambahkan alur CLI untuk menyetujui node jarak jauh
    - Memperluas protokol Gateway dengan pengelolaan Node
summary: 'Persetujuan kapabilitas Node: cara Node mendapatkan akses untuk menampilkan perintah setelah pemasangan perangkat'
title: Pemasangan Node
x-i18n:
    generated_at: "2026-07-16T18:09:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9e4221d7ad6aa6a9cd8ae33f2d4330c2aa49783340fcf7a657c20d6a94c126d9
    source_path: gateway/pairing.md
    workflow: 16
---

Pemasangan Node memiliki dua lapisan, keduanya disimpan pada catatan perangkat yang dipasangkan di
basis data status SQLite milik Gateway:

- **Pemasangan perangkat** (peran `node`) membatasi handshake `connect`. Lihat
  [Persetujuan otomatis perangkat berdasarkan CIDR tepercaya](#trusted-cidr-device-auto-approval)
  di bawah dan [Pemasangan saluran](/id/channels/pairing).
- **Persetujuan kapabilitas Node** (`node.pair.*`) membatasi kapabilitas/perintah
  yang dideklarasikan yang boleh diekspos oleh Node yang terhubung. Gateway adalah
  sumber kebenaran; UI (aplikasi macOS, Control UI) adalah frontend yang menyetujui atau
  menolak permintaan tertunda.

Penyimpanan pemasangan Node mandiri sebelumnya (`nodes/paired.json` dengan token per Node,
dihentikan dari jalur koneksi pada Januari 2026) sudah tidak ada: saat dimulai, Gateway
memasukkan setiap baris yang tersisa ke dalam catatan perangkat satu kali dan mengarsipkan
file lama dengan akhiran `.migrated`. Dukungan bridge TCP lama telah
dihapus.

## Cara kerja persetujuan kapabilitas

1. Node terhubung ke WS Gateway (pemasangan perangkat membatasi langkah ini).
2. Gateway membandingkan cakupan kapabilitas/perintah yang dideklarasikan dengan yang
   disetujui; cakupan baru atau yang diperluas menyimpan **permintaan tertunda** pada
   catatan perangkat dan memancarkan `node.pair.requested`.
3. Anda menyetujui atau menolak permintaan tersebut (CLI atau UI).
4. Hingga disetujui, perintah Node tetap difilter; persetujuan mengekspos cakupan
   yang dideklarasikan, sesuai dengan kebijakan perintah normal.

Permintaan tertunda kedaluwarsa secara otomatis **5 menit setelah percobaan ulang terakhir
Node** — Node yang terus aktif mencoba menyambung kembali mempertahankan satu permintaan tertundanya
alih-alih membuat permintaan baru (dan prompt persetujuan) untuk setiap percobaan.

## Alur kerja CLI (cocok untuk lingkungan headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` menampilkan Node yang dipasangkan/terhubung beserta kapabilitasnya.

## Permukaan API (protokol Gateway)

Peristiwa:

- `node.pair.requested` - dipancarkan saat permintaan tertunda baru dibuat.
- `node.pair.resolved` - dipancarkan saat permintaan disetujui, ditolak, atau
  kedaluwarsa.

Metode:

- `node.pair.list` - mencantumkan Node yang tertunda dan dipasangkan (`operator.pairing`).
- `node.pair.approve` - menyetujui permintaan tertunda.
- `node.pair.reject` - menolak permintaan tertunda.
- `node.pair.remove` - menghapus Node yang dipasangkan. Tindakan ini mencabut peran `node`
  perangkat dalam penyimpanan perangkat yang dipasangkan, sekaligus menghapus cakupan Node yang disetujui, dan
  membatalkan/memutus sesi peran Node milik perangkat tersebut. Perangkat **dengan beberapa peran**
  (misalnya perangkat yang juga memiliki `operator`) mempertahankan barisnya dan hanya
  kehilangan peran `node`; baris perangkat khusus Node akan dihapus. Otorisasi:
  `operator.pairing` dapat menghapus baris Node non-operator; pemanggil dengan token perangkat
  yang mencabut peran Node **miliknya sendiri** pada perangkat dengan beberapa peran juga memerlukan
  `operator.admin`.
- `node.rename` - mengganti nama tampilan Node yang dipasangkan dan ditampilkan kepada operator.

Dihapus pada 2026.7: `node.pair.request` dan `node.pair.verify`. Permintaan
tertunda dibuat oleh Gateway sendiri selama koneksi Node, dan
token mandiri per Node yang dilayaninya sudah tidak ada; autentikasi Node menggunakan
token pemasangan perangkat.

Catatan:

- Penyambungan kembali dengan cakupan yang tidak berubah menggunakan kembali permintaan tertunda; permintaan
  berulang memperbarui metadata Node yang tersimpan dan snapshot terbaru perintah
  yang dideklarasikan dan masuk daftar izin agar dapat dilihat oleh operator.
- Tingkat cakupan operator dan pemeriksaan saat persetujuan dirangkum dalam
  [Cakupan operator](/id/gateway/operator-scopes).
- `node.pair.approve` menggunakan perintah yang dideklarasikan dalam permintaan tertunda untuk menerapkan
  cakupan persetujuan tambahan:
  - permintaan tanpa perintah: `operator.pairing`
  - permintaan perintah biasa: `operator.pairing` + `operator.write`
  - permintaan sensitif bagi admin yang berisi `system.run`, `system.run.prepare`,
    `system.which`, `browser.proxy`, `fs.listDir`, atau
    `system.execApprovals.get/set`: `operator.pairing` + `operator.admin`

<Warning>
Persetujuan pemasangan Node mencatat cakupan kapabilitas tepercaya. Persetujuan ini **tidak** menetapkan permukaan perintah Node aktif untuk setiap Node.

- Perintah Node aktif berasal dari apa yang dideklarasikan Node saat terhubung, lalu difilter oleh
  kebijakan perintah Node global milik Gateway (`gateway.nodes.allowCommands` dan
  `denyCommands`).
- Kebijakan izin dan konfirmasi `system.run` per Node berada pada Node di
  `exec.approvals.node.*`, bukan dalam catatan pemasangan.

</Warning>

## Pembatasan perintah Node (2026.3.31+)

<Warning>
**Perubahan yang merusak kompatibilitas:** mulai `2026.3.31`, perintah Node dinonaktifkan hingga pemasangan Node disetujui. Pemasangan perangkat saja tidak lagi cukup untuk mengekspos perintah Node yang dideklarasikan.
</Warning>

Saat Node terhubung untuk pertama kalinya, pemasangan diminta secara otomatis.
Hingga permintaan tersebut disetujui, semua perintah Node tertunda dari Node tersebut
difilter dan tidak akan dijalankan. Setelah pemasangan disetujui, perintah yang
dideklarasikan Node tersedia, sesuai dengan kebijakan perintah normal.

Artinya:

- Node yang sebelumnya hanya mengandalkan pemasangan perangkat untuk mengekspos perintah kini
  juga harus menyelesaikan pemasangan Node.
- Perintah yang masuk antrean sebelum persetujuan pemasangan akan dibuang, bukan ditunda.

## Batas kepercayaan peristiwa Node (2026.3.31+)

<Warning>
**Perubahan yang merusak kompatibilitas:** proses yang berasal dari Node kini tetap berada pada permukaan tepercaya yang dibatasi.
</Warning>

Ringkasan yang berasal dari Node dan peristiwa sesi terkait dibatasi pada
permukaan tepercaya yang dimaksudkan. Alur yang digerakkan oleh notifikasi atau dipicu oleh Node yang
sebelumnya mengandalkan akses alat host atau sesi yang lebih luas mungkin perlu disesuaikan.
Penguatan ini mencegah peristiwa Node meningkatkan hak akses menjadi akses alat tingkat host
di luar yang diizinkan oleh batas kepercayaan Node.

Pembaruan kehadiran Node yang persisten mengikuti batas identitas yang sama: peristiwa
`node.presence.alive` hanya diterima dari sesi perangkat Node yang
terautentikasi, dan memperbarui metadata pemasangan hanya jika identitas perangkat/Node
sudah dipasangkan. Nilai `client.id` yang dideklarasikan sendiri tidak cukup untuk menulis
status terakhir terlihat.

## Persetujuan otomatis perangkat yang diverifikasi melalui SSH (default)

Pemasangan perangkat `role: node` pertama kali dari alamat privat/CGNAT
disetujui secara otomatis saat Gateway dapat **membuktikan kepemilikan mesin melalui SSH**: Gateway
terhubung kembali ke host yang melakukan pemasangan (`BatchMode`, `StrictHostKeyChecking=yes`),
menjalankan `openclaw node identity --json` di sana, dan menyetujui hanya jika
ID perangkat jarak jauh dan kunci publik sama persis dengan permintaan tertunda. Kecocokan kunci
inilah yang membuatnya aman: keterjangkauan saja tidak pernah menghasilkan persetujuan, sehingga sesama penyewa NAT,
pengguna lain pada host bersama, dan pemalsuan LAN semuanya dialihkan ke
prompt normal.

Diaktifkan secara default. Persyaratan agar fitur ini dijalankan:

- Pengguna proses Gateway (atau `sshVerify.user`) dapat melakukan SSH ke host Node
  secara noninteraktif (kunci/agen; SSH Tailscale juga dapat digunakan), dan kunci host
  sudah dipercaya.
- `openclaw` dapat ditemukan pada `PATH` jarak jauh untuk `sh -lc` noninteraktif.
- IP yang terhubung adalah alamat privat, ULA, link-local, atau CGNAT
  langsung (tanpa proksi, bukan loopback), atau cocok dengan `sshVerify.cidrs` jika ditetapkan.
- Batas kelayakan yang sama dengan persetujuan berdasarkan CIDR tepercaya: hanya pemasangan Node
  baru tanpa cakupan; peningkatan, browser, Control UI, dan WebChat selalu menampilkan prompt.

Saat pemeriksaan sedang berjalan, klien Node diperintahkan untuk terus mencoba ulang
(`wait_then_retry`) alih-alih berhenti sementara untuk menunggu persetujuan manual; jika pemeriksaan
gagal, percobaan berikutnya kembali ke alur prompt normal. Target yang gagal
mendapatkan masa tunggu singkat (5 menit setelah ketidakcocokan kunci).

Perangkat yang disetujui mencatat `approvedVia: "ssh-verified"` dan cakupan kapabilitas
pertama yang dideklarasikannya disetujui dalam langkah yang sama — kecocokan kunci sudah membuktikan
bahwa Node berjalan di bawah akun operator pada mesin milik operator, yang merupakan
klaim yang sama dengan persetujuan kapabilitas manual. Peningkatan cakupan berikutnya tetap
menampilkan prompt.

Perkuat atau nonaktifkan:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        // Nonaktifkan sepenuhnya:
        sshVerify: false,
        // ...atau batasi/sesuaikan pemeriksaan:
        // sshVerify: { user: "me", identity: "~/.ssh/probe", timeoutMs: 7000, cidrs: ["10.0.0.0/8"] },
      },
    },
  },
}
```

## Persetujuan otomatis (aplikasi macOS)

Aplikasi macOS dapat mencoba **persetujuan senyap** atas permintaan kapabilitas Node
saat:

- permintaan ditandai `silent` (Gateway menandai cakupan kapabilitas
  pertama sebagai senyap saat pemasangan perangkat disetujui secara noninteraktif), dan
- aplikasi dapat memverifikasi koneksi SSH ke host Gateway menggunakan pengguna yang
  sama.

Jika persetujuan senyap gagal, aplikasi kembali ke prompt Approve/Reject normal.

## Persetujuan otomatis perangkat berdasarkan CIDR tepercaya

Pemasangan perangkat WS untuk `role: node` tetap manual secara default. Untuk jaringan Node
privat tempat Gateway sudah memercayai jalur jaringan, operator dapat mengaktifkannya
dengan CIDR atau IP persis secara eksplisit:

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

- Dinonaktifkan saat `gateway.nodes.pairing.autoApproveCidrs` tidak ditetapkan.
- Tidak ada mode persetujuan otomatis menyeluruh untuk LAN atau jaringan privat; persetujuan
  otomatis yang diverifikasi melalui SSH (di atas) memerlukan kecocokan kunci perangkat kriptografis, bukan
  hanya kedekatan jaringan.
- Hanya permintaan pemasangan perangkat `role: node` baru tanpa cakupan yang diminta yang
  memenuhi syarat.
- Klien operator, browser, Control UI, dan WebChat tetap memerlukan persetujuan manual.
- Peningkatan peran, cakupan, metadata, dan kunci publik tetap memerlukan persetujuan manual.
- Jalur header proksi tepercaya loopback pada host yang sama tidak memenuhi syarat, karena jalur
  tersebut dapat dipalsukan oleh pemanggil lokal.

## Pembersihan pemasangan senyap yang digantikan

Persetujuan noninteraktif mencatat asalnya pada baris perangkat yang dipasangkan:
persetujuan kebijakan lokal pada host yang sama sebagai `silent`, persetujuan Node berdasarkan CIDR tepercaya sebagai
`trusted-cidr`, persetujuan Node yang diverifikasi melalui SSH sebagai `ssh-verified`. Klien yang direktori statusnya bersifat sementara (direktori beranda sementara,
kontainer, sandbox per proses) membuat pasangan kunci perangkat baru pada setiap proses, dan setiap
proses melakukan pemasangan ulang secara senyap sebagai perangkat baru — tanpa pembersihan, daftar perangkat yang dipasangkan
bertambah satu baris usang untuk setiap proses.

Saat Gateway menyetujui pemasangan perangkat **lokal** secara senyap, Gateway menghentikan
catatan lama yang disetujui dengan `silent` yang termasuk dalam klaster klien yang sama
(cocok dengan `clientId`, `clientMode`, dan nama tampilan) dan saat ini tidak
terhubung. Klien lokal berjalan pada host Gateway itu sendiri, sehingga kunci klaster
tidak dapat cocok dengan mesin lain. Token baris yang dihentikan segera dicabut;
setiap entri pemasangan Node lama yang cocok dihapus dan peristiwa penghapusan `node.pair.resolved`
disiarkan.

Batasan:

- Hanya rekaman yang persetujuan terbarunya merupakan persetujuan lokal pada host yang sama (`silent`) yang
  memenuhi syarat, baik sebagai pemicu maupun sebagai target. Pemasangan terverifikasi CIDR tepercaya dan SSH
  melintasi host yang metadata tampilannya bukan merupakan identitas mesin, sehingga pemasangan tersebut
  tidak pernah dihapus secara otomatis — gunakan pembersihan Control UI atau
  `openclaw nodes remove` untuk pemasangan tersebut.
- Pemasangan yang disetujui pemilik dan pemasangan melalui kode QR/kode penyiapan (bootstrap) tidak pernah dihapus
  secara otomatis. Rekaman yang disetujui sebelum asal-usul tersedia tetap terlindungi,
  bahkan setelah persetujuan ulang senyap berikutnya untuk id perangkat yang sama.
- Perangkat yang sedang terhubung dilewati, sehingga sesi lokal serentak dengan
  direktori status terpisah tetap mempertahankan tokennya selama aktif. Rekaman yang disetujui
  dalam satu menit terakhir juga dilewati, sehingga jabat tangan pemasangan serentak
  tidak dapat menonaktifkan satu sama lain sebelum koneksinya terdaftar.
- Klien yang terdampak secara bawaan bersifat lokal, sehingga dipasangkan ulang secara senyap pada
  koneksi berikutnya.

## Persetujuan otomatis peningkatan metadata

Ketika perangkat yang sudah dipasangkan terhubung kembali hanya dengan perubahan metadata
yang tidak sensitif (misalnya nama tampilan atau petunjuk platform klien), OpenClaw menganggap
hal tersebut sebagai `metadata-upgrade`. Persetujuan otomatis senyap memiliki cakupan terbatas: ini hanya berlaku
untuk koneksi ulang lokal tepercaya non-peramban yang telah membuktikan kepemilikan
kredensial lokal atau bersama, termasuk koneksi ulang aplikasi native pada host yang sama setelah
perubahan metadata versi OS. Klien peramban/Control UI dan klien jarak jauh
tetap menggunakan alur persetujuan ulang eksplisit. Peningkatan cakupan (baca menjadi
tulis/admin) dan perubahan kunci publik **tidak** memenuhi syarat untuk
persetujuan otomatis peningkatan metadata; keduanya tetap menjadi permintaan persetujuan ulang eksplisit.

## Pembantu pemasangan QR

`/pair qr` merender muatan pemasangan sebagai media terstruktur agar klien seluler dan
peramban dapat memindainya secara langsung.

Menghapus perangkat juga membersihkan setiap permintaan pemasangan tertunda yang sudah usang untuk
id perangkat tersebut, sehingga `nodes pending` tidak menampilkan baris tanpa induk setelah pencabutan.

## Lokalitas dan header penerusan

Pemasangan Gateway menganggap koneksi sebagai loopback hanya jika soket mentah
dan setiap bukti proksi hulu selaras. Jika permintaan tiba melalui loopback tetapi
membawa bukti header `Forwarded`, `X-Forwarded-*` apa pun, atau `X-Real-IP`, bukti
header penerusan tersebut membatalkan klaim lokalitas loopback, dan
jalur pemasangan memerlukan persetujuan eksplisit alih-alih secara senyap menganggap
permintaan sebagai koneksi pada host yang sama. Lihat
[Autentikasi Proksi Tepercaya](/id/gateway/trusted-proxy-auth) untuk aturan yang setara pada
autentikasi operator.

## Penyimpanan (lokal, privat)

Status pemasangan berada dalam rekaman perangkat yang dipasangkan di basis data status SQLite
bersama pada direktori status Gateway (default `~/.openclaw`):

- `~/.openclaw/state/openclaw.sqlite` (perangkat yang dipasangkan dengan autentikasi perangkat,
  permukaan Node yang disetujui, permintaan permukaan tertunda, permintaan pemasangan perangkat
  tertunda, dan token bootstrap)

Jika Anda mengganti `OPENCLAW_STATE_DIR`, basis data ikut berpindah. Gateway yang
ditingkatkan dari rilis dengan penyimpanan JSON mengimpornya saat dimulai dan meninggalkan
arsip `devices/*.json.migrated` dan `nodes/*.json.migrated`.

Catatan keamanan:

- Token perangkat merupakan rahasia; perlakukan basis data status sebagai data sensitif.
- Rotasi token perangkat menggunakan `openclaw devices rotate` /
  `device.token.rotate`.

## Perilaku transportasi

- Transportasi ini **tanpa status**; transportasi ini tidak menyimpan keanggotaan.
- Jika Gateway luring atau pemasangan dinonaktifkan, Node tidak dapat dipasangkan.
- Dalam mode jarak jauh, pemasangan dilakukan terhadap penyimpanan Gateway jarak jauh.

## Terkait

- [Pemasangan saluran](/id/channels/pairing)
- [CLI Node](/id/cli/nodes)
- [CLI perangkat](/id/cli/devices)
