---
read_when:
    - Anda ingin merutekan OpenClaw melalui proksi LiteLLM
    - Anda memerlukan pelacakan biaya, pencatatan log, atau perutean model melalui LiteLLM
summary: Jalankan OpenClaw melalui LiteLLM Proxy untuk akses model terpadu dan pelacakan biaya
title: LiteLLM
x-i18n:
    generated_at: "2026-07-12T14:33:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797b7d02a80a4cd37b92553665e260532af49e011398202d3504a28c511cee2f
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) adalah gateway LLM sumber terbuka dengan API terpadu untuk lebih dari 100 penyedia
model. Rutekan OpenClaw melalui LiteLLM untuk pelacakan biaya terpusat, pencatatan log, kunci virtual dengan
batas pengeluaran, dan failover backend tanpa mengubah konfigurasi OpenClaw.

## Mulai cepat

<Tabs>
  <Tab title="Orientasi awal (disarankan)">
    ```bash
    openclaw onboard --auth-choice litellm-api-key
    ```

    Untuk penyiapan noninteraktif terhadap proksi jarak jauh, teruskan URL proksi secara eksplisit:

    ```bash
    openclaw onboard --non-interactive --accept-risk --auth-choice litellm-api-key \
      --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
    ```

  </Tab>

  <Tab title="Penyiapan manual">
    <Steps>
      <Step title="Jalankan Proksi LiteLLM">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Arahkan OpenClaw ke LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"
        openclaw
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Konfigurasi

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

Model default yang ditulis oleh orientasi awal adalah `litellm/claude-opus-4-6`.

## Pembuatan gambar

LiteLLM dapat mendukung alat `image_generate` melalui rute `/images/generations` dan
`/images/edits` yang kompatibel dengan OpenAI. Model gambar default adalah `gpt-image-2`; konfigurasikan model lain di
`agents.defaults.imageGenerationModel`:

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
      },
    },
  },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "litellm/gpt-image-2",
        timeoutMs: 180_000,
      },
    },
  },
}
```

URL local loopback LiteLLM (`http://localhost:4000`, `127.0.0.1`, `::1`, `host.docker.internal`) berfungsi
tanpa pengesampingan jaringan privat global. Untuk proksi yang dihosting di LAN, tetapkan
`models.providers.litellm.request.allowPrivateNetwork: true` karena kunci API dikirim ke host tersebut.

## Tingkat lanjut

<AccordionGroup>
  <Accordion title="Kunci virtual">
    Buat kunci khusus untuk OpenClaw dengan batas pengeluaran:

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    Gunakan kunci yang dibuat sebagai `LITELLM_API_KEY`.

  </Accordion>

  <Accordion title="Perutean model">
    LiteLLM dapat merutekan permintaan model ke backend yang berbeda. Konfigurasikan dalam `config.yaml` LiteLLM Anda:

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    OpenClaw tetap meminta `claude-opus-4-6`; LiteLLM menangani peruteannya.

  </Accordion>

  <Accordion title="Melihat penggunaan">
    ```bash
    # Informasi kunci
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Log pengeluaran
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Catatan perilaku proksi">
    - LiteLLM berjalan di `http://localhost:4000` secara default.
    - OpenClaw terhubung melalui titik akhir `/v1` kompatibel OpenAI bergaya proksi milik LiteLLM.
    - Pembentukan permintaan khusus OpenAI asli tidak berlaku melalui URL dasar LiteLLM yang dikonfigurasi:
      tanpa `service_tier`, tanpa `store` Responses, tanpa petunjuk cache prompt, tanpa pembentukan payload
      upaya penalaran OpenAI.
    - Header atribusi OpenClaw tersembunyi (`originator`, `version`, `User-Agent`) hanya dikirim ke
      titik akhir OpenAI asli yang terverifikasi, sehingga header tersebut tidak disisipkan pada URL dasar LiteLLM khusus.
  </Accordion>
</AccordionGroup>

<Note>
Untuk konfigurasi penyedia umum dan perilaku failover, lihat [Penyedia Model](/id/concepts/model-providers).
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Dokumentasi LiteLLM" href="https://docs.litellm.ai" icon="book">
    Dokumentasi resmi LiteLLM dan referensi API.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Ringkasan semua penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Konfigurasi" href="/id/gateway/configuration" icon="gear">
    Referensi konfigurasi lengkap.
  </Card>
  <Card title="Model" href="/id/concepts/models" icon="brain">
    Cara memilih dan mengonfigurasi model.
  </Card>
</CardGroup>
