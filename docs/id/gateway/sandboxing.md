---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Cara kerja sandboxing OpenClaw: mode, cakupan, akses workspace, dan image'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-26T11:30:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83930d5533832f2ece5fd069c15670f8a73c5801c829ca85c249a4582d36ff29
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw dapat menjalankan **tool di dalam backend sandbox** untuk mengurangi blast radius. Ini **opsional** dan dikendalikan oleh konfigurasi (`agents.defaults.sandbox` atau `agents.list[].sandbox`). Jika sandboxing nonaktif, tool berjalan di host. Gateway tetap berjalan di host; eksekusi tool berjalan di sandbox terisolasi saat diaktifkan.

<Note>
Ini bukan batas keamanan yang sempurna, tetapi secara material membatasi akses filesystem dan proses ketika model melakukan sesuatu yang bodoh.
</Note>

## Apa yang di-sandbox

- Eksekusi tool (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, dll.).
- Browser sandbox opsional (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Detail browser sandbox">
    - Secara default, browser sandbox akan auto-start (memastikan CDP dapat dijangkau) saat tool browser membutuhkannya. Konfigurasikan melalui `agents.defaults.sandbox.browser.autoStart` dan `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Secara default, container browser sandbox menggunakan jaringan Docker khusus (`openclaw-sandbox-browser`) alih-alih jaringan global `bridge`. Konfigurasikan dengan `agents.defaults.sandbox.browser.network`.
    - `agents.defaults.sandbox.browser.cdpSourceRange` opsional membatasi ingress CDP di tepi container dengan allowlist CIDR (misalnya `172.21.0.1/32`).
    - Akses observer noVNC dilindungi kata sandi secara default; OpenClaw mengeluarkan URL token berumur pendek yang menyajikan halaman bootstrap lokal dan membuka noVNC dengan kata sandi di fragmen URL (bukan log query/header).
    - `agents.defaults.sandbox.browser.allowHostControl` memungkinkan sesi yang di-sandbox menargetkan browser host secara eksplisit.
    - Allowlist opsional mengatur `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.
  </Accordion>
</AccordionGroup>

Tidak di-sandbox:

- Proses Gateway itu sendiri.
- Tool apa pun yang secara eksplisit diizinkan berjalan di luar sandbox (misalnya `tools.elevated`).
  - **Elevated exec melewati sandboxing dan menggunakan jalur escape yang dikonfigurasi (`gateway` secara default, atau `node` saat target exec adalah `node`).**
  - Jika sandboxing nonaktif, `tools.elevated` tidak mengubah eksekusi (sudah berada di host). Lihat [Elevated Mode](/id/tools/elevated).

## Mode

`agents.defaults.sandbox.mode` mengendalikan **kapan** sandboxing digunakan:

<Tabs>
  <Tab title="off">
    Tanpa sandboxing.
  </Tab>
  <Tab title="non-main">
    Sandbox hanya sesi **non-main** (default jika Anda ingin chat normal tetap di host).

    `"non-main"` didasarkan pada `session.mainKey` (default `"main"`), bukan id agen. Sesi grup/channel menggunakan key mereka sendiri, sehingga dihitung sebagai non-main dan akan di-sandbox.

  </Tab>
  <Tab title="all">
    Setiap sesi berjalan di sandbox.
  </Tab>
</Tabs>

## Cakupan

`agents.defaults.sandbox.scope` mengendalikan **berapa banyak container** yang dibuat:

- `"agent"` (default): satu container per agen.
- `"session"`: satu container per sesi.
- `"shared"`: satu container yang dibagikan oleh semua sesi yang di-sandbox.

## Backend

`agents.defaults.sandbox.backend` mengendalikan **runtime mana** yang menyediakan sandbox:

- `"docker"` (default saat sandboxing diaktifkan): runtime sandbox lokal berbasis Docker.
- `"ssh"`: runtime sandbox jarak jauh umum berbasis SSH.
- `"openshell"`: runtime sandbox berbasis OpenShell.

Config khusus SSH berada di bawah `agents.defaults.sandbox.ssh`. Config khusus OpenShell berada di `plugins.entries.openshell.config`.

### Memilih backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Tempat berjalan** | Container lokal                  | Host mana pun yang dapat diakses via SSH | Sandbox terkelola OpenShell                  |
| **Penyiapan**       | `scripts/sandbox-setup.sh`       | SSH key + host target          | Plugin OpenShell diaktifkan                         |
| **Model workspace** | Bind-mount atau salin            | Remote-canonical (seed sekali) | `mirror` atau `remote`                              |
| **Kontrol jaringan**| `docker.network` (default: none) | Bergantung pada host remote    | Bergantung pada OpenShell                           |
| **Browser sandbox** | Didukung                         | Tidak didukung                 | Belum didukung                                      |
| **Bind mounts**     | `docker.binds`                   | T/A                            | T/A                                                 |
| **Paling cocok untuk** | Dev lokal, isolasi penuh     | Memindahkan beban ke mesin remote | Sandbox remote terkelola dengan sinkronisasi dua arah opsional |

### Backend Docker

Sandboxing nonaktif secara default. Jika Anda mengaktifkan sandboxing dan tidak memilih backend, OpenClaw menggunakan backend Docker. Ini mengeksekusi tool dan browser sandbox secara lokal melalui socket daemon Docker (`/var/run/docker.sock`). Isolasi container sandbox ditentukan oleh namespace Docker.

<Warning>
**Batasan Docker-out-of-Docker (DooD)**

Jika Anda men-deploy OpenClaw Gateway itu sendiri sebagai container Docker, ia mengorkestrasi container sandbox saudara menggunakan socket Docker milik host (DooD). Ini memperkenalkan batasan pemetaan path yang spesifik:

- **Config memerlukan path host**: Konfigurasi `workspace` di `openclaw.json` HARUS berisi **path absolut milik host** (misalnya `/home/user/.openclaw/workspaces`), bukan path internal container Gateway. Saat OpenClaw meminta daemon Docker untuk membuat sandbox, daemon mengevaluasi path relatif terhadap namespace OS host, bukan namespace Gateway.
- **Paritas bridge FS (peta volume identik)**: Proses native OpenClaw Gateway juga menulis file heartbeat dan bridge ke direktori `workspace`. Karena Gateway mengevaluasi string yang sama persis (path host) dari dalam lingkungan container miliknya sendiri, deployment Gateway HARUS menyertakan peta volume identik yang menautkan namespace host secara native (`-v /home/user/.openclaw:/home/user/.openclaw`).

Jika Anda memetakan path secara internal tanpa paritas host absolut, OpenClaw secara native akan melempar error izin `EACCES` saat mencoba menulis heartbeat di dalam lingkungan container karena string path yang sepenuhnya memenuhi syarat itu tidak ada secara native.
</Warning>

### Backend SSH

Gunakan `backend: "ssh"` saat Anda ingin OpenClaw meng-sandbox `exec`, tool file, dan pembacaan media pada mesin arbitrer yang dapat diakses melalui SSH.

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

<AccordionGroup>
  <Accordion title="Cara kerjanya">
    - OpenClaw membuat root remote per-cakupan di bawah `sandbox.ssh.workspaceRoot`.
    - Pada penggunaan pertama setelah create atau recreate, OpenClaw melakukan seed workspace remote tersebut dari workspace lokal sekali.
    - Setelah itu, `exec`, `read`, `write`, `edit`, `apply_patch`, pembacaan media prompt, dan staging media masuk berjalan langsung terhadap workspace remote melalui SSH.
    - OpenClaw tidak menyinkronkan perubahan remote kembali ke workspace lokal secara otomatis.
  </Accordion>
  <Accordion title="Material autentikasi">
    - `identityFile`, `certificateFile`, `knownHostsFile`: gunakan file lokal yang sudah ada dan teruskan melalui config OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: gunakan string inline atau SecretRef. OpenClaw me-resolve semuanya melalui snapshot runtime secret normal, menuliskannya ke file sementara dengan `0600`, lalu menghapusnya saat sesi SSH berakhir.
    - Jika `*File` dan `*Data` diatur untuk item yang sama, `*Data` menang untuk sesi SSH tersebut.
  </Accordion>
  <Accordion title="Konsekuensi remote-canonical">
    Ini adalah model **remote-canonical**. Workspace SSH remote menjadi status sandbox yang sebenarnya setelah seed awal.

    - Edit lokal host yang dibuat di luar OpenClaw setelah langkah seed tidak terlihat di remote sampai Anda membuat ulang sandbox.
    - `openclaw sandbox recreate` menghapus root remote per-cakupan dan melakukan seed lagi dari lokal pada penggunaan berikutnya.
    - Browser sandbox tidak didukung pada backend SSH.
    - Pengaturan `sandbox.docker.*` tidak berlaku untuk backend SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Gunakan `backend: "openshell"` saat Anda ingin OpenClaw meng-sandbox tool di lingkungan remote terkelola OpenShell. Untuk panduan penyiapan lengkap, referensi konfigurasi, dan perbandingan mode workspace, lihat [halaman OpenShell](/id/gateway/openshell).

OpenShell menggunakan kembali transport SSH inti dan bridge filesystem remote yang sama dengan backend SSH generik, serta menambahkan lifecycle khusus OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) ditambah mode workspace `mirror` opsional.

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
- `remote`: workspace OpenShell menjadi kanonis setelah sandbox dibuat. OpenClaw melakukan seed workspace remote sekali dari workspace lokal, lalu tool file dan exec berjalan langsung terhadap sandbox remote tanpa menyinkronkan perubahan kembali.

<AccordionGroup>
  <Accordion title="Detail transport remote">
    - OpenClaw meminta config SSH khusus sandbox dari OpenShell melalui `openshell sandbox ssh-config <name>`.
    - Core menulis config SSH itu ke file sementara, membuka sesi SSH, dan menggunakan ulang bridge filesystem remote yang sama seperti `backend: "ssh"`.
    - Dalam mode `mirror`, hanya lifecycle yang berbeda: sinkronkan lokal ke remote sebelum exec, lalu sinkronkan kembali setelah exec.
  </Accordion>
  <Accordion title="Batasan OpenShell saat ini">
    - browser sandbox belum didukung
    - `sandbox.docker.binds` tidak didukung pada backend OpenShell
    - knob runtime khusus Docker di bawah `sandbox.docker.*` tetap hanya berlaku untuk backend Docker
  </Accordion>
</AccordionGroup>

#### Mode workspace

OpenShell memiliki dua model workspace. Ini adalah bagian yang paling penting dalam praktik.

<Tabs>
  <Tab title="mirror (lokal kanonis)">
    Gunakan `plugins.entries.openshell.config.mode: "mirror"` saat Anda ingin **workspace lokal tetap menjadi kanonis**.

    Perilaku:

    - Sebelum `exec`, OpenClaw menyinkronkan workspace lokal ke sandbox OpenShell.
    - Setelah `exec`, OpenClaw menyinkronkan workspace remote kembali ke workspace lokal.
    - Tool file tetap beroperasi melalui bridge sandbox, tetapi workspace lokal tetap menjadi sumber kebenaran antar giliran.

    Gunakan ini ketika:

    - Anda mengedit file secara lokal di luar OpenClaw dan ingin perubahan itu otomatis muncul di sandbox
    - Anda ingin sandbox OpenShell berperilaku semirip mungkin dengan backend Docker
    - Anda ingin workspace host mencerminkan hasil tulis sandbox setelah setiap giliran exec

    Konsekuensi: ada biaya sinkronisasi tambahan sebelum dan sesudah exec.

  </Tab>
  <Tab title="remote (OpenShell kanonis)">
    Gunakan `plugins.entries.openshell.config.mode: "remote"` saat Anda ingin **workspace OpenShell menjadi kanonis**.

    Perilaku:

    - Saat sandbox pertama kali dibuat, OpenClaw melakukan seed workspace remote dari workspace lokal sekali.
    - Setelah itu, `exec`, `read`, `write`, `edit`, dan `apply_patch` beroperasi langsung terhadap workspace OpenShell remote.
    - OpenClaw **tidak** menyinkronkan perubahan remote kembali ke workspace lokal setelah exec.
    - Pembacaan media saat prompt tetap berfungsi karena tool file dan media membaca melalui bridge sandbox alih-alih mengasumsikan path host lokal.
    - Transport menggunakan SSH ke sandbox OpenShell yang dikembalikan oleh `openshell sandbox ssh-config`.

    Konsekuensi penting:

    - Jika Anda mengedit file di host di luar OpenClaw setelah langkah seed, sandbox remote **tidak** akan melihat perubahan tersebut secara otomatis.
    - Jika sandbox dibuat ulang, workspace remote akan di-seed lagi dari workspace lokal.
    - Dengan `scope: "agent"` atau `scope: "shared"`, workspace remote tersebut dibagikan pada cakupan yang sama.

    Gunakan ini ketika:

    - sandbox seharusnya hidup terutama di sisi OpenShell remote
    - Anda menginginkan overhead sinkronisasi per giliran yang lebih rendah
    - Anda tidak ingin edit lokal host secara diam-diam menimpa status sandbox remote

  </Tab>
</Tabs>

Pilih `mirror` jika Anda menganggap sandbox sebagai lingkungan eksekusi sementara. Pilih `remote` jika Anda menganggap sandbox sebagai workspace yang sebenarnya.

#### Lifecycle OpenShell

Sandbox OpenShell tetap dikelola melalui lifecycle sandbox normal:

- `openclaw sandbox list` menampilkan runtime OpenShell maupun runtime Docker
- `openclaw sandbox recreate` menghapus runtime saat ini dan membiarkan OpenClaw membuatnya lagi pada penggunaan berikutnya
- logika prune juga sadar backend

Untuk mode `remote`, recreate sangat penting:

- recreate menghapus workspace remote kanonis untuk cakupan tersebut
- penggunaan berikutnya melakukan seed workspace remote yang baru dari workspace lokal

Untuk mode `mirror`, recreate terutama mereset lingkungan eksekusi remote karena workspace lokal tetap kanonis.

## Akses workspace

`agents.defaults.sandbox.workspaceAccess` mengendalikan **apa yang dapat dilihat sandbox**:

<Tabs>
  <Tab title="none (default)">
    Tool melihat workspace sandbox di bawah `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Mount workspace agen sebagai read-only di `/agent` (menonaktifkan `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Mount workspace agen sebagai read/write di `/workspace`.
  </Tab>
</Tabs>

Dengan backend OpenShell:

- mode `mirror` tetap menggunakan workspace lokal sebagai sumber kanonis antar giliran exec
- mode `remote` menggunakan workspace OpenShell remote sebagai sumber kanonis setelah seed awal
- `workspaceAccess: "ro"` dan `"none"` tetap membatasi perilaku penulisan dengan cara yang sama

Media masuk disalin ke workspace sandbox aktif (`media/inbound/*`).

<Note>
**Catatan Skills:** tool `read` berakar pada sandbox. Dengan `workspaceAccess: "none"`, OpenClaw mencerminkan Skills yang memenuhi syarat ke workspace sandbox (`.../skills`) agar dapat dibaca. Dengan `"rw"`, Skills workspace dapat dibaca dari `/workspace/skills`.
</Note>

## Bind mount kustom

`agents.defaults.sandbox.docker.binds` me-mount direktori host tambahan ke dalam container. Format: `host:container:mode` (misalnya `"/home/user/source:/source:rw"`).

Bind global dan per-agen **digabungkan** (bukan diganti). Di bawah `scope: "shared"`, bind per-agen diabaikan.

`agents.defaults.sandbox.browser.binds` me-mount direktori host tambahan ke dalam container **browser sandbox** saja.

- Saat diatur (termasuk `[]`), ia menggantikan `agents.defaults.sandbox.docker.binds` untuk container browser.
- Saat dihilangkan, container browser fallback ke `agents.defaults.sandbox.docker.binds` (kompatibel ke belakang).

Contoh (source read-only + satu direktori data tambahan):

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

<Warning>
**Keamanan bind**

- Bind melewati filesystem sandbox: bind mengekspos path host dengan mode apa pun yang Anda atur (`:ro` atau `:rw`).
- OpenClaw memblokir sumber bind berbahaya (misalnya: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev`, dan mount induk yang akan mengeksposnya).
- OpenClaw juga memblokir root kredensial umum di direktori home seperti `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, dan `~/.ssh`.
- Validasi bind bukan sekadar pencocokan string. OpenClaw menormalkan path sumber, lalu me-resolve lagi melalui ancestor terdalam yang ada sebelum memeriksa ulang path yang diblokir dan root yang diizinkan.
- Artinya, escape melalui induk symlink tetap gagal secara fail-closed bahkan saat leaf akhir belum ada. Contoh: `/workspace/run-link/new-file` tetap di-resolve sebagai `/var/run/...` jika `run-link` menunjuk ke sana.
- Root sumber yang diizinkan juga dikanonisasi dengan cara yang sama, sehingga path yang hanya tampak berada di dalam allowlist sebelum resolusi symlink tetap ditolak sebagai `outside allowed roots`.
- Mount sensitif (secret, SSH key, kredensial layanan) sebaiknya `:ro` kecuali benar-benar diperlukan.
- Gabungkan dengan `workspaceAccess: "ro"` jika Anda hanya memerlukan akses baca ke workspace; mode bind tetap independen.
- Lihat [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) untuk cara bind berinteraksi dengan kebijakan tool dan elevated exec.
</Warning>

## Image dan penyiapan

Image Docker default: `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="Bangun image default">
    ```bash
    scripts/sandbox-setup.sh
    ```

    Image default **tidak** menyertakan Node. Jika sebuah skill memerlukan Node (atau runtime lain), buat custom image atau instal melalui `sandbox.docker.setupCommand` (memerlukan egress jaringan + root yang dapat ditulis + pengguna root).

  </Step>
  <Step title="Opsional: bangun image umum">
    Untuk image sandbox yang lebih fungsional dengan tool umum (misalnya `curl`, `jq`, `nodejs`, `python3`, `git`):

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Lalu atur `agents.defaults.sandbox.docker.image` ke `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Opsional: bangun image browser sandbox">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

Secara default, container sandbox Docker berjalan **tanpa jaringan**. Override dengan `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Default Chromium browser sandbox">
    Image browser sandbox bawaan juga menerapkan default startup Chromium yang konservatif untuk workload dalam container. Default container saat ini mencakup:

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
    - `--no-sandbox` saat `noSandbox` diaktifkan.
    - Tiga flag hardening grafis (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) bersifat opsional dan berguna saat container tidak memiliki dukungan GPU. Atur `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` jika workload Anda memerlukan WebGL atau fitur browser/3D lainnya.
    - `--disable-extensions` diaktifkan secara default dan dapat dinonaktifkan dengan `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` untuk alur yang bergantung pada extension.
    - `--renderer-process-limit=2` dikendalikan oleh `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, dengan `0` mempertahankan default Chromium.

    Jika Anda memerlukan profil runtime yang berbeda, gunakan custom image browser dan sediakan entrypoint Anda sendiri. Untuk profil Chromium lokal (non-container), gunakan `browser.extraArgs` untuk menambahkan flag startup tambahan.

  </Accordion>
  <Accordion title="Default keamanan jaringan">
    - `network: "host"` diblokir.
    - `network: "container:<id>"` diblokir secara default (risiko bypass namespace join).
    - Override break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.
  </Accordion>
</AccordionGroup>

Instalasi Docker dan gateway dalam container ada di sini: [Docker](/id/install/docker)

Untuk deployment gateway Docker, `scripts/docker/setup.sh` dapat mem-bootstrap config sandbox. Atur `OPENCLAW_SANDBOX=1` (atau `true`/`yes`/`on`) untuk mengaktifkan jalur itu. Anda dapat mengoverride lokasi socket dengan `OPENCLAW_DOCKER_SOCKET`. Referensi penyiapan dan env lengkap: [Docker](/id/install/docker#agent-sandbox).

## setupCommand (penyiapan container sekali saja)

`setupCommand` berjalan **sekali** setelah container sandbox dibuat (bukan pada setiap run). Ini dieksekusi di dalam container melalui `sh -lc`.

Path:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Per-agen: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Jebakan umum">
    - Default `docker.network` adalah `"none"` (tanpa egress), jadi instalasi paket akan gagal.
    - `docker.network: "container:<id>"` memerlukan `dangerouslyAllowContainerNamespaceJoin: true` dan hanya untuk break-glass.
    - `readOnlyRoot: true` mencegah penulisan; atur `readOnlyRoot: false` atau buat custom image.
    - `user` harus root untuk instalasi paket (hilangkan `user` atau atur `user: "0:0"`).
    - Sandbox exec **tidak** mewarisi `process.env` host. Gunakan `agents.defaults.sandbox.docker.env` (atau custom image) untuk API key skill.
  </Accordion>
</AccordionGroup>

## Kebijakan tool dan jalur escape

Kebijakan allow/deny tool tetap berlaku sebelum aturan sandbox. Jika sebuah tool ditolak secara global atau per-agen, sandboxing tidak akan menghidupkannya kembali.

`tools.elevated` adalah jalur escape eksplisit yang menjalankan `exec` di luar sandbox (`gateway` secara default, atau `node` saat target exec adalah `node`). Directive `/exec` hanya berlaku untuk pengirim yang diotorisasi dan persisten per sesi; untuk menonaktifkan `exec` secara keras, gunakan tool policy deny (lihat [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugging:

- Gunakan `openclaw sandbox explain` untuk memeriksa mode sandbox efektif, kebijakan tool, dan key config perbaikan.
- Lihat [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) untuk model mental "mengapa ini diblokir?".

Jaga agar tetap terkunci.

## Override multi-agen

Setiap agen dapat mengoverride sandbox + tools: `agents.list[].sandbox` dan `agents.list[].tools` (ditambah `agents.list[].tools.sandbox.tools` untuk kebijakan tool sandbox). Lihat [Sandbox & Tools Multi-Agent](/id/tools/multi-agent-sandbox-tools) untuk prioritas.

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

## Terkait

- [Sandbox & Tools Multi-Agent](/id/tools/multi-agent-sandbox-tools) — override per-agen dan prioritas
- [OpenShell](/id/gateway/openshell) — penyiapan backend sandbox terkelola, mode workspace, dan referensi config
- [Konfigurasi sandbox](/id/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) — debugging "mengapa ini diblokir?"
- [Security](/id/gateway/security)
