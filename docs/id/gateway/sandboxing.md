---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Cara kerja sandboxing OpenClaw: mode, cakupan, akses workspace, dan image'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-05T13:55:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 756ebd5b9806c23ba720a311df7e3b4ffef6ce41ba4315ee4b36b5ea87b26e60
    source_path: gateway/sandboxing.md
    workflow: 15
---

# Sandboxing

OpenClaw dapat menjalankan **tool di dalam backend sandbox** untuk mengurangi radius dampak.
Ini **opsional** dan dikendalikan oleh konfigurasi (`agents.defaults.sandbox` atau
`agents.list[].sandbox`). Jika sandboxing dinonaktifkan, tool berjalan di host.
Gateway tetap berada di host; eksekusi tool berjalan di sandbox yang terisolasi
saat diaktifkan.

Ini bukan batas keamanan yang sempurna, tetapi secara nyata membatasi akses
filesystem dan proses ketika model melakukan sesuatu yang bodoh.

## Apa yang disandbox

- Eksekusi tool (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, dll.).
- Browser sandbox opsional (`agents.defaults.sandbox.browser`).
  - Secara default, browser sandbox otomatis dimulai (memastikan CDP dapat dijangkau) saat tool browser membutuhkannya.
    Konfigurasikan melalui `agents.defaults.sandbox.browser.autoStart` dan `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Secara default, container browser sandbox menggunakan jaringan Docker khusus (`openclaw-sandbox-browser`) alih-alih jaringan `bridge` global.
    Konfigurasikan dengan `agents.defaults.sandbox.browser.network`.
  - `agents.defaults.sandbox.browser.cdpSourceRange` opsional membatasi ingress CDP di tepi container dengan allowlist CIDR (misalnya `172.21.0.1/32`).
  - Akses pengamat noVNC dilindungi kata sandi secara default; OpenClaw memancarkan URL token berumur pendek yang menyajikan halaman bootstrap lokal dan membuka noVNC dengan kata sandi di fragmen URL (bukan log kueri/header).
  - `agents.defaults.sandbox.browser.allowHostControl` memungkinkan sesi yang disandbox menargetkan browser host secara eksplisit.
  - Allowlist opsional mengatur `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Tidak disandbox:

- Proses Gateway itu sendiri.
- Tool apa pun yang secara eksplisit diizinkan berjalan di luar sandbox (misalnya `tools.elevated`).
  - **Elevated exec melewati sandboxing dan menggunakan jalur escape yang dikonfigurasi (`gateway` secara default, atau `node` saat target exec adalah `node`).**
  - Jika sandboxing nonaktif, `tools.elevated` tidak mengubah eksekusi (sudah di host). Lihat [Elevated Mode](/tools/elevated).

## Mode

`agents.defaults.sandbox.mode` mengontrol **kapan** sandboxing digunakan:

- `"off"`: tidak ada sandboxing.
- `"non-main"`: sandbox hanya sesi **non-main** (default jika Anda ingin chat normal di host).
- `"all"`: setiap sesi berjalan di sandbox.
  Catatan: `"non-main"` didasarkan pada `session.mainKey` (default `"main"`), bukan id agen.
  Sesi grup/kanal menggunakan kuncinya sendiri, sehingga dihitung sebagai non-main dan akan disandbox.

## Cakupan

`agents.defaults.sandbox.scope` mengontrol **berapa banyak container** yang dibuat:

- `"agent"` (default): satu container per agen.
- `"session"`: satu container per sesi.
- `"shared"`: satu container dibagikan oleh semua sesi yang disandbox.

## Backend

`agents.defaults.sandbox.backend` mengontrol **runtime mana** yang menyediakan sandbox:

- `"docker"` (default): runtime sandbox lokal berbasis Docker.
- `"ssh"`: runtime sandbox jarak jauh generik berbasis SSH.
- `"openshell"`: runtime sandbox berbasis OpenShell.

Config khusus SSH berada di bawah `agents.defaults.sandbox.ssh`.
Config khusus OpenShell berada di bawah `plugins.entries.openshell.config`.

### Memilih backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Tempat berjalan** | Container lokal                  | Host apa pun yang bisa diakses via SSH | Sandbox terkelola OpenShell                    |
| **Penyiapan**       | `scripts/sandbox-setup.sh`       | Kunci SSH + host target        | Plugin OpenShell diaktifkan                         |
| **Model workspace** | Bind-mount atau salin            | Kanonis-jarak-jauh (seed sekali) | `mirror` atau `remote`                           |
| **Kontrol jaringan**| `docker.network` (default: none) | Bergantung pada host jarak jauh | Bergantung pada OpenShell                          |
| **Browser sandbox** | Didukung                         | Tidak didukung                 | Belum didukung                                      |
| **Bind mount**      | `docker.binds`                   | T/A                            | T/A                                                 |
| **Paling cocok untuk** | Dev lokal, isolasi penuh      | Offload ke mesin jarak jauh    | Sandbox jarak jauh terkelola dengan sinkronisasi dua arah opsional |

### Backend SSH

Gunakan `backend: "ssh"` saat Anda ingin OpenClaw melakukan sandbox pada `exec`, tool file, dan pembacaan media di
mesin apa pun yang dapat diakses melalui SSH.

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
          // Atau gunakan SecretRef / konten inline alih-alih file lokal:
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

- OpenClaw membuat root jarak jauh per cakupan di bawah `sandbox.ssh.workspaceRoot`.
- Pada penggunaan pertama setelah create atau recreate, OpenClaw melakukan seed workspace jarak jauh itu dari workspace lokal satu kali.
- Setelah itu, `exec`, `read`, `write`, `edit`, `apply_patch`, pembacaan media prompt, dan staging media masuk berjalan langsung terhadap workspace jarak jauh melalui SSH.
- OpenClaw tidak menyinkronkan perubahan jarak jauh kembali ke workspace lokal secara otomatis.

Materi autentikasi:

- `identityFile`, `certificateFile`, `knownHostsFile`: gunakan file lokal yang sudah ada dan teruskan melalui config OpenSSH.
- `identityData`, `certificateData`, `knownHostsData`: gunakan string inline atau SecretRef. OpenClaw menyelesaikannya melalui snapshot runtime secrets normal, menuliskannya ke file sementara dengan `0600`, lalu menghapusnya saat sesi SSH berakhir.
- Jika `*File` dan `*Data` keduanya disetel untuk item yang sama, `*Data` menang untuk sesi SSH tersebut.

Ini adalah model **kanonis-jarak-jauh**. Workspace SSH jarak jauh menjadi status sandbox yang sebenarnya setelah seed awal.

Konsekuensi penting:

- Edit lokal host yang dibuat di luar OpenClaw setelah langkah seed tidak terlihat dari jarak jauh sampai Anda membuat ulang sandbox.
- `openclaw sandbox recreate` menghapus root jarak jauh per cakupan dan melakukan seed lagi dari lokal pada penggunaan berikutnya.
- Browser sandboxing tidak didukung pada backend SSH.
- Pengaturan `sandbox.docker.*` tidak berlaku untuk backend SSH.

### Backend OpenShell

Gunakan `backend: "openshell"` saat Anda ingin OpenClaw melakukan sandbox pada tool dalam
environment jarak jauh terkelola OpenShell. Untuk panduan penyiapan lengkap, referensi konfigurasi,
dan perbandingan mode workspace, lihat halaman khusus
[OpenShell](/gateway/openshell).

OpenShell menggunakan kembali transport SSH inti yang sama dan bridge filesystem jarak jauh yang sama seperti
backend SSH generik, dan menambahkan siklus hidup khusus OpenShell
(`sandbox create/get/delete`, `sandbox ssh-config`) plus mode workspace
`mirror` opsional.

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

- `mirror` (default): workspace lokal tetap kanonis. OpenClaw menyinkronkan file lokal ke OpenShell sebelum exec dan menyinkronkan workspace jarak jauh kembali setelah exec.
- `remote`: workspace OpenShell menjadi kanonis setelah sandbox dibuat. OpenClaw melakukan seed workspace jarak jauh satu kali dari workspace lokal, lalu tool file dan exec berjalan langsung terhadap sandbox jarak jauh tanpa menyinkronkan perubahan kembali.

Detail transport jarak jauh:

- OpenClaw meminta config SSH khusus sandbox dari OpenShell melalui `openshell sandbox ssh-config <name>`.
- Core menulis config SSH itu ke file sementara, membuka sesi SSH, dan menggunakan kembali bridge filesystem jarak jauh yang sama dengan yang digunakan oleh `backend: "ssh"`.
- Hanya pada mode `mirror` siklus hidupnya berbeda: sinkronkan lokal ke jarak jauh sebelum exec, lalu sinkronkan kembali setelah exec.

Keterbatasan OpenShell saat ini:

- browser sandbox belum didukung
- `sandbox.docker.binds` tidak didukung pada backend OpenShell
- pengaturan runtime khusus Docker di bawah `sandbox.docker.*` tetap hanya berlaku untuk backend Docker

#### Mode workspace

OpenShell memiliki dua model workspace. Ini adalah bagian yang paling penting dalam praktik.

##### `mirror`

Gunakan `plugins.entries.openshell.config.mode: "mirror"` saat Anda ingin **workspace lokal tetap kanonis**.

Perilaku:

- Sebelum `exec`, OpenClaw menyinkronkan workspace lokal ke sandbox OpenShell.
- Setelah `exec`, OpenClaw menyinkronkan workspace jarak jauh kembali ke workspace lokal.
- Tool file tetap beroperasi melalui bridge sandbox, tetapi workspace lokal tetap menjadi source of truth di antara giliran.

Gunakan ini ketika:

- Anda mengedit file secara lokal di luar OpenClaw dan ingin perubahan itu otomatis muncul di sandbox
- Anda ingin sandbox OpenShell berperilaku semirip mungkin dengan backend Docker
- Anda ingin workspace host mencerminkan penulisan sandbox setelah setiap giliran exec

Tradeoff:

- biaya sinkronisasi tambahan sebelum dan sesudah exec

##### `remote`

Gunakan `plugins.entries.openshell.config.mode: "remote"` saat Anda ingin **workspace OpenShell menjadi kanonis**.

Perilaku:

- Saat sandbox pertama kali dibuat, OpenClaw melakukan seed workspace jarak jauh dari workspace lokal satu kali.
- Setelah itu, `exec`, `read`, `write`, `edit`, dan `apply_patch` beroperasi langsung terhadap workspace OpenShell jarak jauh.
- OpenClaw **tidak** menyinkronkan perubahan jarak jauh kembali ke workspace lokal setelah exec.
- Pembacaan media saat prompt tetap berfungsi karena tool file dan media membaca melalui bridge sandbox alih-alih mengasumsikan path host lokal.
- Transportnya adalah SSH ke sandbox OpenShell yang dikembalikan oleh `openshell sandbox ssh-config`.

Konsekuensi penting:

- Jika Anda mengedit file di host di luar OpenClaw setelah langkah seed, sandbox jarak jauh **tidak** akan melihat perubahan itu secara otomatis.
- Jika sandbox dibuat ulang, workspace jarak jauh di-seed lagi dari workspace lokal.
- Dengan `scope: "agent"` atau `scope: "shared"`, workspace jarak jauh itu dibagikan pada cakupan yang sama.

Gunakan ini ketika:

- sandbox seharusnya hidup terutama di sisi OpenShell jarak jauh
- Anda ingin overhead sinkronisasi per giliran lebih rendah
- Anda tidak ingin edit lokal host diam-diam menimpa status sandbox jarak jauh

Pilih `mirror` jika Anda menganggap sandbox sebagai environment eksekusi sementara.
Pilih `remote` jika Anda menganggap sandbox sebagai workspace yang sebenarnya.

#### Siklus hidup OpenShell

Sandbox OpenShell tetap dikelola melalui siklus hidup sandbox normal:

- `openclaw sandbox list` menampilkan runtime OpenShell maupun runtime Docker
- `openclaw sandbox recreate` menghapus runtime saat ini dan membiarkan OpenClaw membuatnya ulang pada penggunaan berikutnya
- logika prune juga sadar-backend

Untuk mode `remote`, recreate sangat penting:

- recreate menghapus workspace jarak jauh kanonis untuk cakupan tersebut
- penggunaan berikutnya melakukan seed workspace jarak jauh baru dari workspace lokal

Untuk mode `mirror`, recreate terutama mereset environment eksekusi jarak jauh
karena workspace lokal tetap kanonis.

## Akses workspace

`agents.defaults.sandbox.workspaceAccess` mengontrol **apa yang dapat dilihat sandbox**:

- `"none"` (default): tool melihat workspace sandbox di bawah `~/.openclaw/sandboxes`.
- `"ro"`: mount workspace agen sebagai read-only di `/agent` (menonaktifkan `write`/`edit`/`apply_patch`).
- `"rw"`: mount workspace agen sebagai read/write di `/workspace`.

Dengan backend OpenShell:

- mode `mirror` tetap menggunakan workspace lokal sebagai sumber kanonis di antara giliran exec
- mode `remote` menggunakan workspace OpenShell jarak jauh sebagai sumber kanonis setelah seed awal
- `workspaceAccess: "ro"` dan `"none"` tetap membatasi perilaku tulis dengan cara yang sama

Media masuk disalin ke workspace sandbox aktif (`media/inbound/*`).
Catatan Skills: tool `read` berakar pada sandbox. Dengan `workspaceAccess: "none"`,
OpenClaw mencerminkan skill yang memenuhi syarat ke workspace sandbox (`.../skills`) sehingga
dapat dibaca. Dengan `"rw"`, skill workspace dapat dibaca dari
`/workspace/skills`.

## Bind mount kustom

`agents.defaults.sandbox.docker.binds` melakukan mount direktori host tambahan ke dalam container.
Format: `host:container:mode` (misalnya `"/home/user/source:/source:rw"`).

Bind global dan per agen **digabungkan** (bukan diganti). Di bawah `scope: "shared"`, bind per agen diabaikan.

`agents.defaults.sandbox.browser.binds` melakukan mount direktori host tambahan ke dalam container **browser sandbox** saja.

- Saat disetel (termasuk `[]`), ia menggantikan `agents.defaults.sandbox.docker.binds` untuk container browser.
- Saat dihilangkan, container browser kembali ke `agents.defaults.sandbox.docker.binds` (kompatibel ke belakang).

Contoh (sumber read-only + direktori data tambahan):

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
- OpenClaw juga memblokir root kredensial umum di direktori home seperti `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, dan `~/.ssh`.
- Validasi bind bukan hanya pencocokan string. OpenClaw menormalkan path sumber, lalu menyelesaikannya lagi melalui leluhur terdalam yang ada sebelum memeriksa ulang path yang diblokir dan root yang diizinkan.
- Ini berarti escape parent symlink tetap gagal secara tertutup bahkan saat leaf akhir belum ada. Contoh: `/workspace/run-link/new-file` tetap diselesaikan sebagai `/var/run/...` jika `run-link` menunjuk ke sana.
- Root sumber yang diizinkan juga dikanonisasi dengan cara yang sama, sehingga path yang hanya tampak berada di dalam allowlist sebelum resolusi symlink tetap ditolak sebagai `outside allowed roots`.
- Mount sensitif (secret, kunci SSH, kredensial layanan) sebaiknya `:ro` kecuali benar-benar diperlukan.
- Gabungkan dengan `workspaceAccess: "ro"` jika Anda hanya memerlukan akses baca ke workspace; mode bind tetap independen.
- Lihat [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) untuk bagaimana bind berinteraksi dengan kebijakan tool dan elevated exec.

## Image + penyiapan

Image Docker default: `openclaw-sandbox:bookworm-slim`

Bangun sekali:

```bash
scripts/sandbox-setup.sh
```

Catatan: image default **tidak** menyertakan Node. Jika sebuah skill membutuhkan Node (atau
runtime lain), Anda dapat membuat image kustom atau menginstal melalui
`sandbox.docker.setupCommand` (memerlukan network egress + root yang dapat ditulis +
user root).

Jika Anda ingin image sandbox yang lebih fungsional dengan tool umum (misalnya
`curl`, `jq`, `nodejs`, `python3`, `git`), bangun:

```bash
scripts/sandbox-common-setup.sh
```

Lalu setel `agents.defaults.sandbox.docker.image` ke
`openclaw-sandbox-common:bookworm-slim`.

Image browser sandbox:

```bash
scripts/sandbox-browser-setup.sh
```

Secara default, container sandbox Docker berjalan **tanpa jaringan**.
Timpa dengan `agents.defaults.sandbox.docker.network`.

Image browser sandbox bawaan juga menerapkan default startup Chromium yang konservatif
untuk beban kerja dalam container. Default container saat ini mencakup:

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
- Tiga flag penguatan grafis (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) bersifat opsional dan berguna
  saat container tidak memiliki dukungan GPU. Setel `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  jika beban kerja Anda memerlukan WebGL atau fitur browser/3D lainnya.
- `--disable-extensions` diaktifkan secara default dan dapat dinonaktifkan dengan
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` untuk alur yang bergantung pada extension.
- `--renderer-process-limit=2` dikendalikan oleh
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, di mana `0` mempertahankan default Chromium.

Jika Anda memerlukan profil runtime yang berbeda, gunakan image browser kustom dan sediakan
entrypoint Anda sendiri. Untuk profil Chromium lokal (non-container), gunakan
`browser.extraArgs` untuk menambahkan flag startup tambahan.

Default keamanan:

- `network: "host"` diblokir.
- `network: "container:<id>"` diblokir secara default (risiko bypass join namespace).
- Override break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Instalasi Docker dan gateway dalam container berada di sini:
[Docker](/install/docker)

Untuk deployment gateway Docker, `scripts/docker/setup.sh` dapat mem-bootstrap config sandbox.
Setel `OPENCLAW_SANDBOX=1` (atau `true`/`yes`/`on`) untuk mengaktifkan jalur itu. Anda dapat
menimpa lokasi socket dengan `OPENCLAW_DOCKER_SOCKET`. Referensi env dan penyiapan lengkap:
[Docker](/install/docker#agent-sandbox).

## setupCommand (penyiapan container satu kali)

`setupCommand` berjalan **sekali** setelah container sandbox dibuat (bukan pada setiap eksekusi).
Perintah ini dijalankan di dalam container melalui `sh -lc`.

Path:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Per agen: `agents.list[].sandbox.docker.setupCommand`

Masalah umum:

- Default `docker.network` adalah `"none"` (tanpa egress), sehingga instalasi paket akan gagal.
- `docker.network: "container:<id>"` memerlukan `dangerouslyAllowContainerNamespaceJoin: true` dan hanya untuk break-glass.
- `readOnlyRoot: true` mencegah penulisan; setel `readOnlyRoot: false` atau buat image kustom.
- `user` harus root untuk instalasi paket (hilangkan `user` atau setel `user: "0:0"`).
- Sandbox exec **tidak** mewarisi `process.env` host. Gunakan
  `agents.defaults.sandbox.docker.env` (atau image kustom) untuk API key skill.

## Kebijakan tool + jalur escape

Kebijakan izinkan/tolak tool tetap berlaku sebelum aturan sandbox. Jika sebuah tool ditolak
secara global atau per agen, sandboxing tidak akan mengembalikannya.

`tools.elevated` adalah jalur escape eksplisit yang menjalankan `exec` di luar sandbox (`gateway` secara default, atau `node` saat target exec adalah `node`).
Direktif `/exec` hanya berlaku untuk pengirim yang berwenang dan bertahan per sesi; untuk menonaktifkan
`exec` secara keras, gunakan penolakan kebijakan tool (lihat [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugging:

- Gunakan `openclaw sandbox explain` untuk memeriksa mode sandbox efektif, kebijakan tool, dan kunci config perbaikan.
- Lihat [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) untuk model mental “mengapa ini diblokir?”.
  Pertahankan agar tetap terkunci.

## Override multi-agent

Setiap agen dapat menimpa sandbox + tools:
`agents.list[].sandbox` dan `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` untuk kebijakan tool sandbox).
Lihat [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) untuk prioritas.

## Contoh pengaktifan minimal

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

## Dokumen terkait

- [OpenShell](/gateway/openshell) -- penyiapan backend sandbox terkelola, mode workspace, dan referensi konfigurasi
- [Konfigurasi Sandbox](/gateway/configuration-reference#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) -- debugging "mengapa ini diblokir?"
- [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) -- override per agen dan prioritas
- [Security](/gateway/security)
