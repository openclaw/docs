---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Cara kerja sandboxing OpenClaw: mode, cakupan, akses ruang kerja, dan image'
title: Sandboxing
x-i18n:
    generated_at: "2026-07-19T05:06:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7e2cab130955ee38532838a97ad3c750921dad5e9fe6ed6c533837291e935cd5
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw dapat menjalankan eksekusi alat di dalam backend sandbox untuk mengurangi radius dampak. Sandboxing dinonaktifkan secara default dan dikendalikan oleh `agents.defaults.sandbox` (global) atau `agents.list[].sandbox` (per agen). Proses Gateway selalu tetap berada di host; hanya eksekusi alat yang berpindah ke sandbox saat diaktifkan.

<Note>
Ini bukan batas keamanan yang sempurna, tetapi secara signifikan membatasi akses sistem berkas dan proses saat model melakukan sesuatu yang keliru.
</Note>

## Apa yang dimasukkan ke sandbox

- Eksekusi alat: `exec`, `read`, `write`, `edit`, `apply_patch`, `process`, dan sebagainya.
- Browser dalam sandbox opsional (`agents.defaults.sandbox.browser`).

Tidak dimasukkan ke sandbox:

- Proses Gateway itu sendiri.
- Alat apa pun yang secara eksplisit diizinkan berjalan di luar sandbox melalui `tools.elevated`. Eksekusi dengan hak istimewa yang ditingkatkan melewati sandboxing dan berjalan pada jalur keluar yang dikonfigurasi (`gateway` secara default, atau `node` saat target eksekusi adalah `node`). Jika sandboxing dinonaktifkan, `tools.elevated` tidak mengubah apa pun karena eksekusi sudah berjalan di host. Lihat [Mode dengan Hak Istimewa yang Ditingkatkan](/id/tools/elevated).

## Mode, cakupan, dan backend

Tiga pengaturan independen mengendalikan perilaku sandbox:

| Pengaturan | Kunci                             | Nilai                        | Default  |
| ---------- | --------------------------------- | ---------------------------- | -------- |
| Mode       | `agents.defaults.sandbox.mode`    | `off`, `non-main`, `all`     | `off`    |
| Cakupan    | `agents.defaults.sandbox.scope`   | `agent`, `session`, `shared` | `agent`  |
| Backend    | `agents.defaults.sandbox.backend` | `docker`, `ssh`, `openshell` | `docker` |

**Mode** mengendalikan kapan sandboxing diterapkan:

- `off`: tanpa sandboxing.
- `non-main`: masukkan setiap sesi ke sandbox kecuali sesi utama agen. Kunci sesi utama selalu `agent:<agentId>:main` (atau `global` saat `session.scope` adalah `"global"`); kunci ini tidak dapat dikonfigurasi. Sesi grup/saluran menggunakan kuncinya sendiri, sehingga selalu dianggap bukan sesi utama dan dimasukkan ke sandbox.
- `all`: setiap sesi berjalan di dalam sandbox.

**Cakupan** mengendalikan jumlah kontainer/lingkungan yang dibuat:

- `agent`: satu kontainer per agen.
- `session`: satu kontainer per sesi.
- `shared`: satu kontainer yang digunakan bersama oleh semua sesi dalam sandbox (penggantian per agen `docker`/`ssh`/`browser` diabaikan dalam cakupan ini).

**Backend** mengendalikan runtime yang mengeksekusi alat dalam sandbox. Konfigurasi khusus SSH berada di bawah `agents.defaults.sandbox.ssh`; konfigurasi khusus OpenShell berada di bawah `plugins.entries.openshell.config`.

|                       | Docker                           | SSH                            | OpenShell                                                    |
| --------------------- | -------------------------------- | ------------------------------ | ------------------------------------------------------------ |
| **Tempat dijalankan** | Kontainer lokal                  | Host apa pun yang dapat diakses melalui SSH | Sandbox yang dikelola OpenShell                  |
| **Penyiapan**         | `scripts/sandbox-setup.sh`       | Kunci SSH + host target         | Plugin OpenShell diaktifkan                                  |
| **Model ruang kerja** | Bind mount atau salinan          | Kanonis jarak jauh (disemai sekali) | `mirror` atau `remote`              |
| **Kontrol jaringan**  | `docker.network` (default: tidak ada) | Bergantung pada host jarak jauh | Bergantung pada OpenShell                              |
| **Sandbox browser**   | Didukung                         | Tidak didukung                 | Belum didukung                                               |
| **Bind mount**        | `docker.binds`                   | Tidak berlaku                  | Tidak berlaku                                                |
| **Paling sesuai untuk** | Pengembangan lokal, isolasi penuh | Memindahkan beban ke mesin jarak jauh | Sandbox jarak jauh terkelola dengan sinkronisasi dua arah opsional |

## Backend Docker

Docker adalah backend default setelah sandboxing diaktifkan. Backend ini menjalankan alat dan browser sandbox secara lokal melalui soket daemon Docker (`/var/run/docker.sock`); isolasi berasal dari namespace Docker.

Default: `network: "none"` (tanpa akses keluar), `readOnlyRoot: true`, `capDrop: ["ALL"]`, image `openclaw-sandbox:bookworm-slim`.

Untuk mengekspos GPU host, atur `agents.defaults.sandbox.docker.gpus` (atau penggantian per agen) ke nilai seperti `"all"` atau `"device=GPU-uuid"`. Nilai ini diteruskan ke flag `--gpus` milik Docker dan memerlukan runtime host yang kompatibel seperti NVIDIA Container Toolkit.

<Warning>
**Batasan Docker-out-of-Docker (DooD)**

Jika Anda men-deploy Gateway OpenClaw itu sendiri sebagai kontainer Docker, Gateway mengorkestrasi kontainer sandbox sejawat menggunakan soket Docker host (DooD). Hal ini menimbulkan batasan pemetaan jalur:

- **Konfigurasi memerlukan jalur host**: `openclaw.json` `workspace` harus berisi **jalur absolut host** (misalnya `/home/user/.openclaw/workspaces`), bukan jalur internal kontainer Gateway. Daemon Docker mengevaluasi jalur relatif terhadap namespace OS host, bukan namespace Gateway itu sendiri.
- **Diperlukan pemetaan volume yang cocok**: Proses Gateway juga menulis berkas Heartbeat dan jembatan ke jalur `workspace` tersebut. Berikan pemetaan volume yang identik (`-v /home/user/.openclaw:/home/user/.openclaw`) kepada kontainer Gateway agar jalur host yang sama juga diuraikan dengan benar dari dalam kontainer Gateway. Pemetaan yang tidak cocok akan muncul sebagai `EACCES` saat Gateway mencoba menulis Heartbeat-nya.
- **Mode kode Codex**: saat sandbox OpenClaw aktif, OpenClaw menonaktifkan Code Mode native server aplikasi Codex, server MCP pengguna, dan eksekusi Plugin yang didukung aplikasi untuk giliran tersebut (semuanya berjalan dari proses server aplikasi pada host Gateway, bukan dari backend sandbox OpenClaw), kecuali kebijakan alat sandbox mengekspos alat yang diperlukan dan Anda memilih menggunakan jalur eksperimental server eksekusi sandbox. Akses shell kemudian dirutekan melalui alat yang didukung sandbox OpenClaw seperti `sandbox_exec` dan `sandbox_process`. Jangan memasang soket Docker host ke kontainer sandbox agen atau sandbox Codex khusus. Lihat [Harness Codex](/id/plugins/codex-harness) untuk perilaku lengkapnya.

Pada host Ubuntu/AppArmor dengan mode sandbox Docker yang diaktifkan, eksekusi shell `workspace-write` server aplikasi Codex memerlukan namespace pengguna tanpa hak istimewa di dalam kontainer sandbox, dan proses ini dapat gagal sebelum shell dimulai saat pengguna layanan tidak dapat membuatnya. Namespace jaringan tanpa hak istimewa juga diperlukan saat akses keluar sandbox Docker dinonaktifkan (`network: "none"`, default). Gejala umum: `bwrap: setting up uid map: Permission denied` dan `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Jalankan `openclaw doctor`; jika perintah tersebut melaporkan kegagalan pemeriksaan namespace bwrap Codex, utamakan profil AppArmor yang memberikan namespace yang diperlukan kepada proses layanan OpenClaw. `kernel.apparmor_restrict_unprivileged_userns=0` adalah solusi alternatif untuk seluruh host dengan konsekuensi keamanan; gunakan hanya jika postur host tersebut dapat diterima.
</Warning>

### Browser dalam sandbox

- Browser sandbox dimulai secara otomatis (memastikan CDP dapat dijangkau) saat alat browser membutuhkannya. Konfigurasikan melalui `agents.defaults.sandbox.browser.autoStart` (default `true`) dan `autoStartTimeoutMs` (default 12 dtk).
- Kontainer browser sandbox menggunakan jaringan Docker khusus (`openclaw-sandbox-browser`), bukan jaringan global `bridge`. Konfigurasikan dengan `agents.defaults.sandbox.browser.network`.
- `agents.defaults.sandbox.browser.cdpSourceRange` membatasi akses masuk CDP pada tepi kontainer dengan daftar izin CIDR (misalnya `172.21.0.1/32`).
- Akses pengamat noVNC dilindungi kata sandi secara default; OpenClaw menghasilkan URL token berumur pendek yang menyajikan halaman bootstrap lokal dan membuka noVNC dengan kata sandi di fragmen URL (bukan string kueri atau log header).
- `agents.defaults.sandbox.browser.allowHostControl` (default `false`) memungkinkan sesi dalam sandbox menargetkan browser host secara eksplisit.
- Daftar izin opsional membatasi `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

## Backend SSH

Gunakan `backend: "ssh"` untuk memasukkan `exec`, alat berkas, dan pembacaan media ke sandbox pada mesin apa pun yang dapat diakses melalui SSH.

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
          // Atau gunakan SecretRefs / konten sebaris sebagai pengganti berkas lokal:
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

- **Siklus hidup**: OpenClaw membuat root jarak jauh per cakupan di bawah `sandbox.ssh.workspaceRoot`. Pada penggunaan pertama setelah dibuat atau dibuat ulang, OpenClaw menyemai ruang kerja jarak jauh tersebut dari ruang kerja lokal satu kali. Setelah itu, `exec`, `read`, `write`, `edit`, `apply_patch`, pembacaan media prompt, dan penyiapan media masuk berjalan langsung terhadap ruang kerja jarak jauh melalui SSH. OpenClaw tidak secara otomatis menyinkronkan perubahan jarak jauh kembali ke ruang kerja lokal.
- **Materi autentikasi**: `identityFile`/`certificateFile`/`knownHostsFile` merujuk ke berkas lokal yang ada. `identityData`/`certificateData`/`knownHostsData` menerima string sebaris atau SecretRefs, yang diselesaikan melalui snapshot runtime rahasia normal, ditulis ke berkas sementara dengan mode `0600`, dan dihapus saat sesi SSH berakhir. Jika varian `*File` dan `*Data` ditetapkan untuk item yang sama, `*Data` berlaku untuk sesi tersebut.
- **Konsekuensi kanonis jarak jauh**: ruang kerja SSH jarak jauh menjadi status sandbox yang sebenarnya setelah penyemaian awal. Perubahan lokal host yang dibuat di luar OpenClaw setelah langkah penyemaian tidak terlihat dari jarak jauh hingga Anda membuat ulang sandbox. `openclaw sandbox recreate` menghapus root jarak jauh per cakupan dan menyemai ulang dari lokal pada penggunaan berikutnya. Sandboxing browser tidak didukung pada backend ini, dan pengaturan `sandbox.docker.*` tidak berlaku untuk backend ini.

## Backend OpenShell

Gunakan `backend: "openshell"` untuk memasukkan alat ke sandbox dalam lingkungan jarak jauh yang dikelola OpenShell. OpenShell menggunakan kembali transportasi SSH dan jembatan sistem berkas jarak jauh yang sama seperti backend SSH generik, serta menambahkan siklus hidup OpenShell (`sandbox create/get/delete/ssh-config`) dan mode sinkronisasi ruang kerja `mirror` opsional.

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

`mode: "mirror"` (default) mempertahankan ruang kerja lokal sebagai kanonis: OpenClaw menyinkronkan ruang kerja lokal ke sandbox sebelum `exec` dan menyinkronkannya kembali setelahnya. `mode: "remote"` menginisialisasi ruang kerja jarak jauh satu kali dari ruang kerja lokal, lalu menjalankan `exec`/`read`/`write`/`edit`/`apply_patch` langsung pada ruang kerja jarak jauh tanpa menyinkronkannya kembali; perubahan lokal setelah inisialisasi tidak terlihat hingga Anda melakukan `openclaw sandbox recreate`. Dalam `scope: "agent"` atau `scope: "shared"`, ruang kerja jarak jauh tersebut dibagikan pada cakupan yang sama. Keterbatasan saat ini: browser sandbox belum didukung, dan `sandbox.docker.binds` tidak berlaku untuk backend ini.

`openclaw sandbox list`/`recreate`/prune semuanya memperlakukan runtime OpenShell sama seperti runtime Docker; logika prune menyadari backend.

Untuk prasyarat lengkap, referensi konfigurasi, perbandingan mode ruang kerja, dan detail siklus hidup, lihat [OpenShell](/id/gateway/openshell).

## Akses ruang kerja

`agents.defaults.sandbox.workspaceAccess` mengontrol apa yang dapat dilihat sandbox:

| Nilai            | Perilaku                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `none` (default) | Alat melihat ruang kerja sandbox terisolasi di bawah `~/.openclaw/sandboxes`.                    |
| `ro`             | Memasang ruang kerja agen hanya-baca di `/agent` (menonaktifkan `write`/`edit`/`apply_patch`). |
| `rw`             | Memasang ruang kerja agen baca/tulis di `/workspace`.                                    |

Dengan backend OpenShell, mode `mirror` tetap menggunakan ruang kerja lokal sebagai sumber kanonis di antara giliran eksekusi, mode `remote` menggunakan ruang kerja OpenShell jarak jauh sebagai kanonis setelah inisialisasi awal, dan `workspaceAccess: "ro"`/`"none"` tetap membatasi perilaku penulisan dengan cara yang sama.

Media masuk disalin ke ruang kerja sandbox yang aktif (`media/inbound/*`).

<Note>
**Skills**: alat `read` berakar di sandbox. Dengan `workspaceAccess: "none"`, OpenClaw mencerminkan skill yang memenuhi syarat ke ruang kerja sandbox (`.../skills`) agar dapat dibaca. Dengan `"rw"`, skill ruang kerja dapat dibaca dari `/workspace/skills`, dan skill terkelola, bawaan, atau plugin yang memenuhi syarat diwujudkan ke jalur hanya-baca yang dihasilkan, yaitu `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## Beberapa folder untuk satu agen

Gunakan pemasangan bind Docker ketika satu agen dalam sandbox memerlukan lebih dari ruang kerja utamanya. Setiap entri memetakan folder host ke jalur kontainer dengan mode akses eksplisit:

```text
host-directory:container-directory:ro
host-directory:container-directory:rw
```

- `ro` menjadikan folder yang dipasang hanya-baca di dalam sandbox.
- `rw` memungkinkan alat dan proses dalam sandbox mengubah folder host.
- Jalur kontainer adalah jalur yang digunakan agen. Jalur host tidak diekspos secara otomatis.

Contoh ini memberi agen `research` ruang kerja utama yang dapat ditulis, materi referensi hanya-baca di `/reference`, dan folder keluaran terpisah yang dapat ditulis di `/drafts`:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        scope: "agent",
      },
    },
    list: [
      {
        id: "research",
        workspace: "/srv/openclaw/research-workspace",
        sandbox: {
          workspaceAccess: "rw",
          docker: {
            binds: ["/srv/shared/reference:/reference:ro", "/srv/shared/drafts:/drafts:rw"],
            // Diperlukan karena sumber-sumber ini berada di luar ruang kerja agen.
            dangerouslyAllowExternalBindSources: true,
          },
        },
      },
    ],
  },
}
```

`workspaceAccess` dan mode bind bersifat independen:

| Pengaturan                          | Mengontrol                                                                    |
| -------------------------------- | --------------------------------------------------------------------------- |
| `workspaceAccess: "none"`        | Menggunakan ruang kerja sandbox terisolasi; tidak mengekspos ruang kerja agen.    |
| `workspaceAccess: "ro"`          | Memasang ruang kerja agen hanya-baca di `/agent`.                           |
| `workspaceAccess: "rw"`          | Memasang ruang kerja agen baca/tulis di `/workspace`.                      |
| Entri `docker.binds` `:ro`/`:rw` | Hanya mengontrol folder host tambahan tersebut pada jalur kontainer yang dikonfigurasi. |

Mengubah `workspaceAccess` tidak mengubah bind tambahan dari `ro` menjadi `rw`, atau sebaliknya. `docker.binds` global dan per agen digabungkan. Pertahankan `scope: "agent"` atau `"session"` untuk bind per agen; `scope: "shared"` mengabaikan semua penggantian Docker per agen dan hanya menggunakan bind global.

Pemasangan bind merupakan batas beberapa folder yang didukung karena Docker membentuk tampilan sistem berkas kontainer dengan isolasi pemasangan, dan mode `ro`/`rw` berlaku untuk setiap proses dalam sandbox. Batas tersebut mencakup `exec`, alat sistem berkas, proses anak, dan pustaka tanpa menduplikasi pemeriksaan otorisasi jalur di setiap jalur kode OpenClaw. Daftar izin jalur pada sisi host tidak dapat menyediakan batas lengkap yang sama ketika shell atau dependensi yang diizinkan dapat mengakses berkas secara langsung.

`dangerouslyAllowExternalBindSources` yang harus diaktifkan secara eksplisit hanya mengizinkan sumber di luar akar ruang kerja. Opsi ini tidak menonaktifkan pemeriksaan OpenClaw terhadap sistem yang diblokir, kredensial, soket Docker, induk symlink, atau target yang dicadangkan. Pilih folder sekecil mungkin, gunakan `ro` kecuali penulisan diperlukan, dan buat ulang sandbox setelah mengubah pemasangan:

```bash
openclaw sandbox recreate --agent research
```

### Perilaku bind lainnya

`agents.defaults.sandbox.docker.binds` mengonfigurasi pemasangan global. Formatnya menggunakan bentuk `host:container:mode` yang sama (misalnya, `"/home/user/source:/source:rw"`).

`agents.defaults.sandbox.browser.binds` memasang direktori host tambahan hanya ke kontainer **browser sandbox**. Jika ditetapkan (termasuk `[]`), opsi ini menggantikan `docker.binds` untuk kontainer browser; jika dihilangkan, kontainer browser kembali menggunakan `docker.binds`.

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
- OpenClaw memblokir sumber bind berbahaya secara default: jalur sistem (`/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot`), direktori soket Docker (`/run`, `/var/run`, dan varian `docker.sock`-nya), serta akar kredensial umum dalam direktori beranda (`~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh`).
- Validasi menormalkan jalur sumber, lalu menyelesaikannya kembali melalui leluhur terdalam yang sudah ada sebelum memeriksa ulang jalur yang diblokir dan akar yang diizinkan, sehingga upaya keluar melalui induk symlink ditolak secara aman meskipun simpul akhir belum ada (misalnya, `/workspace/run-link/new-file` tetap diselesaikan sebagai `/var/run/...` jika `run-link` menunjuk ke sana).
- Target bind yang menutupi titik pemasangan kontainer yang dicadangkan (`/workspace`, `/agent`) juga diblokir secara default; ganti perilaku ini dengan `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true`.
- Sumber bind di luar akar ruang kerja/ruang kerja agen yang tercantum dalam daftar izin diblokir secara default; ganti perilaku ini dengan `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true`. Akar yang diizinkan dikanonisasi dengan cara yang sama, sehingga jalur yang hanya tampak berada di dalam daftar izin sebelum penyelesaian symlink tetap ditolak karena berada di luar akar yang diizinkan.
- Pemasangan sensitif (rahasia, kunci SSH, kredensial layanan) harus menggunakan `:ro` kecuali benar-benar diperlukan.
- Gabungkan dengan `workspaceAccess: "ro"` jika Anda hanya memerlukan akses baca ke ruang kerja; mode bind tetap independen.
- Lihat [Sandbox vs Kebijakan Alat vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) untuk mengetahui cara bind berinteraksi dengan kebijakan alat dan eksekusi elevated.

</Warning>

## Image dan penyiapan

Image Docker default: `openclaw-sandbox:bookworm-slim`

<Note>
**Checkout sumber vs instalasi npm**

Skrip pembantu `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh`, dan `scripts/sandbox-browser-setup.sh` hanya tersedia saat dijalankan dari [checkout sumber](https://github.com/openclaw/openclaw). Skrip tersebut tidak disertakan dalam paket npm.

Jika Anda menginstal OpenClaw melalui `npm install -g openclaw`, gunakan perintah `docker build` inline yang ditampilkan di bawah.
</Note>

<Steps>
  <Step title="Bangun image default">
    Dari checkout sumber:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Dari instalasi npm (tidak memerlukan checkout sumber):

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

    Image default **tidak** menyertakan Node. Jika sebuah skill memerlukan Node (atau runtime lain), buat image khusus yang sudah menyertakannya atau instal melalui `sandbox.docker.setupCommand` (memerlukan akses jaringan keluar + root yang dapat ditulis + pengguna root).

    OpenClaw tidak secara diam-diam mengganti dengan `debian:bookworm-slim` biasa ketika `openclaw-sandbox:bookworm-slim` tidak ada. Eksekusi sandbox yang menargetkan image default segera gagal dengan petunjuk pembangunan hingga Anda membangunnya, karena image bawaan menyertakan `python3` untuk pembantu penulisan/pengeditan sandbox.

  </Step>
  <Step title="Opsional: bangun image umum">
    Untuk image sandbox yang lebih fungsional dengan alat umum (misalnya `curl`, `jq`, Node 24, pnpm, `python3`, dan `git`):

    Dari checkout sumber:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Dari instalasi npm, bangun image default terlebih dahulu (lihat di atas), lalu bangun image umum di atasnya menggunakan [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) dari repositori.

    Kemudian tetapkan `agents.defaults.sandbox.docker.image` ke `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Opsional: bangun image browser sandbox">
    Dari checkout sumber:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Dari instalasi npm, bangun menggunakan [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) dari repositori.

  </Step>
</Steps>

Secara default, kontainer sandbox Docker berjalan **tanpa jaringan**. Ganti perilaku ini dengan `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Default Chromium browser sandbox">
    Image browser sandbox bawaan menerapkan flag awal Chromium yang konservatif untuk beban kerja dalam kontainer:

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
    - `--headless=new` saat `browser.headless` diaktifkan.
    - `--no-sandbox --disable-setuid-sandbox` saat `browser.noSandbox` diaktifkan.
    - `--disable-3d-apis`, `--disable-gpu`, `--disable-software-rasterizer` secara default; flag penguatan grafis ini membantu kontainer tanpa dukungan GPU. Atur `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` jika beban kerja Anda memerlukan WebGL atau fitur 3D lainnya.
    - `--disable-extensions` secara default; atur `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` untuk alur yang bergantung pada ekstensi.
    - `--renderer-process-limit=2` secara default; dikendalikan oleh `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, dengan `0` mempertahankan nilai default Chromium.

    Jika memerlukan profil runtime yang berbeda, gunakan image browser khusus dan sediakan entrypoint Anda sendiri. Untuk profil Chromium lokal (nonkontainer), gunakan `browser.extraArgs` untuk menambahkan flag startup tambahan.

  </Accordion>
  <Accordion title="Default keamanan jaringan">
    - `network: "host"` diblokir.
    - `network: "container:<id>"` diblokir secara default (risiko bypass penggabungan namespace).
    - Pengabaian darurat: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Instalasi Docker dan Gateway dalam kontainer tersedia di sini: [Docker](/id/install/docker)

Untuk deployment Gateway Docker, `scripts/docker/setup.sh` dapat melakukan bootstrap konfigurasi sandbox. Atur `OPENCLAW_SANDBOX=1` (atau `true`/`yes`/`on`) untuk mengaktifkan jalur tersebut. Ganti lokasi soket dengan `OPENCLAW_DOCKER_SOCKET`. Referensi lengkap penyiapan dan lingkungan: [Docker](/id/install/docker#agent-sandbox).

## setupCommand (penyiapan kontainer satu kali)

`setupCommand` dijalankan **sekali** setelah kontainer sandbox dibuat (bukan pada setiap eksekusi). Perintah ini dijalankan di dalam kontainer melalui `sh -lc`.

Jalur:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Per agen: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Kendala umum">
    - Nilai default `docker.network` adalah `"none"` (tanpa akses keluar), sehingga instalasi paket akan gagal.
    - `docker.network: "container:<id>"` memerlukan `dangerouslyAllowContainerNamespaceJoin: true` dan hanya untuk penggunaan darurat.
    - `readOnlyRoot: true` mencegah penulisan; atur `readOnlyRoot: false` atau buat image khusus.
    - `user` harus berupa root untuk instalasi paket (hilangkan `user` atau atur `user: "0:0"`).
    - Eksekusi sandbox **tidak** mewarisi `process.env` host. Gunakan `agents.defaults.sandbox.docker.env` (atau image khusus) untuk kunci API skill.
    - Nilai dalam `agents.defaults.sandbox.docker.env` diteruskan sebagai variabel lingkungan kontainer Docker eksplisit. Siapa pun yang memiliki akses ke daemon Docker dapat memeriksanya dengan perintah metadata Docker seperti `docker inspect`. Gunakan image khusus, berkas rahasia yang dipasang, atau jalur pengiriman rahasia lainnya jika paparan metadata tersebut tidak dapat diterima.

  </Accordion>
</AccordionGroup>

## Kebijakan alat dan jalur pengabaian

Kebijakan izin/penolakan alat tetap berlaku sebelum aturan sandbox. Jika suatu alat ditolak secara global atau per agen, sandbox tidak akan mengaktifkannya kembali.

`tools.elevated` adalah jalur pengabaian eksplisit yang menjalankan `exec` di luar sandbox (`gateway` secara default, atau `node` saat target eksekusi adalah `node`). Direktif `/exec` hanya berlaku untuk pengirim yang diotorisasi dan bertahan per sesi; untuk menonaktifkan `exec` sepenuhnya, gunakan penolakan dalam kebijakan alat (lihat [Sandbox vs Kebijakan Alat vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugging:

- `openclaw sandbox list` menampilkan kontainer sandbox, status, kecocokan image, usia, waktu tidak aktif, serta sesi/agen yang terkait.
- `openclaw sandbox explain [--session <key>] [--agent <id>]` memeriksa mode sandbox efektif, ruang kerja host, direktori kerja runtime, pemasangan Docker, kebijakan alat, dan kunci konfigurasi perbaikan. Kolom `workspaceRoot` tetap menunjukkan root sandbox yang dikonfigurasi; `effectiveHostWorkspaceRoot` menunjukkan lokasi sebenarnya dari ruang kerja yang aktif.
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` menghapus kontainer/lingkungan agar dibuat ulang dengan konfigurasi saat ini pada penggunaan berikutnya.
- Lihat [Sandbox vs Kebijakan Alat vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) untuk model mental "mengapa ini diblokir?".

## Penggantian konfigurasi multiagen

Setiap agen dapat mengganti konfigurasi sandbox + alat: `agents.list[].sandbox` dan `agents.list[].tools` (serta `agents.list[].tools.sandbox.tools` untuk kebijakan alat sandbox). Lihat [Sandbox & Alat Multiagen](/id/tools/multi-agent-sandbox-tools) untuk urutan prioritas.

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

- [Sandbox & Alat Multiagen](/id/tools/multi-agent-sandbox-tools) -- penggantian konfigurasi per agen dan urutan prioritas
- [OpenShell](/id/gateway/openshell) -- penyiapan backend sandbox terkelola, mode ruang kerja, dan referensi konfigurasi
- [Konfigurasi sandbox](/id/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Kebijakan Alat vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) -- debugging "mengapa ini diblokir?"
- [Keamanan](/id/gateway/security)
