---
read_when:
    - Anda ingin menggunakan Cohere dengan OpenClaw
    - Anda memerlukan variabel lingkungan kunci API Cohere atau pilihan autentikasi CLI
summary: Penyiapan Cohere (auth + pemilihan model)
title: Cohere
x-i18n:
    generated_at: "2026-06-27T18:03:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76365a5d358bd5576d83a24d62ef30e203ee204bca90a2e50c56cc4c549b52af
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) menyediakan inferensi yang kompatibel dengan OpenAI melalui Compatibility API-nya. OpenClaw menyertakan penyedia Cohere selama transisi eksternalisasinya dan juga menerbitkannya sebagai plugin eksternal resmi dengan katalog model Command A.

| Properti        | Nilai                                                |
| --------------- | ---------------------------------------------------- |
| ID penyedia     | `cohere`                                             |
| Plugin          | dibundel selama transisi; paket eksternal resmi      |
| Variabel env auth | `COHERE_API_KEY`                                   |
| Flag orientasi awal | `--auth-choice cohere-api-key`                   |
| Flag CLI langsung | `--cohere-api-key <key>`                           |
| API             | kompatibel dengan OpenAI (`openai-completions`)      |
| URL dasar       | `https://api.cohere.ai/compatibility/v1`             |
| Model default   | `cohere/command-a-03-2025`                           |

## Mulai

1. Cohere disertakan dalam paket OpenClaw saat ini. Jika tidak tersedia, instal paket eksternal dan mulai ulang Gateway:

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. Buat kunci API Cohere.
3. Jalankan orientasi awal:

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. Konfirmasi bahwa katalog tersedia:

```bash
openclaw models list --provider cohere
```

Model default hanya ditetapkan jika belum ada model utama yang dikonfigurasi.

## Penyiapan hanya lingkungan

Buat `COHERE_API_KEY` tersedia untuk proses Gateway, lalu pilih model Cohere:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-03-2025" },
    },
  },
}
```

<Note>
Jika Gateway berjalan sebagai daemon atau di Docker, konfigurasikan `COHERE_API_KEY` untuk layanan tersebut. Mengekspornya hanya di shell interaktif tidak membuatnya tersedia untuk Gateway yang sudah berjalan.
</Note>

## Terkait

- [Penyedia model](/id/concepts/model-providers)
- [CLI model](/id/cli/models)
- [Direktori penyedia](/id/providers)
