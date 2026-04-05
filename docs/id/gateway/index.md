---
read_when:
    - Menjalankan atau men-debug proses gateway
summary: Runbook untuk layanan Gateway, siklus hidup, dan operasional
title: Runbook Gateway
x-i18n:
    generated_at: "2026-04-05T13:54:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ec17674370de4e171779389c83580317308a4f07ebf335ad236a47238af18e1
    source_path: gateway/index.md
    workflow: 15
---

# Runbook gateway

Gunakan halaman ini untuk startup hari pertama dan operasi hari kedua dari layanan Gateway.

<CardGroup cols={2}>
  <Card title="Pemecahan masalah mendalam" icon="siren" href="/gateway/troubleshooting">
    Diagnostik berbasis gejala dengan urutan perintah yang tepat dan signature log.
  </Card>
  <Card title="Konfigurasi" icon="sliders" href="/gateway/configuration">
    Panduan penyiapan berbasis tugas + referensi konfigurasi lengkap.
  </Card>
  <Card title="Manajemen secret" icon="key-round" href="/gateway/secrets">
    Kontrak SecretRef, perilaku snapshot runtime, dan operasi migrasi/reload.
  </Card>
  <Card title="Kontrak rencana secret" icon="shield-check" href="/gateway/secrets-plan-contract">
    Aturan target/path `secrets apply` yang tepat dan perilaku auth-profile khusus ref.
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

Baseline sehat: `Runtime: running` dan `RPC probe: ok`.

  </Step>

  <Step title="Validasikan kesiapan channel">

```bash
openclaw channels status --probe
```

Dengan gateway yang dapat dijangkau, ini menjalankan probe channel per-akun secara live dan audit opsional.
Jika gateway tidak dapat dijangkau, CLI menggunakan fallback ke ringkasan channel berbasis konfigurasi saja
alih-alih output probe live.

  </Step>
</Steps>

<Note>
Reload konfigurasi Gateway memantau path file konfigurasi aktif (yang di-resolve dari default profile/state, atau `OPENCLAW_CONFIG_PATH` jika ditetapkan).
Mode default adalah `gateway.reload.mode="hybrid"`.
Setelah pemuatan pertama berhasil, proses yang berjalan melayani snapshot konfigurasi aktif dalam memori; reload yang berhasil akan menukar snapshot itu secara atomik.
</Note>

## Model runtime

- Satu proses selalu aktif untuk routing, control plane, dan koneksi channel.
- Satu port termultipleks untuk:
  - Kontrol/RPC WebSocket
  - API HTTP, kompatibel dengan OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - UI kontrol dan hook
- Mode bind default: `loopback`.
- Auth diperlukan secara default. Penyiapan shared-secret menggunakan
  `gateway.auth.token` / `gateway.auth.password` (atau
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), dan penyiapan
  reverse-proxy non-loopback dapat menggunakan `gateway.auth.mode: "trusted-proxy"`.

## Endpoint yang kompatibel dengan OpenAI

Permukaan kompatibilitas dengan leverage tertinggi OpenClaw sekarang adalah:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Mengapa set ini penting:

- Sebagian besar integrasi Open WebUI, LobeChat, dan LibreChat mem-probe `/v1/models` terlebih dahulu.
- Banyak pipeline RAG dan memori mengharapkan `/v1/embeddings`.
- Klien native agen semakin memilih `/v1/responses`.

Catatan perencanaan:

- `/v1/models` berfokus pada agen: mengembalikan `openclaw`, `openclaw/default`, dan `openclaw/<agentId>`.
- `openclaw/default` adalah alias stabil yang selalu dipetakan ke agen default yang dikonfigurasi.
- Gunakan `x-openclaw-model` saat Anda menginginkan override penyedia/model backend; jika tidak, model normal dan penyiapan embedding dari agen yang dipilih tetap mengendalikan.

Semua ini berjalan pada port utama Gateway dan menggunakan batas auth operator tepercaya yang sama seperti seluruh API HTTP Gateway lainnya.

### Prioritas port dan bind

| Pengaturan   | Urutan resolusi                                              |
| ------------ | ------------------------------------------------------------ |
| Port Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Mode bind    | CLI/override → `gateway.bind` → `loopback`                   |

### Mode hot reload

| `gateway.reload.mode` | Perilaku                                 |
| --------------------- | ---------------------------------------- |
| `off`                 | Tidak ada reload konfigurasi             |
| `hot`                 | Terapkan hanya perubahan yang aman untuk hot |
| `restart`             | Restart pada perubahan yang memerlukan reload |
| `hybrid` (default)    | Terapkan hot jika aman, restart jika diperlukan |

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

`gateway status --deep` adalah untuk discovery layanan tambahan (unit sistem
LaunchDaemons/systemd/schtasks), bukan probe kesehatan RPC yang lebih mendalam.

## Beberapa gateway (host yang sama)

Sebagian besar instalasi sebaiknya menjalankan satu gateway per mesin. Satu gateway dapat menampung beberapa
agen dan channel.

Anda hanya memerlukan beberapa gateway jika memang sengaja menginginkan isolasi atau bot cadangan.

Pemeriksaan yang berguna:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Yang diharapkan:

- `gateway status --deep` dapat melaporkan `Other gateway-like services detected (best effort)`
  dan menampilkan petunjuk pembersihan ketika instalasi launchd/systemd/schtasks lama masih ada.
- `gateway probe` dapat memperingatkan tentang `multiple reachable gateways` saat lebih dari satu target
  merespons.
- Jika itu disengaja, pisahkan port, konfigurasi/state, dan root workspace untuk setiap gateway.

Penyiapan terperinci: [/gateway/multiple-gateways](/gateway/multiple-gateways).

## Akses jarak jauh

Disarankan: Tailscale/VPN.
Fallback: tunnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Lalu hubungkan klien ke `ws://127.0.0.1:18789` secara lokal.

<Warning>
Tunnel SSH tidak melewati auth gateway. Untuk auth shared-secret, klien tetap
harus mengirim `token`/`password` bahkan melalui tunnel. Untuk mode yang membawa identitas,
permintaan tetap harus memenuhi jalur auth tersebut.
</Warning>

Lihat: [Gateway Jarak Jauh](/gateway/remote), [Autentikasi](/gateway/authentication), [Tailscale](/gateway/tailscale).

## Supervisi dan siklus hidup layanan

Gunakan eksekusi yang disupervisi untuk keandalan seperti produksi.

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
ditolak, OpenClaw menggunakan fallback ke launcher Startup-folder per pengguna
yang menunjuk ke `gateway.cmd` di dalam direktori state.

  </Tab>

  <Tab title="Linux (system service)">

Gunakan system unit untuk host multi-pengguna/selalu aktif.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Gunakan body layanan yang sama seperti user unit, tetapi instal di
`/etc/systemd/system/openclaw-gateway[-<profile>].service` dan sesuaikan
`ExecStart=` jika biner `openclaw` Anda berada di lokasi lain.

  </Tab>
</Tabs>

## Beberapa gateway pada satu host

Sebagian besar penyiapan sebaiknya menjalankan **satu** Gateway.
Gunakan beberapa hanya untuk isolasi/redundansi yang ketat (misalnya profile cadangan).

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

Lihat: [Beberapa gateway](/gateway/multiple-gateways).

### Jalur cepat profile dev

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Default mencakup state/config terisolasi dan port gateway dasar `19001`.

## Referensi cepat protokol (tampilan operator)

- Frame klien pertama harus `connect`.
- Gateway mengembalikan snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- `hello-ok.features.methods` / `events` adalah daftar discovery konservatif, bukan
  dump terhasilkan dari setiap rute helper yang dapat dipanggil.
- Permintaan: `req(method, params)` → `res(ok/payload|error)`.
- Event umum mencakup `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, event siklus hidup pairing/persetujuan, dan `shutdown`.

Eksekusi agen terdiri dari dua tahap:

1. Ack accepted langsung (`status:"accepted"`)
2. Respons penyelesaian final (`status:"ok"|"error"`), dengan event `agent` streaming di antaranya.

Lihat dokumentasi protokol lengkap: [Gateway Protocol](/gateway/protocol).

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

Event tidak diputar ulang. Saat ada gap urutan, refresh state (`health`, `system-presence`) sebelum melanjutkan.

## Signature kegagalan umum

| Signature                                                      | Masalah yang mungkin                                                             |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Bind non-loopback tanpa jalur auth gateway yang valid                            |
| `another gateway instance is already listening` / `EADDRINUSE` | Konflik port                                                                      |
| `Gateway start blocked: set gateway.mode=local`                | Konfigurasi disetel ke mode remote, atau stempel mode lokal hilang dari konfigurasi yang rusak |
| `unauthorized` during connect                                  | Ketidakcocokan auth antara klien dan gateway                                      |

Untuk urutan diagnosis lengkap, gunakan [Pemecahan Masalah Gateway](/gateway/troubleshooting).

## Jaminan keamanan

- Klien protokol gateway gagal dengan cepat saat Gateway tidak tersedia (tidak ada fallback direct-channel implisit).
- Frame pertama yang tidak valid/bukan connect ditolak dan koneksi ditutup.
- Shutdown graceful menghasilkan event `shutdown` sebelum socket ditutup.

---

Terkait:

- [Pemecahan Masalah](/gateway/troubleshooting)
- [Proses Latar Belakang](/gateway/background-process)
- [Konfigurasi](/gateway/configuration)
- [Kesehatan](/gateway/health)
- [Doctor](/gateway/doctor)
- [Autentikasi](/gateway/authentication)
