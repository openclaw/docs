---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Cara kerja isolasi OpenClaw: mode, cakupan, akses ruang kerja, dan gambar'
title: Isolasi Sandbox
x-i18n:
    generated_at: "2026-04-30T09:51:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96861f3f70bf26b5ed20a063c047064f98a0dc74d36e8f4ccada1f3bb455118d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw dapat menjalankan **alat di dalam backend sandbox** untuk mengurangi dampak. Ini **opsional** dan dikendalikan oleh konfigurasi (`agents.defaults.sandbox` atau `agents.list[].sandbox`). Jika sandboxing dimatikan, alat berjalan di host. Gateway tetap berada di host; eksekusi alat berjalan di sandbox terisolasi saat diaktifkan.

<Note>
Ini bukan batas keamanan yang sempurna, tetapi secara nyata membatasi akses sistem berkas dan proses ketika model melakukan hal yang bodoh.
</Note>

## Apa yang dimasukkan ke sandbox

- Eksekusi alat (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, dan sebagainya).
- Peramban sandbox opsional (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Detail peramban sandbox">
    - Secara default, peramban sandbox mulai otomatis (memastikan CDP dapat dijangkau) ketika alat peramban membutuhkannya. Konfigurasikan melalui `agents.defaults.sandbox.browser.autoStart` dan `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Secara default, kontainer peramban sandbox menggunakan jaringan Docker khusus (`openclaw-sandbox-browser`) alih-alih jaringan global `bridge`. Konfigurasikan dengan `agents.defaults.sandbox.browser.network`.
    - `agents.defaults.sandbox.browser.cdpSourceRange` opsional membatasi ingress CDP di tepi kontainer dengan allowlist CIDR (misalnya `172.21.0.1/32`).
    - Akses pengamat noVNC dilindungi kata sandi secara default; OpenClaw memancarkan URL token berumur pendek yang menyajikan halaman bootstrap lokal dan membuka noVNC dengan kata sandi dalam fragmen URL (bukan log query/header).
    - `agents.defaults.sandbox.browser.allowHostControl` memungkinkan sesi sandbox menargetkan peramban host secara eksplisit.
    - Allowlist opsional membatasi `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Tidak dimasukkan ke sandbox:

- Proses Gateway itu sendiri.
- Alat apa pun yang secara eksplisit diizinkan berjalan di luar sandbox (misalnya `tools.elevated`).
  - **Exec yang dinaikkan melewati sandboxing dan menggunakan jalur escape yang dikonfigurasi (`gateway` secara default, atau `node` saat target exec adalah `node`).**
  - Jika sandboxing dimatikan, `tools.elevated` tidak mengubah eksekusi (sudah berada di host). Lihat [Mode Elevated](/id/tools/elevated).

## Mode

`agents.defaults.sandbox.mode` mengontrol **kapan** sandboxing digunakan:

<Tabs>
  <Tab title="off">
    Tanpa sandboxing.
  </Tab>
  <Tab title="non-main">
    Sandbox hanya untuk sesi **non-main** (default jika Anda ingin chat normal berada di host).

    `"non-main"` didasarkan pada `session.mainKey` (default `"main"`), bukan id agen. Sesi grup/kanal menggunakan kunci masing-masing, sehingga dihitung sebagai non-main dan akan dimasukkan ke sandbox.

  </Tab>
  <Tab title="all">
    Setiap sesi berjalan di dalam sandbox.
  </Tab>
</Tabs>

## Cakupan

`agents.defaults.sandbox.scope` mengontrol **berapa banyak kontainer** yang dibuat:

- `"agent"` (default): satu kontainer per agen.
- `"session"`: satu kontainer per sesi.
- `"shared"`: satu kontainer digunakan bersama oleh semua sesi sandbox.

## Backend

`agents.defaults.sandbox.backend` mengontrol **runtime mana** yang menyediakan sandbox:

- `"docker"` (default saat sandboxing diaktifkan): runtime sandbox lokal berbasis Docker.
- `"ssh"`: runtime sandbox jarak jauh umum berbasis SSH.
- `"openshell"`: runtime sandbox berbasis OpenShell.

Konfigurasi khusus SSH berada di bawah `agents.defaults.sandbox.ssh`. Konfigurasi khusus OpenShell berada di bawah `plugins.entries.openshell.config`.

### Memilih backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Tempat berjalan** | Kontainer lokal                  | Host apa pun yang dapat diakses SSH | Sandbox terkelola OpenShell                         |
| **Penyiapan**       | `scripts/sandbox-setup.sh`       | Kunci SSH + host target        | Plugin OpenShell diaktifkan                         |
| **Model workspace** | Bind-mount atau salin            | Kanonis jarak jauh (seed sekali) | `mirror` atau `remote`                              |
| **Kontrol jaringan** | `docker.network` (default: none) | Bergantung pada host jarak jauh | Bergantung pada OpenShell                           |
| **Sandbox peramban** | Didukung                        | Tidak didukung                 | Belum didukung                                      |
| **Bind mount**      | `docker.binds`                   | N/A                            | N/A                                                 |
| **Paling cocok untuk** | Pengembangan lokal, isolasi penuh | Memindahkan beban ke mesin jarak jauh | Sandbox jarak jauh terkelola dengan sinkronisasi dua arah opsional |

### Backend Docker

Sandboxing dimatikan secara default. Jika Anda mengaktifkan sandboxing dan tidak memilih backend, OpenClaw menggunakan backend Docker. Backend ini menjalankan alat dan peramban sandbox secara lokal melalui soket daemon Docker (`/var/run/docker.sock`). Isolasi kontainer sandbox ditentukan oleh namespace Docker.

Untuk mengekspos GPU host ke sandbox Docker, atur `agents.defaults.sandbox.docker.gpus` atau override per-agen `agents.list[].sandbox.docker.gpus`. Nilainya diteruskan ke flag `--gpus` milik Docker sebagai argumen terpisah, misalnya `"all"` atau `"device=GPU-uuid"`, dan memerlukan runtime host yang kompatibel seperti NVIDIA Container Toolkit.

<Warning>
**Batasan Docker-out-of-Docker (DooD)**

Jika Anda men-deploy OpenClaw Gateway itu sendiri sebagai kontainer Docker, Gateway mengorkestrasi kontainer sandbox saudara menggunakan soket Docker milik host (DooD). Ini memperkenalkan batasan pemetaan jalur tertentu:

- **Konfigurasi memerlukan jalur host**: Konfigurasi `workspace` `openclaw.json` HARUS berisi **jalur absolut Host** (misalnya `/home/user/.openclaw/workspaces`), bukan jalur internal kontainer Gateway. Saat OpenClaw meminta daemon Docker untuk membuat sandbox, daemon mengevaluasi jalur relatif terhadap namespace OS Host, bukan namespace Gateway.
- **Paritas bridge FS (peta volume identik)**: Proses native OpenClaw Gateway juga menulis heartbeat dan berkas bridge ke direktori `workspace`. Karena Gateway mengevaluasi string yang persis sama (jalur host) dari dalam lingkungan terkontainerisasi miliknya sendiri, deployment Gateway HARUS menyertakan peta volume identik yang menautkan namespace host secara native (`-v /home/user/.openclaw:/home/user/.openclaw`).

Jika Anda memetakan jalur secara internal tanpa paritas host absolut, OpenClaw secara native melempar error izin `EACCES` saat mencoba menulis heartbeat-nya di dalam lingkungan kontainer karena string jalur yang sepenuhnya memenuhi syarat tidak ada secara native.
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
    - OpenClaw membuat root jarak jauh per-cakupan di bawah `sandbox.ssh.workspaceRoot`.
    - Pada penggunaan pertama setelah dibuat atau dibuat ulang, OpenClaw melakukan seed workspace jarak jauh tersebut dari workspace lokal satu kali.
    - Setelah itu, `exec`, `read`, `write`, `edit`, `apply_patch`, pembacaan media prompt, dan staging media masuk berjalan langsung terhadap workspace jarak jauh melalui SSH.
    - OpenClaw tidak menyinkronkan perubahan jarak jauh kembali ke workspace lokal secara otomatis.

  </Accordion>
  <Accordion title="Materi autentikasi">
    - `identityFile`, `certificateFile`, `knownHostsFile`: gunakan berkas lokal yang ada dan teruskan melalui konfigurasi OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: gunakan string inline atau SecretRefs. OpenClaw menyelesaikannya melalui snapshot runtime rahasia normal, menulisnya ke berkas temporer dengan `0600`, dan menghapusnya saat sesi SSH berakhir.
    - Jika `*File` dan `*Data` sama-sama ditetapkan untuk item yang sama, `*Data` menang untuk sesi SSH tersebut.

  </Accordion>
  <Accordion title="Konsekuensi kanonis jarak jauh">
    Ini adalah model **kanonis jarak jauh**. Workspace SSH jarak jauh menjadi status sandbox nyata setelah seed awal.

    - Edit host-lokal yang dibuat di luar OpenClaw setelah langkah seed tidak terlihat dari jarak jauh sampai Anda membuat ulang sandbox.
    - `openclaw sandbox recreate` menghapus root jarak jauh per-cakupan dan melakukan seed lagi dari lokal pada penggunaan berikutnya.
    - Sandboxing peramban tidak didukung pada backend SSH.
    - Pengaturan `sandbox.docker.*` tidak berlaku untuk backend SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Gunakan `backend: "openshell"` saat Anda ingin OpenClaw memasukkan alat ke sandbox di lingkungan jarak jauh yang dikelola OpenShell. Untuk panduan penyiapan lengkap, referensi konfigurasi, dan perbandingan mode workspace, lihat [halaman OpenShell](/id/gateway/openshell) khusus.

OpenShell menggunakan kembali transport SSH inti dan bridge sistem berkas jarak jauh yang sama seperti backend SSH umum, serta menambahkan lifecycle khusus OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) ditambah mode workspace `mirror` opsional.

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
- `remote`: workspace OpenShell bersifat kanonis setelah sandbox dibuat. OpenClaw melakukan seed workspace jarak jauh sekali dari workspace lokal, lalu alat berkas dan exec berjalan langsung terhadap sandbox jarak jauh tanpa menyinkronkan perubahan kembali.

<AccordionGroup>
  <Accordion title="Detail transport jarak jauh">
    - OpenClaw meminta konfigurasi SSH khusus sandbox dari OpenShell melalui `openshell sandbox ssh-config <name>`.
    - Core menulis konfigurasi SSH tersebut ke berkas temporer, membuka sesi SSH, dan menggunakan kembali bridge sistem berkas jarak jauh yang sama dengan yang digunakan oleh `backend: "ssh"`.
    - Dalam mode `mirror`, hanya lifecycle-nya yang berbeda: sinkronkan lokal ke jarak jauh sebelum exec, lalu sinkronkan kembali setelah exec.

  </Accordion>
  <Accordion title="Batasan OpenShell saat ini">
    - peramban sandbox belum didukung
    - `sandbox.docker.binds` tidak didukung pada backend OpenShell
    - pengaturan runtime khusus Docker di bawah `sandbox.docker.*` tetap hanya berlaku untuk backend Docker

  </Accordion>
</AccordionGroup>

#### Mode workspace

OpenShell memiliki dua model workspace. Ini adalah bagian yang paling penting dalam praktiknya.

<Tabs>
  <Tab title="mirror (kanonis lokal)">
    Gunakan `plugins.entries.openshell.config.mode: "mirror"` saat Anda ingin **workspace lokal tetap kanonis**.

    Perilaku:

    - Sebelum `exec`, OpenClaw menyinkronkan workspace lokal ke sandbox OpenShell.
    - Setelah `exec`, OpenClaw menyinkronkan workspace jarak jauh kembali ke workspace lokal.
    - Alat berkas tetap beroperasi melalui bridge sandbox, tetapi workspace lokal tetap menjadi sumber kebenaran antar giliran.

    Gunakan ini saat:

    - Anda mengedit berkas secara lokal di luar OpenClaw dan ingin perubahan tersebut muncul otomatis di sandbox
    - Anda ingin sandbox OpenShell berperilaku semirip mungkin dengan backend Docker
    - Anda ingin ruang kerja host mencerminkan penulisan sandbox setelah setiap giliran exec

    Tradeoff: biaya sinkronisasi tambahan sebelum dan sesudah exec.

  </Tab>
  <Tab title="jarak jauh (kanonis OpenShell)">
    Gunakan `plugins.entries.openshell.config.mode: "remote"` saat Anda ingin **ruang kerja OpenShell menjadi kanonis**.

    Perilaku:

    - Saat sandbox pertama kali dibuat, OpenClaw mengisi ruang kerja jarak jauh dari ruang kerja lokal satu kali.
    - Setelah itu, `exec`, `read`, `write`, `edit`, dan `apply_patch` beroperasi langsung terhadap ruang kerja OpenShell jarak jauh.
    - OpenClaw **tidak** menyinkronkan perubahan jarak jauh kembali ke ruang kerja lokal setelah exec.
    - Pembacaan media pada waktu prompt tetap berfungsi karena alat berkas dan media membaca melalui jembatan sandbox, bukan mengasumsikan path host lokal.
    - Transport adalah SSH ke sandbox OpenShell yang dikembalikan oleh `openshell sandbox ssh-config`.

    Konsekuensi penting:

    - Jika Anda mengedit berkas pada host di luar OpenClaw setelah langkah pengisian awal, sandbox jarak jauh **tidak** akan melihat perubahan tersebut secara otomatis.
    - Jika sandbox dibuat ulang, ruang kerja jarak jauh diisi dari ruang kerja lokal lagi.
    - Dengan `scope: "agent"` atau `scope: "shared"`, ruang kerja jarak jauh tersebut dibagikan pada cakupan yang sama.

    Gunakan ini saat:

    - sandbox sebaiknya hidup terutama di sisi OpenShell jarak jauh
    - Anda menginginkan overhead sinkronisasi per giliran yang lebih rendah
    - Anda tidak ingin edit lokal host diam-diam menimpa status sandbox jarak jauh

  </Tab>
</Tabs>

Pilih `mirror` jika Anda menganggap sandbox sebagai lingkungan eksekusi sementara. Pilih `remote` jika Anda menganggap sandbox sebagai ruang kerja nyata.

#### Siklus hidup OpenShell

Sandbox OpenShell tetap dikelola melalui siklus hidup sandbox normal:

- `openclaw sandbox list` menampilkan runtime OpenShell serta runtime Docker
- `openclaw sandbox recreate` menghapus runtime saat ini dan memungkinkan OpenClaw membuatnya ulang pada penggunaan berikutnya
- logika prune juga sadar backend

Untuk mode `remote`, recreate sangat penting:

- recreate menghapus ruang kerja jarak jauh kanonis untuk cakupan tersebut
- penggunaan berikutnya mengisi ruang kerja jarak jauh baru dari ruang kerja lokal

Untuk mode `mirror`, recreate terutama mereset lingkungan eksekusi jarak jauh karena ruang kerja lokal tetap menjadi kanonis.

## Akses ruang kerja

`agents.defaults.sandbox.workspaceAccess` mengontrol **apa yang dapat dilihat sandbox**:

<Tabs>
  <Tab title="tidak ada (default)">
    Alat melihat ruang kerja sandbox di bawah `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Memasang ruang kerja agen sebagai hanya-baca di `/agent` (menonaktifkan `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Memasang ruang kerja agen sebagai baca/tulis di `/workspace`.
  </Tab>
</Tabs>

Dengan backend OpenShell:

- mode `mirror` tetap menggunakan ruang kerja lokal sebagai sumber kanonis di antara giliran exec
- mode `remote` menggunakan ruang kerja OpenShell jarak jauh sebagai sumber kanonis setelah pengisian awal
- `workspaceAccess: "ro"` dan `"none"` tetap membatasi perilaku tulis dengan cara yang sama

Media masuk disalin ke ruang kerja sandbox aktif (`media/inbound/*`).

<Note>
**Catatan Skills:** alat `read` berakar pada sandbox. Dengan `workspaceAccess: "none"`, OpenClaw mencerminkan Skills yang memenuhi syarat ke ruang kerja sandbox (`.../skills`) agar dapat dibaca. Dengan `"rw"`, Skills ruang kerja dapat dibaca dari `/workspace/skills`.
</Note>

## Bind mount kustom

`agents.defaults.sandbox.docker.binds` memasang direktori host tambahan ke dalam kontainer. Format: `host:container:mode` (misalnya, `"/home/user/source:/source:rw"`).

Bind global dan per agen **digabungkan** (tidak diganti). Di bawah `scope: "shared"`, bind per agen diabaikan.

`agents.defaults.sandbox.browser.binds` memasang direktori host tambahan hanya ke dalam kontainer **browser sandbox**.

- Saat diatur (termasuk `[]`), ini menggantikan `agents.defaults.sandbox.docker.binds` untuk kontainer browser.
- Saat dihilangkan, kontainer browser kembali menggunakan `agents.defaults.sandbox.docker.binds` (kompatibel ke belakang).

Contoh (sumber hanya-baca + direktori data tambahan):

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
- OpenClaw juga memblokir root kredensial direktori home umum seperti `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, dan `~/.ssh`.
- Validasi bind bukan sekadar pencocokan string. OpenClaw menormalkan path sumber, lalu menyelesaikannya lagi melalui ancestor terdalam yang ada sebelum memeriksa ulang path yang diblokir dan root yang diizinkan.
- Artinya escape melalui induk symlink tetap gagal tertutup meskipun leaf akhir belum ada. Contoh: `/workspace/run-link/new-file` tetap diselesaikan sebagai `/var/run/...` jika `run-link` menunjuk ke sana.
- Root sumber yang diizinkan dikanoniskan dengan cara yang sama, jadi path yang hanya terlihat berada di dalam allowlist sebelum resolusi symlink tetap ditolak sebagai `outside allowed roots`.
- Mount sensitif (secrets, kunci SSH, kredensial layanan) sebaiknya `:ro` kecuali benar-benar diperlukan.
- Gabungkan dengan `workspaceAccess: "ro"` jika Anda hanya membutuhkan akses baca ke ruang kerja; mode bind tetap independen.
- Lihat [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) untuk cara bind berinteraksi dengan kebijakan alat dan exec yang ditingkatkan.

</Warning>

## Image dan penyiapan

Image Docker default: `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="Bangun image default">
    ```bash
    scripts/sandbox-setup.sh
    ```

    Image default **tidak** menyertakan Node. Jika skill membutuhkan Node (atau runtime lain), bake image kustom atau instal melalui `sandbox.docker.setupCommand` (memerlukan egress jaringan + root yang dapat ditulis + pengguna root).

    OpenClaw tidak diam-diam mengganti dengan `debian:bookworm-slim` biasa saat `openclaw-sandbox:bookworm-slim` hilang. Eksekusi sandbox yang menargetkan image default gagal cepat dengan instruksi build sampai Anda menjalankan `scripts/sandbox-setup.sh`, karena image bawaan membawa `python3` untuk helper tulis/edit sandbox.

  </Step>
  <Step title="Opsional: bangun image umum">
    Untuk image sandbox yang lebih fungsional dengan tooling umum (misalnya `curl`, `jq`, `nodejs`, `python3`, `git`):

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

Secara default, kontainer sandbox Docker berjalan dengan **tanpa jaringan**. Override dengan `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Default Chromium browser sandbox">
    Image browser sandbox bawaan juga menerapkan default startup Chromium yang konservatif untuk workload berkontainer. Default kontainer saat ini mencakup:

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
    - Tiga flag penguatan grafis (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) bersifat opsional dan berguna saat kontainer tidak memiliki dukungan GPU. Atur `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` jika workload Anda memerlukan WebGL atau fitur browser/3D lainnya.
    - `--disable-extensions` diaktifkan secara default dan dapat dinonaktifkan dengan `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` untuk alur yang bergantung pada ekstensi.
    - `--renderer-process-limit=2` dikontrol oleh `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, dengan `0` mempertahankan default Chromium.

    Jika Anda membutuhkan profil runtime yang berbeda, gunakan image browser kustom dan sediakan entrypoint Anda sendiri. Untuk profil Chromium lokal (non-kontainer), gunakan `browser.extraArgs` untuk menambahkan flag startup tambahan.

  </Accordion>
  <Accordion title="Default keamanan jaringan">
    - `network: "host"` diblokir.
    - `network: "container:<id>"` diblokir secara default (risiko bypass join namespace).
    - Override break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Instalasi Docker dan Gateway berkontainer berada di sini: [Docker](/id/install/docker)

Untuk deployment Gateway Docker, `scripts/docker/setup.sh` dapat melakukan bootstrap konfigurasi sandbox. Atur `OPENCLAW_SANDBOX=1` (atau `true`/`yes`/`on`) untuk mengaktifkan path tersebut. Anda dapat meng-override lokasi socket dengan `OPENCLAW_DOCKER_SOCKET`. Penyiapan lengkap dan referensi env: [Docker](/id/install/docker#agent-sandbox).

## setupCommand (penyiapan kontainer satu kali)

`setupCommand` berjalan **sekali** setelah kontainer sandbox dibuat (bukan pada setiap run). Ini dieksekusi di dalam kontainer melalui `sh -lc`.

Path:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Per agen: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Kesalahan umum">
    - `docker.network` default adalah `"none"` (tanpa egress), sehingga instalasi paket akan gagal.
    - `docker.network: "container:<id>"` memerlukan `dangerouslyAllowContainerNamespaceJoin: true` dan hanya untuk break-glass.
    - `readOnlyRoot: true` mencegah penulisan; atur `readOnlyRoot: false` atau bake image kustom.
    - `user` harus root untuk instalasi paket (hilangkan `user` atau atur `user: "0:0"`).
    - Exec sandbox **tidak** mewarisi `process.env` host. Gunakan `agents.defaults.sandbox.docker.env` (atau image kustom) untuk kunci API skill.

  </Accordion>
</AccordionGroup>

## Kebijakan alat dan escape hatch

Kebijakan allow/deny alat tetap berlaku sebelum aturan sandbox. Jika alat ditolak secara global atau per agen, sandboxing tidak mengembalikannya.

`tools.elevated` adalah escape hatch eksplisit yang menjalankan `exec` di luar sandbox (`gateway` secara default, atau `node` saat target exec adalah `node`). Direktif `/exec` hanya berlaku untuk pengirim yang diotorisasi dan bertahan per sesi; untuk menonaktifkan keras `exec`, gunakan deny kebijakan alat (lihat [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugging:

- Gunakan `openclaw sandbox explain` untuk memeriksa mode sandbox efektif, kebijakan alat, dan kunci konfigurasi perbaikan.
- Lihat [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) untuk model mental "mengapa ini diblokir?".

Tetap kunci dengan ketat.

## Override multi-agen

Setiap agen dapat meng-override sandbox + alat: `agents.list[].sandbox` dan `agents.list[].tools` (ditambah `agents.list[].tools.sandbox.tools` untuk kebijakan alat sandbox). Lihat [Multi-Agent Sandbox & Tools](/id/tools/multi-agent-sandbox-tools) untuk presedensi.

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

- [Sandbox & Alat Multi-Agen](/id/tools/multi-agent-sandbox-tools) — penimpaan per agen dan presedensi
- [OpenShell](/id/gateway/openshell) — penyiapan backend sandbox terkelola, mode workspace, dan referensi konfigurasi
- [Konfigurasi sandbox](/id/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Kebijakan Alat vs Ditinggikan](/id/gateway/sandbox-vs-tool-policy-vs-elevated) — men-debug "mengapa ini diblokir?"
- [Keamanan](/id/gateway/security)
