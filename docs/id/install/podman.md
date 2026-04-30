---
read_when:
    - Anda menginginkan Gateway yang dikontainerisasi dengan Podman, bukan Docker
summary: Jalankan OpenClaw dalam kontainer Podman tanpa root
title: Podman
x-i18n:
    generated_at: "2026-04-30T09:57:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: bfdcbbdb62c2f8ca2d6d370b742003e6f92f6921a38c00ba19e810d83e350647
    source_path: install/podman.md
    workflow: 16
---

Jalankan OpenClaw Gateway dalam kontainer Podman rootless, yang dikelola oleh pengguna non-root Anda saat ini.

Model yang dimaksud adalah:

- Podman menjalankan kontainer gateway.
- CLI `openclaw` host Anda adalah bidang kontrol.
- State persisten berada di host di bawah `~/.openclaw` secara default.
- Pengelolaan sehari-hari menggunakan `openclaw --container <name> ...` alih-alih `sudo -u openclaw`, `podman exec`, atau pengguna layanan terpisah.

## Prasyarat

- **Podman** dalam mode rootless
- **OpenClaw CLI** terinstal di host
- **Opsional:** `systemd --user` jika Anda ingin auto-start yang dikelola Quadlet
- **Opsional:** `sudo` hanya jika Anda ingin `loginctl enable-linger "$(whoami)"` untuk persistensi boot pada host headless

## Mulai cepat

<Steps>
  <Step title="Penyiapan satu kali">
    Dari root repo, jalankan `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Mulai kontainer Gateway">
    Mulai kontainer dengan `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Jalankan onboarding di dalam kontainer">
    Jalankan `./scripts/run-openclaw-podman.sh launch setup`, lalu buka `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Kelola kontainer yang sedang berjalan dari CLI host">
    Tetapkan `OPENCLAW_CONTAINER=openclaw`, lalu gunakan perintah `openclaw` normal dari host.
  </Step>
</Steps>

Detail penyiapan:

- `./scripts/podman/setup.sh` membangun `openclaw:local` di store Podman rootless Anda secara default, atau menggunakan `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` jika Anda menetapkannya.
- Ini membuat `~/.openclaw/openclaw.json` dengan `gateway.mode: "local"` jika belum ada.
- Ini membuat `~/.openclaw/.env` dengan `OPENCLAW_GATEWAY_TOKEN` jika belum ada.
- Untuk peluncuran manual, helper hanya membaca allowlist kecil berisi key terkait Podman dari `~/.openclaw/.env` dan meneruskan env var runtime eksplisit ke kontainer; ini tidak menyerahkan seluruh file env ke Podman.

Penyiapan yang dikelola Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet adalah opsi khusus Linux karena bergantung pada layanan pengguna systemd.

Anda juga dapat menetapkan `OPENCLAW_PODMAN_QUADLET=1`.

Env var build/penyiapan opsional:

- `OPENCLAW_IMAGE` atau `OPENCLAW_PODMAN_IMAGE` -- gunakan image yang sudah ada/ditarik alih-alih membangun `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- instal paket apt tambahan selama build image
- `OPENCLAW_EXTENSIONS` -- pra-instal dependensi plugin pada waktu build
- `OPENCLAW_INSTALL_BROWSER` -- pra-instal Chromium dan Xvfb untuk otomatisasi browser (tetapkan ke `1` untuk mengaktifkan)

Mulai kontainer:

```bash
./scripts/run-openclaw-podman.sh launch
```

Skrip memulai kontainer sebagai uid/gid Anda saat ini dengan `--userns=keep-id` dan melakukan bind-mount state OpenClaw Anda ke dalam kontainer.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Lalu buka `http://127.0.0.1:18789/` dan gunakan token dari `~/.openclaw/.env`.

Default CLI host:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Lalu perintah seperti ini akan berjalan otomatis di dalam kontainer tersebut:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

Di macOS, mesin Podman dapat membuat browser tampak non-lokal bagi gateway.
Jika Control UI melaporkan error device-auth setelah peluncuran, gunakan panduan Tailscale di
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Untuk HTTPS atau akses browser jarak jauh, ikuti dokumentasi utama Tailscale.

Catatan khusus Podman:

- Pertahankan host publikasi Podman di `127.0.0.1`.
- Lebih pilih `tailscale serve` yang dikelola host daripada `openclaw gateway --tailscale serve`.
- Di macOS, jika konteks device-auth browser lokal tidak andal, gunakan akses Tailscale alih-alih workaround tunnel lokal ad hoc.

Lihat:

- [Tailscale](/id/gateway/tailscale)
- [Control UI](/id/web/control-ui)

## Systemd (Quadlet, opsional)

Jika Anda menjalankan `./scripts/podman/setup.sh --quadlet`, penyiapan memasang file Quadlet di:

```bash
~/.config/containers/systemd/openclaw.container
```

Perintah berguna:

- **Mulai:** `systemctl --user start openclaw.service`
- **Hentikan:** `systemctl --user stop openclaw.service`
- **Status:** `systemctl --user status openclaw.service`
- **Log:** `journalctl --user -u openclaw.service -f`

Setelah mengedit file Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Untuk persistensi boot pada host SSH/headless, aktifkan lingering untuk pengguna Anda saat ini:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Konfigurasi, env, dan penyimpanan

- **Direktori konfigurasi:** `~/.openclaw`
- **Direktori workspace:** `~/.openclaw/workspace`
- **File token:** `~/.openclaw/.env`
- **Helper peluncuran:** `./scripts/run-openclaw-podman.sh`

Skrip peluncuran dan Quadlet melakukan bind-mount state host ke dalam kontainer:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Secara default, itu adalah direktori host, bukan state kontainer anonim, sehingga
`openclaw.json`, `auth-profiles.json` per agen, state channel/provider,
sesi, dan workspace bertahan setelah penggantian kontainer.
Penyiapan Podman juga mengisi `gateway.controlUi.allowedOrigins` untuk `127.0.0.1` dan `localhost` pada port gateway yang dipublikasikan agar dashboard lokal berfungsi dengan bind non-loopback kontainer.

Env var berguna untuk launcher manual:

- `OPENCLAW_PODMAN_CONTAINER` -- nama kontainer (`openclaw` secara default)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- image yang akan dijalankan
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- port host yang dipetakan ke kontainer `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- port host yang dipetakan ke kontainer `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- antarmuka host untuk port yang dipublikasikan; default adalah `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- mode bind gateway di dalam kontainer; default adalah `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (default), `auto`, atau `host`

Launcher manual membaca `~/.openclaw/.env` sebelum menyelesaikan default kontainer/image, sehingga Anda dapat mempertahankan ini di sana.

Jika Anda menggunakan `OPENCLAW_CONFIG_DIR` atau `OPENCLAW_WORKSPACE_DIR` non-default, tetapkan variabel yang sama untuk `./scripts/podman/setup.sh` dan perintah `./scripts/run-openclaw-podman.sh launch` berikutnya. Launcher lokal repo tidak mempertahankan override path kustom lintas shell.

Catatan Quadlet:

- Layanan Quadlet yang dibuat sengaja mempertahankan bentuk default yang tetap dan diperkeras: port yang dipublikasikan di `127.0.0.1`, `--bind lan` di dalam kontainer, dan namespace pengguna `keep-id`.
- Ini menetapkan `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure`, dan `TimeoutStartSec=300`.
- Ini memublikasikan `127.0.0.1:18789:18789` (gateway) dan `127.0.0.1:18790:18790` (bridge).
- Ini membaca `~/.openclaw/.env` sebagai `EnvironmentFile` runtime untuk nilai seperti `OPENCLAW_GATEWAY_TOKEN`, tetapi tidak menggunakan allowlist override khusus Podman milik launcher manual.
- Jika Anda memerlukan port publikasi kustom, host publikasi, atau flag container-run lainnya, gunakan launcher manual atau edit `~/.config/containers/systemd/openclaw.container` secara langsung, lalu muat ulang dan mulai ulang layanan.

## Perintah berguna

- **Log kontainer:** `podman logs -f openclaw`
- **Hentikan kontainer:** `podman stop openclaw`
- **Hapus kontainer:** `podman rm -f openclaw`
- **Buka URL dashboard dari CLI host:** `openclaw dashboard --no-open`
- **Health/status melalui CLI host:** `openclaw gateway status --deep` (probe RPC + pemindaian
  layanan tambahan)

## Pemecahan masalah

- **Izin ditolak (EACCES) pada konfigurasi atau workspace:** Kontainer berjalan dengan `--userns=keep-id` dan `--user <your uid>:<your gid>` secara default. Pastikan path konfigurasi/workspace host dimiliki oleh pengguna Anda saat ini.
- **Mulai Gateway diblokir (`gateway.mode=local` hilang):** Pastikan `~/.openclaw/openclaw.json` ada dan menetapkan `gateway.mode="local"`. `scripts/podman/setup.sh` membuat ini jika belum ada.
- **Perintah CLI kontainer mengenai target yang salah:** Gunakan `openclaw --container <name> ...` secara eksplisit, atau ekspor `OPENCLAW_CONTAINER=<name>` di shell Anda.
- **`openclaw update` gagal dengan `--container`:** Sesuai ekspektasi. Bangun ulang/tarik image, lalu mulai ulang kontainer atau layanan Quadlet.
- **Layanan Quadlet tidak mulai:** Jalankan `systemctl --user daemon-reload`, lalu `systemctl --user start openclaw.service`. Pada sistem headless, Anda mungkin juga memerlukan `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux memblokir bind mount:** Biarkan perilaku mount default apa adanya; launcher otomatis menambahkan `:Z` di Linux saat SELinux dalam mode enforcing atau permissive.

## Terkait

- [Docker](/id/install/docker)
- [Proses latar belakang Gateway](/id/gateway/background-process)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
