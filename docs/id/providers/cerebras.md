---
read_when:
    - Anda ingin menggunakan Cerebras dengan OpenClaw
    - Anda memerlukan variabel lingkungan kunci API Cerebras atau pilihan autentikasi CLI
summary: Penyiapan Cerebras (autentikasi + pemilihan model)
title: Cerebras
x-i18n:
    generated_at: "2026-05-06T09:24:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ba12fcc214ac756111a94f16ec619d26dc01ee2acc1eaef013fcb70bf752610
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) menyediakan inferensi berkecepatan tinggi yang kompatibel dengan OpenAI pada perangkat keras inferensi khusus. OpenClaw menyertakan Plugin penyedia Cerebras yang dibundel dengan katalog statis empat model.

| Properti        | Nilai                                    |
| --------------- | ---------------------------------------- |
| ID penyedia     | `cerebras`                               |
| Plugin          | dibundel, `enabledByDefault: true`       |
| Variabel env autentikasi | `CEREBRAS_API_KEY`              |
| Flag orientasi  | `--auth-choice cerebras-api-key`         |
| Flag CLI langsung | `--cerebras-api-key <key>`             |
| API             | kompatibel dengan OpenAI (`openai-completions`) |
| URL dasar       | `https://api.cerebras.ai/v1`             |
| Model bawaan    | `cerebras/zai-glm-4.7`                   |

## Memulai

<Steps>
  <Step title="Dapatkan kunci API">
    Buat kunci API di [Cerebras Cloud Console](https://cloud.cerebras.ai).
  </Step>
  <Step title="Jalankan orientasi">
    <CodeGroup>

```bash Orientasi
openclaw onboard --auth-choice cerebras-api-key
```

```bash Flag langsung
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Hanya env
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Verifikasi model tersedia">
    ```bash
    openclaw models list --provider cerebras
    ```

    Daftar tersebut seharusnya menyertakan keempat model yang dibundel. Jika `CEREBRAS_API_KEY` tidak terselesaikan, `openclaw models status --json` melaporkan kredensial yang hilang di bawah `auth.unusableProfiles`.

  </Step>
</Steps>

## Penyiapan non-interaktif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Katalog bawaan

OpenClaw mengirimkan katalog statis Cerebras yang mencerminkan endpoint publik yang kompatibel dengan OpenAI. Keempat model berbagi konteks 128k dan 8.192 token output maksimum.

| Ref model                                 | Nama                 | Penalaran | Catatan                               |
| ----------------------------------------- | -------------------- | --------- | ------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | ya        | Model bawaan; model penalaran pratinjau |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | ya        | Model penalaran produksi             |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | tidak     | Model non-penalaran pratinjau        |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | tidak     | Model produksi yang berfokus pada kecepatan |

<Warning>
  Cerebras menandai `zai-glm-4.7` dan `qwen-3-235b-a22b-instruct-2507` sebagai model pratinjau, dan `llama3.1-8b` beserta `qwen-3-235b-a22b-instruct-2507` didokumentasikan akan dihentikan pada 27 Mei 2026. Periksa halaman model yang didukung Cerebras sebelum mengandalkannya untuk beban kerja produksi.
</Warning>

## Konfigurasi manual

Plugin yang dibundel biasanya berarti Anda hanya memerlukan kunci API. Gunakan konfigurasi eksplisit `models.providers.cerebras` ketika Anda ingin menimpa metadata model atau berjalan dalam `mode: "merge"` terhadap katalog statis:

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
  Jika Gateway berjalan sebagai daemon (launchd, systemd, Docker), pastikan `CEREBRAS_API_KEY` tersedia untuk proses tersebut — misalnya di `~/.openclaw/.env` atau melalui `env.shellEnv`. Kunci yang hanya berada di `~/.profile` tidak akan membantu layanan terkelola kecuali env diimpor secara terpisah.
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Penyedia model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Mode berpikir" href="/id/tools/thinking" icon="brain">
    Tingkat upaya penalaran untuk dua model Cerebras yang mendukung penalaran.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/config-agents#agent-defaults" icon="gear">
    Bawaan agen dan konfigurasi model.
  </Card>
  <Card title="FAQ model" href="/id/help/faq-models" icon="circle-question">
    Profil autentikasi, mengganti model, dan menyelesaikan galat "no profile".
  </Card>
</CardGroup>
