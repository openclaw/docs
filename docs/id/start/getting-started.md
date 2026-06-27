---
read_when:
    - Pertama kali menyiapkan dari nol
    - Anda ingin cara tercepat untuk mendapatkan obrolan yang berfungsi
summary: Pasang OpenClaw dan jalankan percakapan pertama Anda dalam hitungan menit.
title: Memulai
x-i18n:
    generated_at: "2026-06-27T18:14:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 769682cfa35a361cc4adc49f010fed18cf897ce66e1404d07b631e4dede64de8
    source_path: start/getting-started.md
    workflow: 16
---

Instal OpenClaw, jalankan onboarding, dan mengobrol dengan asisten AI Anda — semuanya dalam
sekitar 5 menit. Pada akhirnya Anda akan memiliki Gateway yang berjalan, autentikasi yang dikonfigurasi,
dan sesi chat yang berfungsi.

## Yang Anda butuhkan

- **Node.js** — Node 24 direkomendasikan (Node 22.19+ juga didukung)
- **Kunci API** dari penyedia model (Anthropic, OpenAI, Google, dll.) — onboarding akan memintanya dari Anda

<Tip>
Periksa versi Node Anda dengan `node --version`.
**Pengguna Windows:** aplikasi native Windows Hub adalah jalur desktop termudah. Installer
PowerShell dan jalur WSL2 Gateway juga didukung. Lihat [Windows](/id/platforms/windows).
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

    Wizard memandu Anda memilih penyedia model, mengatur kunci API,
    dan mengonfigurasi Gateway. Proses ini memakan waktu sekitar 2 menit.

    Lihat [Onboarding (CLI)](/id/start/wizard) untuk referensi lengkap.

  </Step>
  <Step title="Pastikan Gateway berjalan">
    ```bash
    openclaw gateway status
    ```

    Anda seharusnya melihat Gateway mendengarkan pada port 18789.

  </Step>
  <Step title="Buka dashboard">
    ```bash
    openclaw dashboard
    ```

    Ini membuka Control UI di browser Anda. Jika halaman dimuat, semuanya berfungsi.

  </Step>
  <Step title="Kirim pesan pertama Anda">
    Ketik pesan di chat Control UI dan Anda seharusnya mendapatkan balasan AI.

    Ingin mengobrol dari ponsel Anda saja? Kanal tercepat untuk disiapkan adalah
    [Telegram](/id/channels/telegram) (cukup token bot). Lihat [Kanal](/id/channels)
    untuk semua opsi.

  </Step>
</Steps>

<Accordion title="Lanjutan: pasang build Control UI khusus">
  Jika Anda memelihara build dashboard yang dilokalkan atau dikustomisasi, arahkan
  `gateway.controlUi.root` ke direktori yang berisi aset statis hasil build
  dan `index.html` Anda.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
```

Lalu atur:

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
  <Card title="Hubungkan kanal" href="/id/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo, dan lainnya.
  </Card>
  <Card title="Pairing dan keamanan" href="/id/channels/pairing" icon="shield">
    Kendalikan siapa yang dapat mengirim pesan ke agen Anda.
  </Card>
  <Card title="Konfigurasi Gateway" href="/id/gateway/configuration" icon="settings">
    Model, alat, sandbox, dan pengaturan lanjutan.
  </Card>
  <Card title="Jelajahi alat" href="/id/tools" icon="wrench">
    Browser, exec, pencarian web, Skills, dan Plugin.
  </Card>
</Columns>

<Accordion title="Lanjutan: variabel lingkungan">
  Jika Anda menjalankan OpenClaw sebagai akun layanan atau menginginkan jalur khusus:

- `OPENCLAW_HOME` — direktori home untuk resolusi jalur internal
- `OPENCLAW_STATE_DIR` — timpa direktori state
- `OPENCLAW_CONFIG_PATH` — timpa jalur file konfigurasi

Referensi lengkap: [Variabel lingkungan](/id/help/environment).
</Accordion>

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Ikhtisar kanal](/id/channels)
- [Penyiapan](/id/start/setup)
