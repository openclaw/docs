---
read_when:
    - Anda ingin mengaktifkan atau mengonfigurasi code_execution
    - Anda ingin analisis remote tanpa akses shell lokal
    - Anda ingin menggabungkan x_search atau web_search dengan analisis Python remote
summary: code_execution -- jalankan analisis Python remote tersandbox dengan xAI
title: Code Execution
x-i18n:
    generated_at: "2026-04-05T14:07:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48ca1ddd026cb14837df90ee74859eb98ba6d1a3fbc78da8a72390d0ecee5e40
    source_path: tools/code-execution.md
    workflow: 15
---

# Code Execution

`code_execution` menjalankan analisis Python remote yang tersandbox di Responses API milik xAI.
Ini berbeda dari [`exec`](/tools/exec) lokal:

- `exec` menjalankan perintah shell di mesin atau node Anda
- `code_execution` menjalankan Python di sandbox remote xAI

Gunakan `code_execution` untuk:

- kalkulasi
- tabulasi
- statistik cepat
- analisis bergaya grafik
- menganalisis data yang dikembalikan oleh `x_search` atau `web_search`

**Jangan** gunakan ini saat Anda membutuhkan file lokal, shell Anda, repo Anda, atau perangkat
yang dipasangkan. Gunakan [`exec`](/tools/exec) untuk itu.

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

## Cara Menggunakannya

Tanyakan secara alami dan jelaskan maksud analisisnya:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Tool ini secara internal menerima satu parameter `task`, sehingga agen harus mengirim
permintaan analisis lengkap beserta data inline apa pun dalam satu prompt.

## Batasan

- Ini adalah eksekusi xAI remote, bukan eksekusi proses lokal.
- Ini harus diperlakukan sebagai analisis sementara, bukan notebook persisten.
- Jangan berasumsi memiliki akses ke file lokal atau workspace Anda.
- Untuk data X terbaru, gunakan [`x_search`](/tools/web#x_search) terlebih dahulu.

## Lihat Juga

- [Tool web](/tools/web)
- [Exec](/tools/exec)
- [xAI](/id/providers/xai)
