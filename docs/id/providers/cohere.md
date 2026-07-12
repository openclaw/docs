---
read_when:
    - Anda ingin menggunakan Cohere dengan OpenClaw
    - Anda memerlukan variabel lingkungan kunci API Cohere atau pilihan autentikasi CLI
summary: Penyiapan Cohere (autentikasi + pemilihan model)
title: Cohere
x-i18n:
    generated_at: "2026-07-12T14:35:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fee46bf80609bd5e8211d6be507713f4de178653941effb81ebae48d8bb6528a
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) menyediakan inferensi yang kompatibel dengan OpenAI melalui Compatibility API miliknya. OpenClaw menyertakan penyedia Cohere selama transisi eksternalisasinya dan juga menerbitkannya sebagai plugin eksternal resmi.

| Properti                | Nilai                                                    |
| ----------------------- | -------------------------------------------------------- |
| ID penyedia             | `cohere`                                                 |
| Plugin                  | disertakan selama transisi; paket eksternal resmi        |
| Variabel lingkungan autentikasi | `COHERE_API_KEY`                              |
| Flag orientasi awal     | `--auth-choice cohere-api-key`                           |
| Flag CLI langsung       | `--cohere-api-key <key>`                                 |
| API                     | kompatibel dengan OpenAI (`openai-completions`)          |
| URL dasar               | `https://api.cohere.ai/compatibility/v1`                 |
| Model default           | `cohere/command-a-plus-05-2026`                          |
| Jendela konteks         | 128.000 token                                            |

## Katalog bawaan

| Referensi model                       | Masukan     | Konteks | Keluaran maks. | Catatan                                                |
| ------------------------------------- | ----------- | ------- | -------------- | ------------------------------------------------------ |
| `cohere/command-a-plus-05-2026`       | teks, gambar | 128.000 | 64.000        | Default; model agentik dan penalaran unggulan           |
| `cohere/command-a-03-2025`            | teks        | 256.000 | 8.000          | Model Command A sebelumnya                             |
| `cohere/command-a-reasoning-08-2025`  | teks        | 256.000 | 32.000         | Penalaran agentik dan penggunaan alat                  |
| `cohere/command-a-vision-07-2025`     | teks, gambar | 128.000 | 8.000         | Analisis visual dan dokumen; tanpa penggunaan alat     |
| `cohere/north-mini-code-1-0`          | teks, gambar | 256.000 | 64.000        | Pemrograman agentik; penalaran; batas penggunaan gratis |

Model Cohere yang mendukung penalaran memiliki dua mode penalaran Compatibility API. OpenClaw memetakan **nonaktif** ke `none` dan setiap tingkat berpikir yang diaktifkan ke `high`. Command A Vision tidak mendukung penggunaan alat, sehingga OpenClaw tetap menonaktifkan alat agen untuk model tersebut.

## Memulai

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

4. Pastikan katalog tersedia:

```bash
openclaw models list --provider cohere
```

Orientasi awal hanya menetapkan Cohere sebagai model utama jika belum ada model utama yang dikonfigurasi.

## Penyiapan hanya melalui lingkungan

Sediakan `COHERE_API_KEY` bagi proses Gateway, lalu pilih model Cohere:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-plus-05-2026" },
    },
  },
}
```

<Note>
Jika Gateway berjalan sebagai daemon atau di Docker, tetapkan `COHERE_API_KEY` untuk layanan tersebut. Mengekspornya hanya di shell interaktif tidak membuatnya tersedia bagi Gateway yang sudah berjalan.
</Note>

## Terkait

- [Penyedia model](/id/concepts/model-providers)
- [CLI model](/id/cli/models)
- [Direktori penyedia](/id/providers/index)
