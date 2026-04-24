---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Cara kerja sandboxing OpenClaw: mode, scope, akses workspace, dan image'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-24T09:09:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07be63b71a458a17020f33a24d60e6d8d7007d4eaea686a21acabf4815c3f653
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw dapat menjalankan **alat di dalam backend sandbox** untuk mengurangi blast radius.
Ini **opsional** dan dikendalikan oleh konfigurasi (`agents.defaults.sandbox` atau
`agents.list[].sandbox`). Jika sandboxing nonaktif, alat berjalan di host.
Gateway tetap berada di host; eksekusi alat berjalan di sandbox terisolasi
saat diaktifkan.

Ini bukan batas keamanan yang sempurna, tetapi secara material membatasi akses
filesystem dan proses saat model melakukan sesuatu yang bodoh.

## Apa yang disandbox

- Eksekusi alat (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, dll.).
- Browser sandbox opsional (`agents.defaults.sandbox.browser`).
  - Secara default, browser sandbox mulai otomatis (memastikan CDP dapat dijangkau) saat alat browser membutuhkannya.
    Konfigurasikan melalui `agents.defaults.sandbox.browser.autoStart` dan `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Secara default, container browser sandbox menggunakan jaringan Docker khusus (`openclaw-sandbox-browser`) alih-alih jaringan global `bridge`.
    Konfigurasikan dengan `agents.defaults.sandbox.browser.network`.
  - `agents.defaults.sandbox.browser.cdpSourceRange` opsional membatasi ingress CDP di tepi container dengan allowlist CIDR (misalnya `172.21.0.1/32`).
  - Akses observer noVNC dilindungi kata sandi secara default; OpenClaw mengeluarkan URL token berumur pendek yang menyajikan halaman bootstrap lokal dan membuka noVNC dengan kata sandi di fragmen URL (bukan di log query/header).
  - `agents.defaults.sandbox.browser.allowHostControl` memungkinkan sesi yang disandbox menargetkan browser host secara eksplisit.
  - Allowlist opsional mengendalikan `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Tidak disandbox:

- Proses Gateway itu sendiri.
- Alat apa pun yang secara eksplisit diizinkan berjalan di luar sandbox (misalnya `tools.elevated`).
  - **Elevated exec melewati sandboxing dan menggunakan escape path yang dikonfigurasi (`gateway` secara default, atau `node` saat target exec adalah `node`).**
  - Jika sandboxing nonaktif, `tools.elevated` tidak mengubah eksekusi (sudah di host). Lihat [Elevated Mode](/id/tools/elevated).

## Mode

`agents.defaults.sandbox.mode` mengontrol **kapan** sandboxing digunakan:

- `"off"`: tidak ada sandboxing.
- `"non-main"`: sandbox hanya sesi **non-main** (default jika Anda ingin chat normal di host).
- `"all"`: setiap sesi berjalan di dalam sandbox.
  Catatan: `"non-main"` didasarkan pada `session.mainKey` (default `"main"`), bukan id agen.
  Sesi grup/channel menggunakan kunci mereka sendiri, sehingga dihitung sebagai non-main dan akan disandbox.

## Scope

`agents.defaults.sandbox.scope` mengontrol **berapa banyak container** yang dibuat:

- `"agent"` (default): satu container per agen.
- `"session"`: satu container per sesi.
- `"shared"`: satu container yang dibagikan oleh semua sesi yang disandbox.

## Backend

`agents.defaults.sandbox.backend` mengontrol **runtime mana** yang menyediakan sandbox:

- `"docker"` (default saat sandboxing diaktifkan): runtime sandbox lokal berbasis Docker.
- `"ssh"`: runtime sandbox remote generik berbasis SSH.
- `"openshell"`: runtime sandbox berbasis OpenShell.

Config khusus SSH berada di bawah `agents.defaults.sandbox.ssh`.
Config khusus OpenShell berada di `plugins.entries.openshell.config`.

### Memilih backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Tempat berjalan** | Container lokal                  | Host mana pun yang dapat diakses via SSH | sandbox terkelola OpenShell                         |
| **Penyiapan**       | `scripts/sandbox-setup.sh`       | Kunci SSH + host target        | Plugin OpenShell diaktifkan                         |
| **Model workspace** | Bind-mount atau salin            | Remote-kanonis (seed sekali)   | `mirror` atau `remote`                              |
| **Kontrol jaringan**| `docker.network` (default: none) | Bergantung pada host remote    | Bergantung pada OpenShell                           |
| **Browser sandbox** | Didukung                         | Tidak didukung                 | Belum didukung                                      |
| **Bind mount**      | `docker.binds`                   | T/A                            | T/A                                                 |
| **Terbaik untuk**   | Dev lokal, isolasi penuh         | Memindahkan beban ke mesin remote | Sandbox remote terkelola dengan sinkronisasi dua arah opsional |

### Backend Docker

Sandboxing nonaktif secara default. Jika Anda mengaktifkan sandboxing dan tidak memilih
backend, OpenClaw menggunakan backend Docker. Backend ini mengeksekusi alat dan browser sandbox
secara lokal melalui socket daemon Docker (`/var/run/docker.sock`). Isolasi container sandbox
ditentukan oleh namespace Docker.

**Kendala Docker-out-of-Docker (DooD)**:
Jika Anda men-deploy OpenClaw Gateway itu sendiri sebagai container Docker, Gateway mengorkestrasi container sandbox sibling menggunakan socket Docker host (DooD). Ini menimbulkan kendala pemetaan path tertentu:

- **Config Memerlukan Path Host**: Konfigurasi `workspace` di `openclaw.json` HARUS berisi **path absolut Host** (misalnya `/home/user/.openclaw/workspaces`), bukan path internal container Gateway. Saat OpenClaw meminta daemon Docker memunculkan sandbox, daemon mengevaluasi path relatif terhadap namespace OS Host, bukan namespace Gateway.
- **Paritas FS Bridge (Peta Volume Identik)**: Proses native OpenClaw Gateway juga menulis file heartbeat dan bridge ke direktori `workspace`. Karena Gateway mengevaluasi string yang sama persis (path host) dari dalam environment container-nya sendiri, deployment Gateway HARUS menyertakan peta volume identik yang menghubungkan namespace host secara native (`-v /home/user/.openclaw:/home/user/.openclaw`).

Jika Anda memetakan path secara internal tanpa paritas host absolut, OpenClaw secara native melempar galat izin `EACCES` saat mencoba menulis heartbeat di dalam environment container karena string path yang sepenuhnya memenuhi syarat tidak ada secara native.

### Backend SSH

Gunakan `backend: "ssh"` saat Anda ingin OpenClaw menyandbox `exec`, alat file, dan pembacaan media pada
mesin sebarang yang dapat diakses lewat SSH.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Or use SecretRefs / inline contents instead of local files:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Cara kerjanya:

- OpenClaw membuat root remote per-scope di bawah `sandbox.ssh.workspaceRoot`.
- Pada penggunaan pertama setelah create atau recreate, OpenClaw melakukan seed workspace remote tersebut dari workspace lokal satu kali.
- Setelah itu, `exec`, `read`, `write`, `edit`, `apply_patch`, pembacaan media prompt, dan staging media masuk berjalan langsung terhadap workspace remote melalui SSH.
- OpenClaw tidak menyinkronkan perubahan remote kembali ke workspace lokal secara otomatis.

Materi autentikasi:

- `identityFile`, `certificateFile`, `knownHostsFile`: gunakan file lokal yang ada dan teruskan melalui config OpenSSH.
- `identityData`, `certificateData`, `knownHostsData`: gunakan string inline atau SecretRef. OpenClaw meresolusikannya melalui snapshot runtime secrets normal, menuliskannya ke file temp dengan `0600`, dan menghapusnya saat sesi SSH berakhir.
- Jika `*File` dan `*Data` keduanya disetel untuk item yang sama, `*Data` menang untuk sesi SSH tersebut.

Ini adalah model **remote-kanonis**. Workspace SSH remote menjadi state sandbox yang sebenarnya setelah seed awal.

Konsekuensi penting:

- Edit lokal host yang dibuat di luar OpenClaw setelah langkah seed tidak terlihat secara remote sampai Anda membuat ulang sandbox.
- `openclaw sandbox recreate` menghapus root remote per-scope dan melakukan seed ulang dari lokal pada penggunaan berikutnya.
- Browser sandboxing tidak didukung pada backend SSH.
- Pengaturan `sandbox.docker.*` tidak berlaku untuk backend SSH.

### Backend OpenShell

Gunakan `backend: "openshell"` saat Anda ingin OpenClaw menyandbox alat di environment remote
yang dikelola OpenShell. Untuk panduan penyiapan lengkap, referensi
konfigurasi, dan perbandingan mode workspace, lihat halaman khusus
[OpenShell page](/id/gateway/openshell).

OpenShell menggunakan kembali transport SSH inti dan bridge filesystem remote yang sama seperti
backend SSH generik, dan menambahkan siklus hidup
khusus OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) plus mode workspace `mirror`
opsional.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

Mode OpenShell:

- `mirror` (default): workspace lokal tetap kanonis. OpenClaw menyinkronkan file lokal ke OpenShell sebelum exec dan menyinkronkan workspace remote kembali setelah exec.
- `remote`: workspace OpenShell menjadi kanonis setelah sandbox dibuat. OpenClaw melakukan seed workspace remote satu kali dari workspace lokal, lalu alat file dan exec berjalan langsung terhadap sandbox remote tanpa menyinkronkan perubahan kembali.

Detail transport remote:

- OpenClaw meminta config SSH khusus sandbox dari OpenShell melalui `openshell sandbox ssh-config <name>`.
- Core menulis config SSH tersebut ke file temp, membuka sesi SSH, dan menggunakan kembali bridge filesystem remote yang sama dengan yang digunakan oleh `backend: "ssh"`.
- Dalam mode `mirror` hanya siklus hidupnya yang berbeda: sinkronkan lokal ke remote sebelum exec, lalu sinkronkan kembali setelah exec.

Keterbatasan OpenShell saat ini:

- browser sandbox belum didukung
- `sandbox.docker.binds` tidak didukung pada backend OpenShell
- knob runtime khusus Docker di bawah `sandbox.docker.*` tetap hanya berlaku untuk backend Docker

#### Mode workspace

OpenShell memiliki dua model workspace. Inilah bagian yang paling penting dalam praktik.

##### `mirror`

Gunakan `plugins.entries.openshell.config.mode: "mirror"` saat Anda ingin **workspace lokal tetap kanonis**.

Perilaku:

- Sebelum `exec`, OpenClaw menyinkronkan workspace lokal ke sandbox OpenShell.
- Setelah `exec`, OpenClaw menyinkronkan workspace remote kembali ke workspace lokal.
- Alat file tetap beroperasi melalui bridge sandbox, tetapi workspace lokal tetap menjadi sumber kebenaran antar giliran.

Gunakan ini ketika:

- Anda mengedit file secara lokal di luar OpenClaw dan ingin perubahan tersebut otomatis muncul di sandbox
- Anda ingin sandbox OpenShell berperilaku semirip mungkin dengan backend Docker
- Anda ingin workspace host mencerminkan penulisan sandbox setelah setiap giliran exec

Kompromi:

- ada biaya sinkronisasi tambahan sebelum dan sesudah exec

##### `remote`

Gunakan `plugins.entries.openshell.config.mode: "remote"` saat Anda ingin **workspace OpenShell menjadi kanonis**.

Perilaku:

- Saat sandbox pertama kali dibuat, OpenClaw melakukan seed workspace remote dari workspace lokal satu kali.
- Setelah itu, `exec`, `read`, `write`, `edit`, dan `apply_patch` beroperasi langsung terhadap workspace OpenShell remote.
- OpenClaw **tidak** menyinkronkan perubahan remote kembali ke workspace lokal setelah exec.
- Pembacaan media saat prompt tetap berfungsi karena alat file dan media membaca melalui bridge sandbox alih-alih mengasumsikan path host lokal.
- Transport menggunakan SSH ke sandbox OpenShell yang dikembalikan oleh `openshell sandbox ssh-config`.

Konsekuensi penting:

- Jika Anda mengedit file di host di luar OpenClaw setelah langkah seed, sandbox remote **tidak** akan melihat perubahan tersebut secara otomatis.
- Jika sandbox dibuat ulang, workspace remote akan di-seed lagi dari workspace lokal.
- Dengan `scope: "agent"` atau `scope: "shared"`, workspace remote tersebut dibagikan pada scope yang sama.

Gunakan ini ketika:

- sandbox seharusnya hidup terutama di sisi OpenShell remote
- Anda menginginkan overhead sinkronisasi per giliran yang lebih rendah
- Anda tidak ingin edit lokal host diam-diam menimpa state sandbox remote

Pilih `mirror` jika Anda menganggap sandbox sebagai environment eksekusi sementara.
Pilih `remote` jika Anda menganggap sandbox sebagai workspace yang sebenarnya.

#### Siklus hidup OpenShell

Sandbox OpenShell tetap dikelola melalui siklus hidup sandbox normal:

- `openclaw sandbox list` menampilkan runtime OpenShell maupun runtime Docker
- `openclaw sandbox recreate` menghapus runtime saat ini dan membiarkan OpenClaw membuatnya ulang saat penggunaan berikutnya
- logika prune juga sadar-backend

Untuk mode `remote`, recreate sangat penting:

- recreate menghapus workspace remote kanonis untuk scope tersebut
- penggunaan berikutnya melakukan seed workspace remote baru dari workspace lokal

Untuk mode `mirror`, recreate terutama mereset environment eksekusi remote
karena workspace lokal tetap kanonis.

## Akses workspace

`agents.defaults.sandbox.workspaceAccess` mengontrol **apa yang dapat dilihat sandbox**:

- `"none"` (default): alat melihat workspace sandbox di bawah `~/.openclaw/sandboxes`.
- `"ro"`: me-mount workspace agen hanya-baca di `/agent` (menonaktifkan `write`/`edit`/`apply_patch`).
- `"rw"`: me-mount workspace agen baca/tulis di `/workspace`.

Dengan backend OpenShell:

- mode `mirror` tetap menggunakan workspace lokal sebagai sumber kanonis antar giliran exec
- mode `remote` menggunakan workspace OpenShell remote sebagai sumber kanonis setelah seed awal
- `workspaceAccess: "ro"` dan `"none"` tetap membatasi perilaku tulis dengan cara yang sama

Media masuk disalin ke workspace sandbox aktif (`media/inbound/*`).
Catatan Skills: alat `read` berakar di sandbox. Dengan `workspaceAccess: "none"`,
OpenClaw mencerminkan Skills yang memenuhi syarat ke workspace sandbox (`.../skills`) agar
bisa dibaca. Dengan `"rw"`, Skills workspace dapat dibaca dari
`/workspace/skills`.

## Bind mount kustom

`agents.defaults.sandbox.docker.binds` me-mount direktori host tambahan ke container.
Format: `host:container:mode` (misalnya, `"/home/user/source:/source:rw"`).

Bind global dan per-agen di-**merge** (bukan diganti). Di bawah `scope: "shared"`, bind per-agen diabaikan.

`agents.defaults.sandbox.browser.binds` me-mount direktori host tambahan ke container **browser sandbox** saja.

- Saat disetel (termasuk `[]`), ini menggantikan `agents.defaults.sandbox.docker.binds` untuk container browser.
- Saat dihilangkan, container browser fallback ke `agents.defaults.sandbox.docker.binds` (kompatibel mundur).

Contoh (source hanya-baca + direktori data tambahan):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

Catatan keamanan:

- Bind melewati filesystem sandbox: bind mengekspos path host dengan mode apa pun yang Anda setel (`:ro` atau `:rw`).
- OpenClaw memblokir sumber bind berbahaya (misalnya: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev`, dan mount induk yang akan mengeksposnya).
- OpenClaw juga memblokir root kredensial direktori home umum seperti `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, dan `~/.ssh`.
- Validasi bind bukan sekadar pencocokan string. OpenClaw menormalkan path sumber, lalu meresolusikannya lagi melalui leluhur terdalam yang ada sebelum memeriksa ulang path yang diblokir dan root yang diizinkan.
- Artinya escape induk symlink tetap gagal tertutup bahkan ketika leaf akhir belum ada. Contoh: `/workspace/run-link/new-file` tetap diresolusikan sebagai `/var/run/...` jika `run-link` menunjuk ke sana.
- Root sumber yang diizinkan dikanonisasi dengan cara yang sama, sehingga path yang hanya tampak berada di dalam allowlist sebelum resolusi symlink tetap ditolak sebagai `outside allowed roots`.
- Mount sensitif (secret, kunci SSH, kredensial layanan) seharusnya `:ro` kecuali benar-benar diperlukan.
- Gabungkan dengan `workspaceAccess: "ro"` jika Anda hanya memerlukan akses baca ke workspace; mode bind tetap independen.
- Lihat [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) untuk bagaimana bind berinteraksi dengan kebijakan alat dan elevated exec.

## Image + penyiapan

Image Docker default: `openclaw-sandbox:bookworm-slim`

Bangun sekali:

```bash
scripts/sandbox-setup.sh
```

Catatan: image default **tidak** menyertakan Node. Jika sebuah skill memerlukan Node (atau
runtime lain), buat image kustom atau instal melalui
`sandbox.docker.setupCommand` (memerlukan network egress + root yang dapat ditulis +
pengguna root).

Jika Anda menginginkan image sandbox yang lebih fungsional dengan tooling umum (misalnya
`curl`, `jq`, `nodejs`, `python3`, `git`), bangun:

```bash
scripts/sandbox-common-setup.sh
```

Lalu setel `agents.defaults.sandbox.docker.image` ke
`openclaw-sandbox-common:bookworm-slim`.

Image browser yang disandbox:

```bash
scripts/sandbox-browser-setup.sh
```

Secara default, container sandbox Docker berjalan tanpa **jaringan**.
Override dengan `agents.defaults.sandbox.docker.network`.

Image browser sandbox bawaan juga menerapkan default startup Chromium yang konservatif
untuk workload dalam container. Default container saat ini meliputi:

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- `--no-sandbox` dan `--disable-setuid-sandbox` saat `noSandbox` diaktifkan.
- Tiga flag hardening grafis (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) bersifat opsional dan berguna
  saat container tidak memiliki dukungan GPU. Setel `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  jika workload Anda memerlukan WebGL atau fitur browser 3D lainnya.
- `--disable-extensions` diaktifkan secara default dan dapat dinonaktifkan dengan
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` untuk alur yang bergantung pada extension.
- `--renderer-process-limit=2` dikendalikan oleh
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, di mana `0` mempertahankan default Chromium.

Jika Anda memerlukan profil runtime yang berbeda, gunakan image browser kustom dan sediakan
entrypoint Anda sendiri. Untuk profil Chromium lokal (non-container), gunakan
`browser.extraArgs` untuk menambahkan flag startup tambahan.

Default keamanan:

- `network: "host"` diblokir.
- `network: "container:<id>"` diblokir secara default (risiko bypass namespace join).
- Override break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Instalasi Docker dan gateway yang dikontainerkan ada di sini:
[Docker](/id/install/docker)

Untuk deployment gateway Docker, `scripts/docker/setup.sh` dapat melakukan bootstrap config sandbox.
Setel `OPENCLAW_SANDBOX=1` (atau `true`/`yes`/`on`) untuk mengaktifkan jalur tersebut. Anda dapat
mengoverride lokasi socket dengan `OPENCLAW_DOCKER_SOCKET`. Referensi lengkap penyiapan dan env:
[Docker](/id/install/docker#agent-sandbox).

## setupCommand (penyiapan container sekali jalan)

`setupCommand` berjalan **sekali** setelah container sandbox dibuat (bukan pada setiap run).
Perintah ini dieksekusi di dalam container melalui `sh -lc`.

Path:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Per-agen: `agents.list[].sandbox.docker.setupCommand`

Jebakan umum:

- `docker.network` default adalah `"none"` (tanpa egress), sehingga instalasi paket akan gagal.
- `docker.network: "container:<id>"` memerlukan `dangerouslyAllowContainerNamespaceJoin: true` dan hanya untuk break-glass.
- `readOnlyRoot: true` mencegah penulisan; setel `readOnlyRoot: false` atau buat image kustom.
- `user` harus root untuk instalasi paket (hilangkan `user` atau setel `user: "0:0"`).
- Sandbox exec **tidak** mewarisi `process.env` host. Gunakan
  `agents.defaults.sandbox.docker.env` (atau image kustom) untuk kunci API skill.

## Kebijakan alat + escape hatch

Kebijakan allow/deny alat tetap berlaku sebelum aturan sandbox. Jika suatu alat ditolak
secara global atau per-agen, sandboxing tidak akan mengembalikannya.

`tools.elevated` adalah escape hatch eksplisit yang menjalankan `exec` di luar sandbox (`gateway` secara default, atau `node` saat target exec adalah `node`).
Directive `/exec` hanya berlaku untuk pengirim yang berwenang dan dipersistenkan per sesi; untuk menonaktifkan
`exec` sepenuhnya, gunakan deny kebijakan alat (lihat [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugging:

- Gunakan `openclaw sandbox explain` untuk memeriksa mode sandbox efektif, kebijakan alat, dan kunci config perbaikan.
- Lihat [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) untuk model mental “mengapa ini diblokir?”.
  Tetap kunci ketat.

## Override multi-agen

Setiap agen dapat mengoverride sandbox + alat:
`agents.list[].sandbox` dan `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` untuk kebijakan alat sandbox).
Lihat [Multi-Agent Sandbox & Tools](/id/tools/multi-agent-sandbox-tools) untuk prioritas.

## Contoh minimal pengaktifan

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## Dokumentasi terkait

- [OpenShell](/id/gateway/openshell) -- penyiapan backend sandbox terkelola, mode workspace, dan referensi config
- [Sandbox Configuration](/id/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) -- debugging "mengapa ini diblokir?"
- [Multi-Agent Sandbox & Tools](/id/tools/multi-agent-sandbox-tools) -- override per-agen dan prioritas
- [Security](/id/gateway/security)
