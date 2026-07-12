---
read_when:
    - Penyiapan pertama kali dari nol
    - Anda menginginkan cara tercepat untuk mendapatkan chat yang berfungsi
summary: Instal OpenClaw dan jalankan percakapan pertama Anda dalam hitungan menit.
title: Memulai
x-i18n:
    generated_at: "2026-07-12T14:40:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 308ca58b8a11832b5a4c0d4634d1c88ef44681ef755a18d675bcff60b5aba929
    source_path: start/getting-started.md
    workflow: 16
---

Instal OpenClaw, jalankan orientasi awal, dan mengobrol dengan asisten AI Anda dalam waktu sekitar 5
menit. Setelah selesai, Anda akan memiliki Gateway yang berjalan, autentikasi yang telah dikonfigurasi, dan
sesi obrolan yang berfungsi.

## Yang Anda perlukan

- **Node.js 22.19+, 23.11+, atau 24+** (24 adalah versi bawaan yang direkomendasikan)
- **Kunci API** dari penyedia model (Anthropic, OpenAI, Google, dan sebagainya) — Anda akan diminta memasukkannya saat orientasi awal

<Tip>
Periksa versi Node Anda dengan `node --version`.
**Pengguna Windows:** aplikasi Windows Hub native adalah cara termudah untuk menggunakan desktop. Jalur
penginstal PowerShell dan Gateway WSL2 juga didukung. Lihat [Windows](/id/platforms/windows).
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
    Metode instalasi lainnya (Docker, Nix, npm): [Instalasi](/id/install).
    </Note>

  </Step>
  <Step title="Jalankan orientasi awal">
    ```bash
    openclaw onboard --install-daemon
    ```

    Wisaya akan memandu Anda memilih penyedia model, menetapkan kunci API,
    dan mengonfigurasi Gateway. Mulai Cepat biasanya hanya memerlukan beberapa menit, tetapi
    proses masuk ke penyedia, pemasangan saluran, instalasi daemon, pengunduhan melalui jaringan, Skills,
    atau Plugin opsional dapat membuat orientasi awal lengkap memerlukan waktu lebih lama. Lewati langkah
    opsional dan kembali lagi nanti dengan `openclaw configure`.

    Lihat [Orientasi awal (CLI)](/id/start/wizard) untuk referensi lengkap.

  </Step>
  <Step title="Pastikan Gateway sedang berjalan">
    ```bash
    openclaw gateway status
    ```

    Anda akan melihat Gateway mendengarkan pada porta 18789.

  </Step>
  <Step title="Buka dasbor">
    ```bash
    openclaw dashboard
    ```

    Perintah ini membuka UI Kontrol di peramban Anda. Jika berhasil dimuat, semuanya berfungsi.

  </Step>
  <Step title="Kirim pesan pertama Anda">
    Ketik pesan dalam obrolan UI Kontrol dan Anda akan menerima balasan dari AI.

    Ingin mengobrol dari ponsel? Saluran yang paling cepat disiapkan adalah
    [Telegram](/id/channels/telegram) (hanya memerlukan token bot). Lihat [Saluran](/id/channels)
    untuk semua opsi.

  </Step>
</Steps>

<Accordion title="Lanjutan: pasang build UI Kontrol khusus">
  Jika Anda mengelola build dasbor yang dilokalkan atau disesuaikan, arahkan
  `gateway.controlUi.root` ke direktori yang berisi aset statis hasil build
  dan `index.html` Anda.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Salin file statis hasil build Anda ke direktori tersebut.
```

Kemudian tetapkan:

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

Mulai ulang Gateway dan buka kembali dasbor:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Langkah berikutnya

<Columns>
  <Card title="Hubungkan saluran" href="/id/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo, dan lainnya.
  </Card>
  <Card title="Pemasangan dan keamanan" href="/id/channels/pairing" icon="shield">
    Kendalikan siapa yang dapat mengirim pesan kepada agen Anda.
  </Card>
  <Card title="Konfigurasikan Gateway" href="/id/gateway/configuration" icon="settings">
    Model, alat, sandbox, dan pengaturan lanjutan.
  </Card>
  <Card title="Jelajahi alat" href="/id/tools" icon="wrench">
    Peramban, eksekusi, pencarian web, Skills, dan Plugin.
  </Card>
</Columns>

<Accordion title="Lanjutan: variabel lingkungan">
  Jika Anda menjalankan OpenClaw sebagai akun layanan atau menginginkan jalur khusus:

- `OPENCLAW_HOME` — direktori beranda untuk resolusi jalur internal
- `OPENCLAW_STATE_DIR` — mengganti direktori status
- `OPENCLAW_CONFIG_PATH` — mengganti jalur file konfigurasi

Referensi lengkap: [Variabel lingkungan](/id/help/environment).
</Accordion>

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Ikhtisar saluran](/id/channels)
- [Penyiapan](/id/start/setup)
