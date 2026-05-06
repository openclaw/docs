---
read_when:
    - Menjalankan atau men-debug proses Gateway
summary: Runbook untuk layanan Gateway, siklus hidup, dan operasi
title: Panduan operasional Gateway
x-i18n:
    generated_at: "2026-05-06T09:11:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 592eb379cc75402246676cbb23b1dca39b98f559c214c92983b5a3685cff7ab7
    source_path: gateway/index.md
    workflow: 16
---

Gunakan halaman ini untuk startup hari pertama dan operasi hari kedua layanan Gateway.

<CardGroup cols={2}>
  <Card title="Pemecahan masalah mendalam" icon="siren" href="/id/gateway/troubleshooting">
    Diagnostik berbasis gejala dengan rangkaian perintah yang persis dan pola log.
  </Card>
  <Card title="Konfigurasi" icon="sliders" href="/id/gateway/configuration">
    Panduan penyiapan berorientasi tugas + referensi konfigurasi lengkap.
  </Card>
  <Card title="Manajemen rahasia" icon="key-round" href="/id/gateway/secrets">
    Kontrak SecretRef, perilaku snapshot runtime, dan operasi migrasi/muat ulang.
  </Card>
  <Card title="Kontrak rencana rahasia" icon="shield-check" href="/id/gateway/secrets-plan-contract">
    Aturan target/path `secrets apply` yang persis dan perilaku profil auth khusus ref.
  </Card>
</CardGroup>

## Startup lokal 5 menit

<Steps>
  <Step title="Mulai Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Verifikasi kesehatan layanan">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Baseline sehat: `Runtime: running`, `Connectivity probe: ok`, dan `Capability: ...` yang sesuai dengan ekspektasi Anda. Gunakan `openclaw gateway status --require-rpc` saat Anda membutuhkan bukti RPC cakupan baca, bukan hanya keterjangkauan.

  </Step>

  <Step title="Validasi kesiapan kanal">

```bash
openclaw channels status --probe
```

Dengan gateway yang dapat dijangkau, perintah ini menjalankan probe kanal live per akun dan audit opsional.
Jika gateway tidak dapat dijangkau, CLI beralih ke ringkasan kanal khusus konfigurasi, bukan
output probe live.

  </Step>
</Steps>

<Note>
Muat ulang konfigurasi Gateway memantau path file konfigurasi aktif (diselesaikan dari default profil/status, atau `OPENCLAW_CONFIG_PATH` saat diatur).
Mode default adalah `gateway.reload.mode="hybrid"`.
Setelah pemuatan sukses pertama, proses yang berjalan melayani snapshot konfigurasi aktif dalam memori; muat ulang yang berhasil menukar snapshot itu secara atomik.
</Note>

## Model runtime

- Satu proses selalu aktif untuk routing, control plane, dan koneksi kanal.
- Satu port multiplexed untuk:
  - Kontrol/RPC WebSocket
  - API HTTP, kompatibel OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI dan hook
- Mode bind default: `loopback`.
- Auth diwajibkan secara default. Penyiapan shared-secret menggunakan
  `gateway.auth.token` / `gateway.auth.password` (atau
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), dan penyiapan reverse-proxy
  non-loopback dapat menggunakan `gateway.auth.mode: "trusted-proxy"`.

## Endpoint kompatibel OpenAI

Permukaan kompatibilitas OpenClaw yang paling berdampak kini adalah:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Mengapa set ini penting:

- Sebagian besar integrasi Open WebUI, LobeChat, dan LibreChat memeriksa `/v1/models` terlebih dahulu.
- Banyak pipeline RAG dan memori mengharapkan `/v1/embeddings`.
- Klien agent-native makin sering memilih `/v1/responses`.

Catatan perencanaan:

- `/v1/models` mengutamakan agen: endpoint ini mengembalikan `openclaw`, `openclaw/default`, dan `openclaw/<agentId>`.
- `openclaw/default` adalah alias stabil yang selalu dipetakan ke agen default yang dikonfigurasi.
- Gunakan `x-openclaw-model` saat Anda menginginkan override backend provider/model; jika tidak, model normal dan penyiapan embedding milik agen yang dipilih tetap memegang kendali.

Semua ini berjalan pada port Gateway utama dan menggunakan batas auth operator tepercaya yang sama seperti API HTTP Gateway lainnya.

### Prioritas port dan bind

| Pengaturan   | Urutan resolusi                                              |
| ------------ | ------------------------------------------------------------- |
| Port Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Mode bind    | CLI/override → `gateway.bind` → `loopback`                    |

Layanan gateway terinstal mencatat `--port` yang diselesaikan dalam metadata supervisor. Setelah mengubah `gateway.port`, jalankan `openclaw doctor --fix` atau `openclaw gateway install --force` agar launchd/systemd/schtasks memulai proses pada port baru.

Startup Gateway menggunakan port dan bind efektif yang sama saat menanam origin Control UI lokal
untuk bind non-loopback. Misalnya, `--bind lan --port 3000`
menanam `http://localhost:3000` dan `http://127.0.0.1:3000` sebelum validasi
runtime berjalan. Tambahkan origin browser jarak jauh apa pun, seperti URL proksi HTTPS, ke
`gateway.controlUi.allowedOrigins` secara eksplisit.

### Mode hot reload

| `gateway.reload.mode` | Perilaku                                               |
| --------------------- | ------------------------------------------------------ |
| `off`                 | Tidak ada muat ulang konfigurasi                       |
| `hot`                 | Terapkan hanya perubahan yang aman untuk hot reload    |
| `restart`             | Mulai ulang pada perubahan yang memerlukan muat ulang  |
| `hybrid` (default)    | Terapkan hot saat aman, mulai ulang saat diperlukan    |

## Set perintah operator

```bash
openclaw gateway status
openclaw gateway status --deep   # adds a system-level service scan
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` digunakan untuk penemuan layanan tambahan (LaunchDaemons/systemd system
units/schtasks), bukan probe kesehatan RPC yang lebih mendalam.

## Beberapa gateway (host yang sama)

Sebagian besar instalasi sebaiknya menjalankan satu gateway per mesin. Satu gateway dapat menghosting beberapa
agen dan kanal.

Anda hanya memerlukan beberapa gateway saat secara sengaja menginginkan isolasi atau bot penyelamat.

Pemeriksaan yang berguna:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Yang dapat diharapkan:

- `gateway status --deep` dapat melaporkan `Other gateway-like services detected (best effort)`
  dan mencetak petunjuk pembersihan saat instalasi launchd/systemd/schtasks lama masih ada.
- `gateway probe` dapat memperingatkan tentang `multiple reachable gateways` saat lebih dari satu target
  menjawab.
- Jika itu disengaja, isolasikan port, konfigurasi/status, dan root workspace per gateway.

Checklist per instans:

- `gateway.port` unik
- `OPENCLAW_CONFIG_PATH` unik
- `OPENCLAW_STATE_DIR` unik
- `agents.defaults.workspace` unik

Contoh:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Penyiapan terperinci: [/gateway/multiple-gateways](/id/gateway/multiple-gateways).

## Akses jarak jauh

Disarankan: Tailscale/VPN.
Fallback: tunnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Lalu hubungkan klien secara lokal ke `ws://127.0.0.1:18789`.

<Warning>
Tunnel SSH tidak melewati auth gateway. Untuk auth shared-secret, klien tetap
harus mengirim `token`/`password` bahkan melalui tunnel. Untuk mode yang membawa identitas,
request tetap harus memenuhi jalur auth tersebut.
</Warning>

Lihat: [Gateway Jarak Jauh](/id/gateway/remote), [Autentikasi](/id/gateway/authentication), [Tailscale](/id/gateway/tailscale).

## Supervisi dan siklus hidup layanan

Gunakan eksekusi tersupervisi untuk keandalan seperti produksi.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Gunakan `openclaw gateway restart` untuk mulai ulang. Jangan merangkai `openclaw gateway stop` dan `openclaw gateway start`; di macOS, `gateway stop` secara sengaja menonaktifkan LaunchAgent sebelum menghentikannya.

Label LaunchAgent adalah `ai.openclaw.gateway` (default) atau `ai.openclaw.<profile>` (profil bernama). `openclaw doctor` mengaudit dan memperbaiki drift konfigurasi layanan.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Untuk persistensi setelah logout, aktifkan lingering:

```bash
sudo loginctl enable-linger <user>
```

Contoh user-unit manual saat Anda membutuhkan path instalasi kustom:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (native)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

Startup terkelola Windows native menggunakan Scheduled Task bernama `OpenClaw Gateway`
(atau `OpenClaw Gateway (<profile>)` untuk profil bernama). Jika pembuatan Scheduled Task
ditolak, OpenClaw beralih ke launcher folder Startup per pengguna
yang menunjuk ke `gateway.cmd` di dalam direktori status.

  </Tab>

  <Tab title="Linux (system service)">

Gunakan unit system untuk host multi-pengguna/selalu aktif.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Gunakan badan layanan yang sama seperti unit pengguna, tetapi instal di bawah
`/etc/systemd/system/openclaw-gateway[-<profile>].service` dan sesuaikan
`ExecStart=` jika biner `openclaw` Anda berada di tempat lain.

Jangan juga membiarkan `openclaw doctor --fix` menginstal layanan gateway level pengguna untuk profil/port yang sama. Doctor menolak instalasi otomatis itu saat menemukan layanan gateway OpenClaw level sistem; gunakan `OPENCLAW_SERVICE_REPAIR_POLICY=external` saat unit system memiliki siklus hidup tersebut.

  </Tab>
</Tabs>

## Jalur cepat profil dev

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Default mencakup status/konfigurasi terisolasi dan port gateway dasar `19001`.

## Referensi cepat protokol (tampilan operator)

- Frame klien pertama harus `connect`.
- Gateway mengembalikan snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, batas/kebijakan).
- `hello-ok.features.methods` / `events` adalah daftar penemuan konservatif, bukan
  dump yang dihasilkan dari setiap route helper yang dapat dipanggil.
- Request: `req(method, params)` → `res(ok/payload|error)`.
- Event umum mencakup `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, event siklus hidup pairing/approval, dan `shutdown`.

Run agen terdiri dari dua tahap:

1. Ack diterima langsung (`status:"accepted"`)
2. Respons penyelesaian final (`status:"ok"|"error"`), dengan event `agent` yang di-stream di antaranya.

Lihat dokumentasi protokol lengkap: [Protokol Gateway](/id/gateway/protocol).

## Pemeriksaan operasional

### Liveness

- Buka WS dan kirim `connect`.
- Harapkan respons `hello-ok` dengan snapshot.

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Pemulihan gap

Event tidak diputar ulang. Saat ada gap urutan, segarkan status (`health`, `system-presence`) sebelum melanjutkan.

## Tanda kegagalan umum

| Tanda                                                          | Kemungkinan masalah                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Bind non-loopback tanpa jalur auth gateway yang valid                           |
| `another gateway instance is already listening` / `EADDRINUSE` | Konflik port                                                                    |
| `Gateway start blocked: set gateway.mode=local`                | Konfigurasi diatur ke mode jarak jauh, atau stamp mode lokal hilang dari konfigurasi yang rusak |
| `unauthorized` during connect                                  | Auth tidak cocok antara klien dan gateway                                       |

Untuk rangkaian diagnosis lengkap, gunakan [Pemecahan Masalah Gateway](/id/gateway/troubleshooting).

## Jaminan keselamatan

- Klien protokol Gateway gagal cepat saat Gateway tidak tersedia (tidak ada mekanisme pengalihan saluran langsung implisit).
- Frame pertama yang tidak valid/bukan koneksi ditolak dan ditutup.
- Penonaktifan tertib memancarkan peristiwa `shutdown` sebelum soket ditutup.

---

Terkait:

- [Pemecahan Masalah](/id/gateway/troubleshooting)
- [Proses Latar Belakang](/id/gateway/background-process)
- [Konfigurasi](/id/gateway/configuration)
- [Kesehatan](/id/gateway/health)
- [Dokter](/id/gateway/doctor)
- [Autentikasi](/id/gateway/authentication)

## Terkait

- [Konfigurasi](/id/gateway/configuration)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
- [Akses jarak jauh](/id/gateway/remote)
- [Manajemen rahasia](/id/gateway/secrets)
