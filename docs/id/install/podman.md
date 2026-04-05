---
read_when:
    - Anda ingin gateway dalam kontainer dengan Podman alih-alih Docker
summary: Jalankan OpenClaw dalam kontainer Podman rootless
title: Podman
x-i18n:
    generated_at: "2026-04-05T13:59:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6cb06e2d85b4b0c8a8c6e69c81f629c83b447cbcbb32e34b7876a1819c488020
    source_path: install/podman.md
    workflow: 15
---

# Podman

Jalankan Gateway OpenClaw dalam kontainer Podman rootless, yang dikelola oleh pengguna non-root Anda saat ini.

Model yang dimaksud adalah:

- Podman menjalankan kontainer gateway.
- CLI `openclaw` di host Anda adalah control plane.
- State persisten berada di host di bawah `~/.openclaw` secara default.
- Pengelolaan sehari-hari menggunakan `openclaw --container <name> ...` alih-alih `sudo -u openclaw`, `podman exec`, atau pengguna layanan terpisah.

## Prasyarat

- **Podman** dalam mode rootless
- **CLI OpenClaw** terinstal di host
- **Opsional:** `systemd --user` jika Anda menginginkan auto-start yang dikelola Quadlet
- **Opsional:** `sudo` hanya jika Anda ingin `loginctl enable-linger "$(whoami)"` untuk persistensi saat boot di host headless

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
    Setel `OPENCLAW_CONTAINER=openclaw`, lalu gunakan perintah `openclaw` normal dari host.
  </Step>
</Steps>

Detail penyiapan:

- `./scripts/podman/setup.sh` membangun `openclaw:local` di penyimpanan Podman rootless Anda secara default, atau menggunakan `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` jika Anda menyetelnya.
- Ini membuat `~/.openclaw/openclaw.json` dengan `gateway.mode: "local"` jika belum ada.
- Ini membuat `~/.openclaw/.env` dengan `OPENCLAW_GATEWAY_TOKEN` jika belum ada.
- Untuk peluncuran manual, helper hanya membaca allowlist kecil dari key terkait Podman dari `~/.openclaw/.env` dan meneruskan env var runtime eksplisit ke kontainer; helper ini tidak menyerahkan seluruh file env ke Podman.

Penyiapan yang dikelola Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet adalah opsi khusus Linux karena bergantung pada layanan pengguna systemd.

Anda juga dapat menyetel `OPENCLAW_PODMAN_QUADLET=1`.

Env var build/setup opsional:

- `OPENCLAW_IMAGE` atau `OPENCLAW_PODMAN_IMAGE` -- gunakan image yang sudah ada/di-pull alih-alih membangun `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- instal paket apt tambahan saat build image
- `OPENCLAW_EXTENSIONS` -- pra-instal dependensi extension saat build time

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

Lalu perintah seperti ini akan otomatis berjalan di dalam kontainer tersebut:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

Di macOS, mesin Podman dapat membuat browser tampak non-lokal bagi gateway.
Jika UI Kontrol melaporkan error auth perangkat setelah peluncuran, gunakan panduan Tailscale di
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Untuk akses HTTPS atau browser jarak jauh, ikuti dokumentasi utama Tailscale.

Catatan khusus Podman:

- Biarkan host publish Podman tetap di `127.0.0.1`.
- Utamakan `tailscale serve` yang dikelola host daripada `openclaw gateway --tailscale serve`.
- Di macOS, jika konteks auth perangkat browser lokal tidak andal, gunakan akses Tailscale alih-alih solusi tunnel lokal ad hoc.

Lihat:

- [Tailscale](/id/gateway/tailscale)
- [UI Kontrol](/web/control-ui)

## Systemd (Quadlet, opsional)

Jika Anda menjalankan `./scripts/podman/setup.sh --quadlet`, penyiapan akan menginstal file Quadlet di:

```bash
~/.config/containers/systemd/openclaw.container
```

Perintah yang berguna:

- **Mulai:** `systemctl --user start openclaw.service`
- **Hentikan:** `systemctl --user stop openclaw.service`
- **Status:** `systemctl --user status openclaw.service`
- **Log:** `journalctl --user -u openclaw.service -f`

Setelah mengedit file Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Untuk persistensi saat boot pada host SSH/headless, aktifkan lingering untuk pengguna Anda saat ini:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Konfigurasi, env, dan penyimpanan

- **Dir konfigurasi:** `~/.openclaw`
- **Dir workspace:** `~/.openclaw/workspace`
- **File token:** `~/.openclaw/.env`
- **Helper peluncuran:** `./scripts/run-openclaw-podman.sh`

Skrip peluncuran dan Quadlet melakukan bind-mount state host ke dalam kontainer:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Secara default, ini adalah direktori host, bukan state kontainer anonim, jadi
`openclaw.json`, `auth-profiles.json` per agent, state channel/provider,
sesi, dan workspace tetap bertahan saat kontainer diganti.
Penyiapan Podman juga mengisi `gateway.controlUi.allowedOrigins` untuk `127.0.0.1` dan `localhost` pada port gateway yang dipublikasikan agar dashboard lokal berfungsi dengan bind non-loopback kontainer.

Env var yang berguna untuk peluncur manual:

- `OPENCLAW_PODMAN_CONTAINER` -- nama kontainer (`openclaw` secara default)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- image yang akan dijalankan
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- port host yang dipetakan ke kontainer `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- port host yang dipetakan ke kontainer `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- antarmuka host untuk port yang dipublikasikan; default-nya `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- mode bind gateway di dalam kontainer; default-nya `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (default), `auto`, atau `host`

Peluncur manual membaca `~/.openclaw/.env` sebelum memfinalisasi default kontainer/image, jadi Anda dapat menyimpannya di sana.

Jika Anda menggunakan `OPENCLAW_CONFIG_DIR` atau `OPENCLAW_WORKSPACE_DIR` non-default, setel variabel yang sama untuk `./scripts/podman/setup.sh` dan perintah `./scripts/run-openclaw-podman.sh launch` berikutnya. Peluncur lokal repo tidak menyimpan override path kustom lintas shell.

Catatan Quadlet:

- Layanan Quadlet yang dihasilkan sengaja mempertahankan bentuk default tetap yang diperkeras: port yang dipublikasikan di `127.0.0.1`, `--bind lan` di dalam kontainer, dan namespace pengguna `keep-id`.
- Layanan ini menyematkan `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure`, dan `TimeoutStartSec=300`.
- Layanan ini memublikasikan `127.0.0.1:18789:18789` (gateway) dan `127.0.0.1:18790:18790` (bridge).
- Layanan ini membaca `~/.openclaw/.env` sebagai `EnvironmentFile` runtime untuk nilai seperti `OPENCLAW_GATEWAY_TOKEN`, tetapi tidak menggunakan allowlist override khusus Podman milik peluncur manual.
- Jika Anda memerlukan port publish kustom, host publish, atau flag `container-run` lainnya, gunakan peluncur manual atau edit `~/.config/containers/systemd/openclaw.container` secara langsung, lalu reload dan restart layanan.

## Perintah yang berguna

- **Log kontainer:** `podman logs -f openclaw`
- **Hentikan kontainer:** `podman stop openclaw`
- **Hapus kontainer:** `podman rm -f openclaw`
- **Buka URL dashboard dari CLI host:** `openclaw dashboard --no-open`
- **Kesehatan/status via CLI host:** `openclaw gateway status --deep` (probe RPC + pemindaian layanan tambahan)

## Pemecahan masalah

- **Permission denied (EACCES) pada konfigurasi atau workspace:** Kontainer berjalan dengan `--userns=keep-id` dan `--user <your uid>:<your gid>` secara default. Pastikan path konfigurasi/workspace host dimiliki oleh pengguna Anda saat ini.
- **Mulai Gateway diblokir (tidak ada `gateway.mode=local`):** Pastikan `~/.openclaw/openclaw.json` ada dan menyetel `gateway.mode="local"`. `scripts/podman/setup.sh` akan membuatnya jika belum ada.
- **Perintah CLI kontainer menuju target yang salah:** Gunakan `openclaw --container <name> ...` secara eksplisit, atau ekspor `OPENCLAW_CONTAINER=<name>` di shell Anda.
- **`openclaw update` gagal dengan `--container`:** Wajar. Bangun ulang/pull image, lalu restart kontainer atau layanan Quadlet.
- **Layanan Quadlet tidak mulai:** Jalankan `systemctl --user daemon-reload`, lalu `systemctl --user start openclaw.service`. Pada sistem headless Anda mungkin juga memerlukan `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux memblokir bind mount:** Biarkan perilaku mount default; peluncur otomatis menambahkan `:Z` di Linux saat SELinux enforcing atau permissive.

## Terkait

- [Docker](/install/docker)
- [Proses latar belakang Gateway](/id/gateway/background-process)
- [Pemecahan masalah Gateway](/gateway/troubleshooting)
