---
read_when:
    - Anda menginginkan Gateway dalam kontainer dengan Podman, bukan Docker
summary: Jalankan OpenClaw dalam kontainer Podman tanpa root
title: Podman
x-i18n:
    generated_at: "2026-07-12T14:18:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2db1f2b0413d7b9e1b2007aaae2da9d07fa44a1b52901d4a6cbc6274e54567f1
    source_path: install/podman.md
    workflow: 16
---

Jalankan Gateway OpenClaw dalam kontainer Podman tanpa root, yang dikelola oleh pengguna non-root Anda saat ini.

Modelnya:

- Podman menjalankan kontainer Gateway.
- CLI `openclaw` pada host Anda berfungsi sebagai bidang kendali.
- Status persisten secara default disimpan pada host di bawah `~/.openclaw`.
- Pengelolaan sehari-hari menggunakan `openclaw --container <name> ...`, bukan `sudo -u openclaw`, `podman exec`, atau pengguna layanan terpisah.

## Prasyarat

- **Podman** dalam mode tanpa root
- **CLI OpenClaw** terinstal pada host
- **Opsional:** `systemd --user` jika Anda menginginkan mulai otomatis yang dikelola Quadlet
- **Opsional:** `sudo` hanya jika Anda ingin menjalankan `loginctl enable-linger "$(whoami)"` agar tetap berjalan setelah boot pada host tanpa monitor

## Mulai cepat

<Steps>
  <Step title="Penyiapan satu kali">
    Dari root repositori, jalankan `./scripts/podman/setup.sh`.

    Perintah ini membangun `openclaw:local` di penyimpanan Podman tanpa root Anda (atau menarik `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` jika ditetapkan), membuat `~/.openclaw/openclaw.json` dengan `gateway.mode: "local"` jika belum ada, dan membuat `~/.openclaw/.env` dengan `OPENCLAW_GATEWAY_TOKEN` yang dihasilkan jika belum ada.

    Variabel lingkungan waktu pembangunan opsional:

    | Variabel | Efek |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | Menggunakan citra yang sudah ada/ditarik, alih-alih membangun `openclaw:local` |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | Menginstal paket apt tambahan selama pembangunan citra (juga menerima `OPENCLAW_DOCKER_APT_PACKAGES` lama) |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | Menginstal paket Python tambahan selama pembangunan citra; sematkan versinya dan gunakan hanya indeks paket yang Anda percayai |
    | `OPENCLAW_EXTENSIONS` | Mengompilasi/mengemas plugin terpilih yang didukung dan menginstal dependensi waktu jalannya |
    | `OPENCLAW_INSTALL_BROWSER` | Menginstal Chromium dan Xvfb terlebih dahulu untuk otomatisasi peramban (tetapkan ke `1`) |

    Untuk penyiapan yang dikelola Quadlet sebagai gantinya (khusus Linux + layanan pengguna systemd):

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    Atau tetapkan `OPENCLAW_PODMAN_QUADLET=1`.

  </Step>

  <Step title="Mulai kontainer Gateway">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    Memulai kontainer dengan uid/gid Anda saat ini menggunakan `--userns=keep-id` dan memasang-terikat status OpenClaw Anda ke dalam kontainer.

  </Step>

  <Step title="Jalankan orientasi awal di dalam kontainer">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    Kemudian buka `http://127.0.0.1:18789/` dan gunakan token dari `~/.openclaw/.env`.

    Autentikasi model: gunakan autentikasi yang dikelola OpenClaw selama penyiapan (kunci API Anthropic, atau autentikasi OAuth peramban/kode perangkat OpenAI Codex untuk OpenAI yang didukung Codex). Peluncur Podman tidak memasang direktori kredensial CLI host seperti `~/.claude` atau `~/.codex` ke dalam kontainer penyiapan atau Gateway. Login CLI host yang sudah ada hanya merupakan jalur kemudahan pada host yang sama -- untuk instalasi kontainer, simpan autentikasi penyedia dalam status `~/.openclaw` terpasang yang dikelola oleh penyiapan.

  </Step>

  <Step title="Kelola kontainer yang berjalan dari CLI host">
    ```bash
    export OPENCLAW_CONTAINER=openclaw
    ```

    Setelah itu, perintah `openclaw` biasa berjalan secara otomatis di dalam kontainer tersebut:

    ```bash
    openclaw dashboard --no-open
    openclaw gateway status --deep   # mencakup pemindaian layanan tambahan
    openclaw doctor
    openclaw channels login
    ```

    Di macOS, mesin Podman dapat membuat peramban tampak tidak lokal bagi Gateway. Jika UI Kontrol melaporkan kesalahan autentikasi perangkat setelah peluncuran, gunakan panduan Tailscale dalam [Podman dan Tailscale](#podman-and-tailscale).

  </Step>
</Steps>

Peluncur manual hanya membaca daftar izin kecil berisi kunci terkait Podman dari `~/.openclaw/.env` dan meneruskan variabel lingkungan waktu jalan secara eksplisit ke kontainer; peluncur tidak menyerahkan seluruh berkas lingkungan kepada Podman.

<a id="podman-and-tailscale"></a>

## Podman dan Tailscale

Untuk HTTPS atau akses peramban jarak jauh, ikuti dokumentasi utama Tailscale.

Catatan khusus Podman:

- Pertahankan host publikasi Podman pada `127.0.0.1`.
- Utamakan `tailscale serve` yang dikelola host daripada `openclaw gateway --tailscale serve`.
- Di macOS, jika konteks autentikasi perangkat peramban lokal tidak dapat diandalkan, gunakan akses Tailscale sebagai pengganti solusi sementara terowongan lokal ad hoc.

Lihat [Tailscale](/id/gateway/tailscale) dan [UI Kontrol](/id/web/control-ui).

## Systemd (Quadlet, opsional)

Jika Anda menjalankan `./scripts/podman/setup.sh --quadlet`, penyiapan menginstal berkas Quadlet di `~/.config/containers/systemd/openclaw.container`.

| Tindakan | Perintah                                   |
| -------- | ------------------------------------------ |
| Mulai    | `systemctl --user start openclaw.service`  |
| Hentikan | `systemctl --user stop openclaw.service`   |
| Status   | `systemctl --user status openclaw.service` |
| Log      | `journalctl --user -u openclaw.service -f` |

Setelah mengedit berkas Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Agar tetap berjalan setelah boot pada host SSH/tanpa monitor, aktifkan lingering untuk pengguna Anda saat ini:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Layanan Quadlet yang dihasilkan mempertahankan bentuk bawaan tetap yang diperkeras: port yang dipublikasikan pada `127.0.0.1` (`18789` untuk Gateway, `18790` untuk jembatan), `--bind lan` di dalam kontainer, ruang nama pengguna `keep-id`, `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure`, dan `TimeoutStartSec=300`. Layanan ini membaca `~/.openclaw/.env` sebagai `EnvironmentFile` waktu jalan untuk nilai seperti `OPENCLAW_GATEWAY_TOKEN`, tetapi tidak menggunakan daftar izin penggantian khusus Podman milik peluncur manual. Untuk port publikasi khusus, host publikasi, atau flag lain saat menjalankan kontainer, gunakan peluncur manual sebagai gantinya, atau edit `~/.config/containers/systemd/openclaw.container` secara langsung, lalu muat ulang dan mulai ulang layanan.

## Konfigurasi, lingkungan, dan penyimpanan

- **Direktori konfigurasi:** `~/.openclaw`
- **Direktori ruang kerja:** `~/.openclaw/workspace`
- **Berkas token:** `~/.openclaw/.env`
- **Pembantu peluncuran:** `./scripts/run-openclaw-podman.sh`

Skrip peluncuran dan Quadlet memasang-terikat status host ke dalam kontainer: `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`. Secara bawaan, lokasi tersebut merupakan direktori host, bukan status kontainer anonim, sehingga `openclaw.json`, `auth-profiles.json` per agen, status kanal/penyedia, sesi, dan ruang kerja tetap ada setelah kontainer diganti. Penyiapan juga mengisi awal `gateway.controlUi.allowedOrigins` untuk `127.0.0.1` dan `localhost` pada port Gateway yang dipublikasikan agar dasbor lokal berfungsi dengan pengikatan non-loopback kontainer.

Variabel lingkungan yang berguna untuk peluncur manual (simpan secara persisten di `~/.openclaw/.env`; peluncur membaca berkas tersebut sebelum menetapkan nilai bawaan akhir kontainer/citra):

| Variabel                                   | Bawaan           | Efek                                           |
| ------------------------------------------ | ---------------- | ---------------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`       | Nama kontainer                                 |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local` | Citra yang dijalankan                          |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`          | Port host yang dipetakan ke kontainer `18789`  |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`          | Port host yang dipetakan ke kontainer `18790`  |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`      | Antarmuka host untuk port yang dipublikasikan  |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`            | Mode pengikatan Gateway di dalam kontainer     |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`        | `keep-id`, `auto`, atau `host`                 |

Jika Anda menggunakan `OPENCLAW_CONFIG_DIR` atau `OPENCLAW_WORKSPACE_DIR` nonbawaan, tetapkan variabel yang sama untuk perintah `./scripts/podman/setup.sh` dan `./scripts/run-openclaw-podman.sh launch` berikutnya -- peluncur lokal repositori tidak menyimpan penggantian jalur khusus secara persisten antar-shell.

## Memutakhirkan citra

Setelah Anda membangun ulang atau menarik citra baru, mulai ulang kontainer atau layanan Quadlet.
Pada penyalaan pertama untuk versi OpenClaw baru, Gateway menjalankan perbaikan status dan
plugin secara aman sebelum melaporkan bahwa sistem siap.

Jika Gateway berhenti alih-alih menjadi siap, jalankan citra yang sama satu kali dengan
`openclaw doctor --fix` terhadap status/konfigurasi terpasang yang sama, lalu mulai ulang
Gateway secara normal:

```bash
OPENCLAW_CONFIG_DIR="${OPENCLAW_CONFIG_DIR:-$HOME/.openclaw}"
OPENCLAW_WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:-$OPENCLAW_CONFIG_DIR/workspace}"
OPENCLAW_PODMAN_IMAGE="${OPENCLAW_PODMAN_IMAGE:-${OPENCLAW_IMAGE:-openclaw:local}}"

podman run --rm -it \
  --userns=keep-id \
  --user "$(id -u):$(id -g)" \
  -e HOME=/home/node \
  -e NPM_CONFIG_CACHE=/home/node/.openclaw/.npm \
  -v "$OPENCLAW_CONFIG_DIR:/home/node/.openclaw:rw" \
  -v "$OPENCLAW_WORKSPACE_DIR:/home/node/.openclaw/workspace:rw" \
  "$OPENCLAW_PODMAN_IMAGE" \
  openclaw doctor --fix
```

Pada host SELinux, tambahkan `,Z` ke kedua pemasangan terikat jika Podman memblokir akses ke
status terpasang.

## Perintah yang berguna

- **Log kontainer:** `podman logs -f openclaw`
- **Hentikan kontainer:** `podman stop openclaw`
- **Hapus kontainer:** `podman rm -f openclaw`
- **Buka URL dasbor dari CLI host:** `openclaw dashboard --no-open`
- **Kesehatan/status melalui CLI host:** `openclaw gateway status --deep` (pemeriksaan RPC + pemindaian layanan tambahan)

## Pemecahan masalah

- **Izin ditolak (EACCES) pada konfigurasi atau ruang kerja:** Kontainer secara bawaan berjalan dengan `--userns=keep-id` dan `--user <uid Anda>:<gid Anda>`. Pastikan jalur konfigurasi/ruang kerja host dimiliki oleh pengguna Anda saat ini.
- **Mulainya Gateway diblokir (`gateway.mode=local` tidak ada):** Pastikan `~/.openclaw/openclaw.json` ada dan menetapkan `gateway.mode="local"`. `scripts/podman/setup.sh` membuatnya jika belum ada.
- **Kontainer dimulai ulang setelah pembaruan citra:** Jalankan perintah sekali pakai `openclaw doctor --fix` dalam [Memutakhirkan citra](#upgrading-images), lalu mulai kembali Gateway.
- **Perintah CLI kontainer mengakses target yang salah:** Gunakan `openclaw --container <name> ...` secara eksplisit, atau ekspor `OPENCLAW_CONTAINER=<name>` dalam shell Anda.
- **`openclaw update` gagal dengan `--container`:** Ini sesuai harapan. Bangun ulang/tarik citra, lalu mulai ulang kontainer atau layanan Quadlet.
- **Layanan Quadlet tidak dimulai:** Jalankan `systemctl --user daemon-reload`, lalu `systemctl --user start openclaw.service`. Pada sistem tanpa monitor, Anda mungkin juga perlu menjalankan `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux memblokir pemasangan terikat:** Biarkan perilaku pemasangan bawaan apa adanya; peluncur secara otomatis menambahkan `:Z` di Linux ketika SELinux berada dalam mode enforcing atau permissive.

## Terkait

- [Docker](/id/install/docker)
- [Proses latar belakang Gateway](/id/gateway/background-process)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
