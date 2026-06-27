---
read_when:
    - Anda ingin menggunakan pratinjau Tencent Hy3 dengan OpenClaw
    - Anda perlu menyiapkan kunci API TokenHub
summary: Pengaturan Tencent Cloud TokenHub untuk pratinjau Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-06-27T18:07:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62bcdd795cc0334f409405fa7c369ed9966854616a89dbc7153f91ee349895ad
    source_path: providers/tencent.md
    workflow: 16
---

Instal Plugin penyedia resmi Tencent Cloud untuk mengakses pratinjau Tencent Hy3 melalui endpoint TokenHub (`tencent-tokenhub`) menggunakan API yang kompatibel dengan OpenAI.

| Properti         | Nilai                                                 |
| ---------------- | ----------------------------------------------------- |
| ID penyedia      | `tencent-tokenhub`                                    |
| Paket            | `@openclaw/tencent-provider`                          |
| Variabel env autentikasi | `TOKENHUB_API_KEY`                                    |
| Flag onboarding  | `--auth-choice tokenhub-api-key`                      |
| Flag CLI langsung | `--tokenhub-api-key <key>`                            |
| API              | Kompatibel dengan OpenAI (`openai-completions`)       |
| URL dasar default | `https://tokenhub.tencentmaas.com/v1`                 |
| URL dasar global | `https://tokenhub-intl.tencentmaas.com/v1` (timpa) |
| Model default    | `tencent-tokenhub/hy3-preview`                        |

## Mulai cepat

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/tencent-provider
    ```
  </Step>
  <Step title="Create a TokenHub API key">
    Buat kunci API di Tencent Cloud TokenHub. Jika Anda memilih cakupan akses terbatas untuk kunci tersebut, sertakan **pratinjau Hy3** dalam model yang diizinkan.
  </Step>
  <Step title="Run onboarding">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Env only
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Verify the model">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## Penyiapan non-interaktif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Katalog bawaan

| Ref model                      | Nama                   | Input | Konteks | Output maks | Catatan                      |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Pratinjau Hy3 (TokenHub) | teks  | 256,000 | 64,000     | Default; mendukung penalaran |

Pratinjau Hy3 adalah model bahasa MoE besar Tencent Hunyuan untuk penalaran, mengikuti instruksi konteks panjang, kode, dan alur kerja agen. Contoh Tencent yang kompatibel dengan OpenAI menggunakan `hy3-preview` sebagai ID model dan mendukung pemanggilan alat chat-completions standar serta `reasoning_effort`.

<Tip>
  ID modelnya adalah `hy3-preview`. Jangan keliru dengan model `HY-3D-*` milik Tencent, yang merupakan API pembuatan 3D dan bukan model chat OpenClaw yang dikonfigurasi oleh penyedia ini.
</Tip>

## Harga bertingkat

Katalog penyedia menyertakan metadata biaya bertingkat yang diskalakan berdasarkan panjang jendela input, sehingga estimasi biaya terisi tanpa penimpaan manual.

| Rentang token input | Tarif input | Tarif output | Baca cache |
| ------------------ | ---------- | ----------- | ---------- |
| 0 - 16,000         | 0.176      | 0.587       | 0.059      |
| 16,000 - 32,000    | 0.235      | 0.939       | 0.088      |
| 32,000+            | 0.293      | 1.173       | 0.117      |

Tarif dihitung per satu juta token dalam USD sebagaimana diiklankan oleh Tencent. Timpa harga di bawah `models.providers.tencent-tokenhub` hanya saat Anda membutuhkan permukaan yang berbeda.

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Endpoint override">
    OpenClaw secara default menggunakan endpoint Tencent Cloud `https://tokenhub.tencentmaas.com/v1`. Tencent juga mendokumentasikan endpoint TokenHub internasional:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    Timpa endpoint hanya jika akun atau wilayah TokenHub Anda membutuhkannya.

  </Accordion>

  <Accordion title="Environment availability for the daemon">
    Jika Gateway berjalan sebagai layanan terkelola (launchd, systemd, Docker), `TOKENHUB_API_KEY` harus terlihat oleh proses tersebut. Atur di `~/.openclaw/.env` atau melalui `env.shellEnv` agar lingkungan launchd, systemd, atau Docker exec dapat membacanya.

    <Warning>
      Kunci yang diekspor hanya di shell interaktif tidak terlihat oleh proses gateway terkelola. Gunakan berkas env atau seam konfigurasi untuk ketersediaan persisten.
    </Warning>

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Model providers" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Configuration reference" href="/id/gateway/configuration" icon="gear">
    Skema konfigurasi lengkap termasuk pengaturan penyedia.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Halaman produk TokenHub Tencent Cloud.
  </Card>
  <Card title="Hy3 preview model card" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Detail dan tolok ukur pratinjau Tencent Hunyuan Hy3.
  </Card>
</CardGroup>
