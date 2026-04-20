---
read_when:
    - Menjalankan atau men-debug proses gateway
summary: Runbook untuk layanan Gateway, siklus hidup, dan operasi
title: Runbook Gateway
x-i18n:
    generated_at: "2026-04-20T09:27:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1004cdd43b1db6794f3ca83da38dbdb231a1976329d9d6d851e2b02405278d8
    source_path: gateway/index.md
    workflow: 15
---

# Runbook Gateway

Gunakan halaman ini untuk startup hari pertama dan operasi hari kedua dari layanan Gateway.

<CardGroup cols={2}>
  <Card title="Pemecahan masalah mendalam" icon="siren" href="/id/gateway/troubleshooting">
    Diagnostik berbasis gejala dengan urutan perintah yang tepat dan signature log.
  </Card>
  <Card title="Konfigurasi" icon="sliders" href="/id/gateway/configuration">
    Panduan penyiapan berorientasi tugas + referensi konfigurasi lengkap.
  </Card>
  <Card title="Manajemen secret" icon="key-round" href="/id/gateway/secrets">
    Kontrak SecretRef, perilaku snapshot runtime, dan operasi migrasi/muat ulang.
  </Card>
  <Card title="Kontrak rencana secret" icon="shield-check" href="/id/gateway/secrets-plan-contract">
    Aturan target/path `secrets apply` yang tepat dan perilaku auth-profile hanya-ref.
  </Card>
</CardGroup>

## Startup lokal 5 menit

<Steps>
  <Step title="Mulai Gateway">

```bash
openclaw gateway --port 18789
# debug/trace dicerminkan ke stdio
openclaw gateway --port 18789 --verbose
# paksa matikan listener pada port yang dipilih, lalu mulai
openclaw gateway --force
```

  </Step>

  <Step title="Verifikasi kesehatan layanan">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Baseline sehat: `Runtime: running`, `Connectivity probe: ok`, dan `Capability: ...` yang sesuai dengan yang Anda harapkan. Gunakan `openclaw gateway status --require-rpc` saat Anda memerlukan bukti RPC cakupan baca, bukan sekadar keterjangkauan.

  </Step>

  <Step title="Validasi kesiapan channel">

```bash
openclaw channels status --probe
```

Dengan gateway yang dapat dijangkau, ini menjalankan probe channel per-akun secara live dan audit opsional.
Jika gateway tidak dapat dijangkau, CLI akan kembali ke ringkasan channel berbasis konfigurasi saja
alih-alih output probe live.

  </Step>
</Steps>

<Note>
Reload konfigurasi Gateway memantau path file konfigurasi aktif (di-resolve dari default profile/state, atau `OPENCLAW_CONFIG_PATH` jika disetel).
Mode default adalah `gateway.reload.mode="hybrid"`.
Setelah pemuatan berhasil pertama, proses yang berjalan menyajikan snapshot konfigurasi aktif di memori; reload yang berhasil menukar snapshot tersebut secara atomik.
</Note>

## Model runtime

- Satu proses yang selalu aktif untuk routing, control plane, dan koneksi channel.
- Satu port termultipleks untuk:
  - WebSocket control/RPC
  - HTTP API, kompatibel OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI dan hook
- Mode bind default: `loopback`.
- Auth diwajibkan secara default. Penyiapan shared-secret menggunakan
  `gateway.auth.token` / `gateway.auth.password` (atau
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), dan penyiapan
  reverse-proxy non-loopback dapat menggunakan `gateway.auth.mode: "trusted-proxy"`.

## Endpoint kompatibel OpenAI

Surface kompatibilitas dengan leverage tertinggi OpenClaw saat ini adalah:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Mengapa set ini penting:

- Sebagian besar integrasi Open WebUI, LobeChat, dan LibreChat melakukan probe ke `/v1/models` terlebih dahulu.
- Banyak pipeline RAG dan memori mengharapkan `/v1/embeddings`.
- Klien native agent semakin memilih `/v1/responses`.

Catatan perencanaan:

- `/v1/models` bersifat agent-first: endpoint ini mengembalikan `openclaw`, `openclaw/default`, dan `openclaw/<agentId>`.
- `openclaw/default` adalah alias stabil yang selalu dipetakan ke agent default yang dikonfigurasi.
- Gunakan `x-openclaw-model` saat Anda menginginkan override provider/model backend; jika tidak, pengaturan model dan embedding normal milik agent yang dipilih tetap mengendalikan.

Semua ini berjalan pada port utama Gateway dan menggunakan batas auth operator tepercaya yang sama seperti bagian lain dari HTTP API Gateway.

### Prioritas port dan bind

| Setting      | Urutan resolusi                                               |
| ------------ | ------------------------------------------------------------- |
| Port Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Mode bind    | CLI/override → `gateway.bind` → `loopback`                    |

### Mode hot reload

| `gateway.reload.mode` | Perilaku                                  |
| --------------------- | ----------------------------------------- |
| `off`                 | Tidak ada reload konfigurasi              |
| `hot`                 | Terapkan hanya perubahan yang aman-hot    |
| `restart`             | Restart pada perubahan yang memerlukan reload |
| `hybrid` (default)    | Terapkan secara hot saat aman, restart saat diperlukan |

## Set perintah operator

```bash
openclaw gateway status
openclaw gateway status --deep   # menambahkan pemindaian layanan tingkat sistem
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` digunakan untuk penemuan layanan tambahan (unit
LaunchDaemons/systemd system/schtasks), bukan probe kesehatan RPC yang lebih mendalam.

## Beberapa gateway (host yang sama)

Sebagian besar instalasi sebaiknya menjalankan satu gateway per mesin. Satu gateway dapat menampung beberapa
agent dan channel.

Anda hanya memerlukan beberapa gateway saat Anda sengaja menginginkan isolasi atau rescue bot.

Pemeriksaan yang berguna:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Yang diharapkan:

- `gateway status --deep` dapat melaporkan `Other gateway-like services detected (best effort)`
  dan menampilkan petunjuk pembersihan saat instalasi launchd/systemd/schtasks lama masih ada.
- `gateway probe` dapat memperingatkan tentang `multiple reachable gateways` saat lebih dari satu target
  merespons.
- Jika itu memang disengaja, isolasikan root port, config/state, dan workspace untuk tiap gateway.

Penyiapan terperinci: [/gateway/multiple-gateways](/id/gateway/multiple-gateways).

## Akses jarak jauh

Yang disarankan: Tailscale/VPN.
Cadangan: tunnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Lalu hubungkan klien secara lokal ke `ws://127.0.0.1:18789`.

<Warning>
Tunnel SSH tidak melewati auth gateway. Untuk auth shared-secret, klien tetap
harus mengirim `token`/`password` bahkan melalui tunnel. Untuk mode yang membawa identitas,
permintaan tetap harus memenuhi jalur auth tersebut.
</Warning>

Lihat: [Gateway Jarak Jauh](/id/gateway/remote), [Autentikasi](/id/gateway/authentication), [Tailscale](/id/gateway/tailscale).

## Supervisi dan siklus hidup layanan

Gunakan proses yang disupervisi untuk keandalan yang menyerupai produksi.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Label LaunchAgent adalah `ai.openclaw.gateway` (default) atau `ai.openclaw.<profile>` (profile bernama). `openclaw doctor` mengaudit dan memperbaiki drift konfigurasi layanan.

  </Tab>

  <Tab title="Linux (systemd pengguna)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Agar tetap berjalan setelah logout, aktifkan lingering:

```bash
sudo loginctl enable-linger <user>
```

Contoh user-unit manual saat Anda memerlukan path instalasi kustom:

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
(atau `OpenClaw Gateway (<profile>)` untuk profile bernama). Jika pembuatan Scheduled Task
ditolak, OpenClaw akan beralih ke launcher Startup-folder per-pengguna
yang menunjuk ke `gateway.cmd` di dalam direktori state.

  </Tab>

  <Tab title="Linux (layanan sistem)">

Gunakan unit sistem untuk host multi-pengguna/selalu aktif.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Gunakan body layanan yang sama seperti user unit, tetapi instal di bawah
`/etc/systemd/system/openclaw-gateway[-<profile>].service` dan sesuaikan
`ExecStart=` jika biner `openclaw` Anda berada di lokasi lain.

  </Tab>
</Tabs>

## Beberapa gateway pada satu host

Sebagian besar penyiapan sebaiknya menjalankan **satu** Gateway.
Gunakan beberapa hanya untuk isolasi/redundansi ketat (misalnya profile rescue).

Checklist per instance:

- `gateway.port` unik
- `OPENCLAW_CONFIG_PATH` unik
- `OPENCLAW_STATE_DIR` unik
- `agents.defaults.workspace` unik

Contoh:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Lihat: [Beberapa gateway](/id/gateway/multiple-gateways).

### Jalur cepat profile dev

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Default mencakup state/config yang terisolasi dan port dasar gateway `19001`.

## Referensi cepat protokol (tampilan operator)

- Frame klien pertama harus berupa `connect`.
- Gateway mengembalikan snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- `hello-ok.features.methods` / `events` adalah daftar discovery konservatif, bukan
  dump yang dihasilkan dari setiap helper route yang dapat dipanggil.
- Request: `req(method, params)` → `res(ok/payload|error)`.
- Event umum mencakup `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, event siklus hidup pairing/approval, dan `shutdown`.

Run agent terdiri dari dua tahap:

1. Ack penerimaan langsung (`status:"accepted"`)
2. Respons penyelesaian akhir (`status:"ok"|"error"`), dengan event `agent` yang di-stream di antaranya.

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

Event tidak diputar ulang. Pada gap sequence, segarkan state (`health`, `system-presence`) sebelum melanjutkan.

## Signature kegagalan umum

| Signature                                                      | Kemungkinan masalah                                                               |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Bind non-loopback tanpa jalur auth gateway yang valid                             |
| `another gateway instance is already listening` / `EADDRINUSE` | Konflik port                                                                      |
| `Gateway start blocked: set gateway.mode=local`                | Konfigurasi disetel ke mode remote, atau stamp mode lokal hilang dari konfigurasi yang rusak |
| `unauthorized` during connect                                  | Ketidakcocokan auth antara klien dan gateway                                      |

Untuk urutan diagnosis lengkap, gunakan [Pemecahan Masalah Gateway](/id/gateway/troubleshooting).

## Jaminan keamanan

- Klien protokol Gateway gagal cepat saat Gateway tidak tersedia (tanpa fallback direct-channel implisit).
- Frame pertama yang tidak valid/bukan-connect ditolak dan koneksi ditutup.
- Shutdown graceful mengirim event `shutdown` sebelum socket ditutup.

---

Terkait:

- [Pemecahan Masalah](/id/gateway/troubleshooting)
- [Proses Latar Belakang](/id/gateway/background-process)
- [Konfigurasi](/id/gateway/configuration)
- [Health](/id/gateway/health)
- [Doctor](/id/gateway/doctor)
- [Autentikasi](/id/gateway/authentication)
