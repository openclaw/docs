---
read_when:
    - Anda ingin menggunakan Tencent hy3 dengan OpenClaw
    - Anda perlu menyiapkan kunci API TokenHub atau TokenPlan
summary: Penyiapan Tencent Cloud TokenHub dan TokenPlan untuk hy3
title: Tencent Cloud (TokenHub / TokenPlan)
x-i18n:
    generated_at: "2026-07-12T14:37:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c2ffb8ab824539c7765d38e4332c30a6dd371fdc19be825f2ad9af0197fa256
    source_path: providers/tencent.md
    workflow: 16
---

Instal Plugin penyedia resmi Tencent Cloud untuk mengakses Tencent Hy3 melalui dua endpoint — TokenHub (`tencent-tokenhub`) dan TokenPlan (`tencent-tokenplan`) — menggunakan API yang kompatibel dengan OpenAI.

| Properti                       | Nilai                                                  |
| ------------------------------ | ------------------------------------------------------ |
| ID penyedia                    | `tencent-tokenhub`, `tencent-tokenplan`                |
| Paket                          | `@openclaw/tencent-provider`                           |
| Variabel lingkungan autentikasi TokenHub  | `TOKENHUB_API_KEY`                          |
| Variabel lingkungan autentikasi TokenPlan | `TOKENPLAN_API_KEY`                         |
| Flag orientasi TokenHub        | `--auth-choice tokenhub-api-key`                       |
| Flag orientasi TokenPlan       | `--auth-choice tokenplan-api-key`                      |
| Flag CLI langsung TokenHub     | `--tokenhub-api-key <key>`                             |
| Flag CLI langsung TokenPlan    | `--tokenplan-api-key <key>`                            |
| API                            | Kompatibel dengan OpenAI (`openai-completions`)        |
| URL dasar TokenHub             | `https://tokenhub.tencentmaas.com/v1`                  |
| URL dasar global TokenHub      | `https://tokenhub-intl.tencentmaas.com/v1` (penggantian) |
| URL dasar TokenPlan            | `https://api.lkeap.cloud.tencent.com/plan/v3`          |
| Model default                  | `tencent-tokenhub/hy3`                                 |

## Mulai cepat

<Steps>
  <Step title="Buat kunci API Tencent">
    Buat kunci API untuk Tencent Cloud TokenHub dan TokenPlan. Jika Anda memilih cakupan akses terbatas untuk kunci tersebut, sertakan **hy3** (dan **hy3 preview** jika Anda berencana menggunakannya di TokenHub) dalam model yang diizinkan.
  </Step>
  <Step title="Jalankan orientasi">
    <CodeGroup>

```bash TokenHub onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash TokenHub direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash TokenPlan onboarding
openclaw onboard --auth-choice tokenplan-api-key
```

```bash TokenPlan direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY"
```

```bash Env only
export TOKENHUB_API_KEY=...
export TOKENPLAN_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Verifikasi model">
    ```bash
    openclaw models list --provider tencent-tokenhub
    openclaw models list --provider tencent-tokenplan
    ```
  </Step>
</Steps>

## Penyiapan noninteraktif

```bash
# TokenHub
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk

# TokenPlan
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY" \
  --skip-health \
  --accept-risk
```

<Note>
`--accept-risk` wajib digunakan bersama `--non-interactive`.
</Note>

## Katalog bawaan

| Referensi model                | Nama                   | Masukan | Konteks | Keluaran maks. | Catatan                    |
| ------------------------------ | ---------------------- | ------- | ------- | -------------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | hy3 preview (TokenHub) | teks    | 256,000 | 64,000         | mendukung penalaran         |
| `tencent-tokenhub/hy3`         | hy3 (TokenHub)         | teks    | 256,000 | 64,000         | mendukung penalaran         |
| `tencent-tokenplan/hy3`        | hy3 (TokenPlan)        | teks    | 256,000 | 64,000         | mendukung penalaran         |

hy3 adalah model bahasa MoE besar Tencent Hunyuan untuk penalaran, mengikuti instruksi berkonteks panjang, kode, dan alur kerja agen. Contoh Tencent yang kompatibel dengan OpenAI menggunakan `hy3` sebagai ID model dan mendukung pemanggilan alat chat completions standar serta `reasoning_effort`.

<Tip>
  ID modelnya adalah `hy3`. Jangan tertukar dengan model `HY-3D-*` milik Tencent, yang merupakan API pembuatan 3D dan bukan model percakapan OpenClaw yang dikonfigurasi oleh penyedia ini.
</Tip>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Penggantian endpoint">
    Katalog bawaan OpenClaw menggunakan endpoint Tencent Cloud `https://tokenhub.tencentmaas.com/v1`. Ganti hanya jika akun atau wilayah TokenHub Anda memerlukan endpoint lain:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://your-endpoint/v1"
    ```

  </Accordion>

  <Accordion title="Ketersediaan lingkungan untuk daemon">
    Jika Gateway berjalan sebagai layanan terkelola (launchd, systemd, Docker), `TOKENHUB_API_KEY` dan `TOKENPLAN_API_KEY` harus dapat diakses oleh proses tersebut. Atur keduanya di `~/.openclaw/.env` atau melalui `env.shellEnv` agar lingkungan eksekusi launchd, systemd, atau Docker dapat membacanya.

    <Warning>
      Kunci yang hanya diekspor dalam shell interaktif tidak dapat diakses oleh proses Gateway terkelola. Gunakan berkas lingkungan atau jalur konfigurasi agar tersedia secara persisten.
    </Warning>

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Penyedia model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Skema konfigurasi lengkap, termasuk pengaturan penyedia.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Halaman produk TokenHub milik Tencent Cloud.
  </Card>
  <Card title="Kartu model pratinjau Hy3" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Detail dan tolok ukur pratinjau Tencent Hunyuan Hy3.
  </Card>
</CardGroup>
