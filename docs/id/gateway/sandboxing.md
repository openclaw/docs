---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Cara kerja sandbox OpenClaw: mode, cakupan, akses ruang kerja, dan image'
title: Sandboxing
x-i18n:
    generated_at: "2026-07-12T14:14:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60d6695c5d8f4e8d3bfb80dd387a50c104dc4e140d5974a66d5a2176594782a4
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw dapat menjalankan eksekusi alat di dalam backend sandbox untuk mengurangi dampak kerusakan. Sandboxing dinonaktifkan secara default dan dikendalikan oleh `agents.defaults.sandbox` (global) atau `agents.list[].sandbox` (per agen). Proses Gateway selalu tetap berada di host; hanya eksekusi alat yang dipindahkan ke sandbox saat diaktifkan.

<Note>
Ini bukan batas keamanan yang sempurna, tetapi secara signifikan membatasi akses sistem berkas dan proses ketika model melakukan tindakan yang keliru.
</Note>

## Apa yang dijalankan dalam sandbox

- Eksekusi alat: `exec`, `read`, `write`, `edit`, `apply_patch`, `process`, dan sebagainya.
- Peramban opsional dalam sandbox (`agents.defaults.sandbox.browser`).

Tidak dijalankan dalam sandbox:

- Proses Gateway itu sendiri.
- Alat apa pun yang secara eksplisit diizinkan berjalan di luar sandbox melalui `tools.elevated`. Eksekusi dengan hak istimewa melewati sandboxing dan berjalan pada jalur keluar yang dikonfigurasi (`gateway` secara default, atau `node` ketika target eksekusinya adalah `node`). Jika sandboxing dinonaktifkan, `tools.elevated` tidak mengubah apa pun karena eksekusi sudah berjalan di host. Lihat [Mode dengan Hak Istimewa](/id/tools/elevated).

## Mode, cakupan, dan backend

Tiga pengaturan independen mengendalikan perilaku sandbox:

| Pengaturan | Kunci                             | Nilai                        | Default  |
| ---------- | --------------------------------- | ---------------------------- | -------- |
| Mode       | `agents.defaults.sandbox.mode`    | `off`, `non-main`, `all`     | `off`    |
| Cakupan    | `agents.defaults.sandbox.scope`   | `agent`, `session`, `shared` | `agent`  |
| Backend    | `agents.defaults.sandbox.backend` | `docker`, `ssh`, `openshell` | `docker` |

**Mode** mengendalikan kapan sandboxing diterapkan:

- `off`: tanpa sandboxing.
- `non-main`: jalankan setiap sesi dalam sandbox kecuali sesi utama agen. Kunci sesi utama selalu `agent:<agentId>:main` (atau `global` ketika `session.scope` bernilai `"global"`); kunci ini tidak dapat dikonfigurasi. Sesi grup/saluran menggunakan kuncinya sendiri, sehingga selalu dianggap bukan sesi utama dan dijalankan dalam sandbox.
- `all`: setiap sesi berjalan dalam sandbox.

**Cakupan** mengendalikan jumlah kontainer/lingkungan yang dibuat:

- `agent`: satu kontainer per agen.
- `session`: satu kontainer per sesi.
- `shared`: satu kontainer yang digunakan bersama oleh semua sesi dalam sandbox (penimpaan `docker`/`ssh`/`browser` per agen diabaikan dalam cakupan ini).

**Backend** mengendalikan runtime yang mengeksekusi alat dalam sandbox. Konfigurasi khusus SSH berada di bawah `agents.defaults.sandbox.ssh`; konfigurasi khusus OpenShell berada di bawah `plugins.entries.openshell.config`.

|                           | Docker                               | SSH                                    | OpenShell                                                  |
| ------------------------- | ------------------------------------ | -------------------------------------- | ---------------------------------------------------------- |
| **Tempat berjalan**       | Kontainer lokal                      | Host apa pun yang dapat diakses via SSH | Sandbox yang dikelola OpenShell                            |
| **Penyiapan**             | `scripts/sandbox-setup.sh`           | Kunci SSH + host target                | Plugin OpenShell diaktifkan                                |
| **Model ruang kerja**     | Pemasangan bind atau penyalinan      | Kanonis-jarak-jauh (inisialisasi sekali) | `mirror` atau `remote`                                     |
| **Kontrol jaringan**      | `docker.network` (default: tidak ada) | Bergantung pada host jarak jauh        | Bergantung pada OpenShell                                  |
| **Sandbox peramban**      | Didukung                             | Tidak didukung                         | Belum didukung                                             |
| **Pemasangan bind**       | `docker.binds`                       | T/A                                    | T/A                                                        |
| **Paling sesuai untuk**   | Pengembangan lokal, isolasi penuh    | Mengalihkan beban ke mesin jarak jauh  | Sandbox jarak jauh terkelola dengan sinkronisasi dua arah opsional |

## Backend Docker

Docker adalah backend default setelah sandboxing diaktifkan. Backend ini menjalankan alat dan peramban sandbox secara lokal melalui soket daemon Docker (`/var/run/docker.sock`); isolasi berasal dari namespace Docker.

Default: `network: "none"` (tanpa akses keluar), `readOnlyRoot: true`, `capDrop: ["ALL"]`, image `openclaw-sandbox:bookworm-slim`.

Untuk menyediakan GPU host, atur `agents.defaults.sandbox.docker.gpus` (atau penimpaan per agen) ke nilai seperti `"all"` atau `"device=GPU-uuid"`. Nilai ini diteruskan ke flag `--gpus` milik Docker dan memerlukan runtime host yang kompatibel seperti NVIDIA Container Toolkit.

<Warning>
**Batasan Docker-di-luar-Docker (DooD)**

Jika Anda menerapkan Gateway OpenClaw itu sendiri sebagai kontainer Docker, Gateway tersebut mengatur kontainer sandbox sejajar menggunakan soket Docker milik host (DooD). Hal ini menimbulkan batasan pemetaan jalur:

- **Konfigurasi memerlukan jalur host**: `workspace` dalam `openclaw.json` harus memuat **jalur absolut host** (misalnya `/home/user/.openclaw/workspaces`), bukan jalur internal kontainer Gateway. Daemon Docker mengevaluasi jalur relatif terhadap namespace sistem operasi host, bukan namespace Gateway itu sendiri.
- **Pemetaan volume yang sama diperlukan**: Proses Gateway juga menulis berkas Heartbeat dan bridge ke jalur `workspace` tersebut. Berikan pemetaan volume yang identik kepada kontainer Gateway (`-v /home/user/.openclaw:/home/user/.openclaw`) agar jalur host yang sama juga dapat ditangani dengan benar dari dalam kontainer Gateway. Ketidakcocokan pemetaan muncul sebagai `EACCES` ketika Gateway mencoba menulis Heartbeat.
- **Mode kode Codex**: ketika sandbox OpenClaw aktif, OpenClaw menonaktifkan Mode Kode native server aplikasi Codex, server MCP pengguna, dan eksekusi Plugin yang didukung aplikasi untuk giliran tersebut (semuanya berjalan dari proses server aplikasi di host Gateway, bukan dari backend sandbox OpenClaw), kecuali kebijakan alat sandbox menyediakan alat yang diperlukan dan Anda memilih menggunakan jalur eksperimental server eksekusi sandbox. Akses shell kemudian diarahkan melalui alat berbasis sandbox OpenClaw seperti `sandbox_exec` dan `sandbox_process`. Jangan pasang soket Docker host ke dalam kontainer sandbox agen atau sandbox Codex kustom. Lihat [Harness Codex](/id/plugins/codex-harness) untuk perilaku lengkapnya.

Pada host Ubuntu/AppArmor dengan mode sandbox Docker diaktifkan, eksekusi shell `workspace-write` server aplikasi Codex memerlukan namespace pengguna tanpa hak istimewa di dalam kontainer sandbox, dan proses ini dapat gagal sebelum shell dimulai ketika pengguna layanan tidak dapat membuatnya. Namespace jaringan tanpa hak istimewa juga diperlukan ketika akses keluar sandbox Docker dinonaktifkan (`network: "none"`, default). Gejala umum: `bwrap: setting up uid map: Permission denied` dan `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Jalankan `openclaw doctor`; jika perintah tersebut melaporkan kegagalan pemeriksaan namespace bwrap Codex, utamakan profil AppArmor yang memberikan namespace yang diperlukan kepada proses layanan OpenClaw. `kernel.apparmor_restrict_unprivileged_userns=0` adalah alternatif untuk seluruh host yang memiliki kompromi keamanan; gunakan hanya jika postur keamanan host tersebut dapat diterima.
</Warning>

### Peramban dalam sandbox

- Peramban sandbox dimulai secara otomatis (memastikan CDP dapat dijangkau) ketika alat peramban membutuhkannya. Konfigurasikan melalui `agents.defaults.sandbox.browser.autoStart` (default `true`) dan `autoStartTimeoutMs` (default 12 dtk).
- Kontainer peramban sandbox menggunakan jaringan Docker khusus (`openclaw-sandbox-browser`), bukan jaringan `bridge` global. Konfigurasikan dengan `agents.defaults.sandbox.browser.network`.
- `agents.defaults.sandbox.browser.cdpSourceRange` membatasi akses masuk CDP di tepi kontainer menggunakan daftar izin CIDR (misalnya `172.21.0.1/32`).
- Akses pengamat noVNC dilindungi kata sandi secara default; OpenClaw menghasilkan URL token berumur pendek yang menyajikan halaman bootstrap lokal dan membuka noVNC dengan kata sandi di fragmen URL (bukan string kueri atau log header).
- `agents.defaults.sandbox.browser.allowHostControl` (default `false`) memungkinkan sesi dalam sandbox menargetkan peramban host secara eksplisit.
- Daftar izin opsional membatasi `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

## Backend SSH

Gunakan `backend: "ssh"` untuk menjalankan `exec`, alat berkas, dan pembacaan media dalam sandbox pada mesin apa pun yang dapat diakses melalui SSH.

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

Default: `command: "ssh"`, `workspaceRoot: "/tmp/openclaw-sandboxes"`, `strictHostKeyChecking: true`, `updateHostKeys: true`.

- **Siklus hidup**: OpenClaw membuat direktori akar jarak jauh per cakupan di bawah `sandbox.ssh.workspaceRoot`. Pada penggunaan pertama setelah pembuatan atau pembuatan ulang, OpenClaw menginisialisasi ruang kerja jarak jauh tersebut satu kali dari ruang kerja lokal. Setelah itu, `exec`, `read`, `write`, `edit`, `apply_patch`, pembacaan media prompt, dan penempatan awal media masuk berjalan langsung terhadap ruang kerja jarak jauh melalui SSH. OpenClaw tidak menyinkronkan perubahan jarak jauh kembali ke ruang kerja lokal secara otomatis.
- **Materi autentikasi**: `identityFile`/`certificateFile`/`knownHostsFile` merujuk ke berkas lokal yang sudah ada. `identityData`/`certificateData`/`knownHostsData` menerima string inline atau SecretRef, diselesaikan melalui snapshot runtime rahasia normal, ditulis ke berkas sementara dengan mode `0600`, dan dihapus ketika sesi SSH berakhir. Jika varian `*File` dan `*Data` ditetapkan untuk item yang sama, `*Data` berlaku untuk sesi tersebut.
- **Konsekuensi kanonis-jarak-jauh**: ruang kerja SSH jarak jauh menjadi keadaan sandbox yang sebenarnya setelah inisialisasi awal. Pengeditan lokal di host yang dilakukan di luar OpenClaw setelah langkah inisialisasi tidak terlihat dari jarak jauh hingga Anda membuat ulang sandbox. `openclaw sandbox recreate` menghapus direktori akar jarak jauh per cakupan dan melakukan inisialisasi ulang dari lokal pada penggunaan berikutnya. Sandboxing peramban tidak didukung pada backend ini, dan pengaturan `sandbox.docker.*` tidak berlaku untuknya.

## Backend OpenShell

Gunakan `backend: "openshell"` untuk menjalankan alat dalam sandbox di lingkungan jarak jauh yang dikelola OpenShell. OpenShell menggunakan kembali transportasi SSH dan bridge sistem berkas jarak jauh yang sama dengan backend SSH generik, serta menambahkan siklus hidup OpenShell (`sandbox create/get/delete/ssh-config`) dan mode sinkronisasi ruang kerja `mirror` opsional.

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
        },
      },
    },
  },
}
```

`mode: "mirror"` (default) mempertahankan ruang kerja lokal sebagai kanonis: OpenClaw menyinkronkan ruang kerja lokal ke dalam sandbox sebelum `exec` dan menyinkronkannya kembali setelahnya. `mode: "remote"` menginisialisasi ruang kerja jarak jauh satu kali dari lokal, lalu menjalankan `exec`/`read`/`write`/`edit`/`apply_patch` langsung terhadap ruang kerja jarak jauh tanpa menyinkronkannya kembali; pengeditan lokal setelah inisialisasi tidak terlihat hingga Anda menjalankan `openclaw sandbox recreate`. Dalam `scope: "agent"` atau `scope: "shared"`, ruang kerja jarak jauh tersebut digunakan bersama pada cakupan yang sama. Keterbatasan saat ini: peramban sandbox belum didukung, dan `sandbox.docker.binds` tidak berlaku untuk backend ini.

`openclaw sandbox list`/`recreate`/prune semuanya memperlakukan runtime OpenShell sama seperti runtime Docker; logika prune memperhitungkan backend.

Untuk prasyarat lengkap, referensi konfigurasi, perbandingan mode ruang kerja, dan detail siklus hidup, lihat [OpenShell](/id/gateway/openshell).

## Akses ruang kerja

`agents.defaults.sandbox.workspaceAccess` mengendalikan apa yang dapat dilihat oleh sandbox:

| Nilai            | Perilaku                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `none` (bawaan)  | Alat melihat ruang kerja sandbox terisolasi di bawah `~/.openclaw/sandboxes`.             |
| `ro`             | Memasang ruang kerja agen sebagai hanya-baca di `/agent` (menonaktifkan `write`/`edit`/`apply_patch`). |
| `rw`             | Memasang ruang kerja agen sebagai baca/tulis di `/workspace`.                             |

Dengan backend OpenShell, mode `mirror` tetap menggunakan ruang kerja lokal sebagai sumber kanonis di antara giliran eksekusi, mode `remote` menggunakan ruang kerja OpenShell jarak jauh sebagai sumber kanonis setelah penanaman awal, dan `workspaceAccess: "ro"`/`"none"` tetap membatasi perilaku penulisan dengan cara yang sama.

Media masuk disalin ke ruang kerja sandbox aktif (`media/inbound/*`).

<Note>
**Skills**: alat `read` berakar pada sandbox. Dengan `workspaceAccess: "none"`, OpenClaw mencerminkan Skills yang memenuhi syarat ke ruang kerja sandbox (`.../skills`) agar dapat dibaca. Dengan `"rw"`, Skills ruang kerja dapat dibaca dari `/workspace/skills`, dan Skills terkelola, bawaan, atau Plugin yang memenuhi syarat diwujudkan ke jalur hanya-baca yang dihasilkan `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## Pemasangan bind khusus

`agents.defaults.sandbox.docker.binds` memasang direktori host tambahan ke dalam kontainer. Format: `host:container:mode` (misalnya, `"/home/user/source:/source:rw"`).

Bind global dan per agen digabungkan (bukan diganti). Di bawah `scope: "shared"`, bind per agen diabaikan.

`agents.defaults.sandbox.browser.binds` memasang direktori host tambahan hanya ke dalam kontainer **peramban sandbox**. Ketika ditetapkan (termasuk `[]`), nilai ini menggantikan `docker.binds` untuk kontainer peramban; ketika dihilangkan, kontainer peramban kembali menggunakan `docker.binds`.

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

- Bind melewati sistem berkas sandbox: bind mengekspos jalur host dengan mode apa pun yang Anda tetapkan (`:ro` atau `:rw`).
- OpenClaw memblokir sumber bind berbahaya secara bawaan: jalur sistem (`/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot`), direktori soket Docker (`/run`, `/var/run`, dan varian `docker.sock`-nya), serta akar kredensial direktori beranda yang umum (`~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh`).
- Validasi menormalisasi jalur sumber, lalu menyelesaikannya kembali melalui leluhur terdalam yang ada sebelum memeriksa ulang jalur yang diblokir dan akar yang diizinkan, sehingga pelolosan melalui induk symlink ditolak secara tertutup meskipun daun akhir belum ada (misalnya, `/workspace/run-link/new-file` tetap diselesaikan sebagai `/var/run/...` jika `run-link` menunjuk ke sana).
- Target bind yang menutupi titik pemasangan kontainer yang dicadangkan (`/workspace`, `/agent`) juga diblokir secara bawaan; timpa dengan `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true`.
- Sumber bind di luar akar ruang kerja/ruang kerja agen yang masuk daftar izin diblokir secara bawaan; timpa dengan `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true`. Akar yang diizinkan dikanonisasi dengan cara yang sama, sehingga jalur yang hanya tampak berada di dalam daftar izin sebelum penyelesaian symlink tetap ditolak karena berada di luar akar yang diizinkan.
- Pemasangan sensitif (rahasia, kunci SSH, kredensial layanan) harus menggunakan `:ro` kecuali benar-benar diperlukan.
- Gabungkan dengan `workspaceAccess: "ro"` jika Anda hanya memerlukan akses baca ke ruang kerja; mode bind tetap independen.
- Lihat [Sandbox vs Kebijakan Alat vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) untuk mengetahui cara bind berinteraksi dengan kebijakan alat dan eksekusi elevated.

</Warning>

## Citra dan penyiapan

Citra Docker bawaan: `openclaw-sandbox:bookworm-slim`

<Note>
**Checkout sumber vs instalasi npm**

Skrip pembantu `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh`, dan `scripts/sandbox-browser-setup.sh` hanya tersedia saat menjalankan dari [checkout sumber](https://github.com/openclaw/openclaw). Skrip tersebut tidak disertakan dalam paket npm.

Jika Anda menginstal OpenClaw melalui `npm install -g openclaw`, gunakan perintah `docker build` sebaris yang ditampilkan di bawah sebagai gantinya.
</Note>

<Steps>
  <Step title="Bangun citra bawaan">
    Dari checkout sumber:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Dari instalasi npm (checkout sumber tidak diperlukan):

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

    Citra bawaan **tidak** menyertakan Node. Jika suatu skill memerlukan Node (atau runtime lain), buat citra khusus yang sudah menyertakannya atau instal melalui `sandbox.docker.setupCommand` (memerlukan akses jaringan keluar + root yang dapat ditulis + pengguna root).

    OpenClaw tidak secara diam-diam mengganti dengan `debian:bookworm-slim` biasa ketika `openclaw-sandbox:bookworm-slim` tidak ditemukan. Proses sandbox yang menargetkan citra bawaan langsung gagal dengan instruksi pembangunan hingga Anda membangunnya, karena citra bawaan menyertakan `python3` untuk pembantu tulis/edit sandbox.

  </Step>
  <Step title="Opsional: bangun citra umum">
    Untuk citra sandbox yang lebih fungsional dengan alat umum (misalnya `curl`, `jq`, Node 24, pnpm, `python3`, dan `git`):

    Dari checkout sumber:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Dari instalasi npm, bangun citra bawaan terlebih dahulu (lihat di atas), lalu bangun citra umum di atasnya menggunakan [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) dari repositori.

    Kemudian tetapkan `agents.defaults.sandbox.docker.image` ke `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Opsional: bangun citra peramban sandbox">
    Dari checkout sumber:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Dari instalasi npm, bangun menggunakan [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) dari repositori.

  </Step>
</Steps>

Secara bawaan, kontainer sandbox Docker berjalan **tanpa jaringan**. Timpa dengan `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Bawaan Chromium peramban sandbox">
    Citra peramban sandbox bawaan menerapkan flag awal Chromium yang konservatif untuk beban kerja dalam kontainer:

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--password-store=basic`
    - `--use-mock-keychain`
    - `--headless=new` ketika `browser.headless` diaktifkan.
    - `--no-sandbox --disable-setuid-sandbox` ketika `browser.noSandbox` diaktifkan.
    - `--disable-3d-apis`, `--disable-gpu`, `--disable-software-rasterizer` secara bawaan; flag penguatan grafis ini membantu kontainer tanpa dukungan GPU. Tetapkan `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` jika beban kerja Anda memerlukan WebGL atau fitur 3D lainnya.
    - `--disable-extensions` secara bawaan; tetapkan `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` untuk alur yang bergantung pada ekstensi.
    - `--renderer-process-limit=2` secara bawaan; dikendalikan oleh `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, dengan `0` mempertahankan nilai bawaan Chromium.

    Jika Anda memerlukan profil runtime yang berbeda, gunakan citra peramban khusus dan sediakan entrypoint Anda sendiri. Untuk profil Chromium lokal (bukan kontainer), gunakan `browser.extraArgs` untuk menambahkan flag awal tambahan.

  </Accordion>
  <Accordion title="Bawaan keamanan jaringan">
    - `network: "host"` diblokir.
    - `network: "container:<id>"` diblokir secara bawaan (risiko melewati batas melalui penggabungan namespace).
    - Penimpaan darurat: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Instalasi Docker dan Gateway dalam kontainer tersedia di sini: [Docker](/id/install/docker)

Untuk penerapan Gateway Docker, `scripts/docker/setup.sh` dapat melakukan bootstrap konfigurasi sandbox. Tetapkan `OPENCLAW_SANDBOX=1` (atau `true`/`yes`/`on`) untuk mengaktifkan jalur tersebut. Timpa lokasi soket dengan `OPENCLAW_DOCKER_SOCKET`. Referensi penyiapan lengkap dan variabel lingkungan: [Docker](/id/install/docker#agent-sandbox).

## setupCommand (penyiapan kontainer satu kali)

`setupCommand` berjalan **sekali** setelah kontainer sandbox dibuat (bukan pada setiap proses). Perintah ini dieksekusi di dalam kontainer melalui `sh -lc`.

Jalur:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Per agen: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Kendala umum">
    - Nilai bawaan `docker.network` adalah `"none"` (tanpa akses keluar), sehingga instalasi paket akan gagal.
    - `docker.network: "container:<id>"` memerlukan `dangerouslyAllowContainerNamespaceJoin: true` dan hanya untuk keadaan darurat.
    - `readOnlyRoot: true` mencegah penulisan; tetapkan `readOnlyRoot: false` atau buat citra khusus yang sudah menyertakan kebutuhan Anda.
    - `user` harus berupa root untuk instalasi paket (hilangkan `user` atau tetapkan `user: "0:0"`).
    - Eksekusi sandbox **tidak** mewarisi `process.env` host. Gunakan `agents.defaults.sandbox.docker.env` (atau citra khusus) untuk kunci API skill.
    - Nilai dalam `agents.defaults.sandbox.docker.env` diteruskan sebagai variabel lingkungan kontainer Docker eksplisit. Siapa pun yang memiliki akses ke daemon Docker dapat memeriksanya dengan perintah metadata Docker seperti `docker inspect`. Gunakan citra khusus, berkas rahasia yang dipasang, atau jalur pengiriman rahasia lainnya jika paparan metadata tersebut tidak dapat diterima.

  </Accordion>
</AccordionGroup>

## Kebijakan alat dan jalur keluar darurat

Kebijakan izin/tolak alat tetap berlaku sebelum aturan sandbox. Jika sebuah alat ditolak secara global atau per agen, sandboxing tidak mengaktifkannya kembali.

`tools.elevated` adalah jalur keluar eksplisit yang menjalankan `exec` di luar sandbox (`gateway` secara bawaan, atau `node` ketika target eksekusi adalah `node`). Direktif `/exec` hanya berlaku untuk pengirim yang diotorisasi dan bertahan per sesi; untuk menonaktifkan `exec` sepenuhnya, gunakan penolakan kebijakan alat (lihat [Sandbox vs Kebijakan Alat vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugging:

- `openclaw sandbox list` menampilkan kontainer sandbox, status, kecocokan citra, usia, waktu menganggur, serta sesi/agen terkait.
- `openclaw sandbox explain [--session <key>] [--agent <id>]` memeriksa mode sandbox efektif, ruang kerja host, direktori kerja runtime, pemasangan Docker, kebijakan alat, dan kunci konfigurasi perbaikan. Bidang `workspaceRoot` tetap merupakan akar sandbox yang dikonfigurasi; `effectiveHostWorkspaceRoot` menunjukkan lokasi ruang kerja aktif yang sebenarnya.
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` menghapus kontainer/lingkungan agar dibuat ulang dengan konfigurasi saat ini pada penggunaan berikutnya.
- Lihat [Sandbox vs Kebijakan Alat vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) untuk model mental "mengapa ini diblokir?".

## Penimpaan multiagen

Setiap agen dapat menimpa sandbox + alat: `agents.list[].sandbox` dan `agents.list[].tools` (ditambah `agents.list[].tools.sandbox.tools` untuk kebijakan alat sandbox). Lihat [Sandbox & Alat Multiagen](/id/tools/multi-agent-sandbox-tools) untuk urutan prioritas.

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

- [Sandbox & Alat Multi-Agen](/id/tools/multi-agent-sandbox-tools) -- penggantian khusus per agen dan urutan prioritas
- [OpenShell](/id/gateway/openshell) -- penyiapan backend sandbox terkelola, mode ruang kerja, dan referensi konfigurasi
- [Konfigurasi sandbox](/id/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Kebijakan Alat vs Hak Istimewa](/id/gateway/sandbox-vs-tool-policy-vs-elevated) -- men-debug "mengapa ini diblokir?"
- [Keamanan](/id/gateway/security)
