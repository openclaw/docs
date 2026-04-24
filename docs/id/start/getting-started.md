---
read_when:
    - Penyiapan pertama kali dari nol
    - Anda menginginkan jalur tercepat menuju chat yang berfungsi
summary: Instal OpenClaw dan jalankan chat pertama Anda dalam hitungan menit.
title: Memulai
x-i18n:
    generated_at: "2026-04-24T09:27:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe3f92b1464ebf0a5b631c293fa4a3e4b686fdb35c1152663428025dd3c01259
    source_path: start/getting-started.md
    workflow: 15
---

Instal OpenClaw, jalankan onboarding, dan chat dengan asisten AI Anda — semuanya
dalam sekitar 5 menit. Pada akhirnya Anda akan memiliki Gateway yang berjalan, autentikasi yang dikonfigurasi,
dan sesi chat yang berfungsi.

## Yang Anda butuhkan

- **Node.js** — Node 24 disarankan (Node 22.14+ juga didukung)
- **Kunci API** dari penyedia model (Anthropic, OpenAI, Google, dll.) — onboarding akan memintanya

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

    Wizard akan memandu Anda memilih penyedia model, menetapkan kunci API,
    dan mengonfigurasi Gateway. Ini memakan waktu sekitar 2 menit.

    Lihat [Onboarding (CLI)](/id/start/wizard) untuk referensi lengkapnya.

  </Step>
  <Step title="Verifikasi bahwa Gateway berjalan">
    ```bash
    openclaw gateway status
    ```

    Anda seharusnya melihat Gateway mendengarkan pada port 18789.

  </Step>
  <Step title="Buka dashboard">
    ```bash
    openclaw dashboard
    ```

    Ini membuka UI Kontrol di browser Anda. Jika berhasil dimuat, semuanya berfungsi.

  </Step>
  <Step title="Kirim pesan pertama Anda">
    Ketik pesan di chat UI Kontrol dan Anda akan mendapatkan balasan AI.

    Ingin chat dari ponsel Anda? Channel tercepat untuk disiapkan adalah
    [Telegram](/id/channels/telegram) (cukup token bot). Lihat [Channels](/id/channels)
    untuk semua opsi.

  </Step>
</Steps>

<Accordion title="Lanjutan: mount build UI Kontrol kustom">
  Jika Anda memelihara build dashboard yang dilokalkan atau dikustomisasi, arahkan
  `gateway.controlUi.root` ke direktori yang berisi asset statis hasil build
  dan `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Salin file statis hasil build Anda ke direktori tersebut.
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

Mulai ulang gateway lalu buka kembali dashboard:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Apa yang harus dilakukan selanjutnya

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
    Browser, exec, pencarian web, Skills, dan Plugin.
  </Card>
</Columns>

<Accordion title="Lanjutan: variabel environment">
  Jika Anda menjalankan OpenClaw sebagai akun layanan atau ingin jalur kustom:

- `OPENCLAW_HOME` — direktori home untuk resolusi jalur internal
- `OPENCLAW_STATE_DIR` — timpa direktori state
- `OPENCLAW_CONFIG_PATH` — timpa jalur file config

Referensi lengkap: [Variabel environment](/id/help/environment).
</Accordion>

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Ikhtisar Channels](/id/channels)
- [Penyiapan](/id/start/setup)
