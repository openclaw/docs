---
read_when:
    - Anda ingin menggunakan langganan Claude Max dengan alat yang kompatibel dengan OpenAI
    - Anda menginginkan server API lokal yang membungkus Claude Code CLI
    - Anda ingin mengevaluasi akses Anthropic berbasis langganan dibandingkan dengan yang berbasis kunci API
summary: Proxy komunitas untuk mengekspos kredensial langganan Claude sebagai endpoint yang kompatibel dengan OpenAI
title: Proksi API Claude Max
x-i18n:
    generated_at: "2026-07-12T14:35:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d0d9a70e14d7d444e57e9bcf169816fec4013a2680dfc9b1761e6ab32109e9f
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** adalah paket npm komunitas (bukan plugin OpenClaw) yang
menyediakan langganan Claude Max/Pro sebagai titik akhir API yang kompatibel
dengan OpenAI, sehingga Anda dapat mengarahkan alat apa pun yang kompatibel
dengan OpenAI ke langganan Anda alih-alih menggunakan kunci API Anthropic.

<Warning>
Hanya kompatibilitas teknis, bukan jalur yang disetujui secara resmi. Anthropic
pernah memblokir sebagian penggunaan langganan di luar Claude Code; periksa
aturan penagihan Anthropic saat ini sebelum mengandalkan metode ini.

Dokumentasi Claude Code dari Anthropic menjelaskan `claude -p` sebagai
penggunaan Agent SDK/terprogram. Berdasarkan pembaruan dukungan Anthropic pada
15 Juni 2026, penggunaan Claude Agent SDK, `claude -p`, dan aplikasi pihak
ketiga mengambil kuota dari batas penggunaan langganan yang digunakan untuk
masuk (rencana kredit Agent SDK terpisah yang sebelumnya diumumkan sedang
ditangguhkan). Lihat [artikel paket Agent
SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
dari Anthropic, artikel paket
[Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
dan [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan),
serta [penyedia Anthropic](/id/providers/anthropic) untuk catatan penagihan Claude
CLI milik OpenClaw.
</Warning>

## Mengapa menggunakannya

| Pendekatan                | Jalur biaya                                      | Paling sesuai untuk                              |
| ------------------------- | ------------------------------------------------ | ------------------------------------------------ |
| Kunci API Anthropic       | Bayar per token melalui Claude Console           | Aplikasi produksi, otomatisasi bersama, volume   |
| Proksi langganan Claude   | Paket dan aturan kredit Claude Code / `claude -p` | Eksperimen pribadi dengan alat yang kompatibel   |

Proksi ini memungkinkan langganan Claude Max atau Pro digunakan dengan alat
yang kompatibel dengan OpenAI. Ini bukan jalur tarif tetap tanpa batas — proksi
ini mewarisi batas penggunaan Claude Code. Kunci API tetap menjadi jalur
penagihan yang lebih jelas untuk penggunaan produksi.

## Cara kerjanya

```text
Aplikasi Anda -> claude-max-api-proxy -> Claude Code CLI / claude -p -> Anthropic
     (format OpenAI)                    (mengonversi format)          (menggunakan proses masuk Anda)
```

Proksi menjalankan Claude Code CLI sebagai subproses untuk setiap permintaan,
mengonversi permintaan percakapan berformat OpenAI menjadi perintah CLI, lalu
mengalirkan (atau mengembalikan) respons dalam format OpenAI.

## Memulai

<Steps>
  <Step title="Instal proksi">
    Memerlukan Node.js 20+ dan Claude Code CLI yang telah diautentikasi.

    ```bash
    npm install -g claude-max-api-proxy

    # Pastikan Claude CLI telah diautentikasi
    claude --version
    claude auth login   # jika belum diautentikasi
    ```

  </Step>
  <Step title="Jalankan server">
    ```bash
    claude-max-api
    # Server berjalan di http://localhost:3456
    ```
  </Step>
  <Step title="Uji proksi">
    ```bash
    curl http://localhost:3456/health
    curl http://localhost:3456/v1/models

    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="Konfigurasikan OpenClaw">
    Arahkan OpenClaw ke proksi sebagai titik akhir khusus yang kompatibel dengan OpenAI:

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

<Note>
ID model di bawah merupakan katalog milik proksi, bukan referensi model
Anthropic milik OpenClaw. Setiap ID dipetakan ke alias model Claude Code CLI
(`opus`, `sonnet`, `haiku`), sehingga model yang mendasarinya berubah setiap
kali Anthropic memperbarui alias tersebut di CLI. Periksa README proksi saat
ini sebelum mengandalkan pemetaan tertentu.
</Note>

| ID model            | Alias CLI | Pemetaan saat ini  |
| ------------------- | --------- | ------------------ |
| `claude-opus-4`     | `opus`    | Claude Opus 4.5    |
| `claude-sonnet-4`   | `sonnet`  | Claude Sonnet 4    |
| `claude-haiku-4`    | `haiku`   | Claude Haiku 4     |

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Catatan kompatibilitas OpenAI bergaya proksi">
    Ini menggunakan rute generik khusus `/v1` milik OpenClaw yang kompatibel
    dengan OpenAI, yaitu jalur yang sama seperti backend lain yang kompatibel
    dengan OpenAI dan dihos sendiri:

    - Penyesuaian permintaan khusus OpenAI native tidak berlaku.
    - `/fast` dan `service_tier` hanya berlaku untuk lalu lintas langsung ke
      `api.anthropic.com`; rute proksi membiarkan `service_tier` tidak berubah
      (lihat [mode cepat penyedia Anthropic](/id/providers/anthropic#advanced-configuration)).
    - Tidak ada pembentukan payload Responses `store`, petunjuk cache perintah,
      atau kompatibilitas penalaran OpenAI.
    - Header atribusi OpenAI/Codex milik OpenClaw (`originator`, `version`,
      `User-Agent`) hanya dikirim pada lalu lintas OAuth native ke
      `api.openai.com`, bukan ke target khusus `OPENAI_BASE_URL` seperti proksi
      ini.

  </Accordion>

  <Accordion title="Jalankan otomatis di macOS dengan LaunchAgent">
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

- Mewarisi perilaku penagihan, kredit penggunaan, dan batas laju `claude -p` milik Claude Code.
- Hanya terikat ke `127.0.0.1`; tidak mengirim data ke server pihak ketiga mana pun selain panggilan CLI itu sendiri ke Anthropic.
- Respons streaming didukung.
- Kegagalan autentikasi tidak diperiksa saat dimulai dan baru muncul setelah permintaan percakapan benar-benar dijalankan; jika CLI belum diautentikasi, permintaan pertama akan gagal, bukan server yang menolak untuk dimulai.

<Note>
Untuk integrasi Anthropic native dengan Claude CLI atau kunci API, lihat [penyedia Anthropic](/id/providers/anthropic). Untuk langganan OpenAI/Codex, lihat [penyedia OpenAI](/id/providers/openai).
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Penyedia Anthropic" href="/id/providers/anthropic" icon="bolt">
    Integrasi native OpenClaw dengan Claude CLI atau kunci API.
  </Card>
  <Card title="Penyedia OpenAI" href="/id/providers/openai" icon="robot">
    Untuk langganan OpenAI/Codex.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Ikhtisar semua penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Konfigurasi" href="/id/gateway/configuration" icon="gear">
    Referensi konfigurasi lengkap.
  </Card>
</CardGroup>
