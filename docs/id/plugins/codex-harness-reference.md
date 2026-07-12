---
read_when:
    - Anda memerlukan setiap bidang konfigurasi harness Codex
    - Anda mengubah perilaku transportasi, autentikasi, penemuan, atau batas waktu app-server
    - Anda sedang men-debug startup harness Codex, penemuan model, atau isolasi lingkungan
summary: Referensi konfigurasi, autentikasi, penemuan, dan server aplikasi untuk harness Codex
title: Referensi harness Codex
x-i18n:
    generated_at: "2026-07-12T14:25:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb3dcb14d9dbd70a225c13f239369b6d9d2cc0b0681aa29265f528287a6a8e4c
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Referensi ini mencakup konfigurasi terperinci untuk plugin resmi `codex`.
Untuk keputusan penyiapan dan perutean, mulailah dengan
[harness Codex](/id/plugins/codex-harness).

## Permukaan konfigurasi Plugin

Semua pengaturan harness Codex berada di bawah `plugins.entries.codex.config`.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

Kolom tingkat atas:

| Kolom                      | Bawaan                   | Arti                                                                                                                                                          |
| -------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | diaktifkan               | Pengaturan penemuan model untuk `model/list` pada app-server Codex.                                                                                            |
| `appServer`                | app-server stdio terkelola | Pengaturan transportasi, perintah, autentikasi, persetujuan, sandbox, dan batas waktu. Harness biasa secara bawaan menggunakan status yang dicakup per agen.   |
| `codexDynamicToolsLoading` | `"searchable"`           | Gunakan `"direct"` untuk menempatkan alat dinamis OpenClaw langsung dalam konteks alat awal Codex.                                                             |
| `codexDynamicToolsExclude` | `[]`                     | Nama alat dinamis OpenClaw tambahan yang akan dihilangkan dari giliran app-server Codex.                                                                       |
| `codexPlugins`             | dinonaktifkan            | Dukungan plugin/aplikasi native Codex, termasuk akses opsional ke aplikasi akun yang terhubung. Lihat [plugin native Codex](/id/plugins/codex-native-plugins).     |
| `computerUse`              | dinonaktifkan            | Penyiapan Computer Use Codex. Lihat [Computer Use Codex](/id/plugins/codex-computer-use).                                                                          |
| `supervision`              | dinonaktifkan            | Katalog sesi native yang tidak diarsipkan, kelanjutan cabang lokal, dan kebijakan alat agen. Lihat [supervisi Codex](/plugins/codex-supervision).               |

## Supervisi

Supervisi mencantumkan sesi Codex yang tidak diarsipkan dari komputer Gateway dan
Node berpasangan yang telah ikut serta. Aktifkan secara terpisah dari harness agen:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          supervision: {
            enabled: true,
          },
        },
      },
    },
  },
}
```

Kolom `supervision`:

| Kolom                 | Bawaan                  | Arti                                                                                                                                                                                                                                                 |
| --------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                 | Publikasikan katalog sesi lokal dan, pada Gateway, agregasikan katalog Node berpasangan yang telah ikut serta untuk halaman Sesi Codex.                                                                                                             |
| `endpoints`           | titik akhir lokal bawaan | Target titik akhir kompatibilitas dan lanjutan untuk agen supervisi Codex yang dipertahankan serta alat MCP mandiri. Katalog manusia dan alur cabang mengabaikan target ini dan menggunakan App Server supervisi yang ditetapkan dari `appServer`.     |
| `allowRawTranscripts` | `false`                 | Dengan supervisi diaktifkan, izinkan agen otonom atau MCP mandiri membaca transkrip dan kolom daftar yang diturunkan dari transkrip. Pembacaan khusus metadata `codex_threads` tetap tersedia. Tidak mengontrol kelanjutan Control UI terautentikasi.    |
| `allowWriteControls`  | `false`                 | Dengan supervisi diaktifkan, izinkan mutasi fork, penggantian nama, pengarsipan, dan pembatalan pengarsipan `codex_threads`, serta operasi kirim, arahkan, dan interupsi MCP mandiri. Tidak melewati pemeriksaan pengikatan, host, status, atau konfirmasi lainnya. |

Entri titik akhir menerima kolom berikut:

| Kolom          | Berlaku untuk | Arti                                                                      |
| -------------- | ------------- | ------------------------------------------------------------------------- |
| `id`           | semua         | ID titik akhir yang stabil.                                               |
| `label`        | semua         | Label tampilan opsional.                                                  |
| `transport`    | semua         | `"stdio-proxy"` atau `"websocket"`.                                       |
| `command`      | `stdio-proxy` | Perintah App Server opsional.                                             |
| `args`         | `stdio-proxy` | Argumen perintah opsional.                                                |
| `cwd`          | `stdio-proxy` | Direktori kerja proses anak opsional.                                     |
| `url`          | `websocket`   | URL WebSocket atau soket lokal yang didukung dan wajib disediakan.        |
| `authTokenEnv` | `websocket`   | Variabel lingkungan opsional yang nilainya mengautentikasi titik akhir.   |

Halaman **Sesi Codex** menggunakan App Server supervisi milik plugin dan hanya
menampilkan sesi yang tidak diarsipkan. Tanpa pengaturan koneksi `appServer`
secara eksplisit, koneksi tersebut berupa stdio direktori rumah pengguna yang
terkelola. Baris lokal yang tersimpan atau tidak aktif dapat membuat Chat yang
terkunci pada model dengan riwayat pengguna dan asisten terbatas hingga giliran
sumber persisten terminal terakhir. Pengikatan privatnya mempertahankan fork
snapshot, cabang sumber `appServer` kanonis, injeksi riwayat, dan giliran
berikutnya pada koneksi tersebut. Awal kanonis pertama menggunakan pasangan yang
dikembalikan oleh fork. Pelanjutan berikutnya tidak menyertakan penggantian model
dan penyedia OpenClaw agar Codex memulihkan pasangan persisten utas kanonis;
perubahan native terpisah dapat memperbarui pasangan tersebut, tetapi model luar
dan rantai fallback tidak pernah menggantikannya. Baris yang tersimpan dan tidak
aktif dapat diarsipkan setelah konfirmasi bahwa tidak ada pelaksana lain, kecuali
pengikatan OpenClaw aktif lain memiliki target yang sama persis atau salah satu
turunan yang dibuatnya dan belum diarsipkan. OpenClaw mengikuti paginasi turunan
Codex dan secara tertutup menggagalkan operasi jika terjadi kesalahan enumerasi,
siklus, atau batas keselamatan habis. Konfirmasi tetap mencakup klien native yang
tidak dikenal dan kondisi balapan antara status dan pengarsipan. Chat terkunci
pada model yang disupervisi tidak dapat dihapus selama melindungi pengikatan
native. Sumber aktif tidak dapat membuat cabang atau diarsipkan, tetapi Chat
tersupervisi yang sudah ada tetap dapat dibuka. Setiap baris Node berpasangan
tetap hanya-baca; transportasi Node belum menyediakan siklus hidup streaming
yang diperlukan oleh harness.

`appServer.homeScope: "user"` saja mengubah direktori rumah Codex yang digunakan
proses harness terkelola; pengaturan ini tidak memublikasikan katalog armada.
Mengaktifkan supervisi tidak mengubah bawaan harness. Sebagai gantinya, koneksi
supervisi terpisah secara bawaan menggunakan stdio direktori rumah pengguna
terkelola saat tidak ada pengaturan koneksi `appServer` eksplisit. Pengaturan
eksplisit dipatuhi untuk koneksi tersebut. Pengikatan tersupervisi yang tertunda
dan sudah diterapkan mempertahankan koneksi tersebut untuk setiap giliran;
supervisi yang dinonaktifkan atau penyimpangan koneksi/siklus hidup akan gagal
secara tertutup alih-alih beralih ke harness direktori rumah agen. Koneksi bawaan
berbagi sesi tersimpan dengan klien native Codex, bukan status aktivitas lokal
prosesnya.

Pengaturan lama `plugins.entries.codex-supervisor` telah dihentikan. Jalankan
`openclaw doctor --fix` untuk memigrasikan entri lama, definisi titik akhir,
flag kebijakan, dan referensi izinkan/tolak plugin ke blok ini. Nilai kanonis
eksplisit `codex.config.supervision` akan diutamakan jika terjadi konflik.

## Transportasi app-server

Untuk giliran harness biasa, OpenClaw memulai biner Codex terkelola yang
disertakan bersama plugin resmi (saat ini `@openai/codex` `0.144.1`):

```bash
codex app-server --listen stdio://
```

Hal ini menjaga versi app-server tetap terikat dengan plugin resmi `codex`,
bukan dengan CLI Codex terpisah yang kebetulan terinstal secara lokal. Tetapkan
`appServer.command` hanya jika Anda memang sengaja ingin menggunakan berkas
eksekutabel yang berbeda. Giliran terkelola biasa dengan direktori rumah agen
terisolasi bawaan lebih memilih paket yang disematkan ini, bahkan ketika bundel
desktop macOS terinstal. Ketika
[Computer Use](/id/plugins/codex-computer-use) diaktifkan, atau ketika `homeScope`
bernilai `"user"` dan dapat memuat status Computer Use native, proses mulai
terkelola akan lebih memilih biner aplikasi desktop yang memiliki izin macOS
yang diperlukan. Aturan yang sama untuk memprioritaskan desktop berlaku ketika
konfigurasi Codex efektif milik direktori rumah agen terisolasi mengaktifkan
Computer Use native. Jika tidak ada bundel aplikasi desktop yang terinstal,
OpenClaw beralih ke biner paket yang disematkan.

Penyerahan berkas eksekutabel dan pemagaran konfigurasi native mengoordinasikan
klien dalam satu proses Gateway yang berjalan. Mulai ulang Gateway setelah
proses lain mengubah konfigurasi plugin native Codex.

Supervisi menetapkan koneksi terpisah. Tanpa pengaturan koneksi `appServer`
eksplisit, supervisi menggunakan stdio terkelola dengan `homeScope: "user"`;
harness biasa tetap menggunakan stdio terkelola dengan `homeScope: "agent"`.
Pengaturan koneksi eksplisit dipatuhi oleh kedua jalur. Tetapkan
`homeScope: "user"` secara eksplisit ketika harness biasa harus berbagi
`$CODEX_HOME` (atau `~/.codex`) dengan klien native. Pengikatan tersupervisi
privat menggunakan koneksi supervisi terlepas dari bawaan harness biasa. Proses
App Server independen mempertahankan status langsung dan status persetujuan yang
terpisah.

Untuk app-server yang sudah berjalan, gunakan transportasi WebSocket:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Kolom `appServer`:

| Bidang                                        | Bawaan                                                 | Arti                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` menjalankan Codex; `"unix"` yang ditentukan secara eksplisit terhubung ke soket kontrol lokal; `"websocket"` terhubung ke `url`.                                                                                                                                                                                                                                                     |
| `homeScope`                                   | `"agent"`                                              | `"agent"` mengisolasi status harness biasa per agen OpenClaw. `"user"` adalah keikutsertaan eksplisit yang menggunakan bersama `$CODEX_HOME` atau `~/.codex` native, menggunakan autentikasi native, dan mengaktifkan pengelolaan utas khusus pemilik. Cakupan pengguna mendukung transportasi stdio lokal atau Unix. Untuk koneksi pengawasan terpisah, nilai yang tidak ditetapkan ditetapkan sebagai `"user"` untuk stdio atau Unix dan `"agent"` untuk WebSocket. |
| `command`                                     | biner Codex terkelola                                  | Berkas yang dapat dieksekusi untuk transportasi stdio. Biarkan tidak ditetapkan untuk menggunakan biner terkelola.                                                                                                                                                                                                                                                                             |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumen untuk transportasi stdio.                                                                                                                                                                                                                                                                                                                                                              |
| `url`                                         | tidak ditetapkan                                       | URL App Server WebSocket atau URL `unix://`. Jalur Unix eksplisit yang kosong memilih soket kontrol kanonis di direktori beranda pengguna.                                                                                                                                                                                                                                                     |
| `authToken`                                   | tidak ditetapkan                                       | Token bearer untuk transportasi WebSocket. Menerima string literal atau SecretInput seperti `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                      |
| `headers`                                     | `{}`                                                   | Header WebSocket tambahan. Nilai header menerima string literal atau nilai SecretInput, misalnya `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                              |
| `clearEnv`                                    | `[]`                                                   | Nama variabel lingkungan tambahan yang dihapus dari proses app-server stdio yang dijalankan setelah OpenClaw membangun lingkungan warisannya.                                                                                                                                                                                                                                                  |
| `remoteWorkspaceRoot`                         | tidak ditetapkan                                       | Root ruang kerja app-server Codex jarak jauh. Jika ditetapkan, OpenClaw menyimpulkan root ruang kerja lokal dari ruang kerja OpenClaw yang telah diresolusi, mempertahankan akhiran cwd saat ini di bawah root jarak jauh ini, dan hanya mengirim cwd app-server akhir ke Codex. Jika cwd berada di luar root ruang kerja OpenClaw yang telah diresolusi, OpenClaw gagal secara tertutup alih-alih mengirim jalur lokal Gateway ke app-server jarak jauh. |
| `requestTimeoutMs`                            | `60000`                                                | Batas waktu untuk panggilan bidang kontrol app-server.                                                                                                                                                                                                                                                                                                                                         |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Jendela hening setelah Codex menerima giliran atau setelah permintaan app-server yang dicakup oleh giliran sementara OpenClaw menunggu `turn/completed`.                                                                                                                                                                                                                                       |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Pengaman progres dan waktu menganggur penyelesaian yang digunakan setelah penyerahan alat, penyelesaian alat native, progres mentah asisten setelah alat, penyelesaian penalaran mentah, atau progres penalaran sementara OpenClaw menunggu `turn/completed`. Gunakan ini untuk beban kerja tepercaya atau berat ketika sintesis setelah alat secara wajar dapat tetap hening lebih lama daripada batas waktu rilis akhir asisten. |
| `mode`                                        | `"yolo"` kecuali persyaratan Codex lokal melarang YOLO | Preset untuk eksekusi YOLO atau yang ditinjau penjaga.                                                                                                                                                                                                                                                                                                                                         |
| `approvalPolicy`                              | `"never"` atau kebijakan persetujuan penjaga yang diizinkan | Kebijakan persetujuan native Codex yang dikirim saat memulai utas, melanjutkan utas, dan memulai giliran.                                                                                                                                                                                                                                                                                  |
| `sandbox`                                     | `"danger-full-access"` atau sandbox penjaga yang diizinkan | Mode sandbox native Codex yang dikirim saat memulai dan melanjutkan utas. Sandbox OpenClaw yang aktif mempersempit giliran `danger-full-access` menjadi `workspace-write` Codex; flag jaringan giliran mengikuti akses keluar sandbox OpenClaw.                                                                                                                                             |
| `approvalsReviewer`                           | `"user"` atau peninjau penjaga yang diizinkan          | Gunakan `"auto_review"` agar Codex meninjau permintaan persetujuan native jika diizinkan.                                                                                                                                                                                                                                                                                                      |
| `defaultWorkspaceDir`                         | direktori proses saat ini                              | Ruang kerja yang digunakan oleh `/codex bind` ketika `--cwd` tidak disertakan.                                                                                                                                                                                                                                                                                                                 |
| `serviceTier`                                 | tidak ditetapkan                                       | Tingkat layanan app-server Codex opsional. `"priority"` mengaktifkan perutean mode cepat, `"flex"` meminta pemrosesan fleksibel, dan `null` menghapus penggantian. `"fast"` warisan diterima sebagai `"priority"`.                                                                                                                                                                             |
| `networkProxy`                                | dinonaktifkan                                          | Ikut menggunakan jaringan profil izin Codex untuk perintah app-server. OpenClaw mendefinisikan konfigurasi `permissions.<profile>.network` yang dipilih dan memilihnya dengan `default_permissions`, alih-alih mengirim `sandbox`.                                                                                                                                                              |
| `experimental.sandboxExecServer`              | `false`                                                | Keikutsertaan pratinjau yang mendaftarkan lingkungan Codex berbasis sandbox OpenClaw pada app-server Codex yang didukung agar eksekusi native Codex dapat berjalan di dalam sandbox OpenClaw yang aktif.                                                                                                                                                                                        |

`appServer.networkProxy` bersifat eksplisit karena mengubah kontrak sandbox
Codex. Saat diaktifkan, OpenClaw juga menetapkan `features.network_proxy.enabled` dan
`default_permissions` dalam konfigurasi utas Codex agar profil izin yang
dihasilkan dapat memulai jaringan yang dikelola Codex. Secara bawaan, OpenClaw
menghasilkan nama profil `openclaw-network-<fingerprint>` yang tahan benturan dari isi
profil; gunakan `profileName` hanya ketika nama lokal yang stabil
diperlukan.

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

Jika runtime app-server normal akan menggunakan `danger-full-access`, mengaktifkan
`networkProxy` akan menggunakan akses sistem berkas bergaya ruang kerja untuk profil
izin yang dihasilkan. Penegakan jaringan yang dikelola Codex menggunakan jaringan
dalam sandbox, sehingga profil akses penuh tidak akan melindungi lalu lintas keluar.

Plugin memblokir handshake app-server lama atau tanpa versi: app-server Codex
harus melaporkan versi stabil `0.143.0` atau yang lebih baru.

OpenClaw memperlakukan URL app-server WebSocket non-loopback sebagai remote dan mewajibkan
autentikasi WebSocket yang memuat identitas melalui `appServer.authToken` atau header
`Authorization`. `appServer.authToken` dan setiap nilai `appServer.headers.*`
dapat berupa SecretInput; runtime rahasia menyelesaikan SecretRef dan bentuk singkat
variabel lingkungan sebelum OpenClaw membuat opsi awal app-server, dan SecretRef
terstruktur yang tidak terselesaikan akan gagal sebelum token atau header apa pun dikirim.
Ketika plugin native Codex dikonfigurasi, OpenClaw menggunakan bidang kontrol plugin
app-server yang terhubung untuk memasang atau memperbarui plugin tersebut, lalu memperbarui
inventaris aplikasi agar aplikasi milik plugin terlihat oleh utas Codex. `app/list`
tetap menjadi sumber inventaris dan metadata yang otoritatif, tetapi kebijakan OpenClaw
menentukan apakah `thread/start` mengirim `config.apps[appId].enabled = true` untuk
aplikasi terdaftar yang dapat diakses meskipun Codex saat ini menandainya sebagai
dinonaktifkan. ID aplikasi yang tidak dikenal atau tidak ada tetap gagal secara tertutup;
jalur ini hanya mengaktifkan plugin lokapasar melalui `plugin/install` dan memperbarui
inventaris. Hubungkan OpenClaw hanya ke app-server remote yang dipercaya untuk menerima
pemasangan plugin yang dikelola OpenClaw dan pembaruan inventaris aplikasi.

## Mode persetujuan dan sandbox

Sesi app-server stdio lokal secara default menggunakan mode YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Postur operator lokal tepercaya ini memungkinkan
giliran OpenClaw tanpa pengawasan dan heartbeat tetap berjalan tanpa permintaan persetujuan
native yang tidak dapat dijawab karena tidak ada orang yang tersedia.

Jika berkas persyaratan sistem lokal Codex melarang nilai persetujuan YOLO, peninjau,
atau sandbox implisit, OpenClaw akan memperlakukan default implisit sebagai guardian
dan memilih izin guardian yang diizinkan. `tools.exec.mode: "auto"`
juga memaksa persetujuan Codex yang ditinjau guardian dan tidak mempertahankan
penggantian lama yang tidak aman berupa `approvalPolicy: "never"` atau
`sandbox: "danger-full-access"`; tetapkan `tools.exec.mode: "full"` untuk postur
tanpa persetujuan yang disengaja. Entri `[[remote_sandbox_config]]` yang mencocokkan
nama host dalam berkas persyaratan yang sama dipatuhi dalam keputusan default sandbox.

Tetapkan `appServer.mode: "guardian"` untuk persetujuan Codex yang ditinjau guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Preset `guardian` diperluas menjadi `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, dan `sandbox: "workspace-write"` ketika nilai-nilai
tersebut diizinkan. Setiap bidang kebijakan dapat menggantikan `mode`. Nilai peninjau
lama `guardian_subagent` masih diterima sebagai alias kompatibilitas,
tetapi konfigurasi baru sebaiknya menggunakan `auto_review`.

Ketika sandbox OpenClaw aktif, proses app-server Codex lokal tetap
berjalan pada host Gateway. Karena itu, OpenClaw menonaktifkan Code Mode native Codex,
server MCP pengguna, dan eksekusi Plugin yang didukung aplikasi untuk giliran tersebut,
alih-alih menganggap sandbox sisi host Codex setara dengan backend sandbox OpenClaw.
Akses shell diekspos melalui alat dinamis yang didukung sandbox OpenClaw,
seperti `sandbox_exec` dan `sandbox_process`, ketika alat exec/proses normal
tersedia.

<Note>
Pada host sandbox OpenClaw berbasis Docker (`agents.defaults.sandbox.mode` ditetapkan
ke backend Docker), `openclaw doctor` memeriksa apakah host mengizinkan namespace
pengguna tanpa hak istimewa (dan, ketika keluarnya jaringan sandbox Docker dinonaktifkan,
namespace jaringan) yang diperlukan `bwrap` Codex bertingkat untuk eksekusi shell
`workspace-write` di dalam kontainer sandbox. Pemeriksaan yang gagal biasanya muncul
sebagai `bwrap: setting up uid map: Permission denied` atau
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` pada
host Ubuntu/AppArmor. Perbaiki kebijakan namespace host yang dilaporkan untuk pengguna
layanan OpenClaw dan mulai ulang gateway; utamakan profil AppArmor yang dibatasi untuk
proses layanan daripada fallback tingkat host
`kernel.apparmor_restrict_unprivileged_userns=0`, dan jangan berikan
hak istimewa kontainer Docker yang lebih luas hanya untuk memenuhi kebutuhan `bwrap`
bertingkat.
</Note>

## Eksekusi native dalam sandbox

Default stabilnya adalah gagal secara tertutup: sandbox OpenClaw yang aktif menonaktifkan
permukaan eksekusi native Codex yang jika tidak dinonaktifkan akan berjalan dari host
app-server Codex. Gunakan `appServer.experimental.sandboxExecServer: true` hanya jika Anda
ingin mencoba dukungan lingkungan remote Codex dengan backend sandbox OpenClaw.
Jalur pratinjau ini bekerja dengan setiap versi app-server Codex yang didukung.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            experimental: {
              sandboxExecServer: true,
            },
          },
        },
      },
    },
  },
}
```

Ketika tanda tersebut aktif dan sesi OpenClaw saat ini berada dalam sandbox, OpenClaw
memulai exec-server local loopback yang didukung sandbox aktif, mendaftarkannya
ke app-server Codex, lalu memulai utas dan giliran Codex dengan lingkungan
milik OpenClaw tersebut. Jika app-server tidak dapat mendaftarkan lingkungan,
proses akan gagal secara tertutup, bukan diam-diam kembali ke eksekusi host.

Jalur pratinjau ini hanya untuk penggunaan lokal. App-server WebSocket remote tidak dapat
menjangkau exec-server loopback kecuali berjalan pada host yang sama, sehingga OpenClaw
menolak kombinasi tersebut.

## Autentikasi dan isolasi lingkungan

Dalam direktori beranda per agen default, autentikasi dipilih dengan urutan berikut:

1. Profil autentikasi Codex OpenClaw yang eksplisit untuk agen.
2. Akun app-server yang sudah ada dalam direktori beranda Codex agen tersebut.
3. Hanya untuk peluncuran app-server stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, ketika tidak ada akun app-server dan autentikasi OpenAI
   masih diperlukan.

Ketika OpenClaw melihat profil autentikasi Codex bergaya langganan ChatGPT (jenis
kredensial OAuth atau token), OpenClaw menghapus `CODEX_API_KEY` dan `OPENAI_API_KEY`
dari proses turunan Codex yang dijalankan. Hal ini menjaga kunci API tingkat Gateway
tetap tersedia untuk embedding atau model OpenAI langsung tanpa secara tidak sengaja
menagihkan giliran app-server native Codex melalui API.

Profil kunci API Codex eksplisit dan fallback kunci lingkungan stdio lokal menggunakan
login app-server, bukan lingkungan proses turunan yang diwariskan. Koneksi app-server
WebSocket tidak menerima fallback kunci API lingkungan Gateway; gunakan profil autentikasi
eksplisit atau akun milik app-server remote.

Peluncuran app-server stdio secara default mewarisi lingkungan proses OpenClaw.
OpenClaw memiliki jembatan akun app-server Codex dan menetapkan `CODEX_HOME` ke
direktori per agen di bawah status OpenClaw agen tersebut. Ini menjaga konfigurasi,
akun, tembolok/data plugin, dan status utas Codex tetap terbatas pada agen OpenClaw,
alih-alih bocor dari direktori beranda `~/.codex` pribadi milik operator.

Tetapkan `appServer.homeScope: "user"` untuk berbagi status native Codex dengan Codex
Desktop dan CLI. Mode direktori beranda pengguna lokal ini mendukung stdio terkelola dan
transport Unix eksplisit. Mode ini menggunakan `$CODEX_HOME` jika ditetapkan dan
`~/.codex` jika tidak, termasuk autentikasi native, konfigurasi, plugin, dan utas.
OpenClaw melewati jembatan profil autentikasinya untuk app-server. Giliran pemilik
terverifikasi dapat menggunakan `codex_threads` untuk mencantumkan (dengan filter
`search` opsional), membaca, membuat fork, mengganti nama, mengarsipkan, dan membatalkan
pengarsipan utas tersebut. Buat fork utas sebelum melanjutkannya di OpenClaw; proses
Codex independen tidak mengoordinasikan penulis serentak untuk utas yang sama.

Pilihan eksplisit `homeScope` tersebut berlaku untuk sesi harness biasa. Chat yang dibuat
melalui Codex Sessions menggunakan koneksi supervisi privatnya, yang mempertahankan
konfigurasi autentikasi dan penyedia koneksi native untuk cabang kanonis dan pelanjutan
mendatang.

Dalam Chat dengan model terkunci yang disupervisi, `codex_threads` tidak dapat melampirkan
fork lain atau mengarsipkan utas native yang terikat ke Chat. Pencantuman dan pembacaan
metadata saja tetap tersedia. Pembacaan transkrip mentah memerlukan
`allowRawTranscripts`; ketika dinonaktifkan, pencarian daftar juga ditolak karena
pencarian native dapat mencocokkan pratinjau transkrip. Mengganti nama, membatalkan
pengarsipan, membuat fork terpisah, dan mengarsipkan utas yang tidak terkait serta tidak
dimiliki Chat OpenClaw lain memerlukan `allowWriteControls`. Tidak satu pun opsi tersebut
dapat melewati pengikatan yang terkunci.

OpenClaw tidak menulis ulang `HOME` untuk peluncuran app-server lokal normal.
Subproses yang dijalankan Codex seperti `openclaw`, `gh`, `git`, CLI cloud, dan perintah
shell melihat direktori beranda proses normal dan dapat menemukan konfigurasi serta
token di direktori beranda pengguna. Codex juga dapat menemukan `$HOME/.agents/skills`
dan `$HOME/.agents/plugins/marketplace.json`; penemuan `.agents` tersebut
sengaja dibagikan dengan direktori beranda operator dan terpisah dari status
`~/.codex` yang terisolasi.

Dalam cakupan agen default, Plugin OpenClaw dan snapshot Skills OpenClaw
tetap mengalir melalui registri Plugin dan pemuat Skills milik OpenClaw sendiri;
aset pribadi Codex `~/.codex` tidak ikut mengalir. Jika Anda memiliki Skills atau
plugin CLI Codex yang berguna dari direktori beranda Codex dan ingin menjadikannya
bagian dari agen OpenClaw yang terisolasi, inventarisasikan secara eksplisit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Jika deployment memerlukan isolasi lingkungan tambahan, tambahkan variabel tersebut
ke `appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` hanya memengaruhi proses turunan app-server Codex yang dijalankan.
OpenClaw menghapus `CODEX_HOME` dan `HOME` dari daftar ini selama normalisasi peluncuran
lokal: `CODEX_HOME` tetap diarahkan ke cakupan agen atau pengguna yang dipilih,
dan `HOME` tetap diwariskan agar subproses dapat menggunakan status direktori beranda
pengguna normal.

## Alat dinamis

Alat dinamis Codex secara default menggunakan pemuatan `searchable`, diekspos di bawah
namespace `openclaw` dengan `deferLoading: true`. OpenClaw tidak mengekspos
alat dinamis yang menduplikasi operasi ruang kerja native Codex atau permukaan
pencarian alat milik Codex sendiri:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`
- `tool_call`
- `tool_describe`
- `tool_search`
- `tool_search_code`

Sebagian besar alat integrasi OpenClaw yang tersisa, seperti perpesanan, media, cron,
peramban, node, gateway, `heartbeat_respond`, dan `web_search`, tersedia
melalui pencarian alat Codex dalam namespace tersebut. Hal ini menjaga konteks model
awal tetap lebih kecil. Sejumlah kecil alat tetap dapat dipanggil secara langsung
terlepas dari `codexDynamicToolsLoading`, karena pencarian alat Codex mungkin tidak tersedia
atau hanya menghasilkan himpunan konektor: `agents_list`, `sessions_spawn`, dan
`sessions_yield`. Instruksi pengembang tetap mengarahkan subagen Codex normal
ke `spawn_agent` native untuk pekerjaan subagen native Codex, sedangkan
`sessions_spawn` tetap tersedia untuk delegasi OpenClaw atau ACP yang eksplisit.
Balasan sumber yang hanya menggunakan alat pesan juga tetap langsung karena itu merupakan
kontrak kontrol giliran.

Alat yang ditandai `catalogMode: "direct-only"`, termasuk alat `computer` OpenClaw,
dikelompokkan di bawah `openclaw_direct`. OpenClaw menambahkan namespace tersebut ke
daftar `code_mode.direct_only_tool_namespaces` Codex tanpa mengganti entri yang
disediakan operator. Karena itu, Codex mengekspos alat tersebut sebagai
`DirectModelOnly` dalam utas normal dan utas khusus mode kode, alih-alih merutekannya
melalui panggilan `tools.*` Code Mode bertingkat. Batas ini diperlukan untuk hasil
yang memuat gambar: serialisasi Code Mode bertingkat meratakan keluaran gambar menjadi
teks, yang akan membuang tangkapan layar yang diperlukan untuk tindakan komputer
berikutnya.

Tetapkan `codexDynamicToolsLoading: "direct"` hanya saat menghubungkan ke app-server
Codex khusus yang tidak dapat mencari alat dinamis tertunda atau saat men-debug
payload alat lengkap.

## Batas waktu

Pemanggilan alat dinamis milik OpenClaw dibatasi secara independen dari
`appServer.requestTimeoutMs`. Setiap permintaan Codex `item/tool/call` menggunakan
batas waktu pertama yang tersedia dalam urutan berikut:

- Argumen `timeoutMs` per pemanggilan yang bernilai positif.
- Untuk `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Untuk `image_generate` tanpa batas waktu yang dikonfigurasi, nilai bawaan
  pembuatan gambar sebesar 120 detik.
- Untuk alat `image` pemahaman media, `tools.media.image.timeoutSeconds`
  dikonversi menjadi milidetik, atau nilai bawaan media sebesar 60 detik. Untuk
  pemahaman gambar, ini berlaku pada permintaan itu sendiri dan tidak dikurangi
  oleh pekerjaan persiapan sebelumnya.
- Untuk alat `message`, nilai bawaan tetap sebesar 120 detik.
- Nilai bawaan alat dinamis sebesar 90 detik.

Pengawas ini merupakan anggaran terluar `item/tool/call` dinamis. Batas waktu
permintaan khusus penyedia berjalan di dalam pemanggilan tersebut dan tetap
mempertahankan semantik batas waktunya sendiri. Anggaran alat dinamis dibatasi
hingga 600000 md. Saat batas waktu tercapai, OpenClaw membatalkan sinyal alat
jika didukung dan mengembalikan respons alat dinamis yang gagal kepada Codex
agar giliran dapat dilanjutkan, alih-alih membiarkan sesi tetap dalam status
`processing`.

Setelah Codex menerima suatu giliran, dan setelah OpenClaw merespons permintaan
server aplikasi yang cakupannya terbatas pada giliran, harness mengharapkan
Codex membuat kemajuan pada giliran saat ini dan pada akhirnya menyelesaikan
giliran native dengan `turn/completed`. Jika server aplikasi tidak memberikan
aktivitas selama `appServer.turnCompletionIdleTimeoutMs`, OpenClaw sebisa
mungkin menginterupsi giliran Codex, mencatat batas waktu diagnostik, dan
membebaskan jalur sesi OpenClaw agar pesan obrolan lanjutan tidak mengantre di
belakang giliran native yang sudah usang.

Sebagian besar notifikasi nonterminal untuk giliran yang sama menonaktifkan
pengawas singkat tersebut karena Codex telah membuktikan bahwa giliran masih
aktif. Penyerahan alat menggunakan anggaran tidak aktif pasca-alat yang lebih
panjang: setelah OpenClaw mengembalikan respons `item/tool/call`, setelah item
alat native seperti `commandExecution` selesai, setelah penyelesaian mentah
`custom_tool_call_output`, serta setelah kemajuan mentah asisten pasca-alat,
penyelesaian penalaran mentah, atau kemajuan penalaran. Pelindung menggunakan
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` jika dikonfigurasi dan
jika tidak, nilai bawaannya adalah lima menit. Anggaran pasca-alat yang sama
juga memperpanjang pengawas kemajuan untuk jendela sintesis senyap sebelum
Codex memancarkan peristiwa berikutnya pada giliran saat ini. Penyelesaian
penalaran, penyelesaian `agentMessage` komentar, serta penalaran mentah
pra-alat atau kemajuan asisten dapat diikuti oleh balasan akhir otomatis,
sehingga semuanya menggunakan pelindung balasan pasca-kemajuan alih-alih
langsung membebaskan jalur sesi. Hanya item `agentMessage` akhir/nonkomentar
yang selesai dan penyelesaian mentah asisten pra-alat yang mengaktifkan
pelepasan keluaran asisten: jika Codex kemudian tidak memberikan aktivitas
tanpa `turn/completed`, OpenClaw sebisa mungkin menginterupsi giliran native dan
membebaskan jalur sesi. Kegagalan server aplikasi stdio yang aman untuk diputar
ulang, termasuk batas waktu tidak aktif penyelesaian giliran tanpa bukti
asisten, alat, item aktif, atau efek samping, dicoba ulang satu kali melalui
percobaan server aplikasi baru. Batas waktu yang tidak aman tetap menghentikan
klien server aplikasi yang macet dan membebaskan jalur sesi OpenClaw. Batas
waktu tersebut juga menghapus pengikatan utas native yang sudah usang,
alih-alih memutarnya ulang secara otomatis. Batas waktu pengawasan penyelesaian
menampilkan teks batas waktu khusus Codex: kasus yang aman untuk diputar ulang
menyatakan bahwa respons mungkin tidak lengkap, sedangkan kasus yang tidak
aman meminta pengguna memverifikasi keadaan saat ini sebelum mencoba lagi.
Diagnostik batas waktu publik menyertakan bidang struktural seperti metode
notifikasi server aplikasi terakhir, id/jenis/peran item respons mentah
asisten, jumlah permintaan/item aktif, dan status pengawasan yang aktif. Jika
notifikasi terakhir merupakan item respons mentah asisten, diagnostik juga
menyertakan pratinjau teks asisten yang dibatasi. Diagnostik tersebut tidak
menyertakan isi mentah prompt atau alat.

## Penemuan model

Secara bawaan, Plugin Codex meminta model yang tersedia kepada server aplikasi.
Ketersediaan model dikelola oleh server aplikasi Codex, sehingga daftar dapat
berubah saat OpenClaw meningkatkan versi bawaan `@openai/codex` atau saat suatu
deployment mengarahkan `appServer.command` ke biner Codex yang berbeda.
Ketersediaan juga dapat dibatasi berdasarkan akun. Gunakan `/codex models` pada
Gateway yang sedang berjalan untuk melihat katalog langsung bagi harness dan
akun tersebut.

Jika penemuan gagal atau mencapai batas waktu, OpenClaw menggunakan katalog
cadangan bawaan:

| ID model       | Nama tampilan | Tingkat penalaran         |
| -------------- | ------------- | ------------------------- |
| `gpt-5.5`      | gpt-5.5       | rendah, sedang, tinggi, xhigh |
| `gpt-5.4-mini` | GPT-5.4-Mini  | rendah, sedang, tinggi, xhigh |

<Note>
Harness bawaan saat ini adalah `@openai/codex` `0.144.1`. Pemeriksaan
`model/list` terhadap server aplikasi bawaan tersebut menghasilkan baris
pemilih publik berikut:

| ID model        | Modalitas masukan | Tingkat penalaran                         |
| --------------- | ----------------- | ----------------------------------------- |
| `gpt-5.6-sol`   | teks, gambar      | rendah, sedang, tinggi, xhigh, max, ultra |
| `gpt-5.6-terra` | teks, gambar      | rendah, sedang, tinggi, xhigh, max, ultra |
| `gpt-5.6-luna`  | teks, gambar      | rendah, sedang, tinggi, xhigh, max        |
| `gpt-5.5`       | teks, gambar      | rendah, sedang, tinggi, xhigh             |
| `gpt-5.4`       | teks, gambar      | rendah, sedang, tinggi, xhigh             |
| `gpt-5.4-mini`  | teks, gambar      | rendah, sedang, tinggi, xhigh             |
| `gpt-5.2`       | teks, gambar      | rendah, sedang, tinggi, xhigh             |

Katalog server aplikasi dapat melaporkan `ultra`; kontrol penalaran OpenClaw
saat ini menyediakan tingkat hingga `max`.

Baris pemilih langsung dibatasi berdasarkan akun dan dapat berubah sesuai
akun, katalog Codex, atau versi bawaan; jalankan `/codex models` untuk daftar
saat ini alih-alih mengandalkan tabel pada suatu titik waktu. Model tersembunyi
juga dapat muncul dalam katalog server aplikasi untuk alur internal atau
khusus tanpa menjadi pilihan pemilih model yang normal.
</Note>

Sesuaikan penemuan melalui `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Nonaktifkan penemuan jika Anda ingin proses awal menghindari pemeriksaan Codex
dan hanya menggunakan katalog cadangan:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Berkas bootstrap ruang kerja

Codex menangani `AGENTS.md` sendiri melalui penemuan dokumen proyek native.
OpenClaw tidak menulis berkas dokumen proyek Codex sintetis atau bergantung
pada nama berkas cadangan Codex untuk berkas persona, karena cadangan Codex
hanya berlaku jika `AGENTS.md` tidak tersedia.

Untuk kesetaraan ruang kerja OpenClaw, harness Codex meneruskan berkas
bootstrap lainnya sebagai instruksi pengembang, tetapi tidak secara identik:

- `TOOLS.md` diteruskan sebagai instruksi pengembang Codex yang **diwarisi**,
  sehingga subagen Codex native yang dibuat selama giliran juga dapat
  melihatnya.
- `SOUL.md`, `IDENTITY.md`, dan `USER.md` diteruskan sebagai instruksi
  kolaborasi **bercakupan giliran**. Subagen Codex native tidak mewarisinya,
  sehingga giliran subagen tidak mengambil persona agen induk dan profil
  pengguna.
- Daftar ringkas Skills OpenClaw yang dimuat juga diteruskan sebagai instruksi
  pengembang kolaborasi bercakupan giliran, sehingga subagen Codex native juga
  tidak mewarisinya.
- Isi `HEARTBEAT.md` tidak disuntikkan; giliran Heartbeat mendapatkan penunjuk
  mode kolaborasi untuk membaca berkas tersebut jika tersedia dan tidak
  kosong.
- Isi `MEMORY.md` dari ruang kerja agen yang dikonfigurasi tidak ditempelkan ke
  masukan giliran Codex native jika alat memori tersedia untuk ruang kerja
  tersebut; jika berkas tersedia, harness menambahkan penunjuk memori ruang
  kerja kecil ke instruksi pengembang kolaborasi bercakupan giliran dan Codex
  harus menggunakan `memory_search` atau `memory_get` jika memori persisten
  relevan. Jika alat dinonaktifkan, pencarian memori tidak tersedia, atau ruang
  kerja aktif berbeda dari ruang kerja memori agen, `MEMORY.md` menggunakan
  jalur konteks giliran terbatas yang normal.
- `BOOTSTRAP.md`, jika tersedia, diteruskan sebagai konteks referensi masukan
  giliran OpenClaw.

## Penimpaan lingkungan

Penimpaan lingkungan tetap tersedia untuk pengujian lokal:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` melewati biner terkelola jika
`appServer.command` tidak ditetapkan.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` telah dihapus. Gunakan
`plugins.entries.codex.config.appServer.mode: "guardian"` sebagai gantinya,
atau `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` untuk pengujian lokal satu kali.
Konfigurasi lebih disarankan untuk deployment yang dapat diulang karena
menjaga perilaku Plugin dalam berkas yang ditinjau yang sama dengan seluruh
penyiapan harness Codex lainnya.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [Supervisi Codex](/plugins/codex-supervision)
- [Plugin Codex native](/id/plugins/codex-native-plugins)
- [Penggunaan Komputer Codex](/id/plugins/codex-computer-use)
- [Penyedia OpenAI](/id/providers/openai)
- [Referensi konfigurasi](/id/gateway/configuration-reference)
