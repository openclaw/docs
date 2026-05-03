---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Cara kerja isolasi OpenClaw: mode, cakupan, akses ruang kerja, dan gambar'
title: Isolasi Sandbox
x-i18n:
    generated_at: "2026-05-03T21:32:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: e887d07ed84d582bb605c75f841499b6bed42cfc94d60690aba33c2f351b272b
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw dapat menjalankan **alat di dalam backend sandbox** untuk mengurangi radius dampak. Ini **opsional** dan dikendalikan oleh konfigurasi (`agents.defaults.sandbox` atau `agents.list[].sandbox`). Jika sandboxing nonaktif, alat berjalan di host. Gateway tetap berada di host; eksekusi alat berjalan di sandbox terisolasi saat diaktifkan.

<Note>
Ini bukan batas keamanan yang sempurna, tetapi secara nyata membatasi akses sistem file dan proses ketika model melakukan sesuatu yang bodoh.
</Note>

## Apa yang dimasukkan ke sandbox

- Eksekusi alat (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, dll.).
- Browser bersandbox opsional (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Detail browser bersandbox">
    - Secara default, browser sandbox dimulai otomatis (memastikan CDP dapat dijangkau) saat alat browser membutuhkannya. Konfigurasikan melalui `agents.defaults.sandbox.browser.autoStart` dan `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Secara default, kontainer browser sandbox menggunakan jaringan Docker khusus (`openclaw-sandbox-browser`) alih-alih jaringan global `bridge`. Konfigurasikan dengan `agents.defaults.sandbox.browser.network`.
    - `agents.defaults.sandbox.browser.cdpSourceRange` opsional membatasi ingress CDP di tepi kontainer dengan daftar izin CIDR (misalnya `172.21.0.1/32`).
    - Akses pengamat noVNC dilindungi kata sandi secara default; OpenClaw mengeluarkan URL token berumur pendek yang menyajikan halaman bootstrap lokal dan membuka noVNC dengan kata sandi di fragmen URL (bukan log query/header).
    - `agents.defaults.sandbox.browser.allowHostControl` memungkinkan sesi bersandbox menargetkan browser host secara eksplisit.
    - Daftar izin opsional membatasi `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Tidak dimasukkan ke sandbox:

- Proses Gateway itu sendiri.
- Alat apa pun yang secara eksplisit diizinkan berjalan di luar sandbox (mis. `tools.elevated`).
  - **Elevated exec melewati sandboxing dan menggunakan jalur escape yang dikonfigurasi (`gateway` secara default, atau `node` saat target exec adalah `node`).**
  - Jika sandboxing nonaktif, `tools.elevated` tidak mengubah eksekusi (sudah di host). Lihat [Mode Elevated](/id/tools/elevated).

## Mode

`agents.defaults.sandbox.mode` mengontrol **kapan** sandboxing digunakan:

<Tabs>
  <Tab title="off">
    Tanpa sandboxing.
  </Tab>
  <Tab title="non-main">
    Sandbox hanya untuk sesi **non-main** (default jika Anda ingin chat normal berada di host).

    `"non-main"` didasarkan pada `session.mainKey` (default `"main"`), bukan id agen. Sesi grup/channel menggunakan kuncinya sendiri, sehingga dihitung sebagai non-main dan akan dimasukkan ke sandbox.

  </Tab>
  <Tab title="all">
    Setiap sesi berjalan di sandbox.
  </Tab>
</Tabs>

## Cakupan

`agents.defaults.sandbox.scope` mengontrol **berapa banyak kontainer** yang dibuat:

- `"agent"` (default): satu kontainer per agen.
- `"session"`: satu kontainer per sesi.
- `"shared"`: satu kontainer yang dibagikan oleh semua sesi bersandbox.

## Backend

`agents.defaults.sandbox.backend` mengontrol **runtime mana** yang menyediakan sandbox:

- `"docker"` (default saat sandboxing diaktifkan): runtime sandbox lokal berbasis Docker.
- `"ssh"`: runtime sandbox jarak jauh generik berbasis SSH.
- `"openshell"`: runtime sandbox berbasis OpenShell.

Konfigurasi khusus SSH berada di bawah `agents.defaults.sandbox.ssh`. Konfigurasi khusus OpenShell berada di bawah `plugins.entries.openshell.config`.

### Memilih backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Tempat berjalan** | Kontainer lokal                  | Host apa pun yang dapat diakses SSH | Sandbox terkelola OpenShell                         |
| **Penyiapan**       | `scripts/sandbox-setup.sh`       | Kunci SSH + host target        | Plugin OpenShell diaktifkan                         |
| **Model workspace** | Bind-mount atau salin            | Kanonis-jarak-jauh (seed sekali) | `mirror` atau `remote`                              |
| **Kontrol jaringan** | `docker.network` (default: none) | Bergantung pada host jarak jauh | Bergantung pada OpenShell                           |
| **Browser sandbox** | Didukung                         | Tidak didukung                 | Belum didukung                                      |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **Paling cocok untuk** | Dev lokal, isolasi penuh       | Mengalihkan beban ke mesin jarak jauh | Sandbox jarak jauh terkelola dengan sinkronisasi dua arah opsional |

### Backend Docker

Sandboxing nonaktif secara default. Jika Anda mengaktifkan sandboxing dan tidak memilih backend, OpenClaw menggunakan backend Docker. Backend ini mengeksekusi alat dan browser sandbox secara lokal melalui soket daemon Docker (`/var/run/docker.sock`). Isolasi kontainer sandbox ditentukan oleh namespace Docker.

Untuk mengekspos GPU host ke sandbox Docker, atur `agents.defaults.sandbox.docker.gpus` atau override per agen `agents.list[].sandbox.docker.gpus`. Nilainya diteruskan ke flag `--gpus` Docker sebagai argumen terpisah, misalnya `"all"` atau `"device=GPU-uuid"`, dan membutuhkan runtime host yang kompatibel seperti NVIDIA Container Toolkit.

<Warning>
**Batasan Docker-out-of-Docker (DooD)**

Jika Anda menerapkan OpenClaw Gateway itu sendiri sebagai kontainer Docker, Gateway mengorkestrasi kontainer sandbox saudara menggunakan soket Docker host (DooD). Ini menimbulkan batasan pemetaan jalur tertentu:

- **Konfigurasi membutuhkan jalur host**: Konfigurasi `workspace` `openclaw.json` HARUS berisi **jalur absolut Host** (mis. `/home/user/.openclaw/workspaces`), bukan jalur internal kontainer Gateway. Saat OpenClaw meminta daemon Docker membuat sandbox, daemon mengevaluasi jalur relatif terhadap namespace OS Host, bukan namespace Gateway.
- **Paritas bridge FS (peta volume identik)**: Proses native OpenClaw Gateway juga menulis file heartbeat dan bridge ke direktori `workspace`. Karena Gateway mengevaluasi string yang persis sama (jalur host) dari dalam lingkungan terkontainerisasinya sendiri, penerapan Gateway HARUS menyertakan peta volume identik yang menautkan namespace host secara native (`-v /home/user/.openclaw:/home/user/.openclaw`).

Jika Anda memetakan jalur secara internal tanpa paritas host absolut, OpenClaw secara native melempar error izin `EACCES` saat mencoba menulis heartbeat-nya di dalam lingkungan kontainer karena string jalur lengkap tersebut tidak ada secara native.
</Warning>

### Backend SSH

Gunakan `backend: "ssh"` saat Anda ingin OpenClaw memasukkan `exec`, alat file, dan pembacaan media ke sandbox pada mesin arbitrer yang dapat diakses SSH.

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
    - Pada penggunaan pertama setelah dibuat atau dibuat ulang, OpenClaw melakukan seed workspace jarak jauh tersebut dari workspace lokal sekali.
    - Setelah itu, `exec`, `read`, `write`, `edit`, `apply_patch`, pembacaan media prompt, dan staging media masuk berjalan langsung terhadap workspace jarak jauh melalui SSH.
    - OpenClaw tidak menyinkronkan perubahan jarak jauh kembali ke workspace lokal secara otomatis.

  </Accordion>
  <Accordion title="Materi autentikasi">
    - `identityFile`, `certificateFile`, `knownHostsFile`: gunakan file lokal yang ada dan teruskan melalui konfigurasi OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: gunakan string inline atau SecretRefs. OpenClaw menyelesaikannya melalui snapshot runtime rahasia normal, menulisnya ke file temp dengan `0600`, dan menghapusnya saat sesi SSH berakhir.
    - Jika `*File` dan `*Data` sama-sama diatur untuk item yang sama, `*Data` menang untuk sesi SSH tersebut.

  </Accordion>
  <Accordion title="Konsekuensi kanonis-jarak-jauh">
    Ini adalah model **kanonis-jarak-jauh**. Workspace SSH jarak jauh menjadi state sandbox yang sebenarnya setelah seed awal.

    - Edit host-lokal yang dibuat di luar OpenClaw setelah langkah seed tidak terlihat dari jarak jauh sampai Anda membuat ulang sandbox.
    - `openclaw sandbox recreate` menghapus root jarak jauh per cakupan dan melakukan seed lagi dari lokal pada penggunaan berikutnya.
    - Sandboxing browser tidak didukung pada backend SSH.
    - Pengaturan `sandbox.docker.*` tidak berlaku untuk backend SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Gunakan `backend: "openshell"` saat Anda ingin OpenClaw memasukkan alat ke sandbox dalam lingkungan jarak jauh yang dikelola OpenShell. Untuk panduan penyiapan lengkap, referensi konfigurasi, dan perbandingan mode workspace, lihat [halaman OpenShell](/id/gateway/openshell) khusus.

OpenShell menggunakan kembali transport SSH inti yang sama dan bridge sistem file jarak jauh yang sama dengan backend SSH generik, serta menambahkan lifecycle khusus OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) plus mode workspace `mirror` opsional.

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
- `remote`: workspace OpenShell menjadi kanonis setelah sandbox dibuat. OpenClaw melakukan seed workspace jarak jauh sekali dari workspace lokal, lalu alat file dan exec berjalan langsung terhadap sandbox jarak jauh tanpa menyinkronkan perubahan kembali.

<AccordionGroup>
  <Accordion title="Detail transport jarak jauh">
    - OpenClaw meminta konfigurasi SSH khusus sandbox dari OpenShell melalui `openshell sandbox ssh-config <name>`.
    - Core menulis konfigurasi SSH tersebut ke file temp, membuka sesi SSH, dan menggunakan kembali bridge sistem file jarak jauh yang sama yang digunakan oleh `backend: "ssh"`.
    - Hanya dalam mode `mirror` lifecycle berbeda: sinkronkan lokal ke jarak jauh sebelum exec, lalu sinkronkan kembali setelah exec.

  </Accordion>
  <Accordion title="Batasan OpenShell saat ini">
    - browser sandbox belum didukung
    - `sandbox.docker.binds` tidak didukung pada backend OpenShell
    - knob runtime khusus Docker di bawah `sandbox.docker.*` masih hanya berlaku untuk backend Docker

  </Accordion>
</AccordionGroup>

#### Mode workspace

OpenShell memiliki dua model workspace. Ini adalah bagian yang paling penting dalam praktik.

<Tabs>
  <Tab title="mirror (kanonis lokal)">
    Gunakan `plugins.entries.openshell.config.mode: "mirror"` saat Anda ingin **workspace lokal tetap kanonis**.

    Perilaku:

    - Sebelum `exec`, OpenClaw menyinkronkan workspace lokal ke sandbox OpenShell.
    - Setelah `exec`, OpenClaw menyinkronkan workspace jarak jauh kembali ke workspace lokal.
    - Alat file tetap beroperasi melalui bridge sandbox, tetapi workspace lokal tetap menjadi sumber kebenaran di antara giliran.

    Gunakan ini saat:

    - Anda mengedit file secara lokal di luar OpenClaw dan ingin perubahan tersebut muncul di sandbox secara otomatis
    - Anda ingin sandbox OpenShell berperilaku semirip mungkin dengan backend Docker
    - Anda ingin workspace host mencerminkan penulisan sandbox setelah setiap giliran exec

    Tradeoff: biaya sinkronisasi tambahan sebelum dan sesudah exec.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    Gunakan `plugins.entries.openshell.config.mode: "remote"` ketika Anda ingin **workspace OpenShell menjadi kanonis**.

    Perilaku:

    - Saat sandbox pertama kali dibuat, OpenClaw mengisi workspace jarak jauh dari workspace lokal satu kali.
    - Setelah itu, `exec`, `read`, `write`, `edit`, dan `apply_patch` beroperasi langsung pada workspace OpenShell jarak jauh.
    - OpenClaw **tidak** menyinkronkan perubahan jarak jauh kembali ke workspace lokal setelah exec.
    - Pembacaan media saat prompt tetap berfungsi karena alat file dan media membaca melalui bridge sandbox, bukan mengasumsikan path host lokal.
    - Transport menggunakan SSH ke sandbox OpenShell yang dikembalikan oleh `openshell sandbox ssh-config`.

    Konsekuensi penting:

    - Jika Anda mengedit file pada host di luar OpenClaw setelah langkah seed, sandbox jarak jauh **tidak** akan melihat perubahan tersebut secara otomatis.
    - Jika sandbox dibuat ulang, workspace jarak jauh diisi lagi dari workspace lokal.
    - Dengan `scope: "agent"` atau `scope: "shared"`, workspace jarak jauh tersebut dibagikan pada scope yang sama.

    Gunakan ini ketika:

    - sandbox sebaiknya terutama berada di sisi OpenShell jarak jauh
    - Anda ingin overhead sinkronisasi per giliran lebih rendah
    - Anda tidak ingin edit lokal host diam-diam menimpa state sandbox jarak jauh

  </Tab>
</Tabs>

Pilih `mirror` jika Anda menganggap sandbox sebagai lingkungan eksekusi sementara. Pilih `remote` jika Anda menganggap sandbox sebagai workspace sebenarnya.

#### Siklus hidup OpenShell

Sandbox OpenShell tetap dikelola melalui siklus hidup sandbox normal:

- `openclaw sandbox list` menampilkan runtime OpenShell serta runtime Docker
- `openclaw sandbox recreate` menghapus runtime saat ini dan membiarkan OpenClaw membuatnya ulang pada penggunaan berikutnya
- logika prune juga sadar backend

Untuk mode `remote`, recreate sangat penting:

- recreate menghapus workspace jarak jauh kanonis untuk scope tersebut
- penggunaan berikutnya mengisi workspace jarak jauh baru dari workspace lokal

Untuk mode `mirror`, recreate terutama mereset lingkungan eksekusi jarak jauh karena workspace lokal tetap kanonis.

## Akses workspace

`agents.defaults.sandbox.workspaceAccess` mengontrol **apa yang dapat dilihat sandbox**:

<Tabs>
  <Tab title="none (default)">
    Alat melihat workspace sandbox di bawah `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Memasang workspace agen secara hanya-baca di `/agent` (menonaktifkan `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Memasang workspace agen baca/tulis di `/workspace`.
  </Tab>
</Tabs>

Dengan backend OpenShell:

- mode `mirror` tetap menggunakan workspace lokal sebagai sumber kanonis di antara giliran exec
- mode `remote` menggunakan workspace OpenShell jarak jauh sebagai sumber kanonis setelah seed awal
- `workspaceAccess: "ro"` dan `"none"` tetap membatasi perilaku tulis dengan cara yang sama

Media masuk disalin ke workspace sandbox aktif (`media/inbound/*`).

<Note>
**Catatan Skills:** alat `read` berbasis root sandbox. Dengan `workspaceAccess: "none"`, OpenClaw mencerminkan Skills yang memenuhi syarat ke workspace sandbox (`.../skills`) agar dapat dibaca. Dengan `"rw"`, Skills workspace dapat dibaca dari `/workspace/skills`.
</Note>

## Bind mount khusus

`agents.defaults.sandbox.docker.binds` memasang direktori host tambahan ke dalam container. Format: `host:container:mode` (misalnya, `"/home/user/source:/source:rw"`).

Bind global dan per agen **digabungkan** (bukan diganti). Di bawah `scope: "shared"`, bind per agen diabaikan.

`agents.defaults.sandbox.browser.binds` memasang direktori host tambahan hanya ke dalam container **browser sandbox**.

- Ketika disetel (termasuk `[]`), ini menggantikan `agents.defaults.sandbox.docker.binds` untuk container browser.
- Ketika dihilangkan, container browser menggunakan fallback ke `agents.defaults.sandbox.docker.binds` (kompatibel mundur).

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

<Warning>
**Keamanan bind**

- Bind melewati filesystem sandbox: bind mengekspos path host dengan mode apa pun yang Anda setel (`:ro` atau `:rw`).
- OpenClaw memblokir sumber bind berbahaya (misalnya: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev`, dan mount induk yang akan mengeksposnya).
- OpenClaw juga memblokir root kredensial direktori home umum seperti `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, dan `~/.ssh`.
- Validasi bind bukan sekadar pencocokan string. OpenClaw menormalkan path sumber, lalu menyelesaikannya kembali melalui ancestor terdalam yang ada sebelum memeriksa ulang path yang diblokir dan root yang diizinkan.
- Artinya escape melalui induk symlink tetap gagal tertutup meskipun leaf akhir belum ada. Contoh: `/workspace/run-link/new-file` tetap diselesaikan sebagai `/var/run/...` jika `run-link` menunjuk ke sana.
- Root sumber yang diizinkan dikanonisasi dengan cara yang sama, sehingga path yang hanya tampak berada di dalam allowlist sebelum resolusi symlink tetap ditolak sebagai `outside allowed roots`.
- Mount sensitif (secret, kunci SSH, kredensial layanan) sebaiknya `:ro` kecuali benar-benar diperlukan.
- Gabungkan dengan `workspaceAccess: "ro"` jika Anda hanya memerlukan akses baca ke workspace; mode bind tetap independen.
- Lihat [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) untuk bagaimana bind berinteraksi dengan kebijakan alat dan exec elevated.

</Warning>

## Image dan setup

Image Docker default: `openclaw-sandbox:bookworm-slim`

<Note>
**Checkout source vs instalasi npm**

Skrip pembantu `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh`, dan `scripts/sandbox-browser-setup.sh` hanya tersedia saat menjalankan dari [checkout source](https://github.com/openclaw/openclaw). Skrip tersebut tidak disertakan dalam paket npm.

Jika Anda memasang OpenClaw melalui `npm install -g openclaw`, gunakan perintah inline `docker build` yang ditampilkan di bawah.
</Note>

<Steps>
  <Step title="Build the default image">
    Dari checkout source:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Dari instalasi npm (tidak perlu checkout source):

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

    Image default **tidak** menyertakan Node. Jika suatu skill membutuhkan Node (atau runtime lain), buat image khusus atau instal melalui `sandbox.docker.setupCommand` (memerlukan egress jaringan + root dapat ditulis + pengguna root).

    OpenClaw tidak diam-diam mengganti dengan `debian:bookworm-slim` biasa ketika `openclaw-sandbox:bookworm-slim` tidak ada. Jalankan sandbox yang menargetkan image default akan gagal cepat dengan instruksi build sampai Anda membangunnya, karena image bawaan membawa `python3` untuk pembantu tulis/edit sandbox.

  </Step>
  <Step title="Optional: build the common image">
    Untuk image sandbox yang lebih fungsional dengan tooling umum (misalnya `curl`, `jq`, `nodejs`, `python3`, `git`):

    Dari checkout source:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Dari instalasi npm, build image default terlebih dahulu (lihat di atas), lalu build image common di atasnya menggunakan [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) dari repositori.

    Lalu setel `agents.defaults.sandbox.docker.image` ke `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Optional: build the sandbox browser image">
    Dari checkout source:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Dari instalasi npm, build menggunakan [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) dari repositori.

  </Step>
</Steps>

Secara default, container sandbox Docker berjalan dengan **tanpa jaringan**. Timpa dengan `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
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
    - `--no-sandbox` ketika `noSandbox` diaktifkan.
    - Tiga flag pengerasan grafis (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) bersifat opsional dan berguna ketika container tidak memiliki dukungan GPU. Setel `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` jika workload Anda memerlukan WebGL atau fitur 3D/browser lain.
    - `--disable-extensions` diaktifkan secara default dan dapat dinonaktifkan dengan `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` untuk alur yang bergantung pada ekstensi.
    - `--renderer-process-limit=2` dikontrol oleh `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, dengan `0` mempertahankan default Chromium.

    Jika Anda memerlukan profil runtime berbeda, gunakan image browser khusus dan sediakan entrypoint Anda sendiri. Untuk profil Chromium lokal (non-container), gunakan `browser.extraArgs` untuk menambahkan flag startup tambahan.

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` diblokir.
    - `network: "container:<id>"` diblokir secara default (risiko bypass namespace join).
    - Override break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Instalasi Docker dan Gateway dalam container berada di sini: [Docker](/id/install/docker)

Untuk deployment Gateway Docker, `scripts/docker/setup.sh` dapat melakukan bootstrap konfigurasi sandbox. Setel `OPENCLAW_SANDBOX=1` (atau `true`/`yes`/`on`) untuk mengaktifkan path tersebut. Anda dapat menimpa lokasi socket dengan `OPENCLAW_DOCKER_SOCKET`. Referensi setup dan env lengkap: [Docker](/id/install/docker#agent-sandbox).

## setupCommand (setup container satu kali)

`setupCommand` berjalan **sekali** setelah container sandbox dibuat (bukan pada setiap run). Ini dieksekusi di dalam container melalui `sh -lc`.

Path:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Per agen: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Kesalahan umum">
    - Default `docker.network` adalah `"none"` (tanpa egress), jadi instalasi paket akan gagal.
    - `docker.network: "container:<id>"` memerlukan `dangerouslyAllowContainerNamespaceJoin: true` dan hanya untuk kondisi darurat.
    - `readOnlyRoot: true` mencegah penulisan; atur `readOnlyRoot: false` atau buat image kustom.
    - `user` harus berupa root untuk instalasi paket (hilangkan `user` atau atur `user: "0:0"`).
    - Exec sandbox **tidak** mewarisi `process.env` host. Gunakan `agents.defaults.sandbox.docker.env` (atau image kustom) untuk kunci API skill.

  </Accordion>
</AccordionGroup>

## Kebijakan alat dan celah keluar darurat

Kebijakan izinkan/tolak alat tetap berlaku sebelum aturan sandbox. Jika sebuah alat ditolak secara global atau per agen, sandboxing tidak akan mengembalikannya.

`tools.elevated` adalah celah keluar darurat eksplisit yang menjalankan `exec` di luar sandbox (`gateway` secara default, atau `node` saat target exec adalah `node`). Direktif `/exec` hanya berlaku untuk pengirim yang berwenang dan bertahan per sesi; untuk menonaktifkan `exec` secara paksa, gunakan penolakan kebijakan alat (lihat [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugging:

- Gunakan `openclaw sandbox explain` untuk memeriksa mode sandbox efektif, kebijakan alat, dan kunci konfigurasi perbaikan.
- Lihat [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) untuk model mental "mengapa ini diblokir?".

Tetap kunci dengan ketat.

## Penimpaan multi-agen

Setiap agen dapat menimpa sandbox + alat: `agents.list[].sandbox` dan `agents.list[].tools` (ditambah `agents.list[].tools.sandbox.tools` untuk kebijakan alat sandbox). Lihat [Sandbox & Alat Multi-Agen](/id/tools/multi-agent-sandbox-tools) untuk prioritas.

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

- [Sandbox & Alat Multi-Agen](/id/tools/multi-agent-sandbox-tools) — penimpaan per agen dan prioritas
- [OpenShell](/id/gateway/openshell) — penyiapan backend sandbox terkelola, mode workspace, dan referensi konfigurasi
- [Konfigurasi sandbox](/id/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) — debugging "mengapa ini diblokir?"
- [Keamanan](/id/gateway/security)
