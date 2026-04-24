---
read_when:
    - Anda ingin gateway dalam container dengan Podman alih-alih Docker
summary: Jalankan OpenClaw di container Podman rootless
title: Podman
x-i18n:
    generated_at: "2026-04-24T09:14:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 559ac707e0a3ef173d0300ee2f8c6f4ed664ff5afbf1e3f1848312a9d441e9e4
    source_path: install/podman.md
    workflow: 15
---

Jalankan Gateway OpenClaw dalam container Podman rootless, dikelola oleh pengguna non-root Anda saat ini.

Model yang dimaksud adalah:

- Podman menjalankan container gateway.
- CLI `openclaw` di host Anda adalah control plane.
- Status persisten berada di host di bawah `~/.openclaw` secara default.
- Pengelolaan sehari-hari menggunakan `openclaw --container <name> ...` alih-alih `sudo -u openclaw`, `podman exec`, atau pengguna service terpisah.

## Prasyarat

- **Podman** dalam mode rootless
- **CLI OpenClaw** terinstal di host
- **Opsional:** `systemd --user` jika Anda menginginkan auto-start yang dikelola Quadlet
- **Opsional:** `sudo` hanya jika Anda menginginkan `loginctl enable-linger "$(whoami)"` untuk persistensi saat boot pada host headless

## Mulai cepat

<Steps>
  <Step title="Penyiapan sekali saja">
    Dari root repo, jalankan `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Mulai container Gateway">
    Mulai container dengan `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Jalankan onboarding di dalam container">
    Jalankan `./scripts/run-openclaw-podman.sh launch setup`, lalu buka `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Kelola container yang sedang berjalan dari CLI host">
    Setel `OPENCLAW_CONTAINER=openclaw`, lalu gunakan perintah `openclaw` biasa dari host.
  </Step>
</Steps>

Detail penyiapan:

- `./scripts/podman/setup.sh` membangun `openclaw:local` di rootless Podman store Anda secara default, atau menggunakan `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` jika Anda menyetelnya.
- Skrip ini membuat `~/.openclaw/openclaw.json` dengan `gateway.mode: "local"` jika belum ada.
- Skrip ini membuat `~/.openclaw/.env` dengan `OPENCLAW_GATEWAY_TOKEN` jika belum ada.
- Untuk peluncuran manual, helper hanya membaca allowlist kecil key terkait Podman dari `~/.openclaw/.env` dan meneruskan variabel env runtime eksplisit ke container; helper ini tidak memberikan seluruh file env ke Podman.

Penyiapan yang dikelola Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet adalah opsi khusus Linux karena bergantung pada service systemd user.

Anda juga dapat menyetel `OPENCLAW_PODMAN_QUADLET=1`.

Variabel env build/setup opsional:

- `OPENCLAW_IMAGE` atau `OPENCLAW_PODMAN_IMAGE` -- gunakan image yang sudah ada/ditarik alih-alih membangun `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- instal paket apt tambahan selama build image
- `OPENCLAW_EXTENSIONS` -- pre-install dependensi Plugin pada waktu build

Mulai container:

```bash
./scripts/run-openclaw-podman.sh launch
```

Skrip menjalankan container sebagai uid/gid Anda saat ini dengan `--userns=keep-id` dan bind-mount status OpenClaw Anda ke dalam container.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Lalu buka `http://127.0.0.1:18789/` dan gunakan token dari `~/.openclaw/.env`.

Default CLI host:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Lalu perintah seperti ini akan berjalan di dalam container tersebut secara otomatis:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # menyertakan pemindaian service tambahan
openclaw doctor
openclaw channels login
```

Di macOS, Podman machine dapat membuat browser tampak non-lokal bagi gateway.
Jika Control UI melaporkan error device-auth setelah peluncuran, gunakan panduan Tailscale di
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Untuk akses HTTPS atau browser remote, ikuti dokumentasi utama Tailscale.

Catatan khusus Podman:

- Pertahankan host publish Podman di `127.0.0.1`.
- Utamakan `tailscale serve` yang dikelola host daripada `openclaw gateway --tailscale serve`.
- Di macOS, jika konteks device-auth browser lokal tidak andal, gunakan akses Tailscale alih-alih solusi tunnel lokal ad hoc.

Lihat:

- [Tailscale](/id/gateway/tailscale)
- [Control UI](/id/web/control-ui)

## Systemd (Quadlet, opsional)

Jika Anda menjalankan `./scripts/podman/setup.sh --quadlet`, penyiapan menginstal file Quadlet di:

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

- **Direktori konfigurasi:** `~/.openclaw`
- **Direktori workspace:** `~/.openclaw/workspace`
- **File token:** `~/.openclaw/.env`
- **Helper peluncuran:** `./scripts/run-openclaw-podman.sh`

Skrip peluncuran dan Quadlet melakukan bind-mount status host ke dalam container:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Secara default, ini adalah direktori host, bukan status container anonim, jadi
`openclaw.json`, `auth-profiles.json` per agen, status channel/provider,
sesi, dan workspace tetap bertahan meskipun container diganti.
Penyiapan Podman juga melakukan seed `gateway.controlUi.allowedOrigins` untuk `127.0.0.1` dan `localhost` pada port gateway yang dipublikasikan sehingga dashboard lokal berfungsi dengan bind non-loopback milik container.

Variabel env yang berguna untuk launcher manual:

- `OPENCLAW_PODMAN_CONTAINER` -- nama container (`openclaw` secara default)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- image yang dijalankan
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- port host yang dipetakan ke container `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- port host yang dipetakan ke container `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- interface host untuk port yang dipublikasikan; default adalah `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- mode bind gateway di dalam container; default adalah `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (default), `auto`, atau `host`

Launcher manual membaca `~/.openclaw/.env` sebelum memfinalisasi default container/image, sehingga Anda dapat mempertahankan nilai-nilai ini di sana.

Jika Anda menggunakan `OPENCLAW_CONFIG_DIR` atau `OPENCLAW_WORKSPACE_DIR` non-default, setel variabel yang sama untuk `./scripts/podman/setup.sh` dan perintah `./scripts/run-openclaw-podman.sh launch` berikutnya. Launcher lokal repo tidak mempertahankan override path kustom di seluruh shell.

Catatan Quadlet:

- Service Quadlet yang dihasilkan sengaja mempertahankan bentuk default yang tetap dan diperkeras: port yang dipublikasikan pada `127.0.0.1`, `--bind lan` di dalam container, dan user namespace `keep-id`.
- Service ini mem-pin `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure`, dan `TimeoutStartSec=300`.
- Service ini memublikasikan `127.0.0.1:18789:18789` (gateway) dan `127.0.0.1:18790:18790` (bridge).
- Service ini membaca `~/.openclaw/.env` sebagai `EnvironmentFile` runtime untuk nilai seperti `OPENCLAW_GATEWAY_TOKEN`, tetapi tidak mengonsumsi allowlist override khusus Podman milik launcher manual.
- Jika Anda memerlukan port publish kustom, host publish, atau flag container-run lain, gunakan launcher manual atau edit `~/.config/containers/systemd/openclaw.container` secara langsung, lalu reload dan restart service.

## Perintah yang berguna

- **Log container:** `podman logs -f openclaw`
- **Hentikan container:** `podman stop openclaw`
- **Hapus container:** `podman rm -f openclaw`
- **Buka URL dashboard dari CLI host:** `openclaw dashboard --no-open`
- **Health/status melalui CLI host:** `openclaw gateway status --deep` (probe RPC + pemindaian
  service tambahan)

## Pemecahan masalah

- **Permission denied (EACCES) pada config atau workspace:** Container berjalan dengan `--userns=keep-id` dan `--user <your uid>:<your gid>` secara default. Pastikan path config/workspace host dimiliki oleh pengguna Anda saat ini.
- **Start Gateway diblokir (tidak ada `gateway.mode=local`):** Pastikan `~/.openclaw/openclaw.json` ada dan menyetel `gateway.mode="local"`. `scripts/podman/setup.sh` membuatnya jika belum ada.
- **Perintah CLI container mengenai target yang salah:** Gunakan `openclaw --container <name> ...` secara eksplisit, atau ekspor `OPENCLAW_CONTAINER=<name>` di shell Anda.
- **`openclaw update` gagal dengan `--container`:** Wajar. Bangun ulang/tarik image, lalu mulai ulang container atau service Quadlet.
- **Service Quadlet tidak mulai:** Jalankan `systemctl --user daemon-reload`, lalu `systemctl --user start openclaw.service`. Pada sistem headless Anda mungkin juga memerlukan `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux memblokir bind mount:** Biarkan perilaku mount default apa adanya; launcher otomatis menambahkan `:Z` di Linux saat SELinux enforcing atau permissive.

## Terkait

- [Docker](/id/install/docker)
- [Proses latar belakang Gateway](/id/gateway/background-process)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
