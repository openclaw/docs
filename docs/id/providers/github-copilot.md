---
read_when:
    - Anda ingin menggunakan GitHub Copilot sebagai penyedia model
    - Anda memerlukan alur `openclaw models auth login-github-copilot`
    - Anda sedang memilih antara penyedia Copilot bawaan, harness Copilot SDK, dan Copilot Proxy
summary: Masuk ke GitHub Copilot dari OpenClaw menggunakan alur perangkat atau impor token non-interaktif
title: GitHub Copilot
x-i18n:
    generated_at: "2026-06-27T18:04:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0cd7103ec880592b1f4506ed844abe788f53040f3751e7034daf9aafedc2f94
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot adalah asisten pengodean AI dari GitHub. Ini menyediakan akses ke model Copilot
untuk akun dan paket GitHub Anda. OpenClaw dapat menggunakan Copilot sebagai penyedia model
atau runtime agen dengan tiga cara berbeda.

## Tiga cara menggunakan Copilot di OpenClaw

<Tabs>
  <Tab title="Penyedia bawaan (github-copilot)">
    Gunakan alur login perangkat native untuk memperoleh token GitHub, lalu menukarnya dengan
    token API Copilot saat OpenClaw berjalan. Ini adalah jalur **default** dan paling sederhana
    karena tidak memerlukan VS Code.

    <Steps>
      <Step title="Jalankan perintah login">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Anda akan diminta mengunjungi URL dan memasukkan kode sekali pakai. Biarkan
        terminal tetap terbuka sampai selesai.
      </Step>
      <Step title="Tetapkan model default">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        Atau dalam konfigurasi:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Plugin harness Copilot SDK (copilot)">
    Instal plugin eksternal `@openclaw/copilot` saat Anda ingin CLI dan SDK
    Copilot milik GitHub menangani loop agen tingkat rendah untuk model
    `github-copilot/*` tertentu.

    ```bash
    openclaw plugins install clawhub:@openclaw/copilot
    ```

    Lalu aktifkan runtime untuk sebuah model atau penyedia:

    ```json5
    {
      agents: {
        defaults: {
          model: "github-copilot/gpt-5.5",
          models: {
            "github-copilot/gpt-5.5": {
              agentRuntime: { id: "copilot" },
            },
          },
        },
      },
    }
    ```

    Pilih ini saat Anda menginginkan sesi Copilot CLI native, status thread
    yang dikelola SDK, dan Compaction milik Copilot untuk giliran agen tersebut. Lihat
    [harness Copilot SDK](/id/plugins/copilot) untuk kontrak runtime lengkap.

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Gunakan ekstensi VS Code **Copilot Proxy** sebagai bridge lokal. OpenClaw berbicara dengan
    endpoint `/v1` proxy dan menggunakan daftar model yang Anda konfigurasikan di sana.

    <Note>
    Pilih ini saat Anda sudah menjalankan Copilot Proxy di VS Code atau perlu merutekan
    melaluinya. Anda harus mengaktifkan plugin dan menjaga ekstensi VS Code tetap berjalan.
    </Note>

  </Tab>
</Tabs>

## Flag opsional

| Flag            | Deskripsi                                           |
| --------------- | --------------------------------------------------- |
| `--yes`         | Lewati prompt konfirmasi                            |
| `--set-default` | Juga terapkan model default yang direkomendasikan penyedia |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## Onboarding non-interaktif

Jika Anda sudah memiliki token akses OAuth GitHub untuk Copilot, impor saat
penyiapan headless dengan `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Anda juga dapat menghilangkan `--auth-choice`; meneruskan `--github-copilot-token` akan menyimpulkan
pilihan auth penyedia GitHub Copilot. Jika flag dihilangkan, onboarding akan
fallback ke `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, lalu `GITHUB_TOKEN`. Gunakan
`--secret-input-mode ref` dengan `COPILOT_GITHUB_TOKEN` yang disetel untuk menyimpan
`tokenRef` berbasis env, bukan plaintext di `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="TTY interaktif diperlukan">
    Alur login perangkat memerlukan TTY interaktif. Jalankan langsung di
    terminal, bukan dalam skrip non-interaktif atau pipeline CI.
  </Accordion>

  <Accordion title="Ketersediaan model bergantung pada paket Anda">
    Ketersediaan model Copilot bergantung pada paket GitHub Anda. Jika sebuah model
    ditolak, coba ID lain (misalnya `github-copilot/gpt-5.5`). Lihat
    [model yang didukung per paket Copilot](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    dari GitHub untuk daftar model saat ini.
  </Accordion>

  <Accordion title="Refresh katalog langsung dari API Copilot">
    Setelah jalur auth login perangkat (atau env-var) berhasil menyelesaikan token GitHub,
    OpenClaw menyegarkan katalog model sesuai permintaan dari `${baseUrl}/models`
    (endpoint yang sama yang digunakan VS Code Copilot) sehingga runtime melacak
    hak akun per akun dan jendela konteks yang akurat tanpa churn manifes.
    Model Copilot yang baru diterbitkan menjadi terlihat tanpa upgrade OpenClaw,
    dan jendela konteks mencerminkan batas nyata per model
    (mis. 400k untuk seri gpt-5.x, 1M untuk varian internal
    `claude-opus-*-1m`).

    Katalog statis bawaan tetap menjadi fallback yang terlihat saat discovery
    dinonaktifkan, pengguna tidak memiliki profil auth GitHub, penukaran token
    gagal, atau panggilan HTTPS `/models` error. Untuk opt out dan sepenuhnya mengandalkan
    katalog manifes statis (skenario offline / air-gapped):

    ```json5
    {
      plugins: {
        entries: {
          "github-copilot": {
            config: { discovery: { enabled: false } },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Pemilihan transport">
    ID model Claude menggunakan transport Anthropic Messages secara otomatis. GPT,
    o-series, dan model Gemini tetap menggunakan transport OpenAI Responses. OpenClaw
    memilih transport yang benar berdasarkan ref model.
  </Accordion>

  <Accordion title="Kompatibilitas permintaan">
    OpenClaw mengirim header permintaan bergaya Copilot IDE pada transport Copilot,
    termasuk Compaction bawaan, hasil alat, dan giliran tindak lanjut gambar. Ini
    tidak mengaktifkan kelanjutan Responses tingkat penyedia untuk Copilot kecuali
    perilaku tersebut telah diverifikasi terhadap API Copilot.
  </Accordion>

  <Accordion title="Urutan resolusi variabel lingkungan">
    OpenClaw menyelesaikan auth Copilot dari variabel lingkungan dalam urutan
    prioritas berikut:

    | Prioritas | Variabel              | Catatan                          |
    | --------- | --------------------- | -------------------------------- |
    | 1         | `COPILOT_GITHUB_TOKEN` | Prioritas tertinggi, khusus Copilot |
    | 2         | `GH_TOKEN`            | Token GitHub CLI (fallback)      |
    | 3         | `GITHUB_TOKEN`        | Token GitHub standar (terendah)  |

    Saat beberapa variabel disetel, OpenClaw menggunakan yang berprioritas tertinggi.
    Alur login perangkat (`openclaw models auth login-github-copilot`) menyimpan
    tokennya di penyimpanan profil auth dan lebih diprioritaskan daripada semua variabel
    lingkungan.

  </Accordion>

  <Accordion title="Penyimpanan token">
    Login menyimpan token GitHub di penyimpanan profil auth dan menukarnya
    dengan token API Copilot saat OpenClaw berjalan. Anda tidak perlu mengelola
    token secara manual.
  </Accordion>
</AccordionGroup>

<Warning>
Perintah login perangkat memerlukan TTY interaktif. Gunakan onboarding non-interaktif
saat Anda memerlukan penyiapan headless.
</Warning>

## Embedding pencarian memori

GitHub Copilot juga dapat berfungsi sebagai penyedia embedding untuk
[pencarian memori](/id/concepts/memory-search). Jika Anda memiliki langganan Copilot dan
sudah login, OpenClaw dapat menggunakannya untuk embedding tanpa kunci API terpisah.

### Konfigurasi

Setel `memorySearch.provider` secara eksplisit untuk menggunakan embedding GitHub Copilot. Jika
token GitHub tersedia, OpenClaw menemukan model embedding yang tersedia dari
API Copilot dan memilih yang terbaik secara otomatis.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Optional: override the auto-discovered model
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Cara kerjanya

1. OpenClaw menyelesaikan token GitHub Anda (dari env vars atau profil auth).
2. Menukarnya dengan token API Copilot berumur pendek.
3. Mengkueri endpoint `/models` Copilot untuk menemukan model embedding yang tersedia.
4. Memilih model terbaik (memprioritaskan `text-embedding-3-small`).
5. Mengirim permintaan embedding ke endpoint `/embeddings` Copilot.

Ketersediaan model bergantung pada paket GitHub Anda. Jika tidak ada model embedding yang
tersedia, OpenClaw melewati Copilot dan mencoba penyedia berikutnya.

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="OAuth dan auth" href="/id/gateway/authentication" icon="key">
    Detail auth dan aturan penggunaan ulang kredensial.
  </Card>
</CardGroup>
