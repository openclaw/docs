---
read_when:
    - Anda ingin menggunakan langganan Claude Max dengan alat yang kompatibel dengan OpenAI
    - Anda menginginkan server API lokal yang membungkus Claude Code CLI
    - Anda ingin mengevaluasi akses Anthropic berbasis langganan dibandingkan berbasis kunci API
summary: Proxy komunitas untuk mengekspos kredensial langganan Claude sebagai endpoint yang kompatibel dengan OpenAI
title: Proksi API Claude Max
x-i18n:
    generated_at: "2026-06-28T20:44:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d8800f7d5bd7adf9bff4825a45878a1bbde73b4d54afe4b5b4aa2b1b5523bee
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** adalah alat komunitas yang mengekspos langganan Claude Max/Pro Anda sebagai endpoint API yang kompatibel dengan OpenAI. Ini memungkinkan Anda menggunakan langganan Anda dengan alat apa pun yang mendukung format OpenAI API.

<Warning>
Jalur ini hanya untuk kompatibilitas teknis. Anthropic pernah memblokir sebagian
penggunaan langganan di luar Claude Code sebelumnya. Anda harus memutuskan sendiri apakah akan
menggunakannya dan memverifikasi aturan penagihan Anthropic saat ini sebelum mengandalkannya.

Dokumentasi dukungan Anthropic saat ini menyebutkan bahwa `claude -p` adalah penggunaan Agent SDK/programatik.
Pembaruan dukungan Anthropic pada 15 Juni 2026 menunda rencana kredit Agent SDK
terpisah yang sebelumnya diumumkan. Untuk saat ini, Claude Agent SDK, `claude -p`, dan penggunaan aplikasi pihak ketiga
masih mengambil dari batas penggunaan langganan yang sedang masuk.

Sebelum mengandalkan jalur ini, periksa [artikel paket Agent SDK
Anthropic](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan),
serta artikel dukungan Claude Code untuk akun
[Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
atau
[Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).
</Warning>

## Mengapa menggunakan ini?

| Pendekatan                | Rute biaya                                      | Paling cocok untuk                          |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| API Anthropic             | Bayar per token melalui Claude Console atau cloud | Aplikasi produksi, otomatisasi bersama, volume |
| Proksi langganan Claude   | Aturan paket dan kredit Claude Code / `claude -p` | Eksperimen pribadi dengan alat yang kompatibel |

Jika Anda memiliki langganan Claude Max atau Pro dan ingin menggunakannya dengan
alat yang kompatibel dengan OpenAI, proksi ini mungkin cocok untuk sebagian alur kerja pribadi. Ini bukan
jalur tarif tetap tanpa batas. API key tetap menjadi jalur kebijakan dan penagihan yang lebih jelas untuk
penggunaan produksi.

## Cara kerjanya

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

Proksi:

1. Menerima permintaan berformat OpenAI di `http://localhost:3456/v1/chat/completions`
2. Mengonversinya menjadi perintah Claude Code CLI
3. Mengembalikan respons dalam format OpenAI (streaming didukung)

## Memulai

<Steps>
  <Step title="Pasang proksi">
    Memerlukan Node.js 22+ dan Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    ```

  </Step>
  <Step title="Mulai server">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="Uji proksi">
    ```bash
    # Health check
    curl http://localhost:3456/health

    # List models
    curl http://localhost:3456/v1/models

    # Chat completion
    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="Konfigurasikan OpenClaw">
    Arahkan OpenClaw ke proksi sebagai endpoint khusus yang kompatibel dengan OpenAI:

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

  </Step>
</Steps>

## Katalog bawaan

| ID Model         | Dipetakan Ke     |
| ---------------- | ---------------- |
| `claude-opus-4`  | Claude Opus 4    |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4` | Claude Haiku 4   |

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Catatan kompatibel OpenAI bergaya proksi">
    Jalur ini menggunakan rute kompatibel OpenAI bergaya proksi yang sama seperti backend khusus
    `/v1` lainnya:

    - Pembentukan permintaan khusus OpenAI native tidak berlaku
    - Tidak ada `service_tier`, tidak ada Responses `store`, tidak ada petunjuk prompt-cache, dan tidak ada
      pembentukan payload kompatibel reasoning OpenAI
    - Header atribusi OpenClaw tersembunyi (`originator`, `version`, `User-Agent`)
      tidak disuntikkan pada URL proksi

  </Accordion>

  <Accordion title="Mulai otomatis di macOS dengan LaunchAgent">
    Buat LaunchAgent untuk menjalankan proksi secara otomatis:

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

  </Accordion>
</AccordionGroup>

## Catatan

- Ini adalah **alat komunitas**, tidak didukung secara resmi oleh Anthropic atau OpenClaw
- Memerlukan langganan Claude Max/Pro aktif dengan Claude Code CLI yang sudah terautentikasi
- Mewarisi perilaku penagihan, kredit penggunaan, dan batas laju Claude Code `claude -p`
- Proksi berjalan secara lokal dan tidak mengirim data ke server pihak ketiga mana pun
- Respons streaming didukung sepenuhnya

<Note>
Untuk integrasi Anthropic native dengan Claude CLI atau API key, lihat [penyedia Anthropic](/id/providers/anthropic). Untuk langganan OpenAI/Codex, lihat [penyedia OpenAI](/id/providers/openai).
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Penyedia Anthropic" href="/id/providers/anthropic" icon="bolt">
    Integrasi OpenClaw native dengan Claude CLI atau API key.
  </Card>
  <Card title="Penyedia OpenAI" href="/id/providers/openai" icon="robot">
    Untuk langganan OpenAI/Codex.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Ikhtisar semua penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Konfigurasi" href="/id/gateway/configuration" icon="gear">
    Referensi konfigurasi lengkap.
  </Card>
</CardGroup>
