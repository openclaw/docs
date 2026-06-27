---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Cara kerja sandboxing OpenClaw: mode, cakupan, akses workspace, dan gambar'
title: Isolasi Lingkungan Terbatas
x-i18n:
    generated_at: "2026-06-27T17:33:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c9754fbfc71ee5fb48df72eece8ba3b155ce5e0d9c55aae75ce21801dceb07d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw dapat menjalankan **alat di dalam backend sandbox** untuk mengurangi radius dampak. Ini **opsional** dan dikendalikan oleh konfigurasi (`agents.defaults.sandbox` atau `agents.list[].sandbox`). Jika sandboxing nonaktif, alat berjalan di host. Gateway tetap berada di host; eksekusi alat berjalan dalam sandbox terisolasi saat diaktifkan.

<Note>
Ini bukan batas keamanan yang sempurna, tetapi secara nyata membatasi akses sistem berkas dan proses saat model melakukan sesuatu yang keliru.
</Note>

## Apa yang dimasukkan ke sandbox

- Eksekusi alat (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, dll.).
- Peramban sandbox opsional (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Detail peramban sandbox">
    - Secara default, peramban sandbox otomatis dimulai (memastikan CDP dapat dijangkau) saat alat peramban membutuhkannya. Konfigurasikan melalui `agents.defaults.sandbox.browser.autoStart` dan `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Secara default, kontainer peramban sandbox menggunakan jaringan Docker khusus (`openclaw-sandbox-browser`) alih-alih jaringan `bridge` global. Konfigurasikan dengan `agents.defaults.sandbox.browser.network`.
    - `agents.defaults.sandbox.browser.cdpSourceRange` opsional membatasi ingress CDP di tepi kontainer dengan daftar izinkan CIDR (misalnya `172.21.0.1/32`).
    - Akses pengamat noVNC dilindungi kata sandi secara default; OpenClaw mengeluarkan URL token berumur pendek yang menyajikan halaman bootstrap lokal dan membuka noVNC dengan kata sandi di fragmen URL (bukan log kueri/header).
    - `agents.defaults.sandbox.browser.allowHostControl` memungkinkan sesi sandbox menargetkan peramban host secara eksplisit.
    - Daftar izinkan opsional membatasi `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Tidak dimasukkan ke sandbox:

- Proses Gateway itu sendiri.
- Alat apa pun yang secara eksplisit diizinkan berjalan di luar sandbox (misalnya `tools.elevated`).
  - **Elevated exec melewati sandboxing dan menggunakan jalur keluar yang dikonfigurasi (`gateway` secara default, atau `node` saat target exec adalah `node`).**
  - Jika sandboxing nonaktif, `tools.elevated` tidak mengubah eksekusi (sudah berada di host). Lihat [Mode Elevated](/id/tools/elevated).

## Mode

`agents.defaults.sandbox.mode` mengontrol **kapan** sandboxing digunakan:

<Tabs>
  <Tab title="off">
    Tanpa sandboxing.
  </Tab>
  <Tab title="non-main">
    Sandbox hanya sesi **non-main** (default jika Anda ingin chat normal berada di host).

    `"non-main"` didasarkan pada `session.mainKey` (default `"main"`), bukan id agen. Sesi grup/channel menggunakan kuncinya sendiri, jadi sesi tersebut dihitung sebagai non-main dan akan dimasukkan ke sandbox.

  </Tab>
  <Tab title="all">
    Setiap sesi berjalan dalam sandbox.
  </Tab>
</Tabs>

## Cakupan

`agents.defaults.sandbox.scope` mengontrol **berapa banyak kontainer** yang dibuat:

- `"agent"` (default): satu kontainer per agen.
- `"session"`: satu kontainer per sesi.
- `"shared"`: satu kontainer yang dibagikan oleh semua sesi yang dimasukkan ke sandbox.

## Backend

`agents.defaults.sandbox.backend` mengontrol **runtime mana** yang menyediakan sandbox:

- `"docker"` (default saat sandboxing diaktifkan): runtime sandbox berbasis Docker lokal.
- `"ssh"`: runtime sandbox jarak jauh generik berbasis SSH.
- `"openshell"`: runtime sandbox berbasis OpenShell.

Konfigurasi khusus SSH berada di bawah `agents.defaults.sandbox.ssh`. Konfigurasi khusus OpenShell berada di bawah `plugins.entries.openshell.config`.

### Memilih backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Tempat berjalan** | Kontainer lokal                  | Host apa pun yang dapat diakses SSH | Sandbox yang dikelola OpenShell                     |
| **Penyiapan**       | `scripts/sandbox-setup.sh`       | Kunci SSH + host target        | Plugin OpenShell diaktifkan                         |
| **Model workspace** | Bind-mount atau salin            | Kanonis jarak jauh (seed sekali) | `mirror` atau `remote`                              |
| **Kontrol jaringan** | `docker.network` (default: none) | Bergantung pada host jarak jauh | Bergantung pada OpenShell                           |
| **Sandbox peramban** | Didukung                         | Tidak didukung                 | Belum didukung                                      |
| **Bind mount**      | `docker.binds`                   | N/A                            | N/A                                                 |
| **Paling cocok untuk** | Dev lokal, isolasi penuh      | Memindahkan beban ke mesin jarak jauh | Sandbox jarak jauh terkelola dengan sinkronisasi dua arah opsional |

### Backend Docker

Sandboxing nonaktif secara default. Jika Anda mengaktifkan sandboxing dan tidak memilih backend, OpenClaw menggunakan backend Docker. Backend ini mengeksekusi alat dan peramban sandbox secara lokal melalui soket daemon Docker (`/var/run/docker.sock`). Isolasi kontainer sandbox ditentukan oleh namespace Docker.

Untuk mengekspos GPU host ke sandbox Docker, setel `agents.defaults.sandbox.docker.gpus` atau override per agen `agents.list[].sandbox.docker.gpus`. Nilai tersebut diteruskan ke flag `--gpus` Docker sebagai argumen terpisah, misalnya `"all"` atau `"device=GPU-uuid"`, dan memerlukan runtime host yang kompatibel seperti NVIDIA Container Toolkit.

<Warning>
**Batasan Docker-out-of-Docker (DooD)**

Jika Anda menerapkan OpenClaw Gateway itu sendiri sebagai kontainer Docker, Gateway mengorkestrasi kontainer sandbox saudara menggunakan soket Docker host (DooD). Ini memperkenalkan batasan pemetaan jalur tertentu:

- **Konfigurasi memerlukan jalur host**: Konfigurasi `workspace` `openclaw.json` HARUS berisi **jalur absolut Host** (misalnya `/home/user/.openclaw/workspaces`), bukan jalur internal kontainer Gateway. Saat OpenClaw meminta daemon Docker untuk menjalankan sandbox, daemon mengevaluasi jalur relatif terhadap namespace OS Host, bukan namespace Gateway.
- **Paritas jembatan FS (peta volume identik)**: Proses native OpenClaw Gateway juga menulis heartbeat dan berkas bridge ke direktori `workspace`. Karena Gateway mengevaluasi string yang persis sama (jalur host) dari dalam lingkungan terkonteinerisasinya sendiri, deployment Gateway HARUS menyertakan peta volume identik yang menautkan namespace host secara native (`-v /home/user/.openclaw:/home/user/.openclaw`).
- **Mode kode Codex**: Saat sandbox OpenClaw aktif, OpenClaw menonaktifkan Code Mode native server aplikasi Codex, server MCP pengguna, dan eksekusi Plugin berbasis aplikasi untuk giliran tersebut karena surface native tersebut berjalan dari proses server aplikasi host Gateway, bukan dari backend sandbox OpenClaw. Akses shell diekspos melalui alat berbasis sandbox OpenClaw seperti `sandbox_exec` dan `sandbox_process` saat alat exec/process normal tersedia. Jangan mount soket Docker host ke dalam kontainer sandbox agen atau sandbox Codex khusus.

Pada host Ubuntu/AppArmor, Codex `workspace-write` dapat gagal sebelum startup shell
saat Anda sengaja menjalankan Codex `workspace-write` native tanpa sandboxing
OpenClaw aktif dan pengguna layanan tidak diizinkan membuat namespace pengguna
tanpa privilege. Saat egress sandbox Docker dinonaktifkan (`network: "none"`,
default), Codex juga memerlukan namespace jaringan tanpa privilege. Gejala umum adalah
`bwrap: setting up uid map: Permission denied` dan
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Jalankan
`openclaw doctor`; jika melaporkan kegagalan probe namespace bwrap Codex, lebih baik gunakan
profil AppArmor yang memberikan namespace yang diperlukan kepada proses layanan
OpenClaw. `kernel.apparmor_restrict_unprivileged_userns=0` adalah fallback
seluruh host dengan kompromi keamanan; gunakan hanya saat postur host tersebut
dapat diterima.

Jika Anda memetakan jalur secara internal tanpa paritas host absolut, OpenClaw secara native melempar galat izin `EACCES` saat mencoba menulis heartbeat di dalam lingkungan kontainer karena string jalur yang sepenuhnya terkualifikasi tidak ada secara native.
</Warning>

### Backend SSH

Gunakan `backend: "ssh"` saat Anda ingin OpenClaw memasukkan `exec`, alat berkas, dan pembacaan media ke sandbox pada mesin arbitrer yang dapat diakses SSH.

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

<AccordionGroup>
  <Accordion title="Cara kerjanya">
    - OpenClaw membuat root jarak jauh per cakupan di bawah `sandbox.ssh.workspaceRoot`.
    - Pada penggunaan pertama setelah pembuatan atau pembuatan ulang, OpenClaw melakukan seed workspace jarak jauh tersebut dari workspace lokal sekali.
    - Setelah itu, `exec`, `read`, `write`, `edit`, `apply_patch`, pembacaan media prompt, dan staging media masuk berjalan langsung terhadap workspace jarak jauh melalui SSH.
    - OpenClaw tidak menyinkronkan perubahan jarak jauh kembali ke workspace lokal secara otomatis.

  </Accordion>
  <Accordion title="Material autentikasi">
    - `identityFile`, `certificateFile`, `knownHostsFile`: gunakan berkas lokal yang ada dan teruskan melalui konfigurasi OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: gunakan string inline atau SecretRefs. OpenClaw menyelesaikannya melalui snapshot runtime rahasia normal, menulisnya ke berkas temp dengan `0600`, dan menghapusnya saat sesi SSH berakhir.
    - Jika `*File` dan `*Data` sama-sama disetel untuk item yang sama, `*Data` menang untuk sesi SSH tersebut.

  </Accordion>
  <Accordion title="Konsekuensi kanonis jarak jauh">
    Ini adalah model **kanonis jarak jauh**. Workspace SSH jarak jauh menjadi status sandbox nyata setelah seed awal.

    - Edit host-lokal yang dibuat di luar OpenClaw setelah langkah seed tidak terlihat secara jarak jauh sampai Anda membuat ulang sandbox.
    - `openclaw sandbox recreate` menghapus root jarak jauh per cakupan dan melakukan seed lagi dari lokal pada penggunaan berikutnya.
    - Sandboxing peramban tidak didukung pada backend SSH.
    - Pengaturan `sandbox.docker.*` tidak berlaku untuk backend SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Gunakan `backend: "openshell"` saat Anda ingin OpenClaw memasukkan alat ke sandbox dalam lingkungan jarak jauh yang dikelola OpenShell. Untuk panduan penyiapan lengkap, referensi konfigurasi, dan perbandingan mode workspace, lihat [halaman OpenShell](/id/gateway/openshell) khusus.

OpenShell menggunakan ulang transport SSH inti dan jembatan sistem berkas jarak jauh yang sama seperti backend SSH generik, serta menambahkan siklus hidup khusus OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) plus mode workspace `mirror` opsional.

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

- `mirror` (default): workspace lokal tetap kanonis. OpenClaw menyinkronkan berkas lokal ke OpenShell sebelum exec dan menyinkronkan workspace jarak jauh kembali setelah exec.
- `remote`: workspace OpenShell menjadi kanonis setelah sandbox dibuat. OpenClaw melakukan seed workspace jarak jauh sekali dari workspace lokal, lalu alat berkas dan exec berjalan langsung terhadap sandbox jarak jauh tanpa menyinkronkan perubahan kembali.

<AccordionGroup>
  <Accordion title="Detail transport jarak jauh">
    - OpenClaw meminta konfigurasi SSH khusus sandbox dari OpenShell melalui `openshell sandbox ssh-config <name>`.
    - Core menulis konfigurasi SSH tersebut ke file sementara, membuka sesi SSH, dan menggunakan ulang bridge filesystem jarak jauh yang sama yang digunakan oleh `backend: "ssh"`.
    - Dalam mode `mirror`, hanya siklus hidupnya yang berbeda: sinkronkan lokal ke jarak jauh sebelum exec, lalu sinkronkan kembali setelah exec.

  </Accordion>
  <Accordion title="Keterbatasan OpenShell saat ini">
    - peramban sandbox belum didukung
    - `sandbox.docker.binds` tidak didukung pada backend OpenShell
    - knob runtime khusus Docker di bawah `sandbox.docker.*` tetap hanya berlaku untuk backend Docker

  </Accordion>
</AccordionGroup>

#### Mode workspace

OpenShell memiliki dua model workspace. Ini adalah bagian yang paling penting dalam praktik.

<Tabs>
  <Tab title="mirror (kanonis lokal)">
    Gunakan `plugins.entries.openshell.config.mode: "mirror"` ketika Anda ingin **workspace lokal tetap menjadi kanonis**.

    Perilaku:

    - Sebelum `exec`, OpenClaw menyinkronkan workspace lokal ke sandbox OpenShell.
    - Setelah `exec`, OpenClaw menyinkronkan workspace jarak jauh kembali ke workspace lokal.
    - Tool file tetap beroperasi melalui bridge sandbox, tetapi workspace lokal tetap menjadi sumber kebenaran antar giliran.

    Gunakan ini ketika:

    - Anda mengedit file secara lokal di luar OpenClaw dan ingin perubahan tersebut muncul di sandbox secara otomatis
    - Anda ingin sandbox OpenShell berperilaku semirip mungkin dengan backend Docker
    - Anda ingin workspace host mencerminkan penulisan sandbox setelah setiap giliran exec

    Konsekuensi: biaya sinkronisasi tambahan sebelum dan setelah exec.

  </Tab>
  <Tab title="remote (OpenShell kanonis)">
    Gunakan `plugins.entries.openshell.config.mode: "remote"` ketika Anda ingin **workspace OpenShell menjadi kanonis**.

    Perilaku:

    - Saat sandbox pertama kali dibuat, OpenClaw mengisi workspace jarak jauh dari workspace lokal satu kali.
    - Setelah itu, `exec`, `read`, `write`, `edit`, dan `apply_patch` beroperasi langsung terhadap workspace OpenShell jarak jauh.
    - OpenClaw **tidak** menyinkronkan perubahan jarak jauh kembali ke workspace lokal setelah exec.
    - Pembacaan media saat prompt tetap berfungsi karena tool file dan media membaca melalui bridge sandbox, bukan mengasumsikan path host lokal.
    - Transport adalah SSH ke sandbox OpenShell yang dikembalikan oleh `openshell sandbox ssh-config`.

    Konsekuensi penting:

    - Jika Anda mengedit file di host di luar OpenClaw setelah langkah pengisian awal, sandbox jarak jauh **tidak** akan melihat perubahan tersebut secara otomatis.
    - Jika sandbox dibuat ulang, workspace jarak jauh diisi lagi dari workspace lokal.
    - Dengan `scope: "agent"` atau `scope: "shared"`, workspace jarak jauh tersebut dibagikan pada cakupan yang sama.

    Gunakan ini ketika:

    - sandbox sebaiknya terutama berada di sisi OpenShell jarak jauh
    - Anda ingin overhead sinkronisasi per giliran yang lebih rendah
    - Anda tidak ingin edit lokal host menimpa state sandbox jarak jauh secara diam-diam

  </Tab>
</Tabs>

Pilih `mirror` jika Anda menganggap sandbox sebagai lingkungan eksekusi sementara. Pilih `remote` jika Anda menganggap sandbox sebagai workspace sebenarnya.

#### Siklus hidup OpenShell

Sandbox OpenShell tetap dikelola melalui siklus hidup sandbox normal:

- `openclaw sandbox list` menampilkan runtime OpenShell serta runtime Docker
- `openclaw sandbox recreate` menghapus runtime saat ini dan membiarkan OpenClaw membuatnya ulang pada penggunaan berikutnya
- logika prune juga sadar backend

Untuk mode `remote`, pembuatan ulang sangat penting:

- pembuatan ulang menghapus workspace jarak jauh kanonis untuk cakupan tersebut
- penggunaan berikutnya mengisi workspace jarak jauh baru dari workspace lokal

Untuk mode `mirror`, pembuatan ulang terutama mereset lingkungan eksekusi jarak jauh karena workspace lokal tetap kanonis.

## Akses workspace

`agents.defaults.sandbox.workspaceAccess` mengontrol **apa yang dapat dilihat sandbox**:

<Tabs>
  <Tab title="none (default)">
    Tool melihat workspace sandbox di bawah `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Me-mount workspace agen sebagai baca-saja di `/agent` (menonaktifkan `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Me-mount workspace agen sebagai baca/tulis di `/workspace`.
  </Tab>
</Tabs>

Dengan backend OpenShell:

- mode `mirror` tetap menggunakan workspace lokal sebagai sumber kanonis antar giliran exec
- mode `remote` menggunakan workspace OpenShell jarak jauh sebagai sumber kanonis setelah pengisian awal
- `workspaceAccess: "ro"` dan `"none"` tetap membatasi perilaku penulisan dengan cara yang sama

Media masuk disalin ke workspace sandbox aktif (`media/inbound/*`).

<Note>
**Catatan Skills:** tool `read` berakar pada sandbox. Dengan `workspaceAccess: "none"`, OpenClaw mencerminkan Skills yang memenuhi syarat ke workspace sandbox (`.../skills`) agar dapat dibaca. Dengan `"rw"`, Skills workspace dapat dibaca dari `/workspace/skills`, dan Skills terkelola, bawaan, atau plugin yang memenuhi syarat diwujudkan ke path baca-saja yang dihasilkan `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## Mount bind kustom

`agents.defaults.sandbox.docker.binds` me-mount direktori host tambahan ke dalam kontainer. Format: `host:container:mode` (misalnya, `"/home/user/source:/source:rw"`).

Bind global dan per agen **digabungkan** (bukan diganti). Di bawah `scope: "shared"`, bind per agen diabaikan.

`agents.defaults.sandbox.browser.binds` me-mount direktori host tambahan hanya ke kontainer **peramban sandbox**.

- Saat disetel (termasuk `[]`), ini menggantikan `agents.defaults.sandbox.docker.binds` untuk kontainer peramban.
- Saat dihilangkan, kontainer peramban fallback ke `agents.defaults.sandbox.docker.binds` (kompatibel mundur).

Contoh (sumber baca-saja + direktori data tambahan):

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

- Bind melewati filesystem sandbox: bind mengekspos path host dengan mode apa pun yang Anda setel (`:ro` atau `:rw`).
- OpenClaw memblokir sumber bind berbahaya (misalnya: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev`, dan mount induk yang akan mengeksposnya).
- OpenClaw juga memblokir root kredensial direktori home umum seperti `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, dan `~/.ssh`.
- Validasi bind bukan sekadar pencocokan string. OpenClaw menormalkan path sumber, lalu menyelesaikannya lagi melalui ancestor terdalam yang sudah ada sebelum memeriksa ulang path yang diblokir dan root yang diizinkan.
- Itu berarti escape melalui induk symlink tetap gagal tertutup bahkan ketika leaf akhir belum ada. Contoh: `/workspace/run-link/new-file` tetap diselesaikan sebagai `/var/run/...` jika `run-link` menunjuk ke sana.
- Root sumber yang diizinkan dikanonisasi dengan cara yang sama, sehingga path yang hanya tampak berada di dalam allowlist sebelum resolusi symlink tetap ditolak sebagai `outside allowed roots`.
- Mount sensitif (secret, kunci SSH, kredensial layanan) sebaiknya `:ro` kecuali benar-benar diperlukan.
- Gabungkan dengan `workspaceAccess: "ro"` jika Anda hanya membutuhkan akses baca ke workspace; mode bind tetap independen.
- Lihat [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) untuk cara bind berinteraksi dengan kebijakan tool dan exec elevated.

</Warning>

## Image dan penyiapan

Image Docker default: `openclaw-sandbox:bookworm-slim`

<Note>
**Checkout sumber vs instalasi npm**

Skrip pembantu `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh`, dan `scripts/sandbox-browser-setup.sh` hanya tersedia saat berjalan dari [checkout sumber](https://github.com/openclaw/openclaw). Skrip tersebut tidak disertakan dalam paket npm.

Jika Anda menginstal OpenClaw melalui `npm install -g openclaw`, gunakan perintah inline `docker build` yang ditampilkan di bawah.
</Note>

<Steps>
  <Step title="Bangun image default">
    Dari checkout sumber:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Dari instalasi npm (tidak perlu checkout sumber):

    ```bash
    docker build -t openclaw-sandbox:bookworm-slim - <<'DOCKERFILE'
    FROM debian:bookworm-slim
    ENV DEBIAN_FRONTEND=noninteractive
    RUN apt-get update && apt-get install -y --no-install-recommends \
      bash ca-certificates curl git jq python3 ripgrep \
      && rm -rf /var/lib/apt/lists/*
    RUN useradd --create-home --shell /bin/bash sandbox
    USER sandbox
    WORKDIR /home/sandbox
    CMD ["sleep", "infinity"]
    DOCKERFILE
    ```

    Image default **tidak** menyertakan Node. Jika sebuah skill membutuhkan Node (atau runtime lain), bake image kustom atau instal melalui `sandbox.docker.setupCommand` (memerlukan egress jaringan + root yang dapat ditulis + pengguna root).

    OpenClaw tidak mengganti secara diam-diam dengan `debian:bookworm-slim` polos saat `openclaw-sandbox:bookworm-slim` tidak ada. Eksekusi sandbox yang menargetkan image default akan gagal cepat dengan instruksi build sampai Anda membangunnya, karena image bawaan membawa `python3` untuk pembantu tulis/edit sandbox.

  </Step>
  <Step title="Opsional: bangun image umum">
    Untuk image sandbox yang lebih fungsional dengan tooling umum (misalnya `curl`, `jq`, Node 24, pnpm, `python3`, dan `git`):

    Dari checkout sumber:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Dari instalasi npm, bangun image default terlebih dahulu (lihat di atas), lalu bangun image umum di atasnya menggunakan [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) dari repositori.

    Lalu setel `agents.defaults.sandbox.docker.image` ke `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Opsional: bangun image peramban sandbox">
    Dari checkout sumber:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Dari instalasi npm, bangun menggunakan [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) dari repositori.

  </Step>
</Steps>

Secara default, kontainer sandbox Docker berjalan dengan **tanpa jaringan**. Timpa dengan `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Default Chromium peramban sandbox">
    Image peramban sandbox bawaan juga menerapkan default startup Chromium yang konservatif untuk workload terkontainerisasi. Default kontainer saat ini mencakup:

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
    - Tiga flag pengerasan grafis (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) bersifat opsional dan berguna saat kontainer tidak memiliki dukungan GPU. Setel `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` jika workload Anda memerlukan WebGL atau fitur 3D/peramban lainnya.
    - `--disable-extensions` diaktifkan secara default dan dapat dinonaktifkan dengan `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` untuk alur yang bergantung pada ekstensi.
    - `--renderer-process-limit=2` dikontrol oleh `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, dengan `0` mempertahankan default Chromium.

    Jika Anda membutuhkan profil runtime yang berbeda, gunakan image peramban kustom dan sediakan entrypoint Anda sendiri. Untuk profil Chromium lokal (non-kontainer), gunakan `browser.extraArgs` untuk menambahkan flag startup tambahan.

  </Accordion>
  <Accordion title="Default keamanan jaringan">
    - `network: "host"` diblokir.
    - `network: "container:<id>"` diblokir secara default (risiko bypass penggabungan namespace).
    - Override darurat: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Instalasi Docker dan gateway dalam kontainer berada di sini: [Docker](/id/install/docker)

Untuk deployment Gateway Docker, `scripts/docker/setup.sh` dapat melakukan bootstrap konfigurasi sandbox. Tetapkan `OPENCLAW_SANDBOX=1` (atau `true`/`yes`/`on`) untuk mengaktifkan jalur tersebut. Anda dapat mengganti lokasi socket dengan `OPENCLAW_DOCKER_SOCKET`. Referensi setup dan env lengkap: [Docker](/id/install/docker#agent-sandbox).

## setupCommand (setup kontainer satu kali)

`setupCommand` berjalan **sekali** setelah kontainer sandbox dibuat (bukan pada setiap run). Ini dieksekusi di dalam kontainer melalui `sh -lc`.

Path:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Per-agent: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Kesalahan umum">
    - Default `docker.network` adalah `"none"` (tanpa egress), sehingga instalasi paket akan gagal.
    - `docker.network: "container:<id>"` memerlukan `dangerouslyAllowContainerNamespaceJoin: true` dan hanya untuk darurat.
    - `readOnlyRoot: true` mencegah penulisan; tetapkan `readOnlyRoot: false` atau buat image kustom.
    - `user` harus root untuk instalasi paket (hilangkan `user` atau tetapkan `user: "0:0"`).
    - Exec sandbox **tidak** mewarisi `process.env` host. Gunakan `agents.defaults.sandbox.docker.env` (atau image kustom) untuk kunci API skill.
    - Nilai dalam `agents.defaults.sandbox.docker.env` diteruskan sebagai variabel lingkungan kontainer Docker eksplisit. Siapa pun yang memiliki akses daemon Docker dapat memeriksanya dengan perintah metadata Docker seperti `docker inspect`. Gunakan image kustom, file secret yang di-mount, atau jalur pengiriman secret lain jika paparan metadata tersebut tidak dapat diterima.

  </Accordion>
</AccordionGroup>

## Kebijakan tool dan jalan keluar darurat

Kebijakan izinkan/tolak tool tetap berlaku sebelum aturan sandbox. Jika sebuah tool ditolak secara global atau per-agent, sandboxing tidak mengaktifkannya kembali.

`tools.elevated` adalah jalan keluar darurat eksplisit yang menjalankan `exec` di luar sandbox (`gateway` secara default, atau `node` saat target exec adalah `node`). Direktif `/exec` hanya berlaku untuk pengirim yang berwenang dan bertahan per sesi; untuk menonaktifkan `exec` sepenuhnya, gunakan penolakan kebijakan tool (lihat [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugging:

- Gunakan `openclaw sandbox explain` untuk memeriksa mode sandbox efektif, kebijakan tool, dan kunci konfigurasi perbaikan.
- Lihat [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) untuk model mental "mengapa ini diblokir?".

Jaga tetap terkunci.

## Override multi-agent

Setiap agent dapat mengganti sandbox + tools: `agents.list[].sandbox` dan `agents.list[].tools` (ditambah `agents.list[].tools.sandbox.tools` untuk kebijakan tool sandbox). Lihat [Multi-Agent Sandbox & Tools](/id/tools/multi-agent-sandbox-tools) untuk presedensi.

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

- [Multi-Agent Sandbox & Tools](/id/tools/multi-agent-sandbox-tools) — override per-agent dan presedensi
- [OpenShell](/id/gateway/openshell) — setup backend sandbox terkelola, mode workspace, dan referensi konfigurasi
- [Konfigurasi sandbox](/id/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) — debugging "mengapa ini diblokir?"
- [Keamanan](/id/gateway/security)
