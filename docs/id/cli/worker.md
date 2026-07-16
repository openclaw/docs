---
read_when:
    - Mengoperasikan atau men-debug pekerja cloud yang diluncurkan oleh Gateway
    - Memverifikasi penerimaan worker, penetapan sesi, atau isolasi alat lokal
summary: Referensi operator internal untuk runtime worker cloud terbatas
title: Pekerja
x-i18n:
    generated_at: "2026-07-16T18:03:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6591eb66c201a56e60638ce832c569b030d2d4a01b984d577e0ea44c10a0fa5e
    source_path: cli/worker.md
    workflow: 16
---

# `openclaw worker`

`openclaw worker` adalah titik masuk runtime terbatas untuk diluncurkan oleh orkestrator worker cloud
di dalam lingkungan worker yang telah disiapkan. Ini bukan
perintah serbaguna untuk pendaftaran worker secara manual.

Gateway memasang bundel OpenClaw yang sesuai dan membuka tunnel
SSH balik dengan kunci host yang dipatok. Peluncur worker memulai perintah ini dengan penugasan
yang telah disiapkan. Perintah terhubung melalui soket lokal yang diteruskan oleh tunnel dan
diterima sebagai peran khusus `worker`.

## Kontrak peluncuran

Perintah membaca tepat satu amplop peluncuran JSON terbatas dari input standar.
Amplop tersebut memuat lokasi soket lokal, kredensial worker yang diterbitkan, identitas
bundel dan protokol, epoch pemilik, serta satu-satunya sesi dan giliran yang ditetapkan.
Kredensial tidak pernah diterima melalui argumen baris perintah, dan halaman ini
sengaja tidak menyediakan contoh kredensial maupun amplop yang ditulis secara manual.

Penerimaan ditolak secara aman jika amplop tidak valid, kredensial ditolak,
fitur bundel atau protokol tidak cocok, atau sesi dan epoch pemilik
tidak lagi berlaku. Operator sebaiknya memulai worker melalui orkestrator worker
cloud, bukan menjalankan titik masuk ini secara langsung.

## Batas runtime

Proses menjalankan loop agen tertanam normal dengan backend terbatas:

- Alat pengodean `read`, `write`, `edit`, `apply_patch`, `exec`, dan `process`
  berjalan secara lokal di ruang kerja worker.
- Panggilan model menggunakan proksi inferensi Gateway. Tidak ada profil autentikasi model lokal yang
  dimuat.
- Penulisan transkrip menggunakan RPC commit transkrip Gateway.
- Pembaruan streaming dan siklus hidup alat menggunakan RPC peristiwa langsung Gateway.
- Hanya sesi dan giliran yang ditetapkan yang diterima.

Mode worker tidak memulai channel, permukaan HTTP Gateway, atau mulai otomatis plugin
di luar perangkat alat sesi yang ditetapkan. Mode ini menggunakan direktori status sementara dan tidak memiliki
kredensial provider atau forge yang persisten.

Pengiriman sesi antar-worker tidak diekspos dalam mode ini. Penempatan dan
pengiriman tetap dimiliki Gateway: operator dapat mengirim sesi lokal
dengan worktree terkelola yang sudah ada melalui Gateway, sedangkan proses worker tidak dapat
mengirim dirinya sendiri atau worker lain.

Penugasan yang telah disiapkan memuat konteks transkrip, leaf dasar yang diterima,
urutan commit, dan kursor peristiwa langsung. Saat tunnel tersambung kembali, proses
melakukan penerimaan ulang dengan kredensial dan epoch pemilik yang sama, mempertahankan
dasar transkrip yang diterima, memutar ulang bagian akhir peristiwa langsung yang belum diakui, dan menyambungkan kembali
giliran inferensi yang sedang berlangsung dengan identitas yang sama. Pesan inferensi terminal
bersifat otoritatif jika delta streaming terlewat. Epoch pemilik pengganti
membatasi proses dan menyebabkan proses keluar dengan bersih.

Penolakan transkrip `stale-base-leaf` menghentikan paksa proses yang sedang berjalan. Mode worker
tidak mencoba ulang urutan yang ditolak terhadap leaf lain, sehingga tidak ada
commit duplikat yang dihasilkan; bagian akhir dalam memori yang masih belum di-commit dari proses tersebut
akan hilang. Peluncuran ulang merupakan tanggung jawab pemilik penempatan milestone-3, yang harus
membuat penugasan baru dari transkrip otoritatif dan
ledger commit milik Gateway. Demikian pula, dimulainya ulang proses Gateway menghentikan
giliran inferensi yang tertunda dengan kesalahan provider; hanya penyambungan ulang tunnel atau WebSocket
worker yang dapat menyambungkan kembali ke aliran inferensi aktif dalam proses yang sama.

Lihat [Protokol Gateway](/id/gateway/protocol#worker-role-and-closed-protocol) untuk
permukaan RPC worker tertutup dan [Rencana worker cloud](/id/plan/cloud-workers) untuk
arsitektur dan model keamanan.
