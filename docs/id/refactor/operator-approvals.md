---
read_when:
    - Mengubah siklus hidup persetujuan exec atau plugin, penyimpanan, protokol, atau otorisasi
    - Menambahkan tautan persetujuan atau kontrol persetujuan native ke saluran
    - Memproyeksikan persetujuan sesi turunan ke tampilan induk atau orkestrator
summary: Desain persetujuan yang persisten dan dapat ditautkan secara mendalam di seluruh Control UI, aplikasi native, saluran, dan sesi induk
title: Persetujuan operator multi-permukaan
x-i18n:
    generated_at: "2026-07-16T18:32:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9defdaada1911df1184f64429e1787c4881e735c433d6dbc30a5946e11cc7cce
    source_path: refactor/operator-approvals.md
    workflow: 16
---

# Persetujuan operator multi-permukaan

Desain ini melacak [#103505](https://github.com/openclaw/openclaw/issues/103505). Desain ini menggantikan otoritas persetujuan lokal-proses dengan satu siklus hidup milik Gateway yang didukung SQLite. Setiap persetujuan eksekusi atau plugin/alat milik Gateway mendapatkan satu ID stabil, satu rute Control UI terautentikasi, resolusi atomik dengan jawaban pertama sebagai pemenang, serta proyeksi khusus operator ke aliran sesi sumber dan leluhurnya.

Tindakan sebaris dan tautan dalam digunakan berdampingan. Tidak ada pengalih mode persetujuan.

## Tujuan

- Satu objek persetujuan persisten untuk gerbang eksekusi dan plugin/alat.
- Rute `${controlUiBasePath}/approve/{approvalId}` yang stabil.
- Resolusi dari Control UI, aplikasi native, atau permukaan kanal mana pun yang diotorisasi.
- Perilaku atomik dengan jawaban pertama sebagai pemenang di seluruh permukaan yang berjalan bersamaan.
- Percobaan ulang identik yang idempoten; jawaban terlambat yang bertentangan tidak dapat menimpa pemenang.
- Batas waktu, putusan tepercaya yang salah format, rute yang hilang, pembatalan, dan mulai ulang semuanya gagal secara tertutup.
- Peristiwa permintaan dan terminal mencapai sesi sumber serta semua pemilik induk/orkestrator yang relevan.
- Kanal menerima tindakan persetujuan dan navigasi bertipe; data callback transportasi tetap privat bagi kanal.
- Metode Gateway untuk eksekusi/plugin yang sudah ada tetap kompatibel sementara implementasinya dikonvergensikan ke satu layanan.

## Bukan tujuan

- Mempertahankan atau melanjutkan kembali eksekusi alat yang diblokir itu sendiri setelah Gateway dimulai ulang.
- Menjadikan ID atau URL persetujuan sebagai kredensial bearer.
- Menambahkan permintaan persetujuan ke transkrip yang terlihat oleh model atau membangunkan agen induk.
- Memindahkan kebijakan persetujuan, perintah produk, atau otorisasi peninjau ke Plugin kanal.
- Menggandakan status persetujuan per kanal, perangkat, atau leluhur.
- Mendesain ulang daftar izin eksekusi, komposisi kebijakan plugin, atau persistensi `allow-always`, kecuali jika diperlukan agar hasil terminal tidak ambigu.
- Membuat TUI tersemat tanpa Gateway dapat dijangkau dari jarak jauh pada tahap pertama. TUI tersebut tetap hanya lokal dan harus gagal secara tertutup ketika tidak ada peninjau.

## Dasar acuan sebelum peluncuran dan peta bukti

Tabel ini mencatat status implementasi saat #103505 dibuka. Bagian peluncuran di bawah melacak registri persisten, tindakan bertipe, halaman tautan dalam, dan tahap klien native yang dibangun di atas dasar acuan tersebut.

| Permukaan         | Titik masuk dan pemilik dasar acuan                                                                                                                             | Perilaku dan kesenjangan dasar acuan                                                                                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Eksekusi agen     | `src/agents/bash-tools.exec-approval-request.ts`, `src/agents/bash-tools.exec-host-shared.ts`                                                                   | Pendaftaran `exec.approval.*` dua fase mencegah race `/approve` dini, tetapi batas waktu masih dapat berubah menjadi izin melalui `askFallback`.                                      |
| Gerbang alat plugin | `src/agents/agent-tools.before-tool-call.ts`                                                                                                                  | Meminta `plugin.approval.*`; `timeoutBehavior: "allow"` dapat menyetujui gerbang yang telah melewati batas waktu. Mode tersemat memiliki otoritas lokal-proses terpisah di `src/infra/embedded-plugin-approval-broker.ts`. |
| Gerbang node plugin | `src/gateway/node-invoke-plugin-policy.ts`                                                                                                                    | Membuat dan menyiarkan secara langsung melalui pengelola plugin, sehingga menduplikasi sebagian siklus hidup metode server.                                                                  |
| Otoritas Gateway  | `src/gateway/server-aux-handlers.ts`, `src/gateway/exec-approval-manager.ts`, `src/gateway/server-methods/approval-shared.ts`                                   | Pengelola eksekusi dan plugin yang terpisah menggunakan peta lokal-proses. Entri terminal bertahan selama 15 detik. Jawaban pertama sebagai pemenang hanya berlaku dalam satu proses.          |
| Protokol Gateway  | `packages/gateway-protocol/src/schema/exec-approvals.ts`, `packages/gateway-protocol/src/schema/plugin-approvals.ts`, `src/gateway/methods/core-descriptors.ts` | Eksekusi memiliki `get` khusus tertunda; plugin tidak memiliki `get`; tidak ada pencarian terminal yang tidak bergantung pada jenis untuk tautan dalam.                        |
| Pengiriman        | `src/infra/exec-approval-channel-runtime.ts`, `src/infra/approval-native-runtime.ts`, `src/infra/approval-handler-runtime.ts`                                   | Mendukung perutean asal, DM pemberi persetujuan, pemutaran ulang tertunda, penangan native, dan pembersihan terminal dalam proses. Tindak lanjut terpisah menambahkan rekonsiliasi terminal persisten. |
| Tindakan portabel | `src/interactive/payload.ts`, `src/plugin-sdk/interactive-runtime.ts`, `src/plugin-sdk/approval-reply-runtime.ts`                                               | Tombol persetujuan adalah tindakan perintah yang berisi `/approve ...`; target URL dan Web App adalah bidang tombol tanpa tipe.                                                                 |
| Telegram          | `extensions/telegram/src/approval-handler.runtime.ts`, `extensions/telegram/src/button-types.ts`                                                                | Perender mengurai teks perintah untuk mengenali semantik persetujuan sebelum menghasilkan data callback privat.                                                                              |
| Control UI        | `ui/src/app/exec-approval.ts`, `ui/src/app/overlays.ts`, `ui/src/components/exec-approval.ts`                                                                   | UI persetujuan berupa modal global. `ui/src/app-route-paths.ts` dan `ui/src/app-routes.ts` menggunakan rute persis dan menulis ulang jalur yang tidak dikenal ke Chat.                                        |
| Kepemilikan sesi  | `src/agents/subagent-registry.types.ts`, `src/agents/subagent-registry-read.ts`, `src/config/sessions/types.ts`                                                 | Kepemilikan pengontrol, pemohon, induk eksplisit, dan spawn lama tersedia, tetapi peristiwa persetujuan tidak diproyeksikan ke aliran sesi tersebut.                                           |
| Status bersama    | `src/state/openclaw-state-schema.sql`, `src/state/openclaw-state-db.ts`                                                                                         | Transaksi langsung yang sudah ada dan pembaruan bersyarat Kysely mendukung compare-and-set persisten di `state/openclaw.sqlite`.                                                               |

Pengujian representatif saat ini mencakup `src/gateway/exec-approval-manager.test.ts`, `src/gateway/server-methods/approval-shared.test.ts`, `src/agents/bash-tools.exec-gateway-approval.e2e.test.ts`, `extensions/telegram/src/approval-handler.runtime.test.ts`, dan `ui/src/e2e/approval-flow.e2e.test.ts`.

SDK plugin tetap menjadi satu-satunya batas kanal/plugin. Perubahan runtime dan presentasi persetujuan harus diekspor melalui subjalur `src/plugin-sdk/approval-*.ts` dan `src/plugin-sdk/interactive-runtime.ts` yang sudah ada; kode produksi plugin tidak boleh mengimpor internal Gateway.

## Implementasi terdahulu

Omnigent menyediakan semantik UX dan kegagalan yang berguna:

- [`approval.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/runtime/policies/approval.py) menangguhkan ASK, menerapkan batas waktu per kebijakan, dan hanya memperlakukan penerimaan yang persis sebagai persetujuan.
- [`sessions.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/routes/sessions.py) berisi gerbang harness native sisi server serta proyeksi permintaan/resolusi leluhur.
- [`ApprovePage.tsx`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/web/src/pages/ApprovePage.tsx) menyediakan halaman persetujuan seluler mandiri.

Jangan menyalin klaim penyimpanannya tanpa penilaian kritis. Status aktif yang tertunda saat ini bersifat lokal-proses di [`_elicitation_registry.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/_elicitation_registry.py), dan tabel tertunda yang tidak digunakan dihapus oleh [`e3b1f2a4c9d7_drop_pending_tool_calls_table.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/db/migrations/versions/e3b1f2a4c9d7_drop_pending_tool_calls_table.py). OpenClaw sengaja melangkah lebih jauh: SQLite bersifat otoritatif dan setiap transisi terminal merupakan compare-and-set basis data.

## Arsitektur dan kepemilikan

Gateway memiliki siklus hidup:

1. Agen, hook plugin, atau kebijakan node menyediakan permintaan khusus jenis dan pengikatan eksekusi lokal-proses.
2. Gateway memvalidasinya dan membangun proyeksi peninjau yang telah disanitasi.
3. Layanan persetujuan menghitung audiens sumber/pemilik, menyisipkan baris kanonis, lalu mendaftarkan penunggu dalam proses.
4. Setelah penyisipan persisten, Gateway menerbitkan peristiwa persetujuan yang sudah ada, proyeksi sesi, notifikasi kanal, dan push native.
5. Setiap permukaan melakukan resolusi melalui layanan yang sama.
6. Layanan melakukan commit atas satu transisi terminal, membangunkan penunggu runtime, dan menerbitkan proyeksi terminal.
7. Kegagalan pengiriman peristiwa tidak pernah membatalkan keputusan yang telah di-commit; klien melakukan pemulihan melalui `approval.get` atau pemutaran ulang daftar.

Batas kepemilikan:

- `src/gateway/`: layanan persetujuan, otorisasi, adaptor RPC, konstruksi URL, siklus hidup penunggu, dan penerbitan peristiwa.
- `src/state/`: skema bersama dan tipe Kysely yang dihasilkan.
- `src/infra/`: model tampilan persetujuan yang telah disanitasi dan konstruksi presentasi portabel.
- `src/agents/`: meminta, menunggu, dan menerapkan putusan yang dikembalikan; tanpa persistensi.
- `src/channels/` dan `extensions/*`: merender tindakan bertipe, mengotorisasi pengguna kanal, mengodekan callback privat, dan memperbarui kontrol yang telah dikirimkan.
- `src/plugin-sdk/`: hanya kontrak persetujuan dan presentasi publik.
- `ui/`: halaman mandiri serta klien antrean/modal yang sudah ada.

Penunggu dalam proses adalah mekanisme notifikasi, bukan otoritas. Pendaftaran menyisipkan baris dan memasang penunggu secara sinkron sebelum menerbitkan permintaan, sehingga resolver tidak dapat menyela di antara kedua langkah tersebut. Setiap resolver berikutnya melakukan commit melalui SQLite sebelum menyelesaikan penunggu tersebut.

## Catatan persisten

Tambahkan satu tabel `operator_approvals` ke basis data status bersama.

| Kolom                                             | Tujuan                                                                                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval_id`                                      | ID kanonis yang unik secara global. Pertahankan ID exec yang ada dan ID `plugin:` demi kompatibilitas protokol, tetapi jangan pernah menyimpulkan jenis dari prefiks.      |
| `resolution_ref`                                   | Pencari lokasi base64url SHA-256 lengkap yang unik untuk callback transportasi yang tidak dapat membawa ID kanonis. Ini bukan otorisasi atau ID URL publik. |
| `kind`                                             | Diskriminator `exec \| plugin` tertutup.                                                                                                        |
| `status`                                           | Status `pending \| allowed \| denied \| expired \| cancelled` tertutup.                                                                          |
| `presentation_json`                                | Proyeksi peninjau yang divalidasi dan diberi tag jenis. Permintaan runtime mentah, pengikatan perintah, dan payload callback tetap bersifat lokal untuk proses.               |
| `source_agent_id`, `source_session_key`            | Identitas sumber dan jangkar proyeksi sesi. Kunci sesi bersifat persisten; UUID sesi yang berotasi tidak.                                          |
| `audience_session_keys_json`                       | Larik JSON terurut dan tanpa duplikasi yang dihasilkan oleh penelusuran kepemilikan breadth-first terbatas. Peristiwa permintaan dan terminal menggunakan snapshot yang sama ini. |
| `requested_by_device_id`, `requested_by_client_id` | Metadata pemohon/audit yang persisten. ID koneksi tetap berada dalam memori dan bukan prinsipal lintas permukaan.                                         |
| `reviewer_device_ids_json`                         | Perangkat peninjau opsional yang ditargetkan secara eksplisit dan hanya diberikan oleh runtime persetujuan tepercaya.                                                  |
| `runtime_epoch`                                    | Epok proses yang memiliki eksekusi terparkir; digunakan untuk membatalkan baris yatim setelah dimulai ulang.                                                     |
| `created_at_ms`, `expires_at_ms`, `updated_at_ms`  | Pengaturan waktu otoritatif.                                                                                                                         |
| `decision`                                         | Keputusan pengguna eksplisit jika ada.                                                                                                       |
| `terminal_reason`                                  | Alasan tertutup seperti `user`, `timeout`, `malformed-verdict`, `no-route`, `run-aborted`, atau `gateway-restart`.                                |
| `resolved_at_ms`, `resolver_kind`, `resolver_id`   | Identitas pemenang dan audit yang disimpan di sisi server. Proyeksi peninjau menghilangkan pengidentifikasi penyelesai mentah.                                           |
| `consumed_at_ms`, `consumed_by`                    | Pelindung replay terpisah untuk `allow-once`; konsumsi tidak boleh menghapus keputusan yang tercatat.                                                       |

Indeks yang diperlukan:

| Indeks                                      | Tujuan                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| `(resolution_ref)` unik                  | Tolak ambiguitas lintas kolom `approval_id`/`resolution_ref` saat penyisipan. |
| `(status, expires_at_ms)`                  | Temukan persetujuan yang tertunda dan rekonsiliasi tenggat waktu otoritatif.               |
| `(source_session_key, created_at_ms DESC)` | Putar ulang persetujuan terbaru untuk satu sesi sumber.                             |
| `(resolved_at_ms)`                         | Pangkas persetujuan terminal yang disimpan sesuai kebijakan retensi tetap.  |

Larik audiens berukuran kecil dan terbatas. Replay yang difilter berdasarkan sesi terlebih dahulu memilih baris tertunda yang terlihat melalui Kysely, lalu mendekode dan memfilter larik audiens terbatas dalam kode aplikasi; proses ini tidak menggunakan pencocokan string atau kueri JSON SQL mentah.

Simpan baris terminal selama 30 hari, selaras dengan retensi audit metadata di `src/audit/audit-event-store.ts`. Pemangkasan adalah kebijakan pemeliharaan tetap, bukan permukaan konfigurasi baru. Basis data merupakan status bidang kontrol lokal privat, tetapi API peninjau tidak boleh mengekspos seluruh permintaan tersimpan atau pengikatan runtime.

## Mesin status dan bandingkan-dan-tetapkan

Hanya transisi berikut yang valid:

- `pending -> allowed`: `allow-once` atau `allow-always` eksplisit.
- `pending -> denied`: penolakan eksplisit, putusan terminal salah format yang tepercaya, atau tidak ada rute pengiriman.
- `pending -> expired`: tenggat waktu otoritatif tercapai.
- `pending -> cancelled`: pembatalan proses, penghentian tertib, atau pemulihan yatim setelah dimulai ulang.

Setiap status terminal yang tidak diizinkan memiliki putusan efektif berupa penolakan.

Penyelesaian menggunakan satu transaksi SQLite langsung dan pembaruan bersyarat Kysely yang setara dengan:

```sql
UPDATE operator_approvals
SET status = ?, decision = ?, terminal_reason = ?, resolved_at_ms = ?
WHERE approval_id = ?
  AND status = 'pending'
  AND expires_at_ms > ?;
```

Jika pembaruan tidak memengaruhi baris apa pun, transaksi yang sama membaca catatan:

- Tidak ada atau tidak diotorisasi: kembalikan tidak ditemukan; jangan ungkap keberadaannya.
- Masih tertunda tetapi tenggat waktu tercapai: gunakan bandingkan-dan-tetapkan untuk mengubahnya menjadi `expired`, lalu kembalikan baris terminal tersebut.
- Keputusan tercatat yang sama: kembalikan keberhasilan idempoten beserta pemenang yang tercatat.
- Keputusan berbeda: API terpadu mengembalikan `applied: false` beserta pemenang yang tercatat; adaptor lama mempertahankan `APPROVAL_ALREADY_RESOLVED` jika diwajibkan oleh kontrak yang telah dirilis.
- Status terminal apa pun: jangan pernah memutasinya.

`now == expires_at_ms` telah kedaluwarsa. Waktu Gateway bersifat otoritatif.

Eksekusi `allow-once` menggunakan CAS kedua atas `consumed_at_ms IS NULL`, yang terikat pada konteks perintah/proses sistem persis yang sudah ada. Baris persetujuan tetap menjadi catatan audit setelah dikonsumsi.

Input HTTP/RPC salah format yang tidak dapat diautentikasi atau tidak dapat mengidentifikasi persetujuan ditolak tanpa mutasi dan tidak pernah dapat menyetujui. Putusan terminal salah format yang diterima dari harness/waiter tepercaya untuk persetujuan yang diketahui mengalihkan status menjadi `denied`.

## API Gateway

Tambahkan metode peninjau yang tidak bergantung pada jenis:

| Metode                                    | Kontrak                                                                                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval.get { id }`                     | Mengembalikan proyeksi terminal tertunda atau tersimpan yang terlihat.                                                                                                                                                          |
| `approval.resolve { id, kind, decision }` | Menerima ID kanonis atau referensi transportasi berukuran tetap, lalu menjalankan otorisasi, validasi jenis dan keputusan yang diizinkan, rekonsiliasi tenggat waktu, serta CAS terminal. Respons selalu membawa ID kanonis. |

Setelah CAS berhasil, segera kembalikan proyeksi yang telah dikomit. Peristiwa lama, penerus kanal, dan penentu terminal push merupakan tindak lanjut upaya terbaik; permukaan yang lambat atau gagal tidak boleh menunda atau melakukan rollback terhadap respons pemenang.

Validasi permintaan khusus jenis tetap berada di `exec.approval.request` dan `plugin.approval.request`. `exec.approval.get/list/waitDecision/resolve` dan `plugin.approval.list/waitDecision/resolve` yang ada menjadi adaptor batas protokol ke layanan kanonis karena keduanya merupakan API Gateway yang telah dirilis. Pemanggil internal bermigrasi ke layanan dalam perubahan yang sama.

Proyeksi peninjau adalah union bertag:

```ts
type OperatorApproval = {
  id: string;
  status: OperatorApprovalStatus;
  presentation:
    | { kind: "exec"; commandText: string /* pratinjau exec yang aman */ }
    | { kind: "plugin"; title: string; description: string /* pratinjau plugin yang aman */ };
  // bidang siklus hidup umum
};
```

Path stabil diturunkan, bukan dipersistenkan. `approval.get` mengembalikan `urlPath`; permukaan yang mengetahui origin publik yang disetujui juga dapat menerima `url` absolut. Snapshot peninjau menghilangkan kunci sesi sumber dan audiens. Gateway menyimpan kunci perutean tersebut di sisi server untuk proyeksi `session.approval` yang terpisah.

## Peristiwa dan tindakan portabel

PR 1 mempertahankan nama peristiwa, payload, dan filter penerima tingkat catatan yang telah dirilis:

- `exec.approval.requested`
- `exec.approval.resolved`
- `plugin.approval.requested`
- `plugin.approval.resolved`

Peristiwa lama tersebut dapat berisi seluruh permintaan runtime, sehingga tidak boleh disebarkan ke setiap klien yang tercakup dalam persetujuan. PR 5 menambahkan bidang siklus hidup bertag (`status`, `sourceSessionKey`, `urlPath`, metadata terminal, dan `kind` tingkat presentasi) melalui proyeksi siklus hidup yang telah disanitasi, alih-alih memperluas pengiriman peristiwa lama.

Tambahkan peristiwa proyeksi `session.approval` yang tercakup dalam persetujuan. Publikasikan peristiwa kanonis satu kali dengan kunci audiens yang dipersistenkan; pelanggan sesi persis menerima peristiwa yang sama untuk setiap kunci yang cocok:

- `sessionKey`: stream yang menerima proyeksi.
- `sourceSessionKey`: turunan/sumber yang memicu gerbang.
- `phase`: `pending \| terminal`, didiskriminasi terhadap status persetujuan.
- satu proyeksi `OperatorApproval` yang aman.

Klien memilih ikut serta dengan `sessions.messages.subscribe { key, agentId?, includeApprovals: true }`. Respons yang berhasil menambahkan `approvalReplay` yang berisi hingga 1.000 persetujuan tertunda saat ini untuk kunci stream persis tersebut, yang juga diotorisasi pada tingkat catatan untuk ditinjau oleh klien pelanggan. `truncated: false` menjadikan replay terfilter bersifat otoritatif dan klien yang tersambung kembali mengganti kumpulan tertunda lokalnya dengan replay tersebut; `truncated: true` adalah sinyal beban berlebih dan klien harus mempertahankan entri lokal yang belum terlihat sampai pencarian kanonis atau peristiwa siklus hidup berikutnya menyelesaikannya. Waktu habis persisten yang ditemukan kemudian selama replay memancarkan tombstone terminal hanya kepada audiens pelanggan yang diotorisasi pada tingkat catatan sebelum snapshot baru dikembalikan. `operator.admin` dapat ikut serta secara langsung; klien yang lebih sempit memerlukan identitas perangkat berpasangan dan `operator.approvals`. Langganan sesi saja tidak pernah memberikan visibilitas persetujuan.

Daftarkan peristiwa di bawah `operator.approvals` dalam `src/gateway/server-broadcast.ts`. Proyeksi ini bersifat observasional: tidak pernah menambahkan baris transkrip, memancarkan `sessions.changed`, atau membangunkan agen.

Perluas `MessagePresentationAction` dalam `src/interactive/payload.ts`:

```ts
type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string }
  | {
      type: "approval";
      approvalId: string;
      approvalKind: "exec" | "plugin";
      decision: ExecApprovalDecision;
    }
  | { type: "url"; url: string }
  | { type: "web-app"; url: string };
```

Core membangun tindakan keputusan bertipe dan tautan Tinjau terpisah saat origin absolut Control UI yang disetujui tersedia. Kanal mengodekan tindakan persetujuan ke dalam format callback masing-masing dan mengirimkan penyelesaian ke layanan kanonis. Callback menggunakan ID kanonis yang persis jika muat; jika tidak, callback menggunakan `resolution_ref` digest lengkap unik milik baris tersebut. Referensi tersebut hanyalah kunci pencarian ringkas: autentikasi Gateway normal, otorisasi rekaman, jenis eksplisit, validasi keputusan yang diizinkan, rekonsiliasi tenggat, dan CAS jawaban pertama tetap berlaku. Kanal tidak boleh memotong ID, menguraikan prefiks hash, mengurai teks `/approve`, atau menyimpulkan jenis dari prefiks ID.

Pertahankan `button.url`, `button.webApp`, dan kontrol persetujuan berbasis perintah sebagai input kompatibilitas SDK plugin yang tidak digunakan lagi. Normalkan semuanya di batas SDK; migrasikan setiap pemanggil internal bawaan dalam PR yang sama. `/approve {id} {decision}` tetap menjadi fallback teks dan perintah CLI/obrolan, bukan kontrak semantik tombol.

## Control UI

Rutenya adalah `${basePath}/approve/{approvalId}`. ID adalah satu-satunya parameter jalur; identitas sesi sumber berasal dari rekaman.

Karena router saat ini memiliki rute statis persis dan menulis ulang jalur yang tidak dikenal ke Obrolan, deteksi deep link ini di `ui/src/app/bootstrap.ts` sebelum normalisasi rute biasa. Gunakan kembali penyiapan Gateway/autentikasi normal, tetapi render halaman persetujuan mandiri di luar shell bilah samping dan modal global.

Dokumen dimiliki oleh Gateway yang menyajikan URL-nya. Koneksi awalnya mengabaikan pilihan Gateway jarak jauh tersimpan milik aplikasi lengkap tanpa mengubah atau menyalin pengaturan pilihan tersebut; hanya autentikasi yang tetap dibatasi pada sesi untuk Gateway penyaji. Autentikasi native tepercaya atau override `gatewayUrl` yang dikonfirmasi secara terpisah dapat mengarahkannya ulang. Core mencadangkan namespace satu segmen `/approve` sebelum rute HTTP plugin dan deteksi ekstensi statis, termasuk ID yang berakhiran `.json` atau `.js`; saat penyajian Control UI dinonaktifkan, rute yang dicadangkan gagal secara tertutup dengan `404`. Pertahankan halaman dalam bundel utama Control UI agar kegagalan chunk lazy tidak membiarkan keputusan keamanan terhenti pada indikator pemuatan.

Status halaman:

- memuat
- autentikasi diperlukan
- tertunda
- sedang menyelesaikan
- disetujui atau ditolak di sini
- diselesaikan di tempat lain
- kedaluwarsa
- dibatalkan
- dilarang/tidak ditemukan
- kesalahan koneksi dengan coba lagi

Halaman memanggil RPC Gateway, bukan API REST kedua tanpa autentikasi. Penyegaran browser membaca ulang status persisten. Halaman tidak pernah menempatkan kredensial Gateway dalam URL, kueri, atau fragmen.

## Otorisasi dan privasi

URL adalah pencari lokasi, bukan otoritas. Penyelesaian memerlukan:

1. koneksi Gateway terautentikasi;
2. `operator.approvals` atau `operator.admin`;
3. otorisasi peninjau tingkat rekaman.

Aturan tingkat rekaman:

- `operator.admin` dapat meninjau.
- `reviewer_device_ids` bersifat otoritatif saat tersedia. Hanya perangkat
  `operator.approvals` tersanding yang tercantum yang dapat meninjau; perangkat peminta tidak
  memiliki akses implisit kecuali perangkat tersebut juga tercantum.
- Tanpa daftar peninjau eksplisit, perangkat `operator.approvals`
  tersanding yang meminta dapat meninjau rekamannya sendiri.
- Rekaman lama yang benar-benar tidak memiliki pengikatan peminta atau peninjau mempertahankan
  visibilitas luas bagi perangkat tersanding agar peningkatan tidak menelantarkan pekerjaan yang sudah tertunda.
- Runtime internal tanpa perangkat dapat menyelesaikan, tetapi tidak membaca, melalui koneksi
  runtime persetujuan yang dibatasi. Otoritas tersebut hanya berasal dari token runtime
  yang diautentikasi server; bidang publik `approval.resolve` tidak dapat
  membuatnya.
- Kepemilikan koneksi peminta aktif tetap valid untuk adaptor lama; kepemilikan tersebut
  tidak pernah disimpulkan dari nama klien yang cocok.
- Keanggotaan audiens hanya mengubah penyajian. Keanggotaan tersebut tidak pernah memperluas otorisasi.

`approval.get` hanya mengekspos proyeksi peninjau yang telah disanitasi dan menghilangkan kunci perutean sumber/audiens internal. Peristiwa `session.approval` PR 5 membawa satu tujuan `sessionKey` miliknya beserta `sourceSessionKey` setelah Gateway menerapkan snapshot audiens persisten di sisi server. Peristiwa exec/plugin yang ada mempertahankan payload historis dan penerima terbatasnya hingga konsumen bermigrasi. Permintaan yang dapat dieksekusi, pengikatan perintah, dan kelanjutan hanya tetap berada dalam waiter lokal proses. Baris persisten berisi penyajian aman beserta metadata siklus hidup, perutean, dan audit; baris tersebut tidak pernah menyimpan nilai lingkungan mentah, kredensial, header autentikasi, atau data callback kanal.

## Proyeksi audiens

Hitung audiens sekali sebelum penyisipan dan simpan snapshot yang terurut. Kepemilikan merupakan graf, bukan selalu satu rantai induk: sebuah anak dapat memiliki pengendali saat ini sekaligus peminta asli, dan pemilik tersebut dapat mengarah ke root yang berbeda.

Gunakan penelusuran breadth-first deterministik:

1. Isi awal antrean dengan kunci sesi sumber.
2. Untuk setiap kunci yang dikeluarkan dari antrean, baca baris registri subagen terbaru dan antrekan kedua sisi kepemilikan yang berbeda dalam urutan tetap: `controllerSessionKey`, lalu `requesterSessionKey`.
3. Saat baris registri yang dapat digunakan tersedia, jangan turut mengikuti garis keturunan entri sesi yang mungkin sudah usang setelah pengarahan. Jika tidak, antrekan satu sisi fallback saat ini `parentSessionKey ?? spawnedBy`.
4. Normalkan dan hapus duplikasi saat memasukkan ke antrean agar jalur pertama dan terpendek menang.
5. Berhenti pada 64 kunci unik; batas ukuran audiens ini juga membatasi kedalaman penelusuran.

Sumber registri adalah `src/agents/subagent-registry-read.ts`; bidang kepemilikan didefinisikan di `src/agents/subagent-registry.types.ts`. Bidang fallback sesi didefinisikan di `src/config/sessions/types.ts`.

Proyeksi permintaan dan terminal menggunakan audiens persisten yang sama meskipun kepemilikan fokus/pengendali berubah selama persetujuan tertunda. Ini menjamin pembersihan terminal untuk setiap aliran sesi audiens yang menerima proyeksi permintaan. Penyelesaian selalu menargetkan ID persetujuan sumber; sesi audiens tidak pernah menerima status persetujuan hasil kloning. Pembersihan pesan kanal yang diteruskan tetap menjadi tindak lanjut pencari lokasi pengiriman terpisah di bawah.

Jangan menulis pesan transkrip, menyuntikkan prompt sistem, memulai giliran pemilik, atau memancarkan `sessions.changed` semata-mata untuk persetujuan.

## Konvergensi permukaan terkirim

Handler persetujuan native sudah mempertahankan entri pesan terkirimnya cukup lama untuk mengganti atau menonaktifkan kontrol aktif. Pesan persetujuan umum yang diteruskan saat ini membuang `MessageReceipt`, sehingga keputusan pada permukaan lain dapat membuat kontrol lamanya tampak masih tertunda. Tindak lanjut terpisah menutup celah tersebut dengan tabel anak `operator_approval_deliveries` dalam basis data status bersama.

Setiap baris menyimpan ID persetujuan, ID pengiriman unik, kanal/akun/rute persis, pencari lokasi pesan privat kanal yang dibatasi dan divalidasi JSON, stempel waktu pengiriman, serta status finalisasi. Baris tidak pernah menyimpan data callback, token keputusan, atau permintaan persetujuan mentah. Kanal memiliki pengodean pencari lokasi dan mutasi pesan; core memiliki status kanonis, pemilihan target, kebijakan percobaan ulang, dan teks terminal fallback.

Pendaftaran pengiriman dan penyelesaian terminal menangani kondisi balapan dengan aman:

1. Setelah pengiriman tertunda mengembalikan tanda terimanya, sisipkan pencari lokasi pengiriman dan baca status persetujuan induk dalam satu transaksi.
2. Jika induk sudah terminal, jadwalkan finalisasi segera alih-alih membiarkan pengiriman yang terlambat tetap tertunda.
3. Setiap transisi terminal yang di-commit secara terpisah menjadwalkan semua baris pengiriman yang belum difinalisasi; siaran yang dapat dibuang bukan pemicunya.
4. Terminalizer kanal melaporkan `replaced`, `retired`, atau `unsupported`. Penggantian mencegah pesan terminal duplikat; penonaktifan mengirim tindak lanjut terminal yang ada; kondisi tidak didukung atau kegagalan kembali ke fallback tanpa melakukan rollback CAS persetujuan.
5. Saat mulai, coba ulang persetujuan terminal dengan pengiriman yang belum selesai, sehingga pembersihan tahan terhadap mulai ulang Gateway.

Siklus hidup transportasi ini merupakan hook adaptor pengiriman opsional, bukan renderer atau tindakan pesan yang dihadapkan ke model. Pesan C2C/grup QQ saat ini tidak memiliki API edit, hapus, atau penghapusan keyboard; adaptor tersebut tetap tidak didukung dan hanya dapat menampilkan kebenaran kanonis setelah klik berikutnya hingga transportasi memperoleh API mutasi.

## Semantik mulai ulang, batas waktu, dan rute

Persistensi SQLite tidak menyiratkan pelanjutan eksekusi. Pengikatan perintah/alat tetap berada dalam memori karena dapat berisi fakta runtime yang sensitif terhadap keamanan dan bukan kontrak pekerjaan yang dapat dilanjutkan.

Saat Gateway dimulai:

- buat epoch runtime baru;
- transisikan secara atomik baris tertunda dari epoch lama ke `cancelled` dengan alasan `gateway-restart`;
- pertahankan baris agar URL-nya menjelaskan apa yang terjadi;
- jangan pernah mengeksekusi persetujuan berikutnya terhadap pengikatan runtime yang hilang.

Timer merupakan pengoptimalan untuk membangunkan proses. Otoritas tenggat disimpan `expires_at_ms`; pembacaan, penantian, dan penyelesaian semuanya menjalankan rekonsiliasi kedaluwarsa.

Perilaku ketat final:

- batas waktu -> `expired`, tolak;
- tanpa rute -> `denied`, tolak;
- pembatalan proses -> `cancelled`, tolak;
- putusan tepercaya yang tidak valid -> `denied`, tolak;
- hanya keputusan izinkan eksplisit yang diizinkan -> `allowed`.

Perilaku exec yang dirilis saat ini masih bertentangan dengan kontrak ini:

- `src/agents/bash-tools.exec-host-shared.ts` dapat menerapkan `askFallback`.
- `docs/tools/exec-approvals.md` dan `docs/cli/approvals.md` mendokumentasikan permukaan tersebut.

Persetujuan plugin kini gagal secara tertutup pada batas waktu dan putusan yang tidak valid; bidang lama
`timeoutBehavior` tetap diterima tetapi diabaikan. Tindak lanjut semantik ketat
exec harus memperbarui kode, tipe, dokumentasi, pengujian, dan log perubahan secara bersamaan, dengan
tinjauan pemilik/keamanan yang eksplisit. `askFallback` dapat terus menjelaskan
pemilihan kebijakan pra-gerbang selama migrasi, tetapi tidak boleh mengubah batas waktu
rekaman tertunda yang telah dibuat menjadi persetujuan.

## Rencana kompatibilitas

- Protokol Gateway aditif; tidak ada peningkatan versi protokol.
- Pertahankan metode dan peristiwa exec/plugin yang ada pada batas eksternal.
- Pertahankan ID yang ada, termasuk prefiks `plugin:`, tetapi hentikan penggunaan prefiks sebagai informasi tipe.
- Pertahankan perilaku perintah teks `/approve`.
- Pertahankan bidang URL/Web App tombol lama dan tindakan perintah sebagai input kompatibilitas SDK plugin; output core baru bertipe.
- Migrasikan semua kanal bawaan dan pemanggil internal dalam perubahan tindakan bertipe yang sama.
- Tambahkan entri log perubahan untuk URL/halaman baru dan untuk perubahan perilaku batas waktu berikutnya.
- Jangan tambahkan pengaturan mode elisitasi.

## Peluncuran

### PR 1: siklus hidup persisten

- Catatan desain ini.
- Skema SQLite bersama, pembuatan Kysely, penyimpanan, dan pemangkasan 30 hari.
- Layanan persetujuan Gateway, jembatan waiter runtime, dan penanganan orphan saat mulai ulang.
- `approval.get/resolve` terpadu.
- Adaptor metode exec/plugin.
- Pengujian jawaban-pertama-menang, idempotensi, kedaluwarsa, otorisasi, dan konsumsi.
- Belum ada perubahan perilaku UI atau kanal.

### PR 2: tindakan bertipe dan callback kanal

- Tindakan persetujuan, URL, dan Web App bertipe.
- Builder presentasi inti dan ekspor SDK plugin.
- Pengodean callback privat-transport dengan jenis pemilik eksplisit.
- Referensi callback berukuran tetap yang tahan lama untuk ID kanonis yang melampaui batas transport.
- Migrasi kanal bawaan agar tidak lagi menggunakan inferensi teks perintah dan ID persetujuan.
- Kebenaran jawaban pertama yang kanonis pada permukaan yang diklik dan pembaruan terminal native aktif dengan upaya terbaik; terminalisasi pesan kanal yang tahan lama tetap menjadi tindak lanjut.
- Pengujian SDK dan kanal bawaan.

### PR 3: deep link Control UI

- Halaman persetujuan terautentikasi mandiri dan perutean startup yang memperhitungkan path dasar.
- Pengikatan Gateway penyaji tanpa mengubah pilihan jarak jauh tersimpan milik operator.
- Namespace HTTP persetujuan milik inti, termasuk ID yang menyerupai aset.
- Payload URL yang dibuat oleh Gateway dan polling status tertunda hingga event siklus hidup tersedia.
- Bukti untuk lebar perangkat seluler, koneksi ulang, jawaban yang bersaing, pemuatan ulang, dan path yang dipasang.

### PR 4: klien native

- Permukaan peninjauan iOS dan Android menggunakan `approval.get/resolve` yang memperhitungkan jenis; watchOS meneruskan prompt dan keputusan yang aman bagi peninjau melalui iPhone yang dipasangkan.
- Watch menawarkan keputusan exec yang didukung oleh kontrak relay ringkasnya: izinkan sekali dan tolak.
- Kebenaran terminal jawaban pertama yang kanonis menggantikan status keputusan yang dicoba secara lokal.
- Pengakuan penyelesaian yang hilang atau ambigu membekukan kontrol hingga pembacaan balik kanonis.
- Instans Gateway v4 yang telah dirilis sebelumnya mempertahankan peninjauan exec melalui fallback metode lama yang terbatas; status terminal lintas permukaan yang dipertahankan memerlukan metode terpadu.
- Peringatan bagi peninjau dan konteks pemilik tetap terlihat di iPhone, Watch, dan Android.
- Bukti unit, build, dan platform native.

### PR 5: propagasi siklus hidup leluhur

- Pengiriman tertunda/terminal `session.approval` dari snapshot audiens yang dipersistenkan di PR 1.
- Langganan sesi yang tepat, pemutaran ulang saat koneksi ulang, dan tombstone terminal tanpa mutasi transkrip atau membangunkan agen.
- Callback siklus hidup berjalan setelah insert/CAS yang tahan lama dan tidak pernah menjadi otoritas persetujuan.
- Bukti subagen bertingkat dan koneksi ulang.

### PR 6: perilaku gagal-tertutup

- Migrasikan `node-invoke-plugin-policy.ts` dan broker plugin tertanam agar tidak lagi memiliki otoritas duplikat.
- Semantik ketat untuk batas waktu, data cacat, tanpa rute, pengikatan, dan konsumsi sekali-izinkan.
- Deprekasikan pengaturan batas waktu permisif yang telah dirilis tanpa mematuhinya setelah permintaan tertunda.
- Bukti persaingan multi-permukaan dan injeksi kegagalan.

### Tindak lanjut: pembersihan pesan jarak jauh yang tahan lama

- Persistenkan pencari lokasi pengiriman yang diteruskan dan terminalisasi setiap pesan kanal yang telah dikirim setelah mulai ulang.
- Pisahkan siklus hidup transport ini dari otoritas persetujuan kanonis dan tindakan presentasi bertipe.

## Pengujian

Cakupan terfokus yang diwajibkan:

- Pembukaan ulang SQLite mempertahankan proyeksi tertunda dan terminal.
- Dua penyelesai konkuren menghasilkan tepat satu pemenang CAS.
- Percobaan ulang dengan keputusan yang sama berhasil secara idempoten; percobaan ulang yang bertentangan mengembalikan pemenang yang tercatat.
- Penyelesaian pada atau setelah tenggat tidak dapat menyetujui.
- `allow-once` dapat dikonsumsi tepat sekali tanpa menghapus status audit terminal.
- Startup membatalkan epoch runtime yang lebih lama.
- Pencarian dan penyelesaian tanpa otorisasi tidak mengungkap keberadaan catatan.
- Daftar izin peninjau eksplisit dan perilaku umum `operator.approvals` yang dipasangkan.
- Metode lama exec dan plugin menggunakan penyimpanan yang sama.
- Skema permintaan/daftar/ambil/selesaikan Gateway dan payload event aditif.
- Normalisasi tindakan bertipe, rendering fallback, ekspor SDK, dan peralihan kanal bawaan.
- Pengodean callback Telegram memuat data privat-transport dan tidak mengandung inferensi string perintah.
- Anak langsung, pemilik pengontrol/peminta bercabang, pemilik bertingkat, penetapan ulang, fallback kolom sesi, siklus, dan batas ukuran audiens.
- Array audiens yang diminta dan terminal identik.
- Proyeksi pemilik tidak menyebabkan mutasi transkrip atau membangunkan agen.
- Rute Control UI berfungsi di `/` dan path dasar yang dikonfigurasi; penyegaran menampilkan kebenaran tertunda atau terminal.
- Jawaban Control UI dan Telegram secara simultan menampilkan satu pemenang dan "diselesaikan di tempat lain" pada pihak yang kalah.
- Pengidentifikasi persetujuan native dan pengidentifikasi pemilik Gateway mempertahankan byte UTF-8 yang persis sama selama perutean dan rekonsiliasi.
- Negosiasi keluarga RPC native menetapkan satu keluarga kanonis atau lama per rute Gateway yang diterima dan tidak pernah menurunkan versi secara diam-diam setelah digunakan.
- Pengakuan penyelesaian native yang hilang membekukan tindakan hingga pembacaan balik kanonis; pembacaan balik yang gagal tidak dapat mengarang pemenang atau mengakui penyegaran Watch.
- Korelasi permintaan snapshot Watch hanya diterima untuk pemilik Gateway pasangan yang tepat dan pembacaan balik iPhone kanonis yang telah selesai.
- Bukti jalur pengguna melalui Testbox/Crabbox, termasuk halaman persetujuan selebar perangkat seluler, pembersihan tindakan Telegram, dan satu perjalanan pulang-pergi tertunda/selesaikan/pihak-kalah-terlambat di Android, iPhone, dan Watch.

## Observabilitas

Emisikan log transisi terstruktur tanpa konten dengan ID persetujuan, jenis, kunci sesi sumber, status, alasan, dan latensi. Jangan pernah mencatat pratinjau atau pengikatan mentah.

Lacak:

- jumlah permintaan berdasarkan jenis;
- jumlah terminal berdasarkan jenis/status/alasan;
- pengukur tertunda;
- latensi permintaan-ke-terminal;
- hasil persaingan penyelesaian: pemenang, percobaan ulang idempoten, konflik, kedaluwarsa;
- jumlah rute pengiriman dan penolakan tanpa rute;
- pembatalan yatim saat startup;
- ukuran audiens.

Transisi yang telah di-commit dianggap berhasil meskipun pengiriman event setelahnya gagal. Pelanggan siklus hidup memulihkan melalui pemutaran ulang PR 5 dan pencarian kanonis. Terminalisasi pesan kanal yang tahan lama tetap menjadi tindak lanjut terpisah di atas.

## Keputusan terbuka

1. **Origin Control UI yang dapat dijangkau secara eksternal.** Setiap snapshot membawa `urlPath` relatif yang stabil. URL absolut hanya boleh dipublikasikan dari lokasi Tailscale Serve/Funnel yang di-cache setelah eksposur Gateway berhasil; `allowedOrigins`, header Host permintaan, `gateway.remote.url`, dan kandidat loopback/LAN khusus tampilan bukanlah origin kanonis. Telegram dapat menggunakan wrapper Mini App terautentikasinya untuk mempertahankan path persetujuan melalui bootstrap. Proxy balik arbitrer tetap hanya relatif hingga tersedia kontrak URL publik eksplisit yang ditinjau secara terpisah. Jangan pernah membiarkan kanal menebak origin.
2. **Transisi kompatibilitas batas waktu ketat exec.** Batas waktu persetujuan plugin kini gagal secara tertutup dan `timeoutBehavior` telah dideprekasi. Kontrak `askFallback` yang masih dirilis memerlukan peninjauan eksplisit oleh pemilik/keamanan, changelog, dokumentasi, serta keputusan migrasi/deprekasi sebelum berhenti mengotorisasi eksekusi setelah permintaan tertunda mencapai batas waktu.
3. **Mode tertanam tanpa Gateway.** Rekomendasi: pertahankan hanya lokal pada awalnya, lalu jadikan sebagai klien layanan kanonis ketika Gateway tersedia. Jangan publikasikan deep link yang tidak dapat diselesaikan oleh server mana pun.
