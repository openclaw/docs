---
read_when:
    - Anda memerlukan setiap bidang konfigurasi harness Codex
    - Anda sedang mengubah perilaku transport app-server, autentikasi, penemuan, atau batas waktu
    - Anda sedang men-debug startup harness Codex, penemuan model, atau isolasi lingkungan
summary: Konfigurasi, autentikasi, penemuan, dan referensi server aplikasi untuk harness Codex
title: Referensi harness Codex
x-i18n:
    generated_at: "2026-07-04T20:43:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1ffe2404dd35df36a706c098f99b841a9664baf76ee5d712836bb35d9ac78bc
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Referensi ini mencakup konfigurasi terperinci untuk plugin `codex`
bawaan. Untuk keputusan penyiapan dan perutean, mulai dengan
[harness Codex](/id/plugins/codex-harness).

## Permukaan config Plugin

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

| Bidang                     | Default                  | Arti                                                                                                                                      |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | diaktifkan               | Pengaturan penemuan model untuk app-server Codex `model/list`.                                                                            |
| `appServer`                | app-server stdio terkelola | Pengaturan transport, perintah, auth, persetujuan, sandbox, dan timeout.                                                                  |
| `codexDynamicToolsLoading` | `"searchable"`           | Gunakan `"direct"` untuk menempatkan dynamic tools OpenClaw langsung di konteks tool Codex awal.                                          |
| `codexDynamicToolsExclude` | `[]`                     | Nama dynamic tool OpenClaw tambahan yang akan dihilangkan dari giliran app-server Codex.                                                  |
| `codexPlugins`             | dinonaktifkan            | Dukungan plugin/app Codex native untuk plugin curated yang terpasang dari sumber dan telah dimigrasikan. Lihat [plugin Codex native](/id/plugins/codex-native-plugins). |
| `computerUse`              | dinonaktifkan            | Penyiapan Codex Computer Use. Lihat [Codex Computer Use](/id/plugins/codex-computer-use).                                                    |

## Transport app-server

Secara default, OpenClaw memulai biner Codex terkelola yang dikirim bersama plugin
bawaan:

```bash
codex app-server --listen stdio://
```

Ini menjaga versi app-server tetap terikat ke plugin `codex` bawaan, bukan ke
CLI Codex terpisah mana pun yang kebetulan terpasang secara lokal. Atur
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

| Bidang                                        | Default                                                | Makna                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` menjalankan Codex; `"websocket"` terhubung ke `url`.                                                                                                                                                                                                                                                                                                                                  |
| `homeScope`                                   | `"agent"`                                              | `"agent"` mengisolasi status Codex per agen OpenClaw. `"user"` membagikan `$CODEX_HOME` native atau `~/.codex`, menggunakan autentikasi native, dan mengaktifkan manajemen thread khusus pemilik. Cakupan pengguna memerlukan stdio.                                                                                                                                                            |
| `command`                                     | biner Codex terkelola                                  | Executable untuk transport stdio. Biarkan tidak disetel untuk menggunakan biner terkelola.                                                                                                                                                                                                                                                                                                      |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumen untuk transport stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | tidak disetel                                          | URL app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | tidak disetel                                          | Token Bearer untuk transport WebSocket. Menerima string literal atau SecretInput seperti `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                           |
| `headers`                                     | `{}`                                                   | Header WebSocket tambahan. Nilai header menerima string literal atau nilai SecretInput, misalnya `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nama variabel lingkungan tambahan yang dihapus dari proses app-server stdio yang dijalankan setelah OpenClaw membangun lingkungan warisannya.                                                                                                                                                                                                                                                   |
| `remoteWorkspaceRoot`                         | tidak disetel                                          | Root workspace app-server Codex jarak jauh. Saat disetel, OpenClaw menyimpulkan root workspace lokal dari workspace OpenClaw yang diselesaikan, mempertahankan sufiks cwd saat ini di bawah root jarak jauh ini, dan hanya mengirim cwd app-server final ke Codex. Jika cwd berada di luar root workspace OpenClaw yang diselesaikan, OpenClaw gagal tertutup alih-alih mengirim path gateway-lokal ke app-server jarak jauh. |
| `requestTimeoutMs`                            | `60000`                                                | Batas waktu untuk panggilan control-plane app-server.                                                                                                                                                                                                                                                                                                                                           |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Jendela senyap setelah Codex menerima giliran atau setelah permintaan app-server bercakupan giliran saat OpenClaw menunggu `turn/completed`.                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Penjaga completion-idle dan progres yang digunakan setelah handoff tool, penyelesaian tool native, progres asisten mentah pasca-tool, penyelesaian reasoning mentah, atau progres reasoning saat OpenClaw menunggu `turn/completed`. Gunakan ini untuk beban kerja tepercaya atau berat ketika sintesis pasca-tool secara sah dapat tetap senyap lebih lama daripada anggaran rilis asisten final. |
| `mode`                                        | `"yolo"` kecuali persyaratan Codex lokal melarang YOLO | Preset untuk eksekusi YOLO atau eksekusi yang ditinjau guardian.                                                                                                                                                                                                                                                                                                                                |
| `approvalPolicy`                              | `"never"` atau kebijakan persetujuan guardian yang diizinkan | Kebijakan persetujuan Codex native yang dikirim ke awal thread, resume, dan giliran.                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` atau sandbox guardian yang diizinkan | Mode sandbox Codex native yang dikirim ke awal thread dan resume. Sandbox OpenClaw aktif mempersempit giliran `danger-full-access` menjadi Codex `workspace-write`; flag jaringan giliran mengikuti egress sandbox OpenClaw.                                                                                                                                                                     |
| `approvalsReviewer`                           | `"user"` atau peninjau guardian yang diizinkan         | Gunakan `"auto_review"` agar Codex meninjau prompt persetujuan native saat diizinkan.                                                                                                                                                                                                                                                                                                           |
| `defaultWorkspaceDir`                         | direktori proses saat ini                              | Workspace yang digunakan oleh `/codex bind` saat `--cwd` dihilangkan.                                                                                                                                                                                                                                                                                                                           |
| `serviceTier`                                 | tidak disetel                                          | Tingkat layanan app-server Codex opsional. `"priority"` mengaktifkan routing mode cepat, `"flex"` meminta pemrosesan fleksibel, dan `null` menghapus override. Legacy `"fast"` diterima sebagai `"priority"`.                                                                                                                                                                                   |
| `networkProxy`                                | dinonaktifkan                                          | Ikut serta dalam jaringan profil izin Codex untuk perintah app-server. OpenClaw mendefinisikan config `permissions.<profile>.network` yang dipilih dan memilihnya dengan `default_permissions` alih-alih mengirim `sandbox`.                                                                                                                                                                    |
| `experimental.sandboxExecServer`              | `false`                                                | Opt-in pratinjau yang mendaftarkan lingkungan Codex yang didukung sandbox OpenClaw dengan app-server Codex 0.132.0 atau yang lebih baru sehingga eksekusi Codex native dapat berjalan di dalam sandbox OpenClaw aktif.                                                                                                                                                                           |

`appServer.networkProxy` bersifat eksplisit karena mengubah kontrak sandbox
Codex. Saat diaktifkan, OpenClaw juga menetapkan `features.network_proxy.enabled` dan
`default_permissions` di config thread Codex sehingga profil izin yang dihasilkan
dapat memulai jaringan terkelola Codex. Secara default, OpenClaw menghasilkan
nama profil `openclaw-network-<fingerprint>` yang tahan tabrakan dari isi
profil; gunakan `profileName` hanya saat nama lokal yang stabil diperlukan.

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

Jika runtime app-server normal akan menjadi `danger-full-access`, mengaktifkan
`networkProxy` menggunakan akses sistem berkas bergaya workspace untuk profil
izin yang dihasilkan. Penegakan jaringan yang dikelola Codex adalah jaringan
tersandbox, sehingga profil akses penuh tidak akan melindungi lalu lintas keluar.

Plugin memblokir handshake app-server lama atau tanpa versi. app-server Codex
harus melaporkan versi stabil `0.125.0` atau yang lebih baru.

OpenClaw memperlakukan URL app-server WebSocket non-loopback sebagai remote dan mewajibkan
auth WebSocket yang membawa identitas melalui `appServer.authToken` atau header
`Authorization`. `appServer.authToken` dan setiap nilai `appServer.headers.*`
dapat berupa SecretInput; runtime rahasia menyelesaikan SecretRefs dan singkatan env
sebelum OpenClaw membangun opsi start app-server, dan SecretRefs terstruktur yang tidak terselesaikan
gagal sebelum token atau header apa pun dikirim. Saat Plugin Codex native
dikonfigurasi, OpenClaw menggunakan control plane plugin app-server yang terhubung
untuk menginstal atau menyegarkan Plugin tersebut lalu menyegarkan inventaris app agar
app milik plugin terlihat oleh thread Codex. `app/list` tetap menjadi sumber
inventaris dan metadata otoritatif, tetapi kebijakan OpenClaw menentukan apakah
`thread/start` mengirim `config.apps[appId].enabled = true` untuk app terdaftar yang dapat diakses
meskipun Codex saat ini menandainya nonaktif. Id app yang tidak dikenal atau hilang tetap
fail-closed; jalur ini hanya mengaktifkan plugin marketplace melalui `plugin/install`
dan menyegarkan inventaris. Hanya hubungkan OpenClaw ke app-server remote yang
dipercaya untuk menerima instalasi plugin yang dikelola OpenClaw dan penyegaran inventaris app.

## Mode persetujuan dan sandbox

Sesi app-server stdio lokal default ke mode YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Postur operator lokal tepercaya ini memungkinkan
turn OpenClaw tanpa pengawasan dan Heartbeat berjalan tanpa prompt persetujuan native
yang tidak ada orang untuk menjawabnya.

Jika file persyaratan sistem lokal Codex tidak mengizinkan nilai persetujuan YOLO,
reviewer, atau sandbox implisit, OpenClaw memperlakukan default implisit sebagai guardian
dan memilih izin guardian yang diizinkan. `tools.exec.mode: "auto"`
juga memaksa persetujuan Codex yang ditinjau guardian dan tidak mempertahankan override lama yang tidak aman
`approvalPolicy: "never"` atau `sandbox: "danger-full-access"`;
atur `tools.exec.mode: "full"` untuk postur tanpa persetujuan yang disengaja.
Entri
`[[remote_sandbox_config]]` yang cocok dengan hostname di file persyaratan yang sama dihormati
untuk keputusan default sandbox.

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
`approvalsReviewer: "auto_review"`, dan `sandbox: "workspace-write"` saat nilai-nilai tersebut
diizinkan. Field kebijakan individual menimpa `mode`. Nilai reviewer lama
`guardian_subagent` masih diterima sebagai alias kompatibilitas,
tetapi konfigurasi baru sebaiknya menggunakan `auto_review`.

Saat sandbox OpenClaw aktif, proses app-server Codex lokal tetap
berjalan di host Gateway. Karena itu OpenClaw menonaktifkan Code Mode native Codex,
server MCP pengguna, dan eksekusi plugin berbasis app untuk turn tersebut alih-alih
memperlakukan sandboxing sisi host Codex sebagai setara dengan backend sandbox OpenClaw.
Akses shell diekspos melalui alat dinamis berbasis sandbox OpenClaw
seperti `sandbox_exec` dan `sandbox_process` saat alat exec/process normal
tersedia.

Pada host Ubuntu/AppArmor, bwrap Codex dapat gagal di bawah `workspace-write` sebelum
perintah shell dimulai saat Anda sengaja menjalankan `workspace-write` native Codex
tanpa sandboxing OpenClaw aktif. Jika Anda melihat
`bwrap: setting up uid map: Permission denied` atau
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, jalankan
`openclaw doctor` dan perbaiki kebijakan namespace host yang dilaporkan untuk pengguna layanan OpenClaw
alih-alih memberikan privilege container Docker yang lebih luas. Utamakan
profil AppArmor terlingkup untuk proses layanan; fallback
`kernel.apparmor_restrict_unprivileged_userns=0` berlaku di seluruh host dan memiliki
tradeoff keamanan.

## Eksekusi native tersandbox

Default stabil adalah fail-closed: sandboxing OpenClaw aktif menonaktifkan
permukaan eksekusi native Codex yang seharusnya berjalan dari host app-server
Codex. Gunakan `appServer.experimental.sandboxExecServer: true` hanya saat Anda ingin
mencoba dukungan lingkungan remote Codex dengan backend sandbox OpenClaw. Jalur
pratinjau ini memerlukan app-server Codex 0.132.0 atau yang lebih baru.

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

Saat flag aktif dan sesi OpenClaw saat ini tersandbox, OpenClaw
memulai exec-server local loopback yang didukung sandbox aktif, mendaftarkannya
ke app-server Codex, dan memulai thread serta turn Codex dengan lingkungan
milik OpenClaw tersebut. Jika app-server tidak dapat mendaftarkan lingkungan,
run gagal tertutup alih-alih diam-diam fallback ke eksekusi host.

Jalur pratinjau ini hanya lokal. app-server WebSocket remote tidak dapat menjangkau
exec-server loopback kecuali berjalan di host yang sama, sehingga OpenClaw menolak
kombinasi tersebut.

## Auth dan isolasi lingkungan

Di home per-agent default, auth dipilih dalam urutan ini:

1. Profil auth Codex OpenClaw eksplisit untuk agent.
2. Akun app-server yang sudah ada di home Codex agent tersebut.
3. Hanya untuk peluncuran app-server stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, saat tidak ada akun app-server dan auth OpenAI
   masih diperlukan.

Saat OpenClaw melihat profil auth Codex bergaya langganan ChatGPT, OpenClaw menghapus
`CODEX_API_KEY` dan `OPENAI_API_KEY` dari proses child Codex yang dijalankan. Itu
membuat kunci API level Gateway tetap tersedia untuk embeddings atau model OpenAI langsung
tanpa membuat turn app-server native Codex ditagihkan melalui API secara tidak sengaja.

Profil kunci API Codex eksplisit dan fallback env-key stdio lokal menggunakan login app-server
alih-alih env proses child yang diwarisi. Koneksi app-server WebSocket
tidak menerima fallback kunci API env Gateway; gunakan profil auth eksplisit atau
akun milik app-server remote sendiri.

Peluncuran app-server stdio mewarisi lingkungan proses OpenClaw secara default.
OpenClaw memiliki bridge akun app-server Codex dan menetapkan `CODEX_HOME` ke
direktori per-agent di bawah state OpenClaw agent tersebut. Itu menjaga konfigurasi Codex,
akun, cache/data plugin, dan state thread tetap terlingkup ke agent OpenClaw
alih-alih bocor dari home pribadi operator `~/.codex`.

Atur `appServer.homeScope: "user"` untuk berbagi state native Codex dengan Codex
Desktop dan CLI. Mode khusus stdio lokal ini menggunakan `$CODEX_HOME` saat disetel dan
`~/.codex` jika tidak, termasuk auth native, konfigurasi, plugin, dan thread.
OpenClaw melewati bridge profil auth-nya untuk app-server. Turn owner terverifikasi
dapat menggunakan `codex_threads` untuk mencantumkan, mencari, membaca, fork, mengganti nama, mengarsipkan, dan memulihkan
thread tersebut. Fork thread sebelum melanjutkannya di OpenClaw; proses
Codex independen tidak mengoordinasikan penulis serentak untuk thread yang sama.

OpenClaw tidak menulis ulang `HOME` untuk peluncuran app-server lokal normal. Subproses yang dijalankan Codex
seperti `openclaw`, `gh`, `git`, CLI cloud, dan perintah shell melihat
home proses normal dan dapat menemukan konfigurasi serta token user-home. Codex juga dapat
menemukan `$HOME/.agents/skills` dan `$HOME/.agents/plugins/marketplace.json`;
penemuan `.agents` tersebut sengaja dibagikan dengan home operator dan
terpisah dari state `~/.codex` yang terisolasi.

Dalam lingkup agent default, plugin OpenClaw dan snapshot skill OpenClaw tetap
mengalir melalui registry plugin dan loader skill milik OpenClaw sendiri; aset Codex pribadi
`~/.codex` tidak. Jika Anda memiliki skill atau plugin CLI Codex yang berguna dari
home Codex yang seharusnya menjadi bagian dari agent OpenClaw terisolasi, inventarisasi
secara eksplisit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Jika deployment membutuhkan isolasi lingkungan tambahan, tambahkan variabel tersebut ke
`appServer.clearEnv`:

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

`appServer.clearEnv` hanya memengaruhi proses child app-server Codex yang dijalankan.
OpenClaw menghapus `CODEX_HOME` dan `HOME` dari daftar ini selama normalisasi peluncuran lokal:
`CODEX_HOME` tetap menunjuk ke lingkup agent atau user yang dipilih,
dan `HOME` tetap diwarisi agar subproses dapat menggunakan state user-home normal.

## Alat dinamis

Alat dinamis Codex default ke pemuatan `searchable`. OpenClaw tidak mengekspos
alat dinamis yang menduplikasi operasi workspace native Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Sebagian besar alat integrasi OpenClaw lainnya, seperti messaging, media, cron,
browser, node, gateway, `heartbeat_respond`, dan `web_search`, tersedia
melalui pencarian alat Codex di bawah namespace `openclaw`. Ini menjaga konteks model awal
lebih kecil. `sessions_yield` dan balasan sumber khusus alat pesan
tetap langsung karena itu adalah kontrak kontrol turn. `sessions_spawn` tetap
searchable agar `spawn_agent` native Codex tetap menjadi permukaan subagent Codex utama,
sementara delegasi OpenClaw atau ACP eksplisit tetap tersedia melalui
namespace alat dinamis `openclaw`.

Atur `codexDynamicToolsLoading: "direct"` hanya saat menghubungkan ke app-server Codex kustom
yang tidak dapat mencari alat dinamis tertunda atau saat men-debug payload alat penuh.

## Timeout

Panggilan alat dinamis milik OpenClaw dibatasi secara independen dari
`appServer.requestTimeoutMs`. Setiap permintaan Codex `item/tool/call` menggunakan timeout pertama
yang tersedia dalam urutan ini:

- Argumen `timeoutMs` per-panggilan yang positif.
- Untuk `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Untuk `image_generate` tanpa timeout terkonfigurasi, default pembuatan gambar
  120 detik.
- Untuk alat `image` pemahaman media, `tools.media.image.timeoutSeconds`
  dikonversi ke milidetik, atau default media 60 detik. Untuk pemahaman gambar,
  ini berlaku pada permintaan itu sendiri dan tidak dikurangi oleh
  pekerjaan persiapan sebelumnya.
- Default alat dinamis 90 detik.

Watchdog ini adalah anggaran `item/tool/call` dinamis luar. Timeout permintaan khusus provider
berjalan di dalam panggilan tersebut dan mempertahankan semantik timeout masing-masing.
Anggaran alat dinamis dibatasi maksimum 600000 ms. Saat timeout, OpenClaw membatalkan
sinyal alat jika didukung dan mengembalikan respons alat dinamis gagal ke Codex
agar turn dapat berlanjut alih-alih meninggalkan sesi dalam status `processing`.

Setelah Codex menerima turn, dan setelah OpenClaw merespons permintaan app-server
yang terlingkup turn, harness mengharapkan Codex membuat progres turn saat ini dan
akhirnya menyelesaikan turn native dengan `turn/completed`. Jika app-server diam
selama `appServer.turnCompletionIdleTimeoutMs`, OpenClaw dengan upaya terbaik
menginterupsi turn Codex, mencatat timeout diagnostik, dan melepaskan
lane sesi OpenClaw agar pesan chat lanjutan tidak mengantre di belakang turn native
yang basi.

Sebagian besar notifikasi non-terminal untuk giliran yang sama menonaktifkan watchdog singkat itu
karena Codex telah membuktikan bahwa giliran masih aktif. Handoff alat menggunakan anggaran idle
pasca-alat yang lebih panjang: setelah OpenClaw mengembalikan respons `item/tool/call`, setelah
item alat native seperti `commandExecution` selesai, setelah penyelesaian mentah
`custom_tool_call_output`, dan setelah progres asisten mentah pasca-alat,
penyelesaian penalaran mentah, atau progres penalaran. Guard menggunakan
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` saat dikonfigurasi dan
secara default menggunakan lima menit jika tidak. Anggaran pasca-alat yang sama juga memperpanjang
watchdog progres untuk jendela sintesis senyap sebelum Codex memancarkan event
giliran saat ini berikutnya. Penyelesaian penalaran, penyelesaian
`agentMessage` commentary, dan progres penalaran atau asisten mentah pra-alat dapat
diikuti oleh balasan akhir otomatis, sehingga semuanya menggunakan guard balasan
pasca-progres alih-alih langsung melepaskan lane sesi. Hanya item `agentMessage`
selesai final/non-commentary dan penyelesaian asisten mentah pra-alat yang
mengaktifkan pelepasan output asisten: jika Codex kemudian diam tanpa
`turn/completed`, OpenClaw berupaya sebaik mungkin untuk menginterupsi giliran native dan melepaskan
lane sesi. Kegagalan server aplikasi stdio yang aman diputar ulang, termasuk
timeout idle penyelesaian giliran tanpa bukti asisten, alat, item aktif, atau
efek samping, dicoba ulang sekali pada upaya server aplikasi baru. Timeout yang tidak aman
tetap menghentikan klien server aplikasi yang macet dan melepaskan lane sesi
OpenClaw. Timeout tersebut juga membersihkan pengikatan thread native yang basi alih-alih diputar ulang
secara otomatis. Timeout pemantauan penyelesaian menampilkan teks timeout khusus Codex:
kasus yang aman diputar ulang menyatakan bahwa respons mungkin tidak lengkap, sementara kasus yang tidak aman
memberi tahu pengguna untuk memverifikasi keadaan saat ini sebelum mencoba lagi. Diagnostik timeout publik
menyertakan bidang struktural seperti metode notifikasi server aplikasi terakhir,
id/jenis/peran item respons asisten mentah, jumlah permintaan/item aktif, dan status
watch yang aktif. Saat notifikasi terakhir adalah item respons asisten mentah, diagnostik juga
menyertakan pratinjau teks asisten yang dibatasi. Diagnostik tidak menyertakan prompt mentah atau
konten alat.

## Penemuan model

Secara default, Plugin Codex meminta model yang tersedia kepada server aplikasi. Ketersediaan model
dimiliki oleh server aplikasi Codex, sehingga daftar dapat berubah saat OpenClaw
meningkatkan versi bundled `@openai/codex` atau saat sebuah deployment mengarahkan
`appServer.command` ke binary Codex yang berbeda. Ketersediaan juga dapat
dibatasi per akun. Gunakan `/codex models` pada Gateway yang sedang berjalan untuk melihat katalog live
untuk harness dan akun tersebut.

Jika penemuan gagal atau timeout, OpenClaw menggunakan katalog fallback bundled untuk:

- GPT-5.5
- GPT-5.4 mini

Harness bundled saat ini adalah `@openai/codex` `0.142.5`. Probe `model/list`
terhadap server aplikasi bundled tersebut mengembalikan baris picker publik berikut:

| Id model              | Modalitas input | Upaya penalaran          |
| --------------------- | ---------------- | ------------------------ |
| `gpt-5.5`             | teks, gambar     | low, medium, high, xhigh |
| `gpt-5.4`             | teks, gambar     | low, medium, high, xhigh |
| `gpt-5.4-mini`        | teks, gambar     | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | teks             | low, medium, high, xhigh |

Model tersembunyi dapat dikembalikan oleh katalog server aplikasi untuk alur internal atau
khusus, tetapi model tersebut bukan pilihan normal di pemilih model.

Atur penemuan di bawah `plugins.entries.codex.config.discovery`:

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

Nonaktifkan penemuan saat Anda ingin startup menghindari probe Codex dan hanya menggunakan
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
tidak menulis file dokumen proyek Codex sintetis atau bergantung pada nama file fallback Codex
untuk file persona, karena fallback Codex hanya berlaku saat
`AGENTS.md` tidak ada.

Untuk paritas workspace OpenClaw, harness Codex menyelesaikan file bootstrap
lainnya. `SOUL.md`, `IDENTITY.md`, `TOOLS.md`, dan `USER.md` diteruskan sebagai
instruksi developer OpenClaw Codex karena semuanya mendefinisikan agen aktif,
panduan workspace yang tersedia, dan profil pengguna. Daftar Skills OpenClaw yang ringkas
diteruskan sebagai instruksi developer kolaborasi bercakupan giliran.
Konten `HEARTBEAT.md` tidak diinjeksi; giliran Heartbeat mendapatkan pointer mode kolaborasi
untuk membaca file saat file ada dan tidak kosong. Konten `MEMORY.md`
dari workspace agen yang dikonfigurasi tidak ditempelkan ke input giliran native Codex
saat alat memori tersedia untuk workspace tersebut; saat ada, harness
menambahkan pointer memori workspace kecil ke instruksi developer kolaborasi
bercakupan giliran dan Codex seharusnya menggunakan `memory_search` atau `memory_get` saat memori
tahan lama relevan. Jika alat dinonaktifkan, pencarian memori tidak tersedia, atau
workspace aktif berbeda dari workspace memori agen, `MEMORY.md` menggunakan
jalur konteks giliran berbatas normal.
`BOOTSTRAP.md` saat ada diteruskan sebagai konteks referensi input giliran OpenClaw.

## Override lingkungan

Override lingkungan tetap tersedia untuk pengujian lokal:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` melewati binary terkelola saat
`appServer.command` tidak disetel.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` telah dihapus. Gunakan
`plugins.entries.codex.config.appServer.mode: "guardian"` sebagai gantinya, atau
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` untuk pengujian lokal sekali pakai. Konfigurasi
lebih disarankan untuk deployment yang dapat diulang karena menjaga perilaku Plugin dalam
file yang sama-sama ditinjau dengan sisa penyiapan harness Codex.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [Plugin Codex native](/id/plugins/codex-native-plugins)
- [Codex Computer Use](/id/plugins/codex-computer-use)
- [Provider OpenAI](/id/providers/openai)
- [Referensi konfigurasi](/id/gateway/configuration-reference)
