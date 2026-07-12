---
read_when:
    - Anda ingin menggunakan Cerebras dengan OpenClaw
    - Anda memerlukan variabel lingkungan kunci API Cerebras atau pilihan autentikasi CLI
summary: Penyiapan Cerebras (autentikasi + pemilihan model)
title: Cerebras
x-i18n:
    generated_at: "2026-07-12T14:34:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fca8110d345c796f0481ebf1a8d85c2cc9630b8bd55db8d4bf60772151b35b37
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) menyediakan inferensi berkecepatan tinggi yang kompatibel dengan OpenAI pada perangkat keras inferensi khusus. Plugin ini menyertakan katalog statis berisi empat model (tanpa penemuan langsung).

| Properti              | Nilai                                                     |
| --------------------- | --------------------------------------------------------- |
| ID penyedia           | `cerebras`                                                |
| Plugin                | paket eksternal resmi (`@openclaw/cerebras-provider`)     |
| Variabel lingkungan autentikasi | `CEREBRAS_API_KEY`                              |
| Flag orientasi awal   | `--auth-choice cerebras-api-key`                          |
| Flag CLI langsung     | `--cerebras-api-key <key>`                                |
| API                   | kompatibel dengan OpenAI (`openai-completions`)           |
| URL dasar             | `https://api.cerebras.ai/v1`                              |
| Model default         | `cerebras/zai-glm-4.7`                                    |

## Instal Plugin

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## Memulai

<Steps>
  <Step title="Dapatkan kunci API">
    Buat kunci API di [Konsol Cloud Cerebras](https://cloud.cerebras.ai).
  </Step>
  <Step title="Jalankan orientasi awal">
    <CodeGroup>

```bash Orientasi awal
openclaw onboard --auth-choice cerebras-api-key
```

```bash Flag langsung
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Hanya variabel lingkungan
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Verifikasi ketersediaan model">
    ```bash
    openclaw models list --provider cerebras
    ```

    Menampilkan keempat model statis. Jika `CEREBRAS_API_KEY` tidak dapat ditemukan, `openclaw models status --json` melaporkan kredensial yang tidak ada di bawah `auth.unusableProfiles`.

  </Step>
</Steps>

## Penyiapan noninteraktif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Katalog bawaan

Keempat model memiliki jendela konteks 128 ribu dan maksimum 8.192 token keluaran.

| Referensi model                           | Nama                 | Penalaran | Catatan                                      |
| ----------------------------------------- | -------------------- | --------- | -------------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | ya        | Model default; model penalaran pratinjau     |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | ya        | Model penalaran produksi                     |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | tidak     | Model nonpenalaran pratinjau                  |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | tidak     | Model produksi yang berfokus pada kecepatan  |

<Warning>
Cerebras menandai `zai-glm-4.7` dan `qwen-3-235b-a22b-instruct-2507` sebagai model pratinjau, serta mendokumentasikan bahwa `llama3.1-8b` dan `qwen-3-235b-a22b-instruct-2507` akan dihentikan pada 27 Mei 2026. Periksa [halaman model yang didukung](https://inference-docs.cerebras.ai/models/overview) milik Cerebras sebelum mengandalkannya untuk beban kerja produksi.
</Warning>

## Konfigurasi manual

Sebagian besar penyiapan hanya memerlukan kunci API. Gunakan konfigurasi `models.providers.cerebras` secara eksplisit untuk mengganti metadata model atau menjalankan `mode: "merge"` terhadap katalog statis:

```json5
{
  env: { CEREBRAS_API_KEY: "csk-..." },
  agents: {
    defaults: {
      model: { primary: "cerebras/zai-glm-4.7" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "Z.ai GLM 4.7" },
          { id: "gpt-oss-120b", name: "GPT OSS 120B" },
        ],
      },
    },
  },
}
```

<Note>
Jika Gateway berjalan sebagai daemon (launchd, systemd, Docker), pastikan `CEREBRAS_API_KEY` tersedia untuk proses tersebut — misalnya di `~/.openclaw/.env` atau melalui `env.shellEnv`. Kunci yang hanya diekspor dalam shell interaktif tidak akan membantu layanan terkelola kecuali lingkungan tersebut diimpor secara terpisah.
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Penyedia model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku pengalihan kegagalan.
  </Card>
  <Card title="Mode berpikir" href="/id/tools/thinking" icon="brain">
    Tingkat upaya penalaran untuk dua model Cerebras yang mendukung penalaran.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/config-agents#agent-defaults" icon="gear">
    Default agen dan konfigurasi model.
  </Card>
  <Card title="Tanya jawab umum model" href="/id/help/faq-models" icon="circle-question">
    Profil autentikasi, pergantian model, dan penyelesaian galat "tidak ada profil".
  </Card>
</CardGroup>
