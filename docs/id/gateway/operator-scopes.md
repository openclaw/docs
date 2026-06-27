---
read_when:
    - Men-debug kesalahan cakupan operator yang hilang
    - Meninjau persetujuan pemasangan perangkat atau node
    - Menambahkan atau mengklasifikasikan metode RPC Gateway
summary: Peran operator, cakupan, dan pemeriksaan saat persetujuan untuk klien Gateway
title: Cakupan operator
x-i18n:
    generated_at: "2026-06-27T17:32:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc59453ae1a73b52276185de2cedd1ed4da027111168eda8107d6ba0b74aec2f
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Cakupan operator menentukan apa yang boleh dilakukan klien Gateway setelah terautentikasi.
Cakupan ini adalah pagar pengaman bidang kontrol di dalam satu domain operator Gateway tepercaya,
bukan isolasi multi-tenant yang bermusuhan. Jika Anda memerlukan pemisahan yang kuat antara
orang, tim, atau mesin, jalankan Gateway terpisah di bawah pengguna OS atau host yang terpisah.

Terkait: [Keamanan](/id/gateway/security), [Protokol Gateway](/id/gateway/protocol),
[Pairing Gateway](/id/gateway/pairing), [CLI Perangkat](/id/cli/devices).

## Peran

Klien WebSocket Gateway terhubung dengan satu peran:

- `operator`: klien bidang kontrol seperti CLI, Control UI, otomatisasi, dan
  proses pembantu tepercaya.
- `node`: host kapabilitas seperti macOS, iOS, Android, atau node tanpa antarmuka
  yang mengekspos perintah melalui `node.invoke`.

Metode RPC operator memerlukan peran `operator`. Metode yang berasal dari node
memerlukan peran `node`.

## Tingkat cakupan

| Cakupan                 | Makna                                                                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `operator.read`         | Status hanya-baca, daftar, katalog, log, pembacaan sesi, dan panggilan bidang kontrol lain yang tidak mengubah data.                                                                            |
| `operator.write`        | Tindakan operator pengubah normal seperti mengirim pesan, memanggil alat, memperbarui pengaturan bicara/suara, dan relai perintah node. Juga memenuhi `operator.read`.                          |
| `operator.admin`        | Akses administratif bidang kontrol. Memenuhi setiap cakupan `operator.*`. Diperlukan untuk mutasi konfigurasi, pembaruan, hook native, namespace cadangan sensitif, dan persetujuan berisiko tinggi. |
| `operator.pairing`      | Pengelolaan pairing perangkat dan node, termasuk mencantumkan, menyetujui, menolak, menghapus, merotasi, dan mencabut catatan pairing atau token perangkat.                                      |
| `operator.approvals`    | API persetujuan eksekusi dan plugin.                                                                                                                                                             |
| `operator.talk.secrets` | Membaca konfigurasi Talk dengan rahasia disertakan.                                                                                                                                              |

Cakupan `operator.*` yang tidak dikenal di masa mendatang memerlukan kecocokan persis kecuali pemanggil memiliki
`operator.admin`.

## Cakupan metode hanyalah gerbang pertama

Setiap RPC Gateway memiliki cakupan metode dengan hak istimewa paling rendah. Cakupan metode tersebut menentukan
apakah permintaan dapat mencapai handler. Beberapa handler kemudian menerapkan pemeriksaan
yang lebih ketat pada waktu persetujuan berdasarkan hal konkret yang sedang disetujui atau diubah.

Contoh:

- `device.pair.approve` dapat dijangkau dengan `operator.pairing`, tetapi menyetujui
  perangkat operator hanya dapat menerbitkan atau mempertahankan cakupan yang sudah dimiliki pemanggil.
- `node.pair.approve` dapat dijangkau dengan `operator.pairing`, lalu menurunkan cakupan
  persetujuan tambahan dari daftar perintah node yang tertunda.
- `chat.send` biasanya merupakan metode bercakupan tulis, tetapi `/config set`
  dan `/config unset` persisten memerlukan `operator.admin` pada tingkat perintah.

Ini memungkinkan operator dengan cakupan lebih rendah melakukan tindakan pairing berisiko rendah tanpa membuat
semua persetujuan pairing hanya untuk admin.

## Persetujuan pairing perangkat

Catatan pairing perangkat adalah sumber tahan lama untuk peran dan cakupan yang disetujui.
Perangkat yang sudah dipairing tidak mendapatkan akses lebih luas secara diam-diam: koneksi ulang yang meminta
peran lebih luas atau cakupan lebih luas membuat permintaan peningkatan baru yang tertunda.

Saat menyetujui permintaan perangkat:

- Permintaan tanpa peran operator tidak memerlukan persetujuan cakupan token operator.
- Permintaan untuk peran perangkat non-operator, seperti `node`, memerlukan
  `operator.admin`, bahkan ketika `device.pair.approve` dapat dijangkau dengan
  `operator.pairing`.
- Permintaan untuk `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing`, atau `operator.talk.secrets` mengharuskan pemanggil memiliki
  cakupan tersebut, atau `operator.admin`.
- Permintaan untuk `operator.admin` memerlukan `operator.admin`.
- Permintaan perbaikan tanpa cakupan eksplisit dapat mewarisi cakupan token operator
  yang sudah ada. Jika token yang ada tersebut bercakupan admin, persetujuan tetap memerlukan
  `operator.admin`.

Sesi rahasia bersama dan proxy tepercaya non-admin dapat menyetujui permintaan perangkat operator
hanya di dalam cakupan operator yang mereka deklarasikan sendiri. Menyetujui peran non-operator
hanya untuk admin meskipun sesi tersebut sebaliknya dapat menggunakan
`operator.pairing`.

Untuk sesi token perangkat yang sudah dipairing, pengelolaan juga dibatasi pada dirinya sendiri kecuali
pemanggil memiliki `operator.admin`: pemanggil non-admin hanya melihat entri pairing
miliknya sendiri, hanya dapat menyetujui atau menolak permintaan tertunda miliknya sendiri, dan hanya dapat merotasi,
mencabut, atau menghapus entri perangkat miliknya sendiri.

## Persetujuan pairing node

`node.pair.*` lama menggunakan penyimpanan pairing node terpisah yang dimiliki Gateway. Node WS
menggunakan pairing perangkat dengan `role: node`, tetapi kosakata tingkat persetujuan yang sama
berlaku.

`node.pair.approve` menggunakan daftar perintah permintaan tertunda untuk menurunkan cakupan
tambahan yang diperlukan:

- Permintaan tanpa perintah: `operator.pairing`
- Perintah node non-eksekusi: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare`, atau `system.which`:
  `operator.pairing` + `operator.admin`

Pairing node menetapkan identitas dan kepercayaan. Ini tidak menggantikan kebijakan persetujuan
eksekusi `system.run` milik node sendiri.

## Auth rahasia bersama

Auth token/kata sandi gateway bersama diperlakukan sebagai akses operator tepercaya untuk
Gateway tersebut. Permukaan HTTP yang kompatibel dengan OpenAI, `/tools/invoke`, dan endpoint riwayat sesi HTTP
memulihkan kumpulan cakupan default operator penuh yang normal untuk
auth bearer rahasia bersama, bahkan jika pemanggil mengirim cakupan deklaratif yang lebih sempit.

Mode yang membawa identitas, seperti auth proxy tepercaya atau `none` ingress privat,
masih dapat menghormati cakupan eksplisit yang dideklarasikan. Gunakan Gateway terpisah untuk pemisahan
batas kepercayaan yang nyata.
