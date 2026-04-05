---
read_when:
    - Anda ingin menggunakan langganan Claude Max dengan alat yang kompatibel dengan OpenAI
    - Anda menginginkan server API lokal yang membungkus Claude Code CLI
    - Anda ingin mengevaluasi akses Anthropic berbasis langganan vs berbasis API key
summary: Proxy komunitas untuk mengekspos kredensial langganan Claude sebagai endpoint yang kompatibel dengan OpenAI
title: Claude Max API Proxy
x-i18n:
    generated_at: "2026-04-05T14:03:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e125a6a46e48371544adf1331137a1db51e93e905b8c44da482cf2fba180a09
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

# Claude Max API Proxy

**claude-max-api-proxy** adalah alat komunitas yang mengekspos langganan Claude Max/Pro Anda sebagai endpoint API yang kompatibel dengan OpenAI. Ini memungkinkan Anda menggunakan langganan Anda dengan alat apa pun yang mendukung format API OpenAI.

<Warning>
Jalur ini hanya untuk kompatibilitas teknis. Anthropic pernah memblokir sebagian penggunaan
langganan di luar Claude Code sebelumnya. Anda harus memutuskan sendiri apakah akan menggunakan
jalur ini dan memverifikasi ketentuan Anthropic saat ini sebelum mengandalkannya.
</Warning>

## Mengapa Menggunakan Ini?

| Approach                | Cost                                                | Best For                                   |
| ----------------------- | --------------------------------------------------- | ------------------------------------------ |
| API Anthropic           | Bayar per token (~$15/M input, $75/M output untuk Opus) | Aplikasi produksi, volume tinggi        |
| Langganan Claude Max    | $200/bulan tarif tetap                              | Penggunaan pribadi, pengembangan, penggunaan tanpa batas |

Jika Anda memiliki langganan Claude Max dan ingin menggunakannya dengan alat yang kompatibel dengan OpenAI, proxy ini dapat mengurangi biaya untuk beberapa alur kerja. API key tetap menjadi jalur kebijakan yang lebih jelas untuk penggunaan produksi.

## Cara Kerjanya

```
Aplikasi Anda → claude-max-api-proxy → Claude Code CLI → Anthropic (via subscription)
   (format OpenAI)              (mengonversi format)      (menggunakan login Anda)
```

Proxy ini:

1. Menerima permintaan berformat OpenAI di `http://localhost:3456/v1/chat/completions`
2. Mengonversinya menjadi perintah Claude Code CLI
3. Mengembalikan respons dalam format OpenAI (streaming didukung)

## Instalasi

```bash
# Memerlukan Node.js 20+ dan Claude Code CLI
npm install -g claude-max-api-proxy

# Verifikasi bahwa Claude CLI sudah diautentikasi
claude --version
```

## Penggunaan

### Mulai server

```bash
claude-max-api
# Server berjalan di http://localhost:3456
```

### Uji

```bash
# Health check
curl http://localhost:3456/health

# Daftar model
curl http://localhost:3456/v1/models

# Chat completion
curl http://localhost:3456/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-opus-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Dengan OpenClaw

Anda dapat mengarahkan OpenClaw ke proxy ini sebagai endpoint kustom yang kompatibel dengan OpenAI:

```json5
{
  env: {
    OPENAI_API_KEY: "not-needed",
    OPENAI_BASE_URL: "http://localhost:3456/v1",
  },
  agents: {
    defaults: {
      model: { primary: "openai/claude-opus-4" },
    },
  },
}
```

Jalur ini menggunakan rute gaya proxy yang kompatibel dengan OpenAI yang sama seperti backend kustom `/v1` lainnya:

- pembentukan request native khusus OpenAI tidak berlaku
- tidak ada `service_tier`, tidak ada Responses `store`, tidak ada petunjuk prompt-cache, dan tidak ada pembentukan payload reasoning-compat OpenAI
- header atribusi OpenClaw tersembunyi (`originator`, `version`, `User-Agent`) tidak disuntikkan ke URL proxy

## Model yang Tersedia

| Model ID          | Dipetakan Ke     |
| ----------------- | ---------------- |
| `claude-opus-4`   | Claude Opus 4    |
| `claude-sonnet-4` | Claude Sonnet 4  |
| `claude-haiku-4`  | Claude Haiku 4   |

## Mulai Otomatis di macOS

Buat LaunchAgent untuk menjalankan proxy secara otomatis:

```bash
cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.claude-max-api</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
EOF

launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
```

## Tautan

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Issues:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## Catatan

- Ini adalah **alat komunitas**, tidak didukung secara resmi oleh Anthropic maupun OpenClaw
- Memerlukan langganan Claude Max/Pro yang aktif dengan Claude Code CLI yang sudah diautentikasi
- Proxy berjalan secara lokal dan tidak mengirim data ke server pihak ketiga mana pun
- Respons streaming didukung sepenuhnya

## Lihat Juga

- [provider Anthropic](/providers/anthropic) - integrasi native OpenClaw dengan Claude CLI atau API key
- [provider OpenAI](/providers/openai) - untuk langganan OpenAI/Codex
