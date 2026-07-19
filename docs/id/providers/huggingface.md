---
read_when:
    - Anda ingin menggunakan Hugging Face Inference dengan OpenClaw
    - Anda memerlukan variabel lingkungan token HF atau pilihan autentikasi CLI
summary: Penyiapan Hugging Face Inference (autentikasi + pemilihan model)
title: Hugging Face (inferensi)
x-i18n:
    generated_at: "2026-07-19T05:07:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 92c400b78c5ad2cc724ad4029560dccc5bc2006fdeae400fc6b58998e727e17c
    source_path: providers/huggingface.md
    workflow: 16
---

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) menyediakan router penyelesaian chat yang kompatibel dengan OpenAI untuk banyak model yang di-host (DeepSeek, Llama, dan lainnya) dengan satu token. OpenClaw hanya berkomunikasi dengan **endpoint penyelesaian chat**; untuk teks-ke-gambar, embedding, atau ucapan, gunakan [klien inferensi HF](https://huggingface.co/docs/api-inference/quicktour) secara langsung.

| Properti     | Nilai                                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| ID penyedia  | `huggingface`                                                                                                               |
| Plugin       | bawaan (diaktifkan secara default, tanpa langkah instalasi)                                                                               |
| Variabel lingkungan autentikasi | `HUGGINGFACE_HUB_TOKEN` atau `HF_TOKEN` (token terperinci)                                                                  |
| API          | Kompatibel dengan OpenAI (`https://router.huggingface.co/v1`)                                                                      |
| Penagihan      | Satu token HF; [harga](https://huggingface.co/docs/inference-providers/pricing) mengikuti tarif penyedia dengan tingkat gratis |

## Memulai

<Steps>
  <Step title="Buat token terperinci">
    Buka [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) dan buat token terperinci baru.

    <Warning>
    Token harus mengaktifkan izin **Make calls to Inference Providers** atau permintaan API akan ditolak.
    </Warning>

  </Step>
  <Step title="Jalankan orientasi awal">
    Pilih **Hugging Face** dalam daftar tarik-turun penyedia, lalu masukkan kunci API saat diminta:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Pilih model default">
    Dalam daftar tarik-turun **Default Hugging Face model**, pilih model. Daftar dimuat dari Inference API saat token Anda valid; jika tidak, OpenClaw menampilkan katalog bawaan di bawah. Pilihan Anda disimpan sebagai `agents.defaults.model.primary`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
        },
      },
    }
    ```

  </Step>
  <Step title="Verifikasi bahwa model tersedia">
    ```bash
    openclaw models list --provider huggingface
    ```
  </Step>
</Steps>

### Penyiapan noninteraktif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

Menetapkan `huggingface/deepseek-ai/DeepSeek-R1` sebagai model default.

## ID model

Referensi model menggunakan format `huggingface/<org>/<model>` (ID bergaya Hub). Katalog bawaan OpenClaw:

| Model         | Referensi (awali dengan `huggingface/`) |
| ------------- | -------------------------------- |
| DeepSeek R1   | `deepseek-ai/DeepSeek-R1`        |
| DeepSeek V3.1 | `deepseek-ai/DeepSeek-V3.1`      |
| GPT-OSS 120B  | `openai/gpt-oss-120b`            |

<Tip>
Saat token Anda valid, OpenClaw juga menemukan model lain dari **GET** `https://router.huggingface.co/v1/models` pada saat orientasi awal dan Gateway dimulai, sehingga katalog Anda dapat memuat jauh lebih banyak daripada tiga model di atas. Anda dapat menambahkan `:fastest` atau `:cheapest` ke ID model apa pun; router HF merutekannya ke penyedia inferensi yang cocok. Atur urutan penyedia default Anda di [pengaturan Inference Provider](https://hf.co/settings/inference-providers).
</Tip>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Penemuan model dan daftar tarik-turun orientasi awal">
    OpenClaw menemukan model dengan:

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # atau $HF_TOKEN
    ```

    Responsnya bergaya OpenAI: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    Dengan kunci yang dikonfigurasi (orientasi awal, `HUGGINGFACE_HUB_TOKEN`, atau `HF_TOKEN`), daftar tarik-turun **Default Hugging Face model** selama penyiapan interaktif diisi dari endpoint ini. Saat Gateway dimulai, panggilan yang sama diulangi untuk menyegarkan katalog. Model yang ditemukan digabungkan dengan katalog bawaan di atas (digunakan untuk metadata seperti jendela konteks dan biaya saat ID cocok). Jika permintaan gagal, tidak mengembalikan data, atau tidak ada kunci yang ditetapkan, OpenClaw hanya kembali menggunakan katalog bawaan.

    Nonaktifkan penemuan tanpa menghapus penyedia:

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="Nama model, alias, dan sufiks kebijakan">
    - **Nama dari API:** model yang ditemukan menggunakan `name`, `title`, atau `display_name` dari API jika tersedia; jika tidak, OpenClaw memperoleh nama dari ID model (misalnya `deepseek-ai/DeepSeek-R1` menjadi "DeepSeek R1").
    - **Timpa nama tampilan:** tetapkan label khusus per model dalam konfigurasi:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (fast)" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheap)" },
          },
        },
      },
    }
    ```

    - **Sufiks kebijakan:** `:fastest` dan `:cheapest` adalah konvensi router HF, bukan sesuatu yang ditulis ulang oleh OpenClaw: sufiks dikirim apa adanya sebagai bagian dari ID model dan router HF memilih penyedia inferensi yang cocok. Tambahkan setiap varian sebagai entrinya sendiri di bawah `models.providers.huggingface.models` (atau dalam `model.primary`) jika Anda menginginkan alias yang berbeda untuk setiap sufiks.
    - **Penggabungan konfigurasi:** entri yang sudah ada dalam `models.providers.huggingface.models` (misalnya dalam `models.json`) dipertahankan saat konfigurasi digabungkan, sehingga `name`, `alias`, atau opsi model khusus apa pun yang Anda tetapkan di sana tetap ada setelah dimulai ulang.

  </Accordion>

  <Accordion title="Penyiapan lingkungan dan daemon">
    Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `HUGGINGFACE_HUB_TOKEN` atau `HF_TOKEN` tersedia untuk proses tersebut (misalnya, dalam `~/.openclaw/.env` atau melalui `env.shellEnv`).

    <Note>
    OpenClaw menerima `HUGGINGFACE_HUB_TOKEN` dan `HF_TOKEN`. Jika keduanya ditetapkan, `HUGGINGFACE_HUB_TOKEN` lebih diprioritaskan.
    </Note>

  </Accordion>

  <Accordion title="Konfigurasi: DeepSeek R1 dengan fallback">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/openai/gpt-oss-120b"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Konfigurasi: DeepSeek dengan varian termurah dan tercepat">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheapest)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fastest)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Konfigurasi: DeepSeek + GPT-OSS dengan alias">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.1",
            fallbacks: ["huggingface/openai/gpt-oss-120b"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.1": { alias: "DeepSeek V3.1" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Ikhtisar semua penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/models" icon="brain">
    Cara memilih dan mengonfigurasi model.
  </Card>
  <Card title="Dokumentasi Inference Providers" href="https://huggingface.co/docs/inference-providers" icon="book">
    Dokumentasi resmi Hugging Face Inference Providers.
  </Card>
  <Card title="Konfigurasi" href="/id/gateway/configuration" icon="gear">
    Referensi konfigurasi lengkap.
  </Card>
</CardGroup>
