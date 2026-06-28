---
read_when:
    - Penyiapan pertama dari nol
    - Anda menginginkan cara tercepat untuk menjalankan obrolan
summary: Instal OpenClaw dan jalankan obrolan pertama Anda dalam hitungan menit.
title: Memulai
x-i18n:
    generated_at: "2026-06-28T20:44:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 579ed2b4797dc851b0293b96a4177cc356641b6842fe45c4d48f4e8c224eef75
    source_path: start/getting-started.md
    workflow: 16
---

Instal OpenClaw, jalankan onboarding, dan chat dengan asisten AI Anda — semuanya dalam
sekitar 5 menit. Pada akhirnya, Anda akan memiliki Gateway yang berjalan, autentikasi yang dikonfigurasi,
dan sesi chat yang berfungsi.

## Yang Anda butuhkan

- **Node.js** — Node 24 direkomendasikan (Node 22.19+ juga didukung)
- **Kunci API** dari penyedia model (Anthropic, OpenAI, Google, dll.) — onboarding akan memintanya

<Tip>
Periksa versi Node Anda dengan `node --version`.
**Pengguna Windows:** aplikasi native Windows Hub adalah jalur desktop termudah. Installer
PowerShell dan jalur Gateway WSL2 juga didukung. Lihat [Windows](/id/platforms/windows).
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

    Wizard memandu Anda memilih penyedia model, menetapkan kunci API,
    dan mengonfigurasi Gateway. QuickStart biasanya hanya memerlukan beberapa menit, tetapi
    masuk ke penyedia, pairing channel, instalasi daemon, unduhan jaringan, Skills,
    atau Plugin opsional dapat membuat onboarding penuh memerlukan waktu lebih lama. Anda dapat melewati langkah
    opsional dan kembali nanti dengan `openclaw configure`.

    Lihat [Onboarding (CLI)](/id/start/wizard) untuk referensi lengkap.

  </Step>
  <Step title="Verifikasi Gateway berjalan">
    ```bash
    openclaw gateway status
    ```

    Anda seharusnya melihat Gateway mendengarkan di port 18789.

  </Step>
  <Step title="Buka dashboard">
    ```bash
    openclaw dashboard
    ```

    Ini membuka Control UI di browser Anda. Jika berhasil dimuat, semuanya berfungsi.

  </Step>
  <Step title="Kirim pesan pertama Anda">
    Ketik pesan di chat Control UI dan Anda seharusnya mendapatkan balasan AI.

    Ingin chat dari ponsel Anda sebagai gantinya? Channel tercepat untuk disiapkan adalah
    [Telegram](/id/channels/telegram) (cukup token bot). Lihat [Channel](/id/channels)
    untuk semua opsi.

  </Step>
</Steps>

<Accordion title="Lanjutan: mount build Control UI khusus">
  Jika Anda mengelola build dashboard yang dilokalkan atau disesuaikan, arahkan
  `gateway.controlUi.root` ke direktori yang berisi aset statis hasil build
  dan `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
```

Lalu tetapkan:

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

Mulai ulang gateway dan buka kembali dashboard:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Yang harus dilakukan berikutnya

<Columns>
  <Card title="Hubungkan channel" href="/id/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo, dan lainnya.
  </Card>
  <Card title="Pairing dan keamanan" href="/id/channels/pairing" icon="shield">
    Kontrol siapa yang dapat mengirim pesan ke agent Anda.
  </Card>
  <Card title="Konfigurasi Gateway" href="/id/gateway/configuration" icon="settings">
    Model, alat, sandbox, dan pengaturan lanjutan.
  </Card>
  <Card title="Jelajahi alat" href="/id/tools" icon="wrench">
    Browser, exec, pencarian web, Skills, dan Plugin.
  </Card>
</Columns>

<Accordion title="Lanjutan: variabel lingkungan">
  Jika Anda menjalankan OpenClaw sebagai akun layanan atau menginginkan path khusus:

- `OPENCLAW_HOME` — direktori home untuk resolusi path internal
- `OPENCLAW_STATE_DIR` — timpa direktori state
- `OPENCLAW_CONFIG_PATH` — timpa path file konfigurasi

Referensi lengkap: [Variabel lingkungan](/id/help/environment).
</Accordion>

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Ikhtisar channel](/id/channels)
- [Penyiapan](/id/start/setup)
