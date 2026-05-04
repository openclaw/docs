---
read_when:
    - Menelusuri kesalahan cakupan operator yang hilang
    - Meninjau persetujuan penyandingan perangkat atau Node
    - Menambahkan atau mengklasifikasikan metode RPC Gateway
summary: Peran operator, cakupan, dan pemeriksaan saat persetujuan untuk klien Gateway
title: Cakupan operator
x-i18n:
    generated_at: "2026-05-04T07:06:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: f05d6bdbf9bdad2aef1c9664bb7ebb4b6241334b8aefac7993104e9977e40450
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Cakupan operator menentukan apa yang boleh dilakukan klien Gateway setelah terautentikasi.
Cakupan ini adalah pagar pembatas bidang kontrol di dalam satu domain operator Gateway tepercaya,
bukan isolasi multi-penyewa yang bermusuhan. Jika Anda membutuhkan pemisahan kuat antara
orang, tim, atau mesin, jalankan Gateway terpisah di bawah pengguna OS atau host yang berbeda.

Terkait: [Keamanan](/id/gateway/security), [protokol Gateway](/id/gateway/protocol),
[pemasangan Gateway](/id/gateway/pairing), [CLI Perangkat](/id/cli/devices).

## Peran

Klien WebSocket Gateway terhubung dengan satu peran:

- `operator`: klien bidang kontrol seperti CLI, UI Kontrol, automasi, dan
  proses pembantu tepercaya.
- `node`: host kapabilitas seperti macOS, iOS, Android, atau Node tanpa antarmuka yang
  mengekspos perintah melalui `node.invoke`.

Metode RPC operator memerlukan peran `operator`. Metode yang berasal dari Node
memerlukan peran `node`.

## Tingkat cakupan

| Cakupan                 | Arti                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Status baca-saja, daftar, katalog, log, pembacaan sesi, dan panggilan bidang kontrol lain yang tidak mengubah data.                                                                                    |
| `operator.write`        | Tindakan operator pengubah data normal seperti mengirim pesan, memanggil alat, memperbarui pengaturan bicara/suara, dan relai perintah Node. Juga memenuhi `operator.read`.                      |
| `operator.admin`        | Akses administratif bidang kontrol. Memenuhi setiap cakupan `operator.*`. Diperlukan untuk mutasi konfigurasi, pembaruan, hook native, namespace sensitif yang dicadangkan, dan persetujuan berisiko tinggi. |
| `operator.pairing`      | Pengelolaan pemasangan perangkat dan Node, termasuk mencantumkan, menyetujui, menolak, menghapus, merotasi, dan mencabut catatan pemasangan atau token perangkat.                                       |
| `operator.approvals`    | API persetujuan exec dan Plugin.                                                                                                                                                        |
| `operator.talk.secrets` | Membaca konfigurasi Talk dengan rahasia yang disertakan.                                                                                                                                     |

Cakupan `operator.*` mendatang yang tidak dikenal memerlukan kecocokan tepat kecuali pemanggil memiliki
`operator.admin`.

## Cakupan metode hanyalah gerbang pertama

Setiap RPC Gateway memiliki cakupan metode dengan hak istimewa minimum. Cakupan metode itu menentukan
apakah permintaan dapat mencapai handler. Beberapa handler kemudian menerapkan pemeriksaan yang lebih ketat
pada waktu persetujuan berdasarkan hal konkret yang disetujui atau dimutasi.

Contoh:

- `device.pair.approve` dapat dijangkau dengan `operator.pairing`, tetapi menyetujui
  perangkat operator hanya dapat mencetak atau mempertahankan cakupan yang sudah dimiliki pemanggil.
- `node.pair.approve` dapat dijangkau dengan `operator.pairing`, lalu menurunkan cakupan
  persetujuan tambahan dari daftar perintah Node yang tertunda.
- `chat.send` biasanya merupakan metode bercakupan tulis, tetapi `/config set`
  dan `/config unset` persisten memerlukan `operator.admin` pada tingkat perintah.

Ini memungkinkan operator bercakupan lebih rendah melakukan tindakan pemasangan berisiko rendah tanpa membuat
semua persetujuan pemasangan hanya untuk admin.

## Persetujuan pemasangan perangkat

Catatan pemasangan perangkat adalah sumber tahan lama untuk peran dan cakupan yang disetujui.
Perangkat yang sudah dipasangkan tidak mendapatkan akses lebih luas secara diam-diam: koneksi ulang yang meminta
peran lebih luas atau cakupan lebih luas akan membuat permintaan peningkatan baru yang tertunda.

Saat menyetujui permintaan perangkat:

- Permintaan tanpa peran operator tidak memerlukan persetujuan cakupan token operator.
- Permintaan untuk `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing`, atau `operator.talk.secrets` mengharuskan pemanggil memiliki
  cakupan tersebut, atau `operator.admin`.
- Permintaan untuk `operator.admin` memerlukan `operator.admin`.
- Permintaan perbaikan tanpa cakupan eksplisit dapat mewarisi cakupan token operator
  yang ada. Jika token yang ada tersebut bercakupan admin, persetujuan tetap memerlukan
  `operator.admin`.

Untuk sesi token perangkat yang dipasangkan, pengelolaan bercakupan mandiri kecuali pemanggil
juga memiliki `operator.admin`: pemanggil non-admin hanya melihat entri pemasangannya sendiri,
hanya dapat menyetujui atau menolak permintaan tertunda miliknya sendiri, dan hanya dapat merotasi, mencabut, atau
menghapus entri perangkatnya sendiri.

## Persetujuan pemasangan Node

`node.pair.*` legacy menggunakan penyimpanan pemasangan Node terpisah yang dimiliki Gateway. Node WS
menggunakan pemasangan perangkat dengan `role: node`, tetapi kosakata tingkat persetujuan yang sama
berlaku.

`node.pair.approve` menggunakan daftar perintah permintaan tertunda untuk menurunkan cakupan
tambahan yang diperlukan:

- Permintaan tanpa perintah: `operator.pairing`
- Perintah Node non-exec: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare`, atau `system.which`:
  `operator.pairing` + `operator.admin`

Pemasangan Node menetapkan identitas dan kepercayaan. Ini tidak menggantikan kebijakan
persetujuan exec `system.run` milik Node sendiri.

## Autentikasi rahasia bersama

Autentikasi token/kata sandi gateway bersama diperlakukan sebagai akses operator tepercaya untuk
Gateway tersebut. Permukaan HTTP yang kompatibel dengan OpenAI dan `/tools/invoke` memulihkan
kumpulan cakupan default operator penuh yang normal untuk autentikasi bearer rahasia bersama, meskipun
pemanggil mengirim cakupan deklaratif yang lebih sempit.

Mode yang membawa identitas, seperti autentikasi proksi tepercaya atau `none` ingress privat,
tetap dapat menghormati cakupan deklaratif eksplisit. Gunakan Gateway terpisah untuk pemisahan
batas kepercayaan yang nyata.
