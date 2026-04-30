---
read_when:
    - Anda ingin merutekan OpenClaw melalui proxy LiteLLM
    - Anda memerlukan pelacakan biaya, pencatatan log, atau perutean model melalui LiteLLM
summary: Jalankan OpenClaw melalui LiteLLM Proxy untuk akses model terpadu dan pelacakan biaya
title: LiteLLM
x-i18n:
    generated_at: "2026-04-30T10:07:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26b5150cfca92c9cd425c864c711efb3ab62ef94377b9d1e5d6476b07bf4c800
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) adalah gateway LLM sumber terbuka yang menyediakan API terpadu untuk 100+ penyedia model. Arahkan OpenClaw melalui LiteLLM untuk mendapatkan pelacakan biaya terpusat, pencatatan log, dan fleksibilitas untuk beralih backend tanpa mengubah konfigurasi OpenClaw Anda.

<Tip>
**Mengapa menggunakan LiteLLM dengan OpenClaw?**

- **Pelacakan biaya** — Lihat secara tepat berapa yang dibelanjakan OpenClaw di semua model
- **Perutean model** — Beralih antara Claude, GPT-4, Gemini, Bedrock tanpa perubahan konfigurasi
- **Kunci virtual** — Buat kunci dengan batas pengeluaran untuk OpenClaw
- **Pencatatan log** — Log permintaan/respons lengkap untuk debugging
- **Fallback** — Failover otomatis jika penyedia utama Anda sedang tidak aktif

</Tip>

## Mulai cepat

<Tabs>
  <Tab title="Onboarding (disarankan)">
    **Paling cocok untuk:** jalur tercepat menuju penyiapan LiteLLM yang berfungsi.

    <Steps>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```

        Untuk penyiapan non-interaktif terhadap proxy jarak jauh, teruskan URL proxy secara eksplisit:

        ```bash
        openclaw onboard --non-interactive --auth-choice litellm-api-key --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Penyiapan manual">
    **Paling cocok untuk:** kontrol penuh atas instalasi dan konfigurasi.

    <Steps>
      <Step title="Mulai Proxy LiteLLM">
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

        Selesai. OpenClaw sekarang dirutekan melalui LiteLLM.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Konfigurasi

### Variabel lingkungan

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### File konfigurasi

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

## Konfigurasi lanjutan

### Pembuatan gambar

LiteLLM juga dapat mendukung alat `image_generate` melalui rute yang kompatibel dengan OpenAI
`/images/generations` dan `/images/edits`. Konfigurasikan model gambar LiteLLM
di bawah `agents.defaults.imageGenerationModel`:

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

URL loopback LiteLLM seperti `http://localhost:4000` berfungsi tanpa penggantian
jaringan privat global. Untuk proxy yang dihosting di LAN, atur
`models.providers.litellm.request.allowPrivateNetwork: true` karena kunci API
akan dikirim ke host proxy yang dikonfigurasi.

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

    Gunakan kunci yang dihasilkan sebagai `LITELLM_API_KEY`.

  </Accordion>

  <Accordion title="Perutean model">
    LiteLLM dapat merutekan permintaan model ke backend yang berbeda. Konfigurasikan di `config.yaml` LiteLLM Anda:

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

    OpenClaw tetap meminta `claude-opus-4-6` — LiteLLM menangani peruteannya.

  </Accordion>

  <Accordion title="Melihat penggunaan">
    Periksa dasbor atau API LiteLLM:

    ```bash
    # Key info
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Spend logs
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Catatan perilaku proxy">
    - LiteLLM berjalan di `http://localhost:4000` secara default
    - OpenClaw terhubung melalui endpoint `/v1` LiteLLM bergaya proxy yang kompatibel dengan OpenAI
    - Pembentukan permintaan khusus OpenAI native tidak berlaku melalui LiteLLM:
      tanpa `service_tier`, tanpa Responses `store`, tanpa petunjuk prompt-cache, dan tanpa
      pembentukan payload kompatibilitas penalaran OpenAI
    - Header atribusi OpenClaw tersembunyi (`originator`, `version`, `User-Agent`)
      tidak disuntikkan pada URL dasar LiteLLM kustom
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
    Gambaran umum semua penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Konfigurasi" href="/id/gateway/configuration" icon="gear">
    Referensi konfigurasi lengkap.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/models" icon="brain">
    Cara memilih dan mengonfigurasi model.
  </Card>
</CardGroup>
