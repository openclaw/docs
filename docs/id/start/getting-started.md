---
read_when:
    - Penyiapan pertama kali dari nol
    - Anda menginginkan jalur tercepat menuju chat yang berfungsi
summary: Instal OpenClaw dan jalankan chat pertama Anda dalam hitungan menit.
title: Memulai
x-i18n:
    generated_at: "2026-04-05T14:06:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: c43eee6f0d3f593e3cf0767bfacb3e0ae38f51a2615d594303786ae1d4a6d2c3
    source_path: start/getting-started.md
    workflow: 15
---

# Memulai

Instal OpenClaw, jalankan onboarding, dan mengobrollah dengan asisten AI Anda — semuanya dalam
sekitar 5 menit. Pada akhirnya Anda akan memiliki Gateway yang berjalan, auth yang sudah
dikonfigurasi, dan sesi chat yang berfungsi.

## Yang Anda butuhkan

- **Node.js** — Node 24 direkomendasikan (Node 22.14+ juga didukung)
- **API key** dari model provider (Anthropic, OpenAI, Google, dll.) — onboarding akan memintanya

<Tip>
Periksa versi Node Anda dengan `node --version`.
**Pengguna Windows:** Windows native dan WSL2 sama-sama didukung. WSL2 lebih
stabil dan direkomendasikan untuk pengalaman penuh. Lihat [Windows](/id/platforms/windows).
Perlu menginstal Node? Lihat [Penyiapan Node](/id/install/node).
</Tip>

## Penyiapan cepat

<Steps>
  <Step title="Instal OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Proses Skrip Instalasi"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    Metode instalasi lain (Docker, Nix, npm): [Instal](/id/install).
    </Note>

  </Step>
  <Step title="Jalankan onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Wizard ini memandu Anda memilih model provider, menetapkan API key,
    dan mengonfigurasi Gateway. Proses ini memakan waktu sekitar 2 menit.

    Lihat [Onboarding (CLI)](/start/wizard) untuk referensi lengkap.

  </Step>
  <Step title="Verifikasi bahwa Gateway sedang berjalan">
    ```bash
    openclaw gateway status
    ```

    Anda akan melihat Gateway mendengarkan di port 18789.

  </Step>
  <Step title="Buka dashboard">
    ```bash
    openclaw dashboard
    ```

    Ini akan membuka UI Kontrol di browser Anda. Jika berhasil dimuat, semuanya berfungsi.

  </Step>
  <Step title="Kirim pesan pertama Anda">
    Ketik pesan di chat UI Kontrol dan Anda akan mendapatkan balasan AI.

    Ingin chat dari ponsel Anda? Channel tercepat untuk disiapkan adalah
    [Telegram](/id/channels/telegram) (cukup bot token). Lihat [Channels](/id/channels)
    untuk semua opsi.

  </Step>
</Steps>

<Accordion title="Lanjutan: pasang build UI Kontrol kustom">
  Jika Anda memelihara build dashboard yang dilokalkan atau dikustomisasi, arahkan
  `gateway.controlUi.root` ke direktori yang berisi aset statis hasil build Anda
  dan `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Salin file statis hasil build Anda ke dalam direktori tersebut.
```

Lalu setel:

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

Mulai ulang gateway lalu buka kembali dashboard:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Apa yang harus dilakukan selanjutnya

<Columns>
  <Card title="Hubungkan sebuah channel" href="/id/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo, dan lainnya.
  </Card>
  <Card title="Pairing dan keamanan" href="/id/channels/pairing" icon="shield">
    Kendalikan siapa yang dapat mengirim pesan ke agen Anda.
  </Card>
  <Card title="Konfigurasi Gateway" href="/id/gateway/configuration" icon="settings">
    Model, tools, sandbox, dan pengaturan lanjutan.
  </Card>
  <Card title="Telusuri tools" href="/tools" icon="wrench">
    Browser, exec, pencarian web, Skills, dan plugin.
  </Card>
</Columns>

<Accordion title="Lanjutan: variabel lingkungan">
  Jika Anda menjalankan OpenClaw sebagai service account atau menginginkan path kustom:

- `OPENCLAW_HOME` — direktori home untuk resolusi path internal
- `OPENCLAW_STATE_DIR` — override direktori state
- `OPENCLAW_CONFIG_PATH` — override path file config

Referensi lengkap: [Variabel lingkungan](/id/help/environment).
</Accordion>
