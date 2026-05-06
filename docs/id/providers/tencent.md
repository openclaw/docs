---
read_when:
    - Anda ingin menggunakan pratinjau Tencent Hy3 dengan OpenClaw
    - Anda perlu menyiapkan kunci API TokenHub
summary: Penyiapan Tencent Cloud TokenHub untuk pratinjau Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-05-06T09:26:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: a194e10b0e77e2567e6835f08d1cc0fa2a32fa8d37b1851fb83024b172a03fe3
    source_path: providers/tencent.md
    workflow: 16
---

Tencent Cloud disediakan sebagai Plugin penyedia bawaan di OpenClaw. Plugin ini memberi akses ke pratinjau Tencent Hy3 melalui endpoint TokenHub (`tencent-tokenhub`) menggunakan API yang kompatibel dengan OpenAI.

| Properti         | Nilai                                                 |
| ---------------- | ----------------------------------------------------- |
| id penyedia      | `tencent-tokenhub`                                    |
| Plugin           | bawaan, `enabledByDefault: true`                      |
| Variabel env autentikasi | `TOKENHUB_API_KEY`                            |
| Flag onboarding  | `--auth-choice tokenhub-api-key`                      |
| Flag CLI langsung | `--tokenhub-api-key <key>`                           |
| API              | kompatibel dengan OpenAI (`openai-completions`)       |
| URL dasar default | `https://tokenhub.tencentmaas.com/v1`                |
| URL dasar global | `https://tokenhub-intl.tencentmaas.com/v1` (penggantian) |
| Model default    | `tencent-tokenhub/hy3-preview`                        |

## Mulai cepat

<Steps>
  <Step title="Buat kunci API TokenHub">
    Buat kunci API di Tencent Cloud TokenHub. Jika Anda memilih cakupan akses terbatas untuk kunci tersebut, sertakan **pratinjau Hy3** dalam model yang diizinkan.
  </Step>
  <Step title="Jalankan onboarding">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Flag langsung
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Hanya env
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Verifikasi model">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## Penyiapan noninteraktif

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
| ------------------------------ | ---------------------- | ----- | ------- | ----------- | ---------------------------- |
| `tencent-tokenhub/hy3-preview` | Pratinjau Hy3 (TokenHub) | teks | 256,000 | 64,000      | Default; mendukung penalaran |

Pratinjau Hy3 adalah model bahasa MoE besar Tencent Hunyuan untuk penalaran, mengikuti instruksi konteks panjang, kode, dan alur kerja agen. Contoh Tencent yang kompatibel dengan OpenAI menggunakan `hy3-preview` sebagai id model dan mendukung pemanggilan alat chat-completions standar serta `reasoning_effort`.

<Tip>
  id model adalah `hy3-preview`. Jangan samakan dengan model `HY-3D-*` milik Tencent, yang merupakan API generasi 3D dan bukan model obrolan OpenClaw yang dikonfigurasi oleh penyedia ini.
</Tip>

## Harga bertingkat

Katalog bawaan menyertakan metadata biaya bertingkat yang diskalakan berdasarkan panjang jendela input, sehingga estimasi biaya terisi tanpa penggantian manual.

| Rentang token input | Tarif input | Tarif output | Baca cache |
| ------------------- | ----------- | ------------ | ---------- |
| 0 - 16,000          | 0.176       | 0.587        | 0.059      |
| 16,000 - 32,000     | 0.235       | 0.939        | 0.088      |
| 32,000+             | 0.293       | 1.173        | 0.117      |

Tarif berlaku per satu juta token dalam USD sebagaimana diiklankan oleh Tencent. Ganti harga di bawah `models.providers.tencent-tokenhub` hanya ketika Anda memerlukan permukaan yang berbeda.

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Penggantian endpoint">
    OpenClaw menggunakan endpoint `https://tokenhub.tencentmaas.com/v1` Tencent Cloud secara default. Tencent juga mendokumentasikan endpoint TokenHub internasional:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    Ganti endpoint hanya ketika akun atau wilayah TokenHub Anda memerlukannya.

  </Accordion>

  <Accordion title="Ketersediaan lingkungan untuk daemon">
    Jika Gateway berjalan sebagai layanan terkelola (launchd, systemd, Docker), `TOKENHUB_API_KEY` harus terlihat oleh proses tersebut. Atur di `~/.openclaw/.env` atau melalui `env.shellEnv` agar lingkungan launchd, systemd, atau Docker exec dapat membacanya.

    <Warning>
      Kunci yang hanya diatur di `~/.profile` tidak terlihat oleh proses gateway terkelola. Gunakan file env atau seam konfigurasi untuk ketersediaan persisten.
    </Warning>

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Penyedia model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration" icon="gear">
    Skema konfigurasi lengkap termasuk pengaturan penyedia.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Halaman produk TokenHub Tencent Cloud.
  </Card>
  <Card title="Kartu model pratinjau Hy3" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Detail dan benchmark pratinjau Tencent Hunyuan Hy3.
  </Card>
</CardGroup>
