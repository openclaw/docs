---
read_when:
    - Anda ingin menggunakan Featherless AI dengan OpenClaw
    - Anda memerlukan variabel lingkungan kunci API Featherless atau format referensi model
summary: Penyiapan Featherless AI, pemilihan model, dan pemanggilan alat
title: Featherless AI
x-i18n:
    generated_at: "2026-07-12T14:32:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9112f7e65b4089bf96933c632d0b62f7fb87d42998d985ca85eb92dc392636b6
    source_path: providers/featherless.md
    workflow: 16
---

[Featherless AI](https://featherless.ai) menyediakan model terbuka melalui API yang kompatibel dengan OpenAI. OpenClaw memasang Featherless sebagai Plugin penyedia eksternal resmi dan mempertahankan katalog bawaan tetap ringkas, sekaligus menerima ID model persis dari Featherless saat runtime.

| Properti             | Nilai                                    |
| -------------------- | ---------------------------------------- |
| ID penyedia          | `featherless`                            |
| Paket                | `@openclaw/featherless-provider`         |
| Variabel lingkungan autentikasi | `FEATHERLESS_API_KEY`       |
| Flag orientasi awal  | `--auth-choice featherless-api-key`      |
| Flag CLI langsung    | `--featherless-api-key <key>`            |
| API                  | Kompatibel dengan OpenAI (`openai-completions`) |
| URL dasar            | `https://api.featherless.ai/v1`          |
| Model default        | `featherless/Qwen/Qwen3-32B`             |

## Penyiapan

Pasang Plugin dan mulai ulang Gateway:

```bash
openclaw plugins install @openclaw/featherless-provider
openclaw gateway restart
```

Jalankan orientasi awal:

```bash
openclaw onboard --auth-choice featherless-api-key
```

Untuk penyiapan noninteraktif:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice featherless-api-key \
  --featherless-api-key "$FEATHERLESS_API_KEY"
```

Atau sediakan kunci tersebut bagi proses Gateway:

```bash
export FEATHERLESS_API_KEY="<your-featherless-api-key>" # pragma: allowlist secret
```

Verifikasi penyedia:

```bash
openclaw models list --provider featherless
```

## Model default

Plugin menggunakan `Qwen/Qwen3-32B` sebagai default penyiapan karena dokumentasi Featherless menyatakan dukungan pemanggilan alat native untuk keluarga Qwen 3. OpenClaw mengonfigurasi jendela konteks 32.768 token, batas keluaran konservatif sebesar 4.096 token, dan kontrol proses berpikir pada templat percakapan Qwen.

Kolom biaya katalog bernilai nol karena Featherless mendukung beberapa mode penagihan dan OpenClaw tidak menyematkan tarif paket atau harga per permintaan yang khusus untuk akun tertentu.

## Model Featherless lainnya

Gunakan ID model Featherless secara persis setelah prefiks penyedia `featherless/`:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "featherless/moonshotai/Kimi-K2-Instruct",
      },
    },
  },
}
```

OpenClaw sengaja tidak menyalin seluruh indeks model publik Featherless ke pemilih. Indeks tersebut berukuran besar dan tidak menyediakan metadata kemampuan terstruktur yang memadai untuk mengklasifikasikan setiap model teks, visi, penyematan, dan penalaran dengan aman. Oleh karena itu, ID yang tidak dikenal menggunakan default konservatif khusus teks tanpa penalaran: jendela konteks 4.096 token dan batas keluaran 1.024 token.

Tambahkan entri model penyedia secara eksplisit jika sebuah model memerlukan metadata yang berbeda:

```json5
{
  models: {
    mode: "merge",
    providers: {
      featherless: {
        baseUrl: "https://api.featherless.ai/v1",
        apiKey: "${FEATHERLESS_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-3-27b-it",
            name: "Gemma 3 27B",
            input: ["text", "image"],
            reasoning: false,
            contextWindow: 32768,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

Periksa katalog model Featherless untuk mengetahui ketersediaan model dan tag kemampuan terkini sebelum menambahkan metadata khusus.

## Pemecahan masalah

- `401` atau `403`: pastikan `FEATHERLESS_API_KEY` dapat diakses oleh proses Gateway, atau jalankan kembali orientasi awal.
- Model tidak dikenal: gunakan ID persis yang peka huruf besar-kecil dari Featherless setelah prefiks `featherless/`.
- Pemanggilan alat dikembalikan sebagai teks: pilih keluarga model yang menurut dokumentasi Featherless mendukung pemanggilan fungsi native, seperti Qwen 3.
- Gateway terkelola tidak dapat mengakses kunci: simpan kunci di `~/.openclaw/.env` atau sumber lingkungan lain yang dimuat oleh layanan, lalu mulai ulang Gateway.

## Terkait

- [Penyedia model](/id/concepts/model-providers)
- [Semua penyedia](/id/providers/index)
- [Mode berpikir](/id/tools/thinking)
