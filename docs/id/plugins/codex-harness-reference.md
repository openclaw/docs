---
read_when:
    - Anda memerlukan setiap bidang konfigurasi harness Codex
    - Anda mengubah perilaku transport, autentikasi, penemuan, atau batas waktu app-server
    - Anda sedang men-debug startup harness Codex, penemuan model, atau isolasi lingkungan
summary: Referensi konfigurasi, autentikasi, penemuan, dan server aplikasi untuk harness Codex
title: Referensi harness Codex
x-i18n:
    generated_at: "2026-07-01T08:32:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02dd72f9d85d2ea5fa45533a402d640786f17bdbe2242b7c1b8cd99405561a25
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Referensi ini mencakup konfigurasi terperinci untuk Plugin `codex`
yang dibundel. Untuk keputusan penyiapan dan routing, mulai dari
[Harness Codex](/id/plugins/codex-harness).

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

Bidang tingkat atas yang didukung:

| Bidang                     | Bawaan                  | Makna                                                                                                                                              |
| -------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | diaktifkan              | Pengaturan penemuan model untuk `model/list` app-server Codex.                                                                                     |
| `appServer`                | app-server stdio terkelola | Pengaturan transport, perintah, auth, persetujuan, sandbox, dan timeout.                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`          | Gunakan `"direct"` untuk menempatkan alat dinamis OpenClaw langsung dalam konteks alat Codex awal.                                                 |
| `codexDynamicToolsExclude` | `[]`                    | Nama alat dinamis OpenClaw tambahan yang akan dihilangkan dari giliran app-server Codex.                                                           |
| `codexPlugins`             | dinonaktifkan           | Dukungan Plugin/aplikasi Codex native untuk Plugin kurasi terpasang dari sumber yang telah dimigrasikan. Lihat [Plugin Codex native](/id/plugins/codex-native-plugins). |
| `computerUse`              | dinonaktifkan           | Penyiapan Codex Computer Use. Lihat [Codex Computer Use](/id/plugins/codex-computer-use).                                                             |

## Transport app-server

Secara bawaan, OpenClaw memulai biner Codex terkelola yang dikirim bersama Plugin
yang dibundel:

```bash
codex app-server --listen stdio://
```

Ini membuat versi app-server tetap terikat ke Plugin `codex` yang dibundel, bukan ke
CLI Codex terpisah apa pun yang kebetulan terinstal secara lokal. Tetapkan
`appServer.command` hanya ketika Anda memang ingin menjalankan executable yang
berbeda.

Untuk app-server yang sudah berjalan, gunakan transport WebSocket:

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

Bidang `appServer` yang didukung:

| Bidang                                        | Default                                                | Arti                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` menjalankan Codex; `"websocket"` terhubung ke `url`.                                                                                                                                                                                                                                                                                                                                  |
| `command`                                     | biner Codex terkelola                                  | Executable untuk transport stdio. Biarkan tidak diatur untuk menggunakan biner terkelola.                                                                                                                                                                                                                                                                                                      |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumen untuk transport stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | tidak diatur                                           | URL app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | tidak diatur                                           | Token Bearer untuk transport WebSocket. Menerima string literal atau SecretInput seperti `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                           |
| `headers`                                     | `{}`                                                   | Header WebSocket tambahan. Nilai header menerima string literal atau nilai SecretInput, misalnya `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nama variabel lingkungan tambahan yang dihapus dari proses app-server stdio yang dijalankan setelah OpenClaw membangun lingkungan warisannya.                                                                                                                                                                                                                                                   |
| `remoteWorkspaceRoot`                         | tidak diatur                                           | Root workspace app-server Codex jarak jauh. Saat diatur, OpenClaw menyimpulkan root workspace lokal dari workspace OpenClaw yang diselesaikan, mempertahankan sufiks cwd saat ini di bawah root jarak jauh ini, dan hanya mengirim cwd app-server akhir ke Codex. Jika cwd berada di luar root workspace OpenClaw yang diselesaikan, OpenClaw gagal tertutup alih-alih mengirim jalur lokal gateway ke app-server jarak jauh. |
| `requestTimeoutMs`                            | `60000`                                                | Batas waktu untuk panggilan control-plane app-server.                                                                                                                                                                                                                                                                                                                                           |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Jendela senyap setelah Codex menerima turn atau setelah permintaan app-server bercakupan turn sementara OpenClaw menunggu `turn/completed`.                                                                                                                                                                                                                                                     |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Penjaga idle penyelesaian dan progres yang digunakan setelah handoff tool, penyelesaian tool native, progres asisten mentah pasca-tool, penyelesaian reasoning mentah, atau progres reasoning sementara OpenClaw menunggu `turn/completed`. Gunakan ini untuk beban kerja tepercaya atau berat ketika sintesis pasca-tool secara sah dapat tetap senyap lebih lama daripada anggaran rilis asisten akhir. |
| `mode`                                        | `"yolo"` kecuali persyaratan Codex lokal melarang YOLO | Preset untuk eksekusi YOLO atau yang ditinjau guardian.                                                                                                                                                                                                                                                                                                                                         |
| `approvalPolicy`                              | `"never"` atau kebijakan persetujuan guardian yang diizinkan | Kebijakan persetujuan Codex native yang dikirim ke awal thread, resume, dan turn.                                                                                                                                                                                                                                                                                                               |
| `sandbox`                                     | `"danger-full-access"` atau sandbox guardian yang diizinkan | Mode sandbox Codex native yang dikirim ke awal thread dan resume. Sandbox OpenClaw aktif mempersempit turn `danger-full-access` menjadi Codex `workspace-write`; flag jaringan turn mengikuti egress sandbox OpenClaw.                                                                                                                                                                           |
| `approvalsReviewer`                           | `"user"` atau reviewer guardian yang diizinkan         | Gunakan `"auto_review"` untuk membiarkan Codex meninjau prompt persetujuan native saat diizinkan.                                                                                                                                                                                                                                                                                               |
| `defaultWorkspaceDir`                         | direktori proses saat ini                              | Workspace yang digunakan oleh `/codex bind` saat `--cwd` dihilangkan.                                                                                                                                                                                                                                                                                                                           |
| `serviceTier`                                 | tidak diatur                                           | Tingkat layanan app-server Codex opsional. `"priority"` mengaktifkan routing fast-mode, `"flex"` meminta pemrosesan flex, dan `null` menghapus override. Legacy `"fast"` diterima sebagai `"priority"`.                                                                                                                                                                                         |
| `networkProxy`                                | dinonaktifkan                                          | Ikut serta dalam jaringan profil izin Codex untuk perintah app-server. OpenClaw mendefinisikan konfigurasi `permissions.<profile>.network` yang dipilih dan memilihnya dengan `default_permissions` alih-alih mengirim `sandbox`.                                                                                                                                                               |
| `experimental.sandboxExecServer`              | `false`                                                | Opt-in pratinjau yang mendaftarkan lingkungan Codex berbasis sandbox OpenClaw dengan app-server Codex 0.132.0 atau yang lebih baru sehingga eksekusi Codex native dapat berjalan di dalam sandbox OpenClaw aktif.                                                                                                                                                                               |

`appServer.networkProxy` bersifat eksplisit karena mengubah kontrak sandbox
Codex. Saat diaktifkan, OpenClaw juga mengatur `features.network_proxy.enabled` dan
`default_permissions` dalam konfigurasi thread Codex sehingga profil izin yang
dihasilkan dapat memulai jaringan terkelola Codex. Secara default, OpenClaw menghasilkan
nama profil `openclaw-network-<fingerprint>` yang tahan benturan dari isi
profil; gunakan `profileName` hanya ketika nama lokal yang stabil diperlukan.

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

Jika runtime app-server normal adalah `danger-full-access`, mengaktifkan
`networkProxy` menggunakan akses sistem berkas bergaya workspace untuk profil
izin yang dihasilkan. Penegakan jaringan terkelola Codex adalah jaringan yang
di-sandbox, jadi profil akses penuh tidak akan melindungi lalu lintas keluar.

Plugin memblokir handshake app-server yang lebih lama atau tidak berversi. App-server Codex
harus melaporkan versi stabil `0.125.0` atau yang lebih baru.

OpenClaw memperlakukan URL server aplikasi WebSocket non-loopback sebagai remote dan mewajibkan
auth WebSocket yang memuat identitas melalui `appServer.authToken` atau header
`Authorization`. `appServer.authToken` dan setiap nilai `appServer.headers.*`
dapat berupa SecretInput; runtime secrets menyelesaikan SecretRefs dan singkatan
env sebelum OpenClaw membangun opsi mulai server aplikasi, dan SecretRefs
terstruktur yang tidak terselesaikan gagal sebelum token atau header apa pun
dikirim. Saat Plugin Codex native dikonfigurasi, OpenClaw menggunakan control
plane plugin server aplikasi yang terhubung untuk menginstal atau menyegarkan
plugin tersebut lalu menyegarkan inventaris aplikasi agar aplikasi milik plugin
terlihat oleh thread Codex. `app/list` tetap menjadi sumber inventaris dan
metadata otoritatif, tetapi kebijakan OpenClaw menentukan apakah `thread/start`
mengirim `config.apps[appId].enabled = true` untuk aplikasi yang terdaftar dan
dapat diakses meskipun Codex saat ini menandainya nonaktif. Id aplikasi yang
tidak dikenal atau hilang tetap fail-closed; jalur ini hanya mengaktifkan plugin
marketplace melalui `plugin/install` dan menyegarkan inventaris. Hubungkan
OpenClaw hanya ke server aplikasi remote yang dipercaya untuk menerima instalasi
plugin yang dikelola OpenClaw dan penyegaran inventaris aplikasi.

## Mode persetujuan dan sandbox

Sesi server aplikasi stdio lokal secara default menggunakan mode YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Postur operator lokal tepercaya ini memungkinkan
giliran OpenClaw tanpa pengawasan dan Heartbeat terus berjalan tanpa prompt
persetujuan native yang tidak akan dijawab siapa pun.

Jika file persyaratan sistem lokal Codex melarang persetujuan YOLO implisit,
reviewer, atau nilai sandbox, OpenClaw memperlakukan default implisit sebagai
guardian dan memilih izin guardian yang diizinkan. `tools.exec.mode: "auto"`
juga memaksa persetujuan Codex yang ditinjau guardian dan tidak mempertahankan
override legacy yang tidak aman seperti `approvalPolicy: "never"` atau
`sandbox: "danger-full-access"`; atur `tools.exec.mode: "full"` untuk postur
tanpa persetujuan yang disengaja. Entri
`[[remote_sandbox_config]]` yang cocok dengan hostname dalam file persyaratan
yang sama dihormati untuk keputusan default sandbox.

Atur `appServer.mode: "guardian"` untuk persetujuan Codex yang ditinjau guardian:

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
`approvalsReviewer: "auto_review"`, dan `sandbox: "workspace-write"` saat
nilai-nilai tersebut diizinkan. Field kebijakan individual menimpa `mode`. Nilai
reviewer lama `guardian_subagent` masih diterima sebagai alias kompatibilitas,
tetapi config baru sebaiknya menggunakan `auto_review`.

Saat sandbox OpenClaw aktif, proses server aplikasi Codex lokal tetap berjalan
di host Gateway. Karena itu, OpenClaw menonaktifkan Code Mode native Codex,
server MCP pengguna, dan eksekusi plugin berbasis aplikasi untuk giliran
tersebut alih-alih memperlakukan sandboxing sisi host Codex sebagai setara dengan
backend sandbox OpenClaw. Akses shell diekspos melalui alat dinamis yang didukung
sandbox OpenClaw seperti `sandbox_exec` dan `sandbox_process` saat alat
exec/process normal tersedia.

Pada host Ubuntu/AppArmor, bwrap Codex dapat gagal di bawah `workspace-write`
sebelum perintah shell dimulai saat Anda sengaja menjalankan
`workspace-write` native Codex tanpa sandboxing OpenClaw aktif. Jika Anda melihat
`bwrap: setting up uid map: Permission denied` atau
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, jalankan
`openclaw doctor` dan perbaiki kebijakan namespace host yang dilaporkan untuk
pengguna layanan OpenClaw, bukan memberikan hak istimewa container Docker yang
lebih luas. Lebih baik gunakan profil AppArmor yang dibatasi untuk proses
layanan; fallback `kernel.apparmor_restrict_unprivileged_userns=0` berlaku
seluruh host dan memiliki tradeoff keamanan.

## Eksekusi native tersandbox

Default stabil adalah fail-closed: sandboxing OpenClaw aktif menonaktifkan
surface eksekusi native Codex yang jika tidak akan berjalan dari host server
aplikasi Codex. Gunakan `appServer.experimental.sandboxExecServer: true` hanya
saat Anda ingin mencoba dukungan lingkungan remote Codex dengan backend sandbox
OpenClaw. Jalur pratinjau ini memerlukan server aplikasi Codex 0.132.0 atau yang
lebih baru.

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

Saat flag aktif dan sesi OpenClaw saat ini tersandbox, OpenClaw memulai
exec-server local loopback yang didukung oleh sandbox aktif, mendaftarkannya
dengan server aplikasi Codex, lalu memulai thread dan giliran Codex dengan
lingkungan milik OpenClaw tersebut. Jika server aplikasi tidak dapat mendaftarkan
lingkungan, run gagal tertutup alih-alih diam-diam fallback ke eksekusi host.

Jalur pratinjau ini hanya lokal. Server aplikasi WebSocket remote tidak dapat
menjangkau exec-server loopback kecuali berjalan di host yang sama, sehingga
OpenClaw menolak kombinasi tersebut.

## Isolasi auth dan lingkungan

Auth dipilih dalam urutan ini:

1. Profil auth OpenClaw Codex eksplisit untuk agen.
2. Akun server aplikasi yang sudah ada di home Codex agen tersebut.
3. Hanya untuk peluncuran server aplikasi stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, saat tidak ada akun server aplikasi dan auth OpenAI masih
   diperlukan.

Saat OpenClaw melihat profil auth Codex bergaya langganan ChatGPT, OpenClaw
menghapus `CODEX_API_KEY` dan `OPENAI_API_KEY` dari proses child Codex yang
di-spawn. Ini menjaga kunci API tingkat Gateway tetap tersedia untuk embedding
atau model OpenAI langsung tanpa membuat giliran server aplikasi native Codex
tertagih melalui API secara tidak sengaja.

Profil kunci API Codex eksplisit dan fallback env-key stdio lokal menggunakan
login server aplikasi alih-alih env proses child yang diwarisi. Koneksi server
aplikasi WebSocket tidak menerima fallback kunci API env Gateway; gunakan profil
auth eksplisit atau akun milik server aplikasi remote sendiri.

Peluncuran server aplikasi stdio mewarisi lingkungan proses OpenClaw secara
default. OpenClaw memiliki bridge akun server aplikasi Codex dan mengatur
`CODEX_HOME` ke direktori per agen di bawah state OpenClaw agen tersebut. Ini
menjaga config Codex, akun, cache/data plugin, dan state thread tetap terskop ke
agen OpenClaw alih-alih bocor dari home pribadi operator `~/.codex`.

OpenClaw tidak menulis ulang `HOME` untuk peluncuran server aplikasi lokal
normal. Subproses yang dijalankan Codex seperti `openclaw`, `gh`, `git`, CLI
cloud, dan perintah shell melihat home proses normal dan dapat menemukan config
serta token user-home. Codex juga dapat menemukan `$HOME/.agents/skills` dan
`$HOME/.agents/plugins/marketplace.json`; penemuan `.agents` tersebut memang
sengaja dibagikan dengan home operator dan terpisah dari state `~/.codex` yang
terisolasi.

Plugin OpenClaw dan snapshot skill OpenClaw tetap mengalir melalui registry
plugin dan loader skill milik OpenClaw sendiri. Aset Codex pribadi `~/.codex`
tidak. Jika Anda memiliki skills atau plugin CLI Codex yang berguna dari home
Codex dan seharusnya menjadi bagian dari agen OpenClaw, inventarisasikan secara
eksplisit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Jika deployment memerlukan isolasi lingkungan tambahan, tambahkan variabel
tersebut ke `appServer.clearEnv`:

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

`appServer.clearEnv` hanya memengaruhi proses child server aplikasi Codex yang
di-spawn. OpenClaw menghapus `CODEX_HOME` dan `HOME` dari daftar ini selama
normalisasi peluncuran lokal: `CODEX_HOME` tetap per agen, dan `HOME` tetap
diwarisi agar subproses dapat menggunakan state user-home normal.

## Alat dinamis

Alat dinamis Codex secara default menggunakan pemuatan `searchable`. OpenClaw
tidak mengekspos alat dinamis yang menduplikasi operasi workspace native Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Sebagian besar alat integrasi OpenClaw lainnya, seperti messaging, media, cron,
browser, node, gateway, `heartbeat_respond`, dan `web_search`, tersedia melalui
pencarian alat Codex di bawah namespace `openclaw`. Ini menjaga konteks model
awal lebih kecil. `sessions_yield` dan balasan sumber yang hanya berupa alat
pesan tetap langsung karena keduanya adalah kontrak kontrol giliran.
`sessions_spawn` tetap searchable sehingga `spawn_agent` native Codex tetap
menjadi surface subagen Codex utama, sementara delegasi OpenClaw atau ACP
eksplisit tetap tersedia melalui namespace alat dinamis `openclaw`.

Atur `codexDynamicToolsLoading: "direct"` hanya saat menghubungkan ke server
aplikasi Codex kustom yang tidak dapat mencari alat dinamis yang ditunda atau
saat men-debug payload alat penuh.

## Timeout

Panggilan alat dinamis milik OpenClaw dibatasi secara independen dari
`appServer.requestTimeoutMs`. Setiap permintaan Codex `item/tool/call`
menggunakan timeout pertama yang tersedia dalam urutan ini:

- Argumen per panggilan `timeoutMs` yang positif.
- Untuk `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Untuk `image_generate` tanpa timeout yang dikonfigurasi, default pembuatan
  gambar 120 detik.
- Untuk alat `image` pemahaman media, `tools.media.image.timeoutSeconds` yang
  dikonversi ke milidetik, atau default media 60 detik. Untuk pemahaman gambar,
  ini berlaku pada permintaan itu sendiri dan tidak dikurangi oleh pekerjaan
  persiapan sebelumnya.
- Default alat dinamis 90 detik.

Watchdog ini adalah anggaran luar `item/tool/call` dinamis. Timeout permintaan
khusus provider berjalan di dalam panggilan tersebut dan mempertahankan semantik
timeout masing-masing. Anggaran alat dinamis dibatasi pada 600000 ms. Saat
timeout, OpenClaw membatalkan sinyal alat jika didukung dan mengembalikan
respons alat dinamis yang gagal ke Codex agar giliran dapat berlanjut alih-alih
membiarkan sesi dalam `processing`.

Setelah Codex menerima giliran, dan setelah OpenClaw merespons permintaan server
aplikasi yang terskop giliran, harness mengharapkan Codex membuat progres
giliran saat ini dan akhirnya menyelesaikan giliran native dengan
`turn/completed`. Jika server aplikasi diam selama
`appServer.turnCompletionIdleTimeoutMs`, OpenClaw best-effort menginterupsi
giliran Codex, mencatat timeout diagnostik, dan melepaskan lane sesi OpenClaw
agar pesan chat lanjutan tidak mengantre di belakang giliran native yang stale.

Sebagian besar notifikasi non-terminal untuk giliran yang sama menonaktifkan watchdog singkat tersebut
karena Codex telah membuktikan bahwa giliran masih hidup. Handoff alat menggunakan anggaran idle
pasca-alat yang lebih panjang: setelah OpenClaw mengembalikan respons `item/tool/call`, setelah
item alat native seperti `commandExecution` selesai, setelah penyelesaian mentah
`custom_tool_call_output`, dan setelah progres asisten mentah pasca-alat,
penyelesaian penalaran mentah, atau progres penalaran. Guard menggunakan
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` saat dikonfigurasi dan
jika tidak, default-nya lima menit. Anggaran pasca-alat yang sama juga memperpanjang
watchdog progres untuk jendela sintesis senyap sebelum Codex memancarkan event
giliran saat ini berikutnya. Penyelesaian penalaran, penyelesaian
`agentMessage` commentary, dan progres penalaran atau asisten mentah pra-alat dapat
diikuti oleh balasan final otomatis, sehingga semuanya menggunakan guard balasan pasca-progres
alih-alih langsung melepaskan lane sesi. Hanya item `agentMessage` yang selesai
final/non-commentary dan penyelesaian asisten mentah pra-alat yang mempersenjatai
pelepasan output asisten: jika Codex kemudian senyap tanpa `turn/completed`,
OpenClaw berupaya sebaik mungkin untuk menginterupsi giliran native dan melepaskan
lane sesi. Kegagalan app-server stdio yang aman untuk replay, termasuk timeout
idle penyelesaian giliran tanpa bukti asisten, alat, item aktif, atau efek samping,
dicoba ulang sekali pada percobaan app-server baru. Timeout yang tidak aman tetap
menghentikan klien app-server yang macet dan melepaskan lane sesi OpenClaw.
Timeout tersebut juga menghapus binding thread native yang usang, bukan diputar ulang
secara otomatis. Timeout completion-watch menampilkan teks timeout khusus Codex:
kasus yang aman untuk replay mengatakan respons mungkin tidak lengkap, sedangkan kasus
yang tidak aman memberi tahu pengguna untuk memverifikasi status saat ini sebelum mencoba lagi.
Diagnostik timeout publik mencakup field struktural seperti metode notifikasi app-server terakhir,
id/tipe/peran item respons asisten mentah, jumlah request/item aktif, dan status watch yang dipersenjatai.
Saat notifikasi terakhir adalah item respons asisten mentah, diagnostik juga menyertakan
pratinjau teks asisten yang dibatasi. Diagnostik tidak menyertakan prompt mentah atau
konten alat.

## Penemuan model

Secara default, plugin Codex meminta model yang tersedia kepada app-server. Ketersediaan model
dimiliki oleh app-server Codex, sehingga daftar dapat berubah saat OpenClaw
memutakhirkan versi `@openai/codex` yang dibundel atau saat deployment mengarahkan
`appServer.command` ke biner Codex yang berbeda. Ketersediaan juga dapat
bercakupan akun. Gunakan `/codex models` pada gateway yang berjalan untuk melihat katalog live
untuk harness dan akun tersebut.

Jika penemuan gagal atau timeout, OpenClaw menggunakan katalog fallback yang dibundel untuk:

- GPT-5.5
- GPT-5.4 mini

Harness bundel saat ini adalah `@openai/codex` `0.142.4`. Probe `model/list`
terhadap app-server bundel tersebut di workspace yang mengaktifkan GPT-5.6 mengembalikan baris picker publik berikut:

| Id model              | Modalitas input | Upaya penalaran                      |
| --------------------- | ---------------- | ------------------------------------ |
| `gpt-5.6-sol`         | teks, gambar     | rendah, sedang, tinggi, xhigh, max, ultra |
| `gpt-5.6-terra`       | teks, gambar     | rendah, sedang, tinggi, xhigh, max, ultra |
| `gpt-5.6-luna`        | teks, gambar     | rendah, sedang, tinggi, xhigh, max        |
| `gpt-5.5`             | teks, gambar     | rendah, sedang, tinggi, xhigh             |
| `gpt-5.4`             | teks, gambar     | rendah, sedang, tinggi, xhigh             |
| `gpt-5.4-mini`        | teks, gambar     | rendah, sedang, tinggi, xhigh             |
| `gpt-5.4-pro`         | teks, gambar     | sedang, tinggi, xhigh                    |
| `gpt-5.3-codex-spark` | teks             | rendah, sedang, tinggi, xhigh             |

Akses GPT-5.6 bercakupan akun selama pratinjau terbatas. `max` adalah upaya
penalaran model. `ultra` adalah metadata orkestrasi multi-agen Codex yang terpisah,
bukan upaya penalaran OpenAI standar.

Model tersembunyi dapat dikembalikan oleh katalog app-server untuk alur internal atau
khusus, tetapi bukan pilihan picker model normal.

Sesuaikan penemuan di bawah `plugins.entries.codex.config.discovery`:

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

Nonaktifkan penemuan saat Anda ingin startup menghindari probing Codex dan hanya menggunakan
katalog fallback:

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

## File bootstrap workspace

Codex menangani `AGENTS.md` sendiri melalui penemuan dokumen proyek native. OpenClaw
tidak menulis file dokumen proyek Codex sintetis atau bergantung pada nama file fallback
Codex untuk file persona, karena fallback Codex hanya berlaku saat
`AGENTS.md` tidak ada.

Untuk paritas workspace OpenClaw, harness Codex me-resolve file bootstrap lainnya.
`SOUL.md`, `IDENTITY.md`, `TOOLS.md`, dan `USER.md` diteruskan sebagai
instruksi developer OpenClaw Codex karena semuanya mendefinisikan agen aktif,
panduan workspace yang tersedia, dan profil pengguna. Daftar Skills OpenClaw yang ringkas
diteruskan sebagai instruksi developer kolaborasi bercakupan giliran.
Konten `HEARTBEAT.md` tidak disuntikkan; giliran heartbeat mendapatkan pointer mode kolaborasi
untuk membaca file saat file tersebut ada dan tidak kosong. Konten `MEMORY.md`
dari workspace agen yang dikonfigurasi tidak ditempelkan ke input giliran Codex native
saat alat memori tersedia untuk workspace tersebut; saat ada, harness
menambahkan pointer memori workspace kecil ke instruksi developer kolaborasi
bercakupan giliran dan Codex harus menggunakan `memory_search` atau `memory_get` saat memori
durable relevan. Jika alat dinonaktifkan, pencarian memori tidak tersedia, atau
workspace aktif berbeda dari workspace memori agen, `MEMORY.md` menggunakan
jalur konteks giliran terbatas normal.
`BOOTSTRAP.md` saat ada diteruskan sebagai konteks referensi input giliran OpenClaw.

## Override lingkungan

Override lingkungan tetap tersedia untuk pengujian lokal:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` melewati biner terkelola saat
`appServer.command` tidak disetel.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` telah dihapus. Gunakan
`plugins.entries.codex.config.appServer.mode: "guardian"` sebagai gantinya, atau
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` untuk pengujian lokal sekali pakai. Konfigurasi
lebih disarankan untuk deployment yang dapat diulang karena menjaga perilaku plugin di
file yang sama yang ditinjau seperti sisa setup harness Codex.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [Plugin Codex native](/id/plugins/codex-native-plugins)
- [Codex Computer Use](/id/plugins/codex-computer-use)
- [Penyedia OpenAI](/id/providers/openai)
- [Referensi konfigurasi](/id/gateway/configuration-reference)
