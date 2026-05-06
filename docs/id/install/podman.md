---
read_when:
    - Anda menginginkan Gateway terkontainerisasi dengan Podman, bukan Docker
summary: Jalankan OpenClaw dalam kontainer Podman tanpa root
title: Podman
x-i18n:
    generated_at: "2026-05-06T09:18:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44f89feede7fe10325810599dad457f8fcc3adbd9c139e26df67b9ad12019d56
    source_path: install/podman.md
    workflow: 16
---

Jalankan OpenClaw Gateway dalam kontainer Podman rootless, dikelola oleh pengguna non-root Anda saat ini.

Model yang dimaksud adalah:

- Podman menjalankan kontainer gateway.
- CLI `openclaw` host Anda adalah bidang kontrol.
- State persisten berada di host di bawah `~/.openclaw` secara default.
- Pengelolaan sehari-hari menggunakan `openclaw --container <name> ...`, bukan `sudo -u openclaw`, `podman exec`, atau pengguna layanan terpisah.

## Prasyarat

- **Podman** dalam mode rootless
- **CLI OpenClaw** terinstal di host
- **Opsional:** `systemd --user` jika Anda menginginkan auto-start yang dikelola Quadlet
- **Opsional:** `sudo` hanya jika Anda menginginkan `loginctl enable-linger "$(whoami)"` untuk persistensi boot pada host headless

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

  <Step title="Kelola kontainer yang berjalan dari CLI host">
    Atur `OPENCLAW_CONTAINER=openclaw`, lalu gunakan perintah `openclaw` normal dari host.
  </Step>
</Steps>

Detail penyiapan:

- `./scripts/podman/setup.sh` membangun `openclaw:local` di penyimpanan Podman rootless Anda secara default, atau menggunakan `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` jika Anda menetapkannya.
- Ini membuat `~/.openclaw/openclaw.json` dengan `gateway.mode: "local"` jika belum ada.
- Ini membuat `~/.openclaw/.env` dengan `OPENCLAW_GATEWAY_TOKEN` jika belum ada.
- Untuk peluncuran manual, helper hanya membaca allowlist kecil berisi key terkait Podman dari `~/.openclaw/.env` dan meneruskan variabel env runtime eksplisit ke kontainer; ini tidak menyerahkan seluruh file env ke Podman.

Penyiapan yang dikelola Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet adalah opsi khusus Linux karena bergantung pada layanan pengguna systemd.

Anda juga dapat menetapkan `OPENCLAW_PODMAN_QUADLET=1`.

Variabel env build/penyiapan opsional:

- `OPENCLAW_IMAGE` atau `OPENCLAW_PODMAN_IMAGE` -- gunakan image yang sudah ada/ditarik, bukan membangun `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- instal paket apt tambahan selama build image
- `OPENCLAW_EXTENSIONS` -- prainstal dependensi plugin pada waktu build
- `OPENCLAW_INSTALL_BROWSER` -- prainstal Chromium dan Xvfb untuk otomasi browser (atur ke `1` untuk mengaktifkan)

Mulai kontainer:

```bash
./scripts/run-openclaw-podman.sh launch
```

Skrip memulai kontainer sebagai uid/gid Anda saat ini dengan `--userns=keep-id` dan memasang state OpenClaw Anda ke dalam kontainer dengan bind mount.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Lalu buka `http://127.0.0.1:18789/` dan gunakan token dari `~/.openclaw/.env`.

Default CLI host:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Lalu perintah seperti berikut akan otomatis berjalan di dalam kontainer tersebut:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

Di macOS, mesin Podman dapat membuat browser tampak non-lokal bagi gateway.
Jika Control UI melaporkan error auth perangkat setelah peluncuran, gunakan panduan Tailscale di
[Podman dan Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman dan Tailscale

Untuk HTTPS atau akses browser jarak jauh, ikuti dokumentasi Tailscale utama.

Catatan khusus Podman:

- Pertahankan host publish Podman di `127.0.0.1`.
- Utamakan `tailscale serve` yang dikelola host daripada `openclaw gateway --tailscale serve`.
- Di macOS, jika konteks auth perangkat browser lokal tidak andal, gunakan akses Tailscale alih-alih solusi sementara tunnel lokal ad hoc.

Lihat:

- [Tailscale](/id/gateway/tailscale)
- [Control UI](/id/web/control-ui)

## Systemd (Quadlet, opsional)

Jika Anda menjalankan `./scripts/podman/setup.sh --quadlet`, penyiapan menginstal file Quadlet di:

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

Skrip peluncuran dan Quadlet memasang state host ke dalam kontainer dengan bind mount:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Secara default, itu adalah direktori host, bukan state kontainer anonim, sehingga
`openclaw.json`, `auth-profiles.json` per agen, state channel/provider,
sesi, dan workspace tetap bertahan setelah penggantian kontainer.
Penyiapan Podman juga mengisi `gateway.controlUi.allowedOrigins` untuk `127.0.0.1` dan `localhost` pada port gateway yang dipublikasikan sehingga dashboard lokal berfungsi dengan bind non-loopback kontainer.

Variabel env berguna untuk peluncur manual:

- `OPENCLAW_PODMAN_CONTAINER` -- nama kontainer (`openclaw` secara default)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- image yang akan dijalankan
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- port host yang dipetakan ke kontainer `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- port host yang dipetakan ke kontainer `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- antarmuka host untuk port yang dipublikasikan; defaultnya adalah `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- mode bind gateway di dalam kontainer; defaultnya adalah `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (default), `auto`, atau `host`

Peluncur manual membaca `~/.openclaw/.env` sebelum memfinalisasi default kontainer/image, sehingga Anda dapat menyimpannya secara persisten di sana.

Jika Anda menggunakan `OPENCLAW_CONFIG_DIR` atau `OPENCLAW_WORKSPACE_DIR` yang bukan default, tetapkan variabel yang sama untuk perintah `./scripts/podman/setup.sh` dan perintah `./scripts/run-openclaw-podman.sh launch` berikutnya. Peluncur lokal repo tidak menyimpan override path kustom lintas shell.

Catatan Quadlet:

- Layanan Quadlet yang dihasilkan sengaja mempertahankan bentuk default tetap dan diperkeras: port yang dipublikasikan `127.0.0.1`, `--bind lan` di dalam kontainer, dan namespace pengguna `keep-id`.
- Ini memasang `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure`, dan `TimeoutStartSec=300`.
- Ini memublikasikan `127.0.0.1:18789:18789` (gateway) dan `127.0.0.1:18790:18790` (bridge).
- Ini membaca `~/.openclaw/.env` sebagai `EnvironmentFile` runtime untuk nilai seperti `OPENCLAW_GATEWAY_TOKEN`, tetapi tidak memakai allowlist override khusus Podman milik peluncur manual.
- Jika Anda membutuhkan port publish, host publish, atau flag container-run kustom lain, gunakan peluncur manual atau edit `~/.config/containers/systemd/openclaw.container` secara langsung, lalu muat ulang dan mulai ulang layanan.

## Perintah berguna

- **Log kontainer:** `podman logs -f openclaw`
- **Hentikan kontainer:** `podman stop openclaw`
- **Hapus kontainer:** `podman rm -f openclaw`
- **Buka URL dashboard dari CLI host:** `openclaw dashboard --no-open`
- **Health/status melalui CLI host:** `openclaw gateway status --deep` (probe RPC + pemindaian layanan tambahan)

## Pemecahan masalah

- **Izin ditolak (EACCES) pada konfigurasi atau workspace:** Kontainer berjalan dengan `--userns=keep-id` dan `--user <your uid>:<your gid>` secara default. Pastikan path konfigurasi/workspace host dimiliki oleh pengguna Anda saat ini.
- **Mulai Gateway diblokir (`gateway.mode=local` tidak ada):** Pastikan `~/.openclaw/openclaw.json` ada dan menetapkan `gateway.mode="local"`. `scripts/podman/setup.sh` membuat ini jika belum ada.
- **Perintah CLI kontainer mengenai target yang salah:** Gunakan `openclaw --container <name> ...` secara eksplisit, atau ekspor `OPENCLAW_CONTAINER=<name>` di shell Anda.
- **`openclaw update` gagal dengan `--container`:** Ini wajar. Bangun ulang/tarik image, lalu mulai ulang kontainer atau layanan Quadlet.
- **Layanan Quadlet tidak mulai:** Jalankan `systemctl --user daemon-reload`, lalu `systemctl --user start openclaw.service`. Pada sistem headless, Anda mungkin juga perlu `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux memblokir bind mount:** Biarkan perilaku mount default apa adanya; peluncur otomatis menambahkan `:Z` di Linux saat SELinux dalam mode enforcing atau permissive.

## Terkait

- [Docker](/id/install/docker)
- [Proses latar belakang Gateway](/id/gateway/background-process)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
