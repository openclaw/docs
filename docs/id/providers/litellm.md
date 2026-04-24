---
read_when:
    - Anda ingin merutekan OpenClaw melalui proxy LiteLLM
    - Anda memerlukan pelacakan biaya, logging, atau perutean model melalui LiteLLM
summary: Jalankan OpenClaw melalui LiteLLM Proxy untuk akses model terpadu dan pelacakan biaya
title: LiteLLM
x-i18n:
    generated_at: "2026-04-24T09:23:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9da14e6ded4c9e0b54989898a982987c0a60f6f6170d10b6cd2eddcd5106630f
    source_path: providers/litellm.md
    workflow: 15
---

[LiteLLM](https://litellm.ai) adalah gateway LLM open-source yang menyediakan API terpadu untuk 100+ provider model. Rutekan OpenClaw melalui LiteLLM untuk mendapatkan pelacakan biaya terpusat, logging, dan fleksibilitas untuk beralih backend tanpa mengubah konfigurasi OpenClaw Anda.

<Tip>
**Mengapa menggunakan LiteLLM dengan OpenClaw?**

- **Pelacakan biaya** — Lihat dengan tepat berapa biaya yang dikeluarkan OpenClaw di semua model
- **Perutean model** — Beralih antara Claude, GPT-4, Gemini, Bedrock tanpa perubahan konfigurasi
- **Kunci virtual** — Buat kunci dengan batas pengeluaran untuk OpenClaw
- **Logging** — Log permintaan/respons lengkap untuk debugging
- **Fallback** — Failover otomatis jika provider utama Anda sedang tidak tersedia

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
    **Paling cocok untuk:** kontrol penuh atas instalasi dan konfigurasi.

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

    OpenClaw akan tetap meminta `claude-opus-4-6` — LiteLLM yang menangani peruteannya.

  </Accordion>

  <Accordion title="Melihat penggunaan">
    Periksa dasbor atau API LiteLLM:

    ```bash
    # Informasi kunci
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Log pengeluaran
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Catatan perilaku proxy">
    - LiteLLM berjalan di `http://localhost:4000` secara default
    - OpenClaw terhubung melalui endpoint `/v1` bergaya proxy LiteLLM yang kompatibel dengan OpenAI
    - Pembentukan permintaan native khusus OpenAI tidak berlaku melalui LiteLLM:
      tidak ada `service_tier`, tidak ada `store` pada Responses, tidak ada petunjuk prompt-cache, dan tidak ada pembentukan payload kompatibilitas reasoning OpenAI
    - Header atribusi OpenClaw tersembunyi (`originator`, `version`, `User-Agent`)
      tidak disisipkan pada base URL LiteLLM kustom
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
    Ikhtisar semua provider, referensi model, dan perilaku failover.
  </Card>
  <Card title="Konfigurasi" href="/id/gateway/configuration" icon="gear">
    Referensi konfigurasi lengkap.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/models" icon="brain">
    Cara memilih dan mengonfigurasi model.
  </Card>
</CardGroup>
