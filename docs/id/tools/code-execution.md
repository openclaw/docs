---
read_when:
    - Anda ingin mengaktifkan atau mengonfigurasi code_execution
    - Anda menginginkan analisis jarak jauh tanpa akses shell lokal
    - Anda ingin menggabungkan x_search atau web_search dengan analisis Python jarak jauh
summary: code_execution -- jalankan analisis Python jarak jauh tersandbox dengan xAI
title: Eksekusi kode
x-i18n:
    generated_at: "2026-04-24T09:29:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 332afbbef15eaa832d87f263eb095eff680e8f941b9e123add9b37f9b4fa5e00
    source_path: tools/code-execution.md
    workflow: 15
---

`code_execution` menjalankan analisis Python jarak jauh tersandbox di Responses API xAI.
Ini berbeda dari [`exec`](/id/tools/exec) lokal:

- `exec` menjalankan perintah shell di mesin atau node Anda
- `code_execution` menjalankan Python di sandbox jarak jauh xAI

Gunakan `code_execution` untuk:

- perhitungan
- tabulasi
- statistik cepat
- analisis bergaya grafik
- menganalisis data yang dikembalikan oleh `x_search` atau `web_search`

**Jangan** gunakan ini saat Anda memerlukan file lokal, shell Anda, repo Anda, atau perangkat yang dipasangkan. Gunakan [`exec`](/id/tools/exec) untuk itu.

## Penyiapan

Anda memerlukan API key xAI. Salah satu dari ini dapat digunakan:

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

Contoh:

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...",
          },
          codeExecution: {
            enabled: true,
            model: "grok-4-1-fast",
            maxTurns: 2,
            timeoutSeconds: 30,
          },
        },
      },
    },
  },
}
```

## Cara menggunakannya

Ajukan secara natural dan buat maksud analisisnya eksplisit:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Alat ini secara internal menerima satu parameter `task`, jadi agen harus mengirim
permintaan analisis lengkap dan data inline apa pun dalam satu prompt.

## Batasan

- Ini adalah eksekusi xAI jarak jauh, bukan eksekusi proses lokal.
- Ini harus diperlakukan sebagai analisis sementara, bukan notebook persisten.
- Jangan mengasumsikan akses ke file lokal atau workspace Anda.
- Untuk data X terbaru, gunakan [`x_search`](/id/tools/web#x_search) terlebih dahulu.

## Terkait

- [Alat exec](/id/tools/exec)
- [Persetujuan exec](/id/tools/exec-approvals)
- [alat apply_patch](/id/tools/apply-patch)
- [Alat web](/id/tools/web)
- [xAI](/id/providers/xai)
