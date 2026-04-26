---
read_when:
    - Menjalankan atau men-debug proses gateway
summary: Runbook untuk layanan Gateway, siklus hidup, dan operasi
title: Runbook Gateway
x-i18n:
    generated_at: "2026-04-26T11:28:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 775c7288ce1fa666f65c0fc4ff1fc06b0cd14589fc932af1944ac7eeb126729c
    source_path: gateway/index.md
    workflow: 15
---

Gunakan halaman ini untuk startup hari pertama dan operasi hari kedua dari layanan Gateway.

<CardGroup cols={2}>
  <Card title="Pemecahan masalah mendalam" icon="siren" href="/id/gateway/troubleshooting">
    Diagnostik berbasis gejala dengan urutan perintah yang tepat dan signature log.
  </Card>
  <Card title="Konfigurasi" icon="sliders" href="/id/gateway/configuration">
    Panduan penyiapan berorientasi tugas + referensi konfigurasi lengkap.
  </Card>
  <Card title="Manajemen secret" icon="key-round" href="/id/gateway/secrets">
    Kontrak SecretRef, perilaku snapshot runtime, dan operasi migrate/reload.
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
# paksa hentikan listener pada port yang dipilih, lalu mulai
openclaw gateway --force
```

  </Step>

  <Step title="Verifikasi kesehatan layanan">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Baseline sehat: `Runtime: running`, `Connectivity probe: ok`, dan `Capability: ...` yang sesuai dengan yang Anda harapkan. Gunakan `openclaw gateway status --require-rpc` saat Anda memerlukan bukti RPC scope-baca, bukan hanya reachability.

  </Step>

  <Step title="Validasi kesiapan channel">

```bash
openclaw channels status --probe
```

Dengan gateway yang dapat dijangkau, ini menjalankan probe channel live per akun dan audit opsional.
Jika gateway tidak dapat dijangkau, CLI kembali ke ringkasan channel berbasis config saja
alih-alih output probe live.

  </Step>
</Steps>

<Note>
Reload config Gateway memantau path file config aktif (yang di-resolve dari default profile/state, atau `OPENCLAW_CONFIG_PATH` saat diatur).
Mode default adalah `gateway.reload.mode="hybrid"`.
Setelah pemuatan pertama berhasil, proses yang berjalan menyajikan snapshot config dalam memori yang aktif; reload yang berhasil menukar snapshot itu secara atomik.
</Note>

## Model runtime

- Satu proses selalu aktif untuk routing, control plane, dan koneksi channel.
- Satu port termultipleks untuk:
  - control/RPC WebSocket
  - API HTTP, kompatibel OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI dan hook
- Mode bind default: `loopback`.
- Auth diwajibkan secara default. Penyiapan shared-secret menggunakan
  `gateway.auth.token` / `gateway.auth.password` (atau
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), dan penyiapan
  reverse-proxy non-loopback dapat menggunakan `gateway.auth.mode: "trusted-proxy"`.

## Endpoint kompatibel OpenAI

Permukaan kompatibilitas dengan leverage tertinggi di OpenClaw sekarang adalah:

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

- `/v1/models` bersifat agent-first: endpoint ini mengembalikan `openclaw`, `openclaw/default`, dan `openclaw/<agentId>`.
- `openclaw/default` adalah alias stabil yang selalu dipetakan ke agen default yang dikonfigurasi.
- Gunakan `x-openclaw-model` saat Anda menginginkan override backend provider/model; jika tidak, penyiapan model dan embedding normal dari agen yang dipilih tetap mengendalikan.

Semua ini berjalan pada port Gateway utama dan menggunakan batas auth operator tepercaya yang sama seperti HTTP API Gateway lainnya.

### Prioritas port dan bind

| Pengaturan   | Urutan resolusi                                              |
| ------------ | ------------------------------------------------------------ |
| Port Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Mode bind    | CLI/override → `gateway.bind` → `loopback`                   |

Startup Gateway menggunakan port dan bind efektif yang sama saat menginisialisasi origin Control UI lokal untuk bind non-loopback. Misalnya, `--bind lan --port 3000`
menginisialisasi `http://localhost:3000` dan `http://127.0.0.1:3000` sebelum validasi runtime berjalan. Tambahkan origin browser remote, seperti URL proxy HTTPS, ke
`gateway.controlUi.allowedOrigins` secara eksplisit.

### Mode hot reload

| `gateway.reload.mode` | Perilaku                                  |
| --------------------- | ----------------------------------------- |
| `off`                 | Tidak ada reload config                   |
| `hot`                 | Terapkan hanya perubahan yang aman untuk hot |
| `restart`             | Restart pada perubahan yang memerlukan reload |
| `hybrid` (default)    | Terapkan hot bila aman, restart bila diperlukan |

## Kumpulan perintah operator

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

`gateway status --deep` untuk discovery layanan tambahan (LaunchDaemons/systemd system
units/schtasks), bukan probe kesehatan RPC yang lebih mendalam.

## Beberapa gateway (host yang sama)

Sebagian besar instalasi seharusnya menjalankan satu gateway per mesin. Satu gateway dapat meng-host beberapa
agen dan channel.

Anda hanya memerlukan beberapa gateway saat memang menginginkan isolasi atau rescue bot.

Pemeriksaan yang berguna:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Yang diharapkan:

- `gateway status --deep` dapat melaporkan `Other gateway-like services detected (best effort)`
  dan mencetak petunjuk pembersihan ketika instalasi launchd/systemd/schtasks usang masih ada.
- `gateway probe` dapat memperingatkan tentang `multiple reachable gateways` saat lebih dari satu target
  menjawab.
- Jika itu memang disengaja, isolasikan port, config/state, dan root workspace per gateway.

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

Penyiapan terperinci: [/gateway/multiple-gateways](/id/gateway/multiple-gateways).

## Endpoint brain real-time VoiceClaw

OpenClaw mengekspos endpoint WebSocket real-time yang kompatibel VoiceClaw di
`/voiceclaw/realtime`. Gunakan ini saat klien desktop VoiceClaw harus berbicara
langsung dengan brain OpenClaw real-time alih-alih melalui proses relay
terpisah.

Endpoint ini menggunakan Gemini Live untuk audio real-time dan memanggil OpenClaw sebagai
brain dengan mengekspos tool OpenClaw langsung ke Gemini Live. Panggilan tool mengembalikan
hasil `working` langsung agar giliran suara tetap responsif, lalu OpenClaw
mengeksekusi tool sebenarnya secara asynchronous dan menyuntikkan hasilnya kembali ke
sesi live. Atur `GEMINI_API_KEY` dalam environment proses gateway. Jika
auth gateway diaktifkan, klien desktop mengirim token atau password gateway
dalam pesan `session.config` pertamanya.

Akses brain real-time menjalankan perintah agen OpenClaw yang diotorisasi owner. Batasi
`gateway.auth.mode: "none"` hanya untuk instance uji loopback-only. Koneksi brain
real-time non-lokal memerlukan auth gateway.

Untuk gateway uji terisolasi, jalankan instance terpisah dengan port, config,
dan state miliknya sendiri:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

Lalu konfigurasikan VoiceClaw untuk menggunakan:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## Akses remote

Yang disukai: Tailscale/VPN.
Fallback: tunnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Lalu hubungkan klien secara lokal ke `ws://127.0.0.1:18789`.

<Warning>
Tunnel SSH tidak melewati auth gateway. Untuk auth shared-secret, klien tetap
harus mengirim `token`/`password` bahkan melalui tunnel. Untuk mode yang membawa identitas,
permintaan tetap harus memenuhi jalur auth tersebut.
</Warning>

Lihat: [Remote Gateway](/id/gateway/remote), [Authentication](/id/gateway/authentication), [Tailscale](/id/gateway/tailscale).

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

Gunakan `openclaw gateway restart` untuk restart. Jangan merangkai `openclaw gateway stop` dan `openclaw gateway start`; di macOS, `gateway stop` sengaja menonaktifkan LaunchAgent sebelum menghentikannya.

Label LaunchAgent adalah `ai.openclaw.gateway` (default) atau `ai.openclaw.<profile>` (profile bernama). `openclaw doctor` mengaudit dan memperbaiki drift config layanan.

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
ditolak, OpenClaw kembali ke launcher Startup-folder per pengguna
yang mengarah ke `gateway.cmd` di dalam direktori status.

  </Tab>

  <Tab title="Linux (system service)">

Gunakan system unit untuk host multi-pengguna/selalu aktif.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Gunakan body layanan yang sama seperti user unit, tetapi pasang di
`/etc/systemd/system/openclaw-gateway[-<profile>].service` dan sesuaikan
`ExecStart=` jika biner `openclaw` Anda berada di lokasi lain.

  </Tab>
</Tabs>

## Jalur cepat profile dev

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
  dump yang dihasilkan dari setiap helper route yang dapat dipanggil.
- Permintaan: `req(method, params)` → `res(ok/payload|error)`.
- Peristiwa umum mencakup `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, peristiwa siklus hidup pairing/approval, dan `shutdown`.

Eksekusi agen terdiri dari dua tahap:

1. Ack langsung diterima (`status:"accepted"`)
2. Respons penyelesaian final (`status:"ok"|"error"`), dengan peristiwa `agent` yang di-stream di antaranya.

Lihat dokumentasi protokol lengkap: [Gateway Protocol](/id/gateway/protocol).

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

Peristiwa tidak diputar ulang. Pada gap urutan, segarkan status (`health`, `system-presence`) sebelum melanjutkan.

## Signature kegagalan umum

| Signature                                                      | Masalah yang mungkin terjadi                                                     |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Bind non-loopback tanpa jalur auth gateway yang valid                            |
| `another gateway instance is already listening` / `EADDRINUSE` | Konflik port                                                                     |
| `Gateway start blocked: set gateway.mode=local`                | Config diatur ke mode remote, atau cap mode lokal hilang dari config yang rusak |
| `unauthorized` during connect                                  | Ketidakcocokan auth antara klien dan gateway                                     |

Untuk urutan diagnosis lengkap, gunakan [Gateway Troubleshooting](/id/gateway/troubleshooting).

## Jaminan keamanan

- Klien protokol Gateway gagal cepat saat Gateway tidak tersedia (tidak ada fallback direct-channel implisit).
- Frame pertama yang tidak valid/bukan connect ditolak dan koneksi ditutup.
- Shutdown graceful memancarkan peristiwa `shutdown` sebelum socket ditutup.

---

Terkait:

- [Pemecahan masalah](/id/gateway/troubleshooting)
- [Proses Latar Belakang](/id/gateway/background-process)
- [Konfigurasi](/id/gateway/configuration)
- [Health](/id/gateway/health)
- [Doctor](/id/gateway/doctor)
- [Authentication](/id/gateway/authentication)

## Terkait

- [Konfigurasi](/id/gateway/configuration)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
- [Akses remote](/id/gateway/remote)
- [Manajemen secret](/id/gateway/secrets)
