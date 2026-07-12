---
read_when:
    - Anda ingin menggunakan Meta dengan OpenClaw
    - Anda memerlukan variabel lingkungan MODEL_API_KEY atau pilihan autentikasi CLI
summary: Penyiapan Meta (autentikasi + pemilihan model muse-spark-1.1)
title: Meta
x-i18n:
    generated_at: "2026-07-12T14:33:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2ce7616d9abc14a2d15ee53ea7725d3e70059af1a38bb61dbfe5b3969106432
    source_path: providers/meta.md
    workflow: 16
---

**Meta API** menggunakan **Responses API** yang kompatibel dengan OpenAI (`POST /v1/responses`)
untuk model penalaran `muse-spark-1.1`. Penyedia ini disertakan sebagai plugin
OpenClaw bawaan.

| Properti              | Nilai                              |
| --------------------- | ---------------------------------- |
| ID penyedia           | `meta`                             |
| Plugin                | penyedia bawaan                    |
| Variabel lingkungan autentikasi | `MODEL_API_KEY`          |
| Flag orientasi awal   | `--auth-choice meta-api-key`       |
| Flag CLI langsung     | `--meta-api-key <key>`             |
| API                   | Responses API (`openai-responses`) |
| URL dasar             | `https://api.meta.ai/v1`           |
| Model default         | `meta/muse-spark-1.1`              |
| Penalaran default     | `high` (`reasoning.effort`)        |

## Memulai

<Steps>
  <Step title="Tetapkan kunci API">
    <CodeGroup>

```bash Orientasi awal
openclaw onboard --auth-choice meta-api-key
```

```bash Flag langsung
openclaw onboard --non-interactive --accept-risk \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

```bash Hanya variabel lingkungan
export MODEL_API_KEY=<key>
```

    </CodeGroup>

  </Step>
  <Step title="Verifikasi bahwa model tersedia">
    ```bash
    openclaw models list --provider meta
    ```

    Menampilkan entri katalog statis `muse-spark-1.1`. Jika `MODEL_API_KEY` tidak dapat ditemukan,
    `openclaw models status --json` melaporkan kredensial yang tidak tersedia di bawah
    `auth.unusableProfiles`.

  </Step>
</Steps>

## Penyiapan noninteraktif

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

## Katalog bawaan

| Referensi model       | Nama           | Penalaran | Jendela konteks | Keluaran maks. |
| --------------------- | -------------- | --------- | --------------- | -------------- |
| `meta/muse-spark-1.1` | Muse Spark 1.1 | ya        | 1,048,576       | 131,072        |

Kemampuan:

- Masukan teks + gambar
- Pemanggilan alat dan streaming
- Tingkat upaya penalaran: `minimal`, `low`, `medium`, `high`, `xhigh` (default: `high`)
- Pemutaran ulang penalaran terenkripsi tanpa status (`store: false`, `include: ["reasoning.encrypted_content"]`)

<Warning>
`muse-spark-1.1` tidak menerima `reasoning.effort: "none"`. OpenClaw memetakan
`--thinking off` ke `minimal` untuk penyedia ini.
</Warning>

## Konfigurasi manual

```json5
{
  env: { MODEL_API_KEY: "<key>" },
  agents: {
    defaults: {
      model: { primary: "meta/muse-spark-1.1" },
      models: {
        "meta/muse-spark-1.1": { alias: "Muse Spark 1.1" },
      },
    },
  },
}
```

<Note>
Jika Gateway berjalan sebagai daemon (launchd, systemd, Docker), pastikan
`MODEL_API_KEY` tersedia untuk proses tersebut — misalnya di
`~/.openclaw/.env` atau melalui `env.shellEnv`. Kunci yang hanya diekspor dalam
shell interaktif tidak akan membantu layanan terkelola kecuali variabel lingkungannya diimpor
secara terpisah.
</Note>

## Uji cepat

```bash
export MODEL_API_KEY=<key>
pnpm test:live -- extensions/meta/meta.live.test.ts
```

Pengujian langsung menggunakan `muse-spark-1.1` terhadap `POST /v1/responses`.

## Terkait

<CardGroup cols={2}>
  <Card title="Penyedia model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Mode berpikir" href="/id/tools/thinking" icon="brain">
    Tingkat upaya penalaran untuk muse-spark-1.1.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/config-agents#agent-defaults" icon="gear">
    Default agen dan konfigurasi model.
  </Card>
</CardGroup>
