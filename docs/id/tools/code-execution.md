---
read_when:
    - Anda ingin mengaktifkan atau mengonfigurasi code_execution
    - Anda menginginkan analisis jarak jauh tanpa akses shell lokal
    - Anda ingin menggabungkan x_search atau web_search dengan analisis Python jarak jauh
summary: 'code_execution: jalankan analisis Python jarak jauh dalam sandbox dengan xAI'
title: Eksekusi kode
x-i18n:
    generated_at: "2026-06-27T18:16:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d510d0d2b41deab527d456e675a23ef80ac3b55b5f01906ba2c43d90e4452e36
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` menjalankan analisis Python jarak jauh yang di-sandbox pada Responses API xAI. Ini didaftarkan oleh Plugin `xai` bawaan (di bawah kontrak `tools`) dan meneruskan ke endpoint `https://api.x.ai/v1/responses` yang sama dengan yang digunakan oleh `x_search`.

| Properti           | Nilai                                                                             |
| ------------------ | --------------------------------------------------------------------------------- |
| Nama tool          | `code_execution`                                                                  |
| Plugin penyedia    | `xai` (bawaan, `enabledByDefault: true`)                                          |
| Auth               | profil auth xAI, `XAI_API_KEY`, atau `plugins.entries.xai.config.webSearch.apiKey` |
| Model default      | `grok-4-1-fast`                                                                   |
| Timeout default    | 30 detik                                                                          |
| `maxTurns` default | tidak disetel (xAI menerapkan batas internalnya sendiri)                          |

Ini berbeda dari [`exec`](/id/tools/exec) lokal:

- `exec` menjalankan perintah shell di mesin Anda atau node yang dipasangkan.
- `code_execution` menjalankan Python di sandbox jarak jauh xAI.

Gunakan `code_execution` untuk:

- Perhitungan.
- Tabulasi.
- Statistik cepat.
- Analisis bergaya bagan.
- Menganalisis data yang dikembalikan oleh `x_search` atau `web_search`.

Jangan gunakan ini saat Anda memerlukan file lokal, shell Anda, repo Anda, atau perangkat yang dipasangkan. Gunakan [`exec`](/id/tools/exec) untuk itu.

## Penyiapan

<Steps>
  <Step title="Berikan kredensial xAI">
    Masuk dengan Grok OAuth menggunakan langganan SuperGrok atau X Premium yang memenuhi syarat,
    atau simpan API key. xAI OAuth menggunakan verifikasi kode perangkat, sehingga berfungsi
    dari host jarak jauh tanpa callback localhost. OAuth berfungsi untuk
    `code_execution` dan `x_search`; `XAI_API_KEY` atau konfigurasi web-search Plugin
    juga dapat menjalankan Grok `web_search`.

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Selama instalasi baru, pilihan auth yang sama tersedia di dalam
    onboarding:

    ```bash
    openclaw onboard --install-daemon
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    Atau gunakan API key:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

    Atau melalui konfigurasi:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              webSearch: {
                apiKey: "xai-...",
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Aktifkan dan sesuaikan code_execution">
    `code_execution` tersedia saat kredensial xAI tersedia. Setel
    `plugins.entries.xai.config.codeExecution.enabled` ke `false` untuk menonaktifkannya,
    atau gunakan blok yang sama untuk menyesuaikan model dan timeout.

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // override the default xAI code-execution model
                maxTurns: 2,            // optional cap on internal tool turns
                timeoutSeconds: 30,     // request timeout (default: 30)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Mulai ulang Gateway">
    ```bash
    openclaw gateway restart
    ```

    `code_execution` muncul di daftar tool agen setelah Plugin xAI mendaftar ulang dengan `enabled: true`.

  </Step>
</Steps>

## Cara menggunakannya

Ajukan permintaan secara alami dan buat maksud analisisnya eksplisit:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Tool ini menerima satu parameter `task` secara internal, sehingga agen harus mengirim permintaan analisis lengkap dan data inline apa pun dalam satu prompt.

## Error

Saat tool berjalan tanpa auth, tool mengembalikan error `missing_xai_api_key` terstruktur yang menunjuk ke opsi profil auth, env var, dan konfigurasi. Error tersebut berupa JSON, bukan exception yang dilempar, sehingga agen dapat memperbaiki sendiri:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Batasan

- Ini adalah eksekusi jarak jauh xAI, bukan eksekusi proses lokal.
- Perlakukan hasil sebagai analisis sementara, bukan sesi notebook persisten.
- Jangan berasumsi ada akses ke file lokal atau workspace Anda.
- Untuk data X terbaru, gunakan [`x_search`](/id/tools/web#x_search) terlebih dahulu dan teruskan hasilnya ke `code_execution`.

## Terkait

<CardGroup cols={2}>
  <Card title="Tool Exec" href="/id/tools/exec" icon="terminal">
    Eksekusi shell lokal di mesin Anda atau node yang dipasangkan.
  </Card>
  <Card title="Persetujuan Exec" href="/id/tools/exec-approvals" icon="shield">
    Kebijakan izinkan/tolak untuk eksekusi shell.
  </Card>
  <Card title="Tool web" href="/id/tools/web" icon="globe">
    `web_search`, `x_search`, dan `web_fetch`.
  </Card>
  <Card title="Penyedia xAI" href="/id/providers/xai" icon="microchip">
    Model Grok, pencarian web/x, dan konfigurasi eksekusi kode.
  </Card>
</CardGroup>
