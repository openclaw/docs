---
read_when:
    - Pemecahan masalah kesalahan cakupan operator yang hilang
    - Meninjau persetujuan penyandingan perangkat atau Node
    - Menambahkan atau mengklasifikasikan metode RPC Gateway
summary: Peran operator, cakupan, dan pemeriksaan saat persetujuan untuk klien Gateway
title: Cakupan operator
x-i18n:
    generated_at: "2026-05-03T09:16:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48f59f96b41333af9124ad4083ac5442eedb2d6cebdfff74e3ba256f06d36add
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Cakupan operator menentukan apa yang dapat dilakukan klien Gateway setelah autentikasi.
Ini adalah pagar pembatas control-plane di dalam satu domain operator Gateway tepercaya,
bukan isolasi multi-tenant yang bermusuhan. Jika Anda memerlukan pemisahan yang kuat antara
orang, tim, atau mesin, jalankan Gateway terpisah di bawah pengguna OS atau
host terpisah.

Terkait: [Keamanan](/id/gateway/security), [Protokol Gateway](/id/gateway/protocol),
[Pairing Gateway](/id/gateway/pairing), [CLI Perangkat](/id/cli/devices).

## Peran

Klien WebSocket Gateway terhubung dengan satu peran:

- `operator`: klien control-plane seperti CLI, Control UI, otomatisasi, dan
  proses pembantu tepercaya.
- `node`: host kapabilitas seperti macOS, iOS, Android, atau node tanpa kepala yang
  mengekspos perintah melalui `node.invoke`.

Metode RPC operator memerlukan peran `operator`. Metode yang berasal dari Node
memerlukan peran `node`.

## Tingkat cakupan

| Cakupan                 | Arti                                                                                                                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Status hanya-baca, daftar, katalog, log, pembacaan sesi, dan panggilan control-plane lain yang tidak mengubah data.                                                               |
| `operator.write`        | Tindakan operator pengubah normal seperti mengirim pesan, memanggil alat, memperbarui pengaturan bicara/suara, dan relay perintah node. Juga memenuhi `operator.read`.            |
| `operator.admin`        | Akses control-plane administratif. Memenuhi setiap cakupan `operator.*`. Diperlukan untuk mutasi konfigurasi, pembaruan, hook native, namespace cadangan yang sensitif, dan persetujuan berisiko tinggi. |
| `operator.pairing`      | Manajemen pairing perangkat dan node, termasuk mencantumkan, menyetujui, menolak, menghapus, merotasi, dan mencabut catatan pairing atau token perangkat.                         |
| `operator.approvals`    | API persetujuan exec dan Plugin.                                                                                                                                                   |
| `operator.talk.secrets` | Membaca konfigurasi Talk dengan rahasia disertakan.                                                                                                                               |

Cakupan `operator.*` masa depan yang tidak dikenal memerlukan kecocokan persis kecuali pemanggil memiliki
`operator.admin`.

## Cakupan metode hanyalah gerbang pertama

Setiap RPC Gateway memiliki cakupan metode dengan hak paling minimum. Cakupan metode tersebut menentukan
apakah permintaan dapat mencapai handler. Beberapa handler kemudian menerapkan pemeriksaan yang lebih ketat
saat persetujuan berdasarkan hal konkret yang sedang disetujui atau diubah.

Contoh:

- `device.pair.approve` dapat dijangkau dengan `operator.pairing`, tetapi menyetujui
  perangkat operator hanya dapat membuat atau mempertahankan cakupan yang sudah dimiliki pemanggil.
- `node.pair.approve` dapat dijangkau dengan `operator.pairing`, lalu menurunkan cakupan
  persetujuan tambahan dari daftar perintah node yang tertunda.
- `chat.send` biasanya merupakan metode bercakupan tulis, tetapi `/config set`
  dan `/config unset` persisten memerlukan `operator.admin` pada tingkat perintah.

Ini memungkinkan operator dengan cakupan lebih rendah melakukan tindakan pairing berisiko rendah tanpa membuat
semua persetujuan pairing hanya dapat dilakukan admin.

## Persetujuan pairing perangkat

Catatan pairing perangkat adalah sumber tahan lama untuk peran dan cakupan yang disetujui.
Perangkat yang sudah dipasangkan tidak mendapatkan akses yang lebih luas secara diam-diam: koneksi ulang yang meminta
peran lebih luas atau cakupan lebih luas membuat permintaan peningkatan tertunda yang baru.

Saat menyetujui permintaan perangkat:

- Permintaan tanpa peran operator tidak memerlukan persetujuan cakupan token operator.
- Permintaan untuk `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing`, atau `operator.talk.secrets` mengharuskan pemanggil memiliki
  cakupan tersebut, atau `operator.admin`.
- Permintaan untuk `operator.admin` memerlukan `operator.admin`.
- Permintaan perbaikan tanpa cakupan eksplisit dapat mewarisi cakupan token operator
  yang sudah ada. Jika token yang sudah ada itu bercakupan admin, persetujuan tetap memerlukan
  `operator.admin`.

Untuk sesi token perangkat yang dipasangkan, manajemen bercakupan mandiri kecuali pemanggil
juga memiliki `operator.admin`: pemanggil non-admin hanya dapat merotasi, mencabut, atau menghapus
entri perangkat mereka sendiri.

## Persetujuan pairing node

`node.pair.*` lama menggunakan penyimpanan pairing node terpisah yang dimiliki Gateway. Node WS
menggunakan pairing perangkat dengan `role: node`, tetapi kosakata tingkat persetujuan yang sama
berlaku.

`node.pair.approve` menggunakan daftar perintah permintaan tertunda untuk menurunkan cakupan
wajib tambahan:

- Permintaan tanpa perintah: `operator.pairing`
- Perintah node non-exec: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare`, atau `system.which`:
  `operator.pairing` + `operator.admin`

Pairing node menetapkan identitas dan kepercayaan. Ini tidak menggantikan kebijakan persetujuan exec `system.run`
milik node itu sendiri.

## Autentikasi rahasia bersama

Autentikasi token/kata sandi gateway bersama diperlakukan sebagai akses operator tepercaya untuk
Gateway tersebut. Permukaan HTTP yang kompatibel dengan OpenAI dan `/tools/invoke` memulihkan
set cakupan default operator penuh normal untuk autentikasi bearer rahasia bersama, meskipun
pemanggil mengirim cakupan yang dideklarasikan lebih sempit.

Mode yang membawa identitas, seperti autentikasi proxy tepercaya atau `none` ingress privat,
tetap dapat menghormati cakupan eksplisit yang dideklarasikan. Gunakan Gateway terpisah untuk pemisahan batas
kepercayaan yang nyata.
