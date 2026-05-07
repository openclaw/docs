---
read_when:
    - Penyiapan pertama kali dari nol
    - Anda menginginkan cara tercepat menuju percakapan yang berfungsi
summary: Instal OpenClaw dan mulai obrolan pertama Anda dalam hitungan menit.
title: Memulai
x-i18n:
    generated_at: "2026-05-07T13:25:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 295ce8fd03320027a77a3aef494f785f0fe58e0f57c72ee63f6f9aca68626c20
    source_path: start/getting-started.md
    workflow: 16
---

Instal OpenClaw, jalankan onboarding, dan chat dengan asisten AI Anda — semuanya dalam
sekitar 5 menit. Pada akhirnya Anda akan memiliki Gateway yang berjalan, auth yang dikonfigurasi,
dan sesi chat yang berfungsi.

## Yang Anda butuhkan

- **Node.js** — Node 24 direkomendasikan (Node 22.16+ juga didukung)
- **Kunci API** dari penyedia model (Anthropic, OpenAI, Google, dll.) — onboarding akan meminta Anda memasukkannya

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

    Wizard memandu Anda memilih penyedia model, mengatur kunci API,
    dan mengonfigurasi Gateway. Ini memerlukan sekitar 2 menit.

    Lihat [Onboarding (CLI)](/id/start/wizard) untuk referensi lengkap.

  </Step>
  <Step title="Verifikasi Gateway sedang berjalan">
    ```bash
    openclaw gateway status
    ```

    Anda akan melihat Gateway mendengarkan pada port 18789.

  </Step>
  <Step title="Buka dashboard">
    ```bash
    openclaw dashboard
    ```

    Ini membuka Control UI di browser Anda. Jika halaman dimuat, semuanya berfungsi.

  </Step>
  <Step title="Kirim pesan pertama Anda">
    Ketik pesan di chat Control UI dan Anda akan mendapatkan balasan AI.

    Ingin chat dari ponsel sebagai gantinya? Channel tercepat untuk disiapkan adalah
    [Telegram](/id/channels/telegram) (hanya token bot). Lihat [Channel](/id/channels)
    untuk semua opsi.

  </Step>
</Steps>

<Accordion title="Lanjutan: mount build Control UI kustom">
  Jika Anda memelihara build dashboard yang dilokalkan atau dikustomisasi, arahkan
  `gateway.controlUi.root` ke direktori yang berisi aset statis hasil build
  dan `index.html`.

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

## Yang dapat dilakukan berikutnya

<Columns>
  <Card title="Hubungkan channel" href="/id/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo, dan lainnya.
  </Card>
  <Card title="Pairing dan keamanan" href="/id/channels/pairing" icon="shield">
    Kendalikan siapa yang dapat mengirim pesan ke agen Anda.
  </Card>
  <Card title="Konfigurasikan Gateway" href="/id/gateway/configuration" icon="settings">
    Model, alat, sandbox, dan pengaturan lanjutan.
  </Card>
  <Card title="Jelajahi alat" href="/id/tools" icon="wrench">
    Browser, exec, pencarian web, Skills, dan plugin.
  </Card>
</Columns>

<Accordion title="Lanjutan: variabel lingkungan">
  Jika Anda menjalankan OpenClaw sebagai akun layanan atau menginginkan path kustom:

- `OPENCLAW_HOME` — direktori home untuk resolusi path internal
- `OPENCLAW_STATE_DIR` — timpa direktori state
- `OPENCLAW_CONFIG_PATH` — timpa path file konfigurasi

Referensi lengkap: [Variabel lingkungan](/id/help/environment).
</Accordion>

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Ikhtisar channel](/id/channels)
- [Penyiapan](/id/start/setup)
