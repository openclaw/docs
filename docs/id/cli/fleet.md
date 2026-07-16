---
read_when:
    - Anda menghosting beberapa domain kepercayaan tenant pada satu mesin
    - Anda perlu membuat, memeriksa, meningkatkan, atau menghapus sel armada
summary: Referensi CLI untuk menyediakan dan mengelola sel OpenClaw per tenant yang terisolasi
title: Armada
x-i18n:
    generated_at: "2026-07-16T18:00:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: be589500e4715541f175caf0d5135a96baee4874e64c60c8b6f188ff1f70bc9f
    source_path: cli/fleet.md
    workflow: 16
---

# `openclaw fleet`

`openclaw fleet` mengelola instans OpenClaw lengkap yang disebut **sel**. Setiap sel memiliki Gateway, status, kredensial, akun saluran, kontainer, dan port host khusus loopback sendiri. Gunakan satu sel untuk setiap batas kepercayaan tenant; jangan gunakan satu Gateway bersama sebagai batas multi-tenant yang tidak tepercaya.

Fleet bersifat **eksperimental**. Nama perintah, flag, bentuk output, dan profil kontainer dapat berubah antar-rilis tanpa masa penghentian dukungan.

Fleet mendukung Docker dan Podman. Image default adalah `ghcr.io/openclaw/openclaw:latest`.

Fleet diuji pada host Linux dan macOS. Host Windows saat ini belum diuji.

## Mulai cepat

```bash
openclaw fleet create acme
openclaw fleet status acme
openclaw fleet list
```

`fleet create` mencetak token Gateway yang dihasilkan satu kali beserta URL sel. Segera simpan token tersebut, lalu konfigurasikan akun saluran setiap tenant di dalam sel tenant tersebut.

## ID tenant

ID tenant harus cocok dengan:

```text
^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$
```

Pola ini mengizinkan 1 hingga 40 huruf kecil, digit, dan tanda hubung internal. ID harus diawali dan diakhiri dengan huruf atau digit. Huruf besar, garis bawah, garis miring, titik, spasi kosong, dan string traversal seperti `../acme` ditolak.

ID menjadi bagian dari nama kontainer: `openclaw-cell-<tenant>`.

## `fleet create`

Buat sel dan jalankan:

```bash
openclaw fleet create acme
```

Buat sel Podman pada port tetap tanpa menjalankannya:

```bash
openclaw fleet create acme \
  --runtime podman \
  --port 19125 \
  --no-start
```

Teruskan variabel lingkungan khusus tenant dengan mengulangi `--env`:

```bash
openclaw fleet create acme \
  --env TZ=America/Los_Angeles \
  --env OPENCLAW_DISABLE_BONJOUR=1
```

Kunci lingkungan menggunakan huruf, digit, dan garis bawah serta tidak boleh diawali dengan digit. Nilai harus terdiri dari satu baris karena Fleet meneruskannya melalui file lingkungan runtime yang dilindungi. Fleet menolak upaya untuk menimpa variabel jalur kontainer dan token Gateway terkelola yang tercantum di [Penyimpanan dan tata letak kontainer](#storage-and-container-layout).

### Opsi pembuatan

| Opsi                    | Default                               | Deskripsi                                                                                    |
| ------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `--image <ref>`           | `ghcr.io/openclaw/openclaw:latest`    | Image kontainer untuk sel.                                                                  |
| `--runtime <runtime>`     | `docker`                              | CLI kontainer: `docker` atau `podman`.                                                           |
| `--port <number>`         | Dialokasikan otomatis dari `19100`  | Port host loopback. Port yang dipilih secara eksplisit tidak boleh dimiliki sel terdaftar lain.    |
| `--memory <value>`        | `2g`                                  | Batas memori kontainer dalam sintaks Docker/Podman.                                                |
| `--cpus <value>`          | `2`                                   | Batas CPU kontainer.                                                                           |
| `--disk <size>`           | Tidak ada                                  | Membatasi lapisan kontainer yang dapat ditulisi ketika backend penyimpanan mendukung kuota.                     |
| `--network <mode>`        | `bridge`                              | Mode jaringan keluar: `bridge` atau `internal`.                                                 |
| `--pids-limit <number>`   | `512`                                 | Jumlah maksimum proses dalam kontainer.                                                  |
| `--env <KEY=VALUE>`       | Tidak ada                                  | Meneruskan variabel lingkungan ke sel. Ulangi untuk beberapa nilai.                          |
| `--gateway-token <value>` | Token heksadesimal acak 32 karakter | Menggunakan token Gateway yang diberikan alih-alih membuatnya. Lihat [Penanganan token](#token-handling). |
| `--no-start`              | Sel dijalankan                           | Membuat kontainer tanpa menjalankannya.                                                      |
| `--json`                  | Output yang mudah dibaca manusia                 | Mencetak output yang dapat dibaca mesin.                                                                 |

Alokasi otomatis memilih port registri pertama yang belum digunakan pada atau di atas `19100`. Fleet menolak ID tenant duplikat dan port eksplisit yang sudah ditetapkan ke sel lain.

Referensi image diteruskan sebagai satu argumen runtime kontainer. Referensi kosong dan nilai yang diawali dengan `-` ditolak agar image tidak dapat ditafsirkan sebagai opsi Docker atau Podman.

Endpoint Docker atau Podman yang dipilih harus lokal. Fleet menolak konteks Docker jarak jauh, endpoint `DOCKER_HOST`, dan layanan Podman jarak jauh sebelum mencadangkan port atau membuat status lokal. Host sel jarak jauh tidak didukung.

Saat Fleet menjalankan sel baru, proses pembuatan menunggu hingga sekitar satu menit agar Gateway merespons `/healthz`. Jika sel tidak menjadi sehat, Fleet membiarkan kontainer dan baris registrinya tetap utuh untuk `fleet status`, `fleet logs`, atau penghapusan eksplisit. `--no-start` melewati gerbang pemeriksaan kesehatan ini. Token Gateway yang dihasilkan untuk sel baru yang tidak sehat tidak hilang—token tetap berada di lingkungan kontainer (`docker|podman inspect`), dan karena sel belum melayani lalu lintas apa pun, `fleet rm --force` yang diikuti pembuatan baru selalu merupakan alternatif yang aman.

### Penyematan berdasarkan digest

Perintah pembuatan dan peningkatan menerima referensi image yang disematkan berdasarkan digest seperti `--image ghcr.io/openclaw/openclaw@sha256:<digest>`. Fleet meneruskan referensi image secara verbatim ke Docker atau Podman, sehingga operator dapat mempertahankan sel pada byte image yang tidak dapat berubah alih-alih tag yang bergerak.

Hasil pembuatan mencakup ID tenant, nama kontainer, port host, token Gateway, dan URL lokal. Bahkan dalam output JSON, perlakukan hasil tersebut sebagai data yang mengandung rahasia karena memuat token.

### Batas disk

`--disk` hanya membatasi lapisan kontainer yang dapat ditulisi. Direktori status dan autentikasi per tenant yang dipasang melalui bind tetap menggunakan penyimpanan host; gunakan kuota proyek sistem berkas host jika direktori tersebut juga memerlukan batas keras.

| Backend runtime/penyimpanan | Dukungan `--disk`                                                             |
| ----------------------- | ---------------------------------------------------------------------------- |
| Docker overlay2 pada XFS  | Memerlukan opsi mount XFS `pquota`.                                      |
| Docker btrfs atau zfs     | Didukung oleh driver penyimpanan.                                             |
| Podman overlay          | Memerlukan penyimpanan pendukung XFS.                                                |
| Backend lainnya          | Pembuatan kontainer gagal dengan galat daemon dan panduan backend Fleet. |

### Kebijakan egress

| Mode       | Docker                                                                                                | Podman                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `bridge`   | Didukung; egress keluar tidak dibatasi secara default.                                                | Didukung; egress keluar tidak dibatasi secara default.                              |
| `internal` | Ditolak karena Docker tidak mempertahankan port Gateway loopback yang dipublikasikan pada jaringan internal. | Didukung; Gateway loopback tetap dipublikasikan sementara egress keluar diblokir. |

Untuk Docker, pertahankan mode bridge dan terapkan kebijakan keluar dengan aturan firewall host seperti rantai `DOCKER-USER`.

## `fleet list`

Cantumkan sel berdasarkan urutan ID tenant:

```bash
openclaw fleet list
openclaw fleet ls
openclaw fleet list --json
```

Tabel tersebut berisi:

| Kolom    | Arti                                                                                                                                                                                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant`  | ID tenant.                                                                                                                                                                                                                                                                            |
| `state`   | Status kontainer langsung dari inspeksi Docker atau Podman. `unknown` berarti runtime tidak tersedia, atau terdapat kontainer dengan nama sel tersebut tetapi label kepemilikan Fleet-nya tidak cocok dengan catatan registri (sinyal benturan atau manipulasi—periksa secara manual sebelum bertindak). |
| `port`    | Port host loopback yang dipetakan ke Gateway sel.                                                                                                                                                                                                                                        |
| `image`   | Image kontainer yang tercatat.                                                                                                                                                                                                                                                             |
| `created` | Waktu pembuatan sel.                                                                                                                                                                                                                                                                   |

Baris registri tetap terlihat ketika Docker atau Podman tidak tersedia; hanya status langsung yang menjadi `unknown`.

## `fleet status`

Periksa satu sel:

```bash
openclaw fleet status acme
openclaw fleet status acme --json
```

Status menggabungkan baris registri fleet, inspeksi kontainer langsung, dan permintaan singkat dengan upaya terbaik ke:

```text
http://127.0.0.1:<host-port>/healthz
```

Hasil pemeriksaan kesehatan adalah `ok`, `failed`, atau `skipped`. `/healthz` membuktikan bahwa Gateway aktif, bukan kesiapan penuh setiap saluran atau plugin yang dikonfigurasi. Probe dilewati ketika tidak ada endpoint lokal yang dapat digunakan untuk diperiksa.

## `fleet logs`

Alirkan log kontainer sel secara langsung ke terminal:

```bash
openclaw fleet logs acme
openclaw fleet logs acme --follow
openclaw fleet logs acme --tail 200
openclaw fleet logs acme --since 10m
```

Fleet memverifikasi label kepemilikan kontainer terdaftar sebelum membaca log apa pun, sehingga menolak kontainer asing yang menggunakan nama sel yang diharapkan. Aliran disematkan ke ID kontainer yang telah diperiksa tersebut, sehingga penggantian serentak tidak dapat mengalihkannya ke generasi yang lebih baru. Tekan Ctrl-C untuk mengakhiri `--follow` tanpa menganggap penghentian oleh operator sebagai kegagalan perintah. Output log disalurkan melalui filter redaksi yang mengganti token Gateway sel saat ini dengan `<redacted>` sebelum apa pun mencapai terminal.

`fleet logs` tidak memiliki mode `--json` karena log kontainer merupakan aliran mentah stdout/stderr. Untuk skrip, batasi output dengan `--tail` dan gunakan pengalihan atau pipeline shell biasa.

## `fleet start`, `fleet stop`, dan `fleet restart`

Kendalikan sel yang ada dengan runtime yang tercatat:

```bash
openclaw fleet start acme
openclaw fleet stop acme
openclaw fleet restart acme
```

Perintah ini beroperasi pada nama kontainer yang terdaftar. Perintah akan gagal jika tenant tidak dikenal atau runtime yang tercatat tidak dapat melakukan operasi tersebut.

## `fleet upgrade`

Tarik ulang image yang tercatat dan ganti kontainer sel:

```bash
openclaw fleet upgrade acme
```

Pindahkan sel ke image lain:

```bash
openclaw fleet upgrade acme --image ghcr.io/openclaw/openclaw:<version>
```

Upgrade menarik image target, memeriksa kontainer yang ada dan jaringan per sel, menghentikan dan menghapus kontainer, lalu membuat ulang dan memulainya. Penggantian mempertahankan port host, direktori data, jaringan bridge per sel, profil runtime, batas sumber daya, kebijakan mulai ulang, lingkungan yang dikelola Fleet, dan nilai yang awalnya diberikan dengan `--env`. State yang di-mount tetap bertahan setelah penggantian kontainer; lingkungan bawaan image dapat berubah sesuai image target.

Penggantian hanya diterapkan setelah Gateway merespons `/healthz` pada port loopback sel, sesuai dengan kontrak kesehatan yang digunakan oleh file compose resmi. Pengganti yang berhenti, mengalami crash loop, atau gagal menjadi sehat dalam waktu sekitar satu menit akan dihapus dan kontainer sebelumnya dipulihkan, sehingga image yang rusak tidak menonaktifkan sel yang berfungsi.

Token Gateway sengaja tidak disimpan dalam registri fleet. Sebelum menghapus kontainer lama, Fleet membaca lingkungannya dan membawa `OPENCLAW_GATEWAY_TOKEN` ke kontainer pengganti. Jangan menghapus kontainer lama secara manual sebelum upgrade jika token tidak tersedia di tempat lain yang Anda kendalikan.

## `fleet backup` dan `fleet restore`

Cadangkan satu sel yang telah dihentikan:

```bash
openclaw fleet stop acme
openclaw fleet backup acme --out ./acme.tgz
```

Pulihkan arsip tersebut ke sel yang terdaftar:

```bash
openclaw fleet restore acme --from ./acme.tgz
```

Perintah ini memerlukan hak istimewa operator host. Arsip berisi state tenant dan rahasia autentikasi, dibuat dengan mode `0600`, dan harus disimpan seperti kredensial. Pencadangan menolak sel yang sedang berjalan agar state SQLite diambil secara konsisten. Pemulihan menolak sel yang sedang berjalan kecuali `--force` diberikan, hanya mengganti state tenant tersebut, merotasi token Gateway, dan mencetak token baru satu kali. Fleet mencadangkan satu tenant pada satu waktu; pencadangan semua tenant merupakan tindakan operator yang terpisah.

Pemulihan memerlukan kontainer yang ada dan telah dihentikan karena profil runtime hasil pemeriksaannya menyediakan batas pengganti, pemetaan pengguna, asal lingkungan, dan image. Jika kontainer yang terdaftar dihapus di luar mekanisme Fleet, pertama-tama jalankan `fleet rm <tenant> --force` tanpa `--purge-data`, buat ulang sel dengan image yang dimaksud dan `--no-start`, lalu coba lagi pemulihan. Penghapusan pertama mempertahankan kedua direktori data tenant.

Kedua perintah menerima `--max-bytes <bytes>` untuk membatasi data file yang diarsipkan atau diekstrak, dan keduanya menerapkan anggaran tetap sebesar satu juta segmen jalur arsip sehingga bom arsip yang hanya berisi metadata tidak dapat menghabiskan inode host dan setiap cadangan yang diterima tetap dapat dipulihkan. Pencadangan menerima `--out <path>` dan kedua perintah mendukung `--json`.

Arsip hanya berisi file biasa dan direktori. Pencadangan tidak pernah mengikuti atau menyimpan tautan simbolis, hard link, soket, atau node perangkat; jumlah yang dilewati dilaporkan dalam hasil. Pemulihan menolak arsip yang berisi jenis entri lainnya. Pohon tautan simbolis yang dapat dibuat ulang seperti `node_modules` ruang kerja harus diinstal ulang di dalam sel setelah pemulihan.

## `fleet doctor`

Audit setiap sel atau satu tenant tanpa mengubah state runtime atau sistem file:

```bash
openclaw fleet doctor
openclaw fleet doctor acme --json
```

Doctor memeriksa lokalitas runtime, label kepemilikan, kesehatan, penguatan keamanan, batas sumber daya, pengikatan port loopback, keberadaan token, kepemilikan jaringan dan mode egress, serta izin direktori state privat. Peringatan menjelaskan sel yang dihentikan atau perbedaan kepemilikan; setiap temuan yang gagal menetapkan kode keluar proses bukan nol.

## `fleet rm`

Hapus sel yang telah dihentikan dari runtime dan registri sambil mempertahankan data tenant:

```bash
openclaw fleet rm acme
```

Kontainer yang sedang berjalan memerlukan `--force`:

```bash
openclaw fleet rm acme --force
```

Hapus juga data sel secara permanen:

```bash
openclaw fleet rm acme --purge-data --force
```

Fleet menghapus kontainer sel sebelum menghapus jaringan bridge khususnya. `--purge-data` memerlukan `--force`. Sebelum penghapusan rekursif, Fleet me-resolve kedua root milik Fleet dan kedua direktori per tenant. Setiap target harus berupa leaf tenant yang persis seperti yang diharapkan, sepenuhnya berada di dalam root-nya, dan bukan tautan simbolis. Pemeriksaan pembatasan ini mencegah jalur registri yang rusak atau tautan simbolis lintas tenant mengarahkan penghapusan ke lokasi lain.

Pembersihan dapat dicoba ulang ketika direktori tenant yang persis diharapkan sudah tidak ada. Hal ini memungkinkan pemanggilan berikutnya menyelesaikan pembersihan setelah kegagalan parsial sistem file tanpa melonggarkan pemeriksaan jalur untuk direktori yang masih ada.

## Tata letak penyimpanan dan kontainer

State sel dan kunci enkripsi profil autentikasi menggunakan jalur host per tenant yang terpisah di bawah direktori state OpenClaw aktif:

```text
<state-dir>/fleet/cells/<tenant>/
<state-dir>/fleet/auth-profile-secrets/<tenant>/
```

Direktori pertama di-mount pada `/home/node/.openclaw`. Direktori kedua di-mount pada `/home/node/.config/openclaw`, sesuai dengan mount kunci enkripsi pada penyiapan Docker resmi. Oleh karena itu, kunci enkripsi tidak terekspos di bawah mount state biasa atau disertakan ketika hanya direktori state sel yang dicadangkan atau dibagikan. Kedua direktori tetap bertahan setelah penghapusan dan upgrade normal; `fleet rm --purge-data --force` menghapus keduanya setelah pemeriksaan pembatasan terpisah.

Sebelum pertama kali dimulai, Fleet menginisialisasi konfigurasi sel dengan `gateway.mode=local`, autentikasi token, pengikatan kontainer LAN, dan origin Control UI untuk port host yang dialokasikan. Nilai token tidak ditulis ke konfigurasi tersebut; nilai tetap berada dalam lingkungan kontainer.

Fleet menyematkan jalur kontainer image resmi dengan nilai lingkungan berikut:

| Variabel                 | Nilai kontainer                      |
| ------------------------ | ------------------------------------ |
| `HOME`                   | `/home/node`                         |
| `OPENCLAW_HOME`          | `/home/node`                         |
| `OPENCLAW_STATE_DIR`     | `/home/node/.openclaw`               |
| `OPENCLAW_CONFIG_PATH`   | `/home/node/.openclaw/openclaw.json` |
| `OPENCLAW_WORKSPACE_DIR` | `/home/node/.openclaw/workspace`     |
| `OPENCLAW_GATEWAY_TOKEN` | Token sel yang dibuat atau diberikan     |

Image resmi secara bawaan menggunakan pengguna non-root `node` dengan UID 1000. Fleet menjaga agar bind mount privat `0700` dapat ditulisi tanpa membuatnya dapat diakses semua pengguna. Docker rootful menjalankan sel dengan UID dan GID non-root pemanggil; Docker rootless menggunakan UID kontainer 0, yang dipetakan ke pengguna host tanpa hak istimewa yang memanggil di dalam namespace pengguna daemon. Podman menggunakan `keep-id` dengan UID dan GID pemanggil. Ketika Fleet sendiri berjalan sebagai root terhadap runtime rootful, Fleet mempertahankan pengguna image dan menetapkan file mount awal ke UID/GID 1000.

Pada host SELinux, mount Docker dan Podman menerima pelabelan ulang privat `:Z`. Jika Anda memulihkan atau memindahkan data sel, pastikan jalur bind mount tetap dapat ditulisi oleh pengguna kontainer efektif. Profil ini ramah rootless, tetapi Docker atau Podman harus sudah dikonfigurasi untuk operasi rootless pada host; Fleet tidak mengubah daemon rootful menjadi rootless.

## Profil keamanan

Fleet menerapkan profil berikut ke setiap sel:

| Kontrol              | Profil yang diterapkan                                      | Alasan                                                                                    |
| -------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Kapabilitas Linux   | `--cap-drop=ALL`                                     | Gateway adalah proses Node.js dan tidak memerlukan kapabilitas Linux tambahan.                |
| Eskalasi hak istimewa | `--security-opt no-new-privileges`                   | Mencegah proses memperoleh hak istimewa melalui biner setuid atau setgid.          |
| Proses init         | `--init`                                             | Mengambil proses turunan yang selesai dan meneruskan sinyal siklus hidup kontainer.                   |
| Batas proses        | `--pids-limit 512` secara bawaan                        | Membatasi fork dan kehabisan proses.                                                    |
| Batas memori         | `--memory 2g` secara bawaan                             | Membatasi penggunaan memori sel.                                                                |
| Batas CPU            | `--cpus 2` secara bawaan                                | Membatasi penggunaan CPU sel.                                                                   |
| Disk lapisan yang dapat ditulisi  | `--disk` opsional                                    | Membatasi lapisan kontainer ketika backend penyimpanan runtime mendukung kuota.           |
| Kebijakan mulai ulang       | `--restart unless-stopped`                           | Memulai ulang sel yang gagal tanpa mengabaikan penghentian yang disengaja.                         |
| Publikasi host      | Hanya `127.0.0.1:<host-port>:18789`                   | Menjauhkan Gateway dari antarmuka host wildcard.                                        |
| Jaringan sel         | Satu bridge atau jaringan internal Podman per sel       | Memisahkan lalu lintas IP kontainer dan secara opsional memblokir egress keluar Podman.           |
| Identitas kontainer   | Pemetaan pengguna yang disesuaikan dengan host                            | Menjaga bind mount privat tetap dapat ditulisi tanpa memberikan akses kepada semua pengguna.                      |
| State persisten     | Mount per sel; tanpa mount state bersama               | Menyimpan konfigurasi tenant, kredensial, sesi, dan ruang kerja dalam pohon data tenant tersebut. |
| Perintah kontainer    | `node dist/index.js gateway --bind lan --port 18789` | Mendengarkan pada jaringan kontainer agar pemetaan port host khusus loopback dapat menjangkaunya.  |

Fleet tidak pernah me-mount `/var/run/docker.sock`, menggunakan `--privileged` atau jaringan host, maupun menambahkan kapabilitas. Bridge per sel merupakan batas pemisahan lintas sel, bukan firewall keluar: sel tetap memiliki egress jaringan yang diperlukan untuk penyedia dan kanal. Letakkan proxy, tunnel SSH, atau konfigurasi tailnet yang sesuai dengan deployment Anda di depan port loopback. `http://127.0.0.1:<port>` hanya dapat dijangkau secara langsung dari host Fleet.

Profil ini memisahkan kontainer tenant, tetapi tidak melindungi tenant dari operator Fleet, administrator runtime kontainer, atau host yang telah disusupi. Lihat [Hosting multi-tenant](/gateway/multi-tenant-hosting) untuk model kepercayaan lengkap dan opsi isolasi yang lebih kuat.

## Penanganan token

Secara bawaan, `fleet create` menghasilkan token Gateway heksadesimal 32 karakter yang acak secara kriptografis dan mencetaknya satu kali dalam hasil pembuatan. Simpan token tersebut dalam pengelola rahasia yang disetujui dan hindari merekam keluaran pembuatan dalam log.

`--gateway-token` menempatkan token khusus dalam argumen proses lokal, yang mungkin tersimpan dalam riwayat shell atau terlihat dalam daftar proses. Utamakan token yang dihasilkan kecuali alur kerja pengelolaan rahasia yang ada memerlukan nilai yang diberikan.

Token dan setiap nilai yang diteruskan dengan `--env` berada dalam lingkungan kontainer. Fleet menuliskannya ke file lingkungan berumur pendek dengan mode `0600`, hanya meneruskan jalur file tersebut ke Docker atau Podman, dan menghapusnya setelah perintah runtime selesai. Nilai yang diketik secara eksplisit dalam `openclaw fleet create --gateway-token ...` atau `--env KEY=VALUE` tetap dapat terlihat dalam argumen proses `openclaw` luar dan riwayat shell.

Nilai lingkungan kontainer tidak disembunyikan dari operator host tepercaya: administrator Docker atau Podman dapat membacanya melalui inspeksi kontainer. Catatan "hanya ditampilkan sekali" milik Fleet menjelaskan keluaran CLI normal, bukan perlindungan terhadap administrator host.

## Terkait

- [Hosting multi-tenant](/gateway/multi-tenant-hosting)
- [Docker](/id/install/docker)
- [Podman](/id/install/podman)
- [Keamanan Gateway](/id/gateway/security)
