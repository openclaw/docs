---
read_when:
    - Anda ingin mengaktifkan atau mengonfigurasi code_execution
    - Anda menginginkan analisis jarak jauh tanpa akses shell lokal
    - Anda ingin menggabungkan x_search atau web_search dengan analisis Python jarak jauh
summary: code_execution -- jalankan analisis Python jarak jauh dalam sandbox dengan xAI
title: Eksekusi kode
x-i18n:
    generated_at: "2026-04-30T10:14:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe635ec65aaf593a5bd63c139fbfc69e1ba3ea7c58c2bba639ec1ebd70dba1a9
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` menjalankan analisis Python jarak jauh yang disandbox pada Responses API xAI.
Ini berbeda dari [`exec`](/id/tools/exec) lokal:

- `exec` menjalankan perintah shell di mesin atau node Anda
- `code_execution` menjalankan Python di sandbox jarak jauh xAI

Gunakan `code_execution` untuk:

- perhitungan
- tabulasi
- statistik cepat
- analisis bergaya bagan
- menganalisis data yang dikembalikan oleh `x_search` atau `web_search`

Jangan gunakan ini saat Anda memerlukan file lokal, shell Anda, repo Anda, atau perangkat yang dipasangkan. Gunakan [`exec`](/id/tools/exec) untuk itu.

## Penyiapan

Anda memerlukan kunci API xAI. Yang mana pun dari ini dapat digunakan:

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

Ajukan permintaan secara alami dan jelaskan maksud analisisnya secara eksplisit:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Alat ini menerima satu parameter `task` secara internal, jadi agen harus mengirim permintaan analisis lengkap dan data inline apa pun dalam satu prompt.

## Batasan

- Ini adalah eksekusi xAI jarak jauh, bukan eksekusi proses lokal.
- Ini harus diperlakukan sebagai analisis sementara, bukan notebook persisten.
- Jangan mengasumsikan akses ke file lokal atau ruang kerja Anda.
- Untuk data X terbaru, gunakan [`x_search`](/id/tools/web#x_search) terlebih dahulu.

## Terkait

- [Alat Exec](/id/tools/exec)
- [Persetujuan Exec](/id/tools/exec-approvals)
- [Alat apply_patch](/id/tools/apply-patch)
- [Alat Web](/id/tools/web)
- [xAI](/id/providers/xai)
