---
read_when:
    - Anda menginginkan host Linux murah yang selalu aktif untuk Gateway
    - Anda ingin mengakses UI Kontrol dari jarak jauh tanpa menjalankan VPS sendiri
summary: Jalankan Gateway OpenClaw di exe.dev (VM + proksi HTTPS) untuk akses jarak jauh
title: exe.dev
x-i18n:
    generated_at: "2026-07-12T14:19:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a768511d2d7e4e4ec10bcdae83684417bde05286468b0534200f8dd5ec015f7b
    source_path: install/exe-dev.md
    workflow: 16
---

**Tujuan:** Gateway OpenClaw berjalan pada VM [exe.dev](https://exe.dev), dapat diakses di `https://<vm-name>.exe.xyz`.

Panduan ini mengasumsikan image **exeuntu** bawaan exe.dev. Sesuaikan paket untuk distro lain.

## Yang Anda perlukan

- Akun exe.dev
- Akses `ssh exe.dev` ke VM exe.dev (opsional, untuk penyiapan manual)

## Jalur cepat untuk pemula

1. Buka [https://exe.new/openclaw](https://exe.new/openclaw)
2. Isi kunci autentikasi/token sesuai kebutuhan
3. Klik "Agent" di samping VM Anda dan tunggu hingga Shelley selesai melakukan penyediaan
4. Buka `https://<vm-name>.exe.xyz/` dan lakukan autentikasi menggunakan rahasia bersama yang dikonfigurasi (autentikasi token secara default; autentikasi kata sandi juga berfungsi jika Anda mengubah `gateway.auth.mode`)
5. Setujui permintaan pemasangan perangkat yang tertunda dengan `openclaw devices approve <requestId>`

## Instalasi otomatis dengan Shelley

Shelley, agen exe.dev, dapat menginstal OpenClaw berdasarkan perintah:

```text
Siapkan OpenClaw (https://docs.openclaw.ai/install) pada VM ini. Gunakan flag noninteraktif dan penerimaan risiko untuk orientasi awal openclaw. Tambahkan autentikasi atau token yang diberikan sesuai kebutuhan. Konfigurasikan nginx untuk meneruskan dari port bawaan 18789 ke lokasi akar pada konfigurasi situs bawaan yang diaktifkan, serta pastikan dukungan WebSocket diaktifkan. Pemasangan dilakukan dengan "openclaw devices list" dan "openclaw devices approve <request id>". Pastikan dasbor menunjukkan bahwa kondisi OpenClaw baik. exe.dev menangani penerusan dari port 8000 ke port 80/443 dan HTTPS untuk kita, sehingga alamat akhir yang "dapat diakses" harus berupa <vm-name>.exe.xyz, tanpa mencantumkan port.
```

## Instalasi manual

<Steps>
  <Step title="Buat VM">
    Dari perangkat Anda:

    ```bash
    ssh exe.dev new
    ```

    Kemudian hubungkan:

    ```bash
    ssh <vm-name>.exe.xyz
    ```

    <Tip>
    Pertahankan VM ini agar **memiliki status persisten**. OpenClaw menyimpan `openclaw.json`, `auth-profiles.json` per agen, sesi, serta status saluran/penyedia di bawah `~/.openclaw/`, dan ruang kerja di bawah `~/.openclaw/workspace/`.
    </Tip>

  </Step>

  <Step title="Instal prasyarat (pada VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl jq ca-certificates openssl
    ```
  </Step>

  <Step title="Instal OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Konfigurasikan nginx sebagai proksi ke port 8000">
    Edit `/etc/nginx/sites-enabled/default`:

    ```nginx
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        listen 8000;
        listen [::]:8000;

        server_name _;

        location / {
            proxy_pass http://127.0.0.1:18789;
            proxy_http_version 1.1;

            # Dukungan WebSocket
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # Header proksi standar
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Pengaturan batas waktu untuk koneksi berumur panjang
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }
    }
    ```

    Timpa header penerusan alih-alih mempertahankan rantai yang diberikan klien. OpenClaw hanya memercayai metadata IP yang diteruskan dari proksi yang dikonfigurasi secara eksplisit, dan rantai `X-Forwarded-For` bergaya penambahan dianggap sebagai risiko penguatan keamanan.

  </Step>

  <Step title="Akses OpenClaw dan setujui perangkat">
    Buka `https://<vm-name>.exe.xyz/` (lihat keluaran UI Kontrol dari orientasi awal). Jika autentikasi diminta, tempelkan rahasia bersama yang dikonfigurasi dari VM.

    Panduan ini menggunakan autentikasi token secara default, jadi ambil `gateway.auth.token` dengan `openclaw config get gateway.auth.token`, atau buat yang baru dengan `openclaw doctor --n`. Jika Anda mengubah Gateway ke autentikasi kata sandi, gunakan `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` sebagai gantinya.

    Setujui perangkat dengan `openclaw devices list` dan `openclaw devices approve <requestId>`. Jika ragu, gunakan Shelley dari peramban Anda.

  </Step>
</Steps>

## Penyiapan saluran jarak jauh

Untuk host jarak jauh, pilih satu panggilan `config patch` daripada banyak panggilan SSH ke `config set`. Simpan token sebenarnya di lingkungan VM atau `~/.openclaw/.env`, dan hanya masukkan SecretRef ke `openclaw.json`. Lihat [Pengelolaan rahasia](/id/gateway/secrets) untuk kontrak SecretRef lengkap.

Pada VM, pastikan lingkungan layanan berisi rahasia yang diperlukan:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

Dari mesin lokal Anda, buat berkas tambalan dan salurkan ke VM:

```json5
// openclaw.remote.patch.json5
{
  secrets: {
    providers: {
      default: { source: "env" },
    },
  },
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --dry-run' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw gateway restart && openclaw health'
```

Gunakan `--replace-path` ketika daftar izin bertingkat harus menjadi sama persis dengan nilai tambalan, misalnya saat mengganti daftar izin saluran Discord:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

Lihat [Discord](/id/channels/discord) dan [Slack](/id/channels/slack) untuk referensi lengkap konfigurasi saluran.

## Akses jarak jauh

exe.dev menangani autentikasi untuk akses jarak jauh. Secara default, lalu lintas HTTP dari port 8000 diteruskan ke `https://<vm-name>.exe.xyz` dengan autentikasi email.

## Memperbarui

```bash
openclaw update
```

Lihat [Memperbarui](/id/install/updating) untuk pergantian saluran dan pemulihan manual.

## Terkait

- [Gateway jarak jauh](/id/gateway/remote)
- [Ringkasan instalasi](/id/install)
