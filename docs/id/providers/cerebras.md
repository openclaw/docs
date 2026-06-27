---
read_when:
    - Anda ingin menggunakan Cerebras dengan OpenClaw
    - Anda memerlukan variabel lingkungan kunci API Cerebras atau pilihan autentikasi CLI
summary: Pengaturan Cerebras (auth + pemilihan model)
title: Cerebras
x-i18n:
    generated_at: "2026-06-27T18:02:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd21756ac521c7b60ca6d3dfbef8665574dca52d1a25e6293169b24f4af6273e
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) menyediakan inferensi kompatibel OpenAI berkecepatan tinggi pada perangkat keras inferensi khusus. Plugin penyedia Cerebras menyertakan katalog statis empat model.

| Properti        | Nilai                                    |
| --------------- | ---------------------------------------- |
| ID penyedia     | `cerebras`                               |
| Plugin          | paket eksternal resmi                    |
| Variabel env auth | `CEREBRAS_API_KEY`                     |
| Flag onboarding | `--auth-choice cerebras-api-key`         |
| Flag CLI langsung | `--cerebras-api-key <key>`             |
| API             | kompatibel OpenAI (`openai-completions`) |
| URL dasar       | `https://api.cerebras.ai/v1`             |
| Model default   | `cerebras/zai-glm-4.7`                   |

## Instal Plugin

Instal plugin resmi, lalu mulai ulang Gateway:

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## Memulai

<Steps>
  <Step title="Dapatkan kunci API">
    Buat kunci API di [Cerebras Cloud Console](https://cloud.cerebras.ai).
  </Step>
  <Step title="Jalankan onboarding">
    <CodeGroup>

```bash Onboarding
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

    Daftar tersebut harus menyertakan keempat model statis. Jika `CEREBRAS_API_KEY` tidak terselesaikan, `openclaw models status --json` melaporkan kredensial yang hilang di bawah `auth.unusableProfiles`.

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

OpenClaw mengirimkan katalog Cerebras statis yang mencerminkan endpoint publik kompatibel OpenAI. Keempat model berbagi konteks 128k dan token output maksimum 8.192.

| Ref model                                 | Nama                 | Penalaran | Catatan                               |
| ----------------------------------------- | -------------------- | --------- | ------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | ya        | Model default; model penalaran pratinjau |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | ya        | Model penalaran produksi              |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | tidak     | Model non-penalaran pratinjau         |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | tidak     | Model produksi berfokus kecepatan     |

<Warning>
  Cerebras menandai `zai-glm-4.7` dan `qwen-3-235b-a22b-instruct-2507` sebagai model pratinjau, dan `llama3.1-8b` serta `qwen-3-235b-a22b-instruct-2507` didokumentasikan untuk penghentian pada 27 Mei 2026. Periksa halaman model yang didukung Cerebras sebelum mengandalkannya untuk beban kerja produksi.
</Warning>

## Konfigurasi manual

Plugin biasanya berarti Anda hanya memerlukan kunci API. Gunakan konfigurasi eksplisit `models.providers.cerebras` saat Anda ingin menimpa metadata model atau menjalankan dalam `mode: "merge"` terhadap katalog statis:

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
  Jika Gateway berjalan sebagai daemon (launchd, systemd, Docker), pastikan `CEREBRAS_API_KEY` tersedia untuk proses tersebut — misalnya di `~/.openclaw/.env` atau melalui `env.shellEnv`. Kunci yang diekspor hanya di shell interaktif tidak akan membantu layanan terkelola kecuali env diimpor secara terpisah.
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Penyedia model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Mode berpikir" href="/id/tools/thinking" icon="brain">
    Tingkat upaya penalaran untuk dua model Cerebras yang mampu melakukan penalaran.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/config-agents#agent-defaults" icon="gear">
    Default agen dan konfigurasi model.
  </Card>
  <Card title="FAQ model" href="/id/help/faq-models" icon="circle-question">
    Profil auth, berpindah model, dan menyelesaikan kesalahan "no profile".
  </Card>
</CardGroup>
