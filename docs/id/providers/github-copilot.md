---
read_when:
    - Anda ingin menggunakan GitHub Copilot sebagai penyedia model
    - Anda memerlukan alur `openclaw models auth login-github-copilot`
summary: Masuk ke GitHub Copilot dari OpenClaw menggunakan alur perangkat atau impor token non-interaktif
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-30T10:06:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ebcee41d4a3fffff8f20072e99e6dbb57baa2d9ec7eddad1d426ee37805597c
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot adalah asisten coding AI dari GitHub. Ini menyediakan akses ke model
Copilot untuk akun dan paket GitHub Anda. OpenClaw dapat menggunakan Copilot sebagai
penyedia model dalam dua cara berbeda.

## Dua cara menggunakan Copilot di OpenClaw

<Tabs>
  <Tab title="Built-in provider (github-copilot)">
    Gunakan alur login perangkat native untuk memperoleh token GitHub, lalu tukarkan
    dengan token API Copilot saat OpenClaw berjalan. Ini adalah jalur **default** dan
    paling sederhana karena tidak memerlukan VS Code.

    <Steps>
      <Step title="Run the login command">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Anda akan diminta mengunjungi URL dan memasukkan kode sekali pakai. Biarkan
        terminal tetap terbuka hingga selesai.
      </Step>
      <Step title="Set a default model">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        Atau di konfigurasi:

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

  <Tab title="Copilot Proxy plugin (copilot-proxy)">
    Gunakan ekstensi VS Code **Copilot Proxy** sebagai jembatan lokal. OpenClaw
    berkomunikasi dengan endpoint `/v1` milik proxy dan menggunakan daftar model
    yang Anda konfigurasikan di sana.

    <Note>
    Pilih ini saat Anda sudah menjalankan Copilot Proxy di VS Code atau perlu
    merutekan melalui ekstensi tersebut. Anda harus mengaktifkan Plugin dan menjaga
    ekstensi VS Code tetap berjalan.
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

Jika Anda sudah memiliki token akses OAuth GitHub untuk Copilot, impor token itu
selama penyiapan tanpa antarmuka dengan `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Anda juga dapat menghilangkan `--auth-choice`; meneruskan `--github-copilot-token`
akan menyimpulkan pilihan auth penyedia GitHub Copilot. Jika flag tersebut
dihilangkan, onboarding akan fallback ke `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, lalu
`GITHUB_TOKEN`. Gunakan `--secret-input-mode ref` dengan `COPILOT_GITHUB_TOKEN`
yang disetel untuk menyimpan `tokenRef` berbasis env, bukan teks polos di
`auth-profiles.json`.

<AccordionGroup>
  <Accordion title="Interactive TTY required">
    Alur login perangkat memerlukan TTY interaktif. Jalankan langsung di
    terminal, bukan di skrip non-interaktif atau pipeline CI.
  </Accordion>

  <Accordion title="Model availability depends on your plan">
    Ketersediaan model Copilot bergantung pada paket GitHub Anda. Jika suatu model
    ditolak, coba ID lain (misalnya `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Transport selection">
    ID model Claude menggunakan transport Anthropic Messages secara otomatis. Model
    GPT, o-series, dan Gemini tetap menggunakan transport OpenAI Responses. OpenClaw
    memilih transport yang benar berdasarkan referensi model.
  </Accordion>

  <Accordion title="Request compatibility">
    OpenClaw mengirim header permintaan bergaya IDE Copilot pada transport Copilot,
    termasuk giliran bawaan untuk Compaction, hasil alat, dan tindak lanjut gambar.
    OpenClaw tidak mengaktifkan kelanjutan Responses tingkat penyedia untuk Copilot
    kecuali perilaku tersebut telah diverifikasi terhadap API Copilot.
  </Accordion>

  <Accordion title="Environment variable resolution order">
    OpenClaw menyelesaikan auth Copilot dari variabel lingkungan dalam urutan
    prioritas berikut:

    | Prioritas | Variabel              | Catatan                          |
    | --------- | --------------------- | -------------------------------- |
    | 1         | `COPILOT_GITHUB_TOKEN` | Prioritas tertinggi, khusus Copilot |
    | 2         | `GH_TOKEN`            | Token GitHub CLI (fallback)      |
    | 3         | `GITHUB_TOKEN`        | Token GitHub standar (terendah)  |

    Saat beberapa variabel disetel, OpenClaw menggunakan variabel dengan prioritas
    tertinggi. Alur login perangkat (`openclaw models auth login-github-copilot`)
    menyimpan tokennya di penyimpanan profil auth dan didahulukan atas semua
    variabel lingkungan.

  </Accordion>

  <Accordion title="Token storage">
    Login menyimpan token GitHub di penyimpanan profil auth dan menukarkannya
    dengan token API Copilot saat OpenClaw berjalan. Anda tidak perlu mengelola
    token secara manual.
  </Accordion>
</AccordionGroup>

<Warning>
Perintah login perangkat memerlukan TTY interaktif. Gunakan onboarding
non-interaktif saat Anda memerlukan penyiapan tanpa antarmuka.
</Warning>

## Embedding pencarian memori

GitHub Copilot juga dapat berfungsi sebagai penyedia embedding untuk
[pencarian memori](/id/concepts/memory-search). Jika Anda memiliki langganan Copilot
dan sudah login, OpenClaw dapat menggunakannya untuk embedding tanpa kunci API
terpisah.

### Deteksi otomatis

Saat `memorySearch.provider` adalah `"auto"` (default), GitHub Copilot dicoba pada
prioritas 15 -- setelah embedding lokal tetapi sebelum OpenAI dan penyedia berbayar
lainnya. Jika token GitHub tersedia, OpenClaw menemukan model embedding yang
tersedia dari API Copilot dan memilih yang terbaik secara otomatis.

### Konfigurasi eksplisit

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

1. OpenClaw menyelesaikan token GitHub Anda (dari variabel env atau profil auth).
2. Menukarkannya dengan token API Copilot berumur pendek.
3. Mengueri endpoint `/models` Copilot untuk menemukan model embedding yang tersedia.
4. Memilih model terbaik (lebih menyukai `text-embedding-3-small`).
5. Mengirim permintaan embedding ke endpoint `/embeddings` Copilot.

Ketersediaan model bergantung pada paket GitHub Anda. Jika tidak ada model
embedding yang tersedia, OpenClaw melewati Copilot dan mencoba penyedia berikutnya.

## Terkait

<CardGroup cols={2}>
  <Card title="Model selection" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="OAuth and auth" href="/id/gateway/authentication" icon="key">
    Detail auth dan aturan penggunaan ulang kredensial.
  </Card>
</CardGroup>
