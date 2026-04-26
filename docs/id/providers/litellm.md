---
read_when:
    - Anda ingin merutekan OpenClaw melalui proxy LiteLLM
    - Anda memerlukan pelacakan biaya, logging, atau routing model melalui LiteLLM
summary: Jalankan OpenClaw melalui LiteLLM Proxy untuk akses model terpadu dan pelacakan biaya
title: LiteLLM
x-i18n:
    generated_at: "2026-04-26T11:37:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: f4e2cdddff8dd953b989beb4f2ed1c31dae09298dacd0cf809ef07b41358623b
    source_path: providers/litellm.md
    workflow: 15
---

[LiteLLM](https://litellm.ai) adalah gateway LLM open-source yang menyediakan API terpadu untuk 100+ provider model. Rutekan OpenClaw melalui LiteLLM untuk mendapatkan pelacakan biaya terpusat, logging, dan fleksibilitas untuk mengganti backend tanpa mengubah config OpenClaw Anda.

<Tip>
**Mengapa menggunakan LiteLLM dengan OpenClaw?**

- **Pelacakan biaya** — Lihat dengan tepat berapa pengeluaran OpenClaw di semua model
- **Routing model** — Beralih antara Claude, GPT-4, Gemini, Bedrock tanpa perubahan config
- **Virtual key** — Buat key dengan batas pengeluaran untuk OpenClaw
- **Logging** — Log permintaan/respons penuh untuk debugging
- **Fallback** — Failover otomatis jika provider utama Anda sedang down

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
      </Step>
    </Steps>

  </Tab>

  <Tab title="Penyiapan manual">
    **Paling cocok untuk:** kontrol penuh atas instalasi dan config.

    <Steps>
      <Step title="Mulai LiteLLM Proxy">
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

        Itu saja. OpenClaw sekarang dirutekan melalui LiteLLM.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Config

### Variabel environment

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### File config

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

## Config lanjutan

### Pembuatan gambar

LiteLLM juga dapat mendukung tool `image_generate` melalui rute
`/images/generations` dan `/images/edits` yang kompatibel dengan OpenAI. Konfigurasikan model gambar LiteLLM
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

URL LiteLLM loopback seperti `http://localhost:4000` berfungsi tanpa override
private-network global. Untuk proxy yang di-host di LAN, atur
`models.providers.litellm.request.allowPrivateNetwork: true` karena API key
akan dikirim ke host proxy yang dikonfigurasi.

<AccordionGroup>
  <Accordion title="Virtual key">
    Buat key khusus untuk OpenClaw dengan batas pengeluaran:

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

    Gunakan key yang dihasilkan sebagai `LITELLM_API_KEY`.

  </Accordion>

  <Accordion title="Routing model">
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

    OpenClaw tetap meminta `claude-opus-4-6` — LiteLLM yang menangani routing.

  </Accordion>

  <Accordion title="Melihat penggunaan">
    Periksa dashboard atau API LiteLLM:

    ```bash
    # Info key
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Log pengeluaran
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Catatan perilaku proxy">
    - LiteLLM berjalan pada `http://localhost:4000` secara default
    - OpenClaw terhubung melalui endpoint `/v1` LiteLLM yang kompatibel dengan OpenAI bergaya proxy
    - Pembentukan permintaan native khusus OpenAI tidak berlaku melalui LiteLLM:
      tidak ada `service_tier`, tidak ada `store` untuk Responses, tidak ada hint prompt-cache, dan tidak ada pembentukan payload kompatibilitas reasoning OpenAI
    - Header atribusi OpenClaw tersembunyi (`originator`, `version`, `User-Agent`)
      tidak disuntikkan pada base URL LiteLLM kustom
  </Accordion>
</AccordionGroup>

<Note>
Untuk konfigurasi provider umum dan perilaku failover, lihat [Provider Model](/id/concepts/model-providers).
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Dokumentasi LiteLLM" href="https://docs.litellm.ai" icon="book">
    Dokumentasi resmi LiteLLM dan referensi API.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Ikhtisar semua provider, ref model, dan perilaku failover.
  </Card>
  <Card title="Configuration" href="/id/gateway/configuration" icon="gear">
    Referensi config lengkap.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/models" icon="brain">
    Cara memilih dan mengonfigurasi model.
  </Card>
</CardGroup>
