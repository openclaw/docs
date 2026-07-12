---
read_when:
    - Anda ingin menggunakan GitHub Copilot sebagai penyedia model
    - Anda memerlukan alur `openclaw models auth login-github-copilot`
    - Anda sedang memilih antara penyedia Copilot bawaan, harness Copilot SDK, dan Copilot Proxy
summary: Masuk ke GitHub Copilot dari OpenClaw menggunakan alur perangkat atau impor token noninteraktif
title: GitHub Copilot
x-i18n:
    generated_at: "2026-07-12T14:35:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e731d46dd387bbecb0219c4ec3e319fb8d07fd4017da8035561f110501587ad4
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot adalah asisten pengodean AI milik GitHub. Layanan ini menyediakan akses ke model Copilot
untuk akun dan paket GitHub Anda. OpenClaw dapat menggunakan Copilot sebagai penyedia
model atau runtime agen melalui tiga cara berbeda.

## Tiga cara menggunakan Copilot di OpenClaw

<Tabs>
  <Tab title="Penyedia bawaan (github-copilot)">
    Gunakan alur masuk perangkat native untuk memperoleh token GitHub, lalu tukarkan token tersebut dengan
    token API Copilot saat OpenClaw berjalan. Ini adalah jalur **default** dan paling sederhana
    karena tidak memerlukan VS Code.

    <Steps>
      <Step title="Jalankan perintah masuk">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Anda akan diminta mengunjungi URL dan memasukkan kode sekali pakai. Biarkan
        terminal tetap terbuka hingga proses selesai.
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

  <Tab title="Plugin harness SDK Copilot (copilot)">
    Instal plugin eksternal `@openclaw/copilot` jika Anda ingin CLI dan SDK
    Copilot milik GitHub menangani loop agen tingkat rendah untuk model
    `github-copilot/*` yang dipilih.

    ```bash
    openclaw plugins install @openclaw/copilot
    ```

    Kemudian aktifkan runtime untuk model atau penyedia:

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

    Pilih opsi ini jika Anda menginginkan sesi CLI Copilot native, status utas
    yang dikelola SDK, dan compaction yang dikelola Copilot untuk giliran agen tersebut. Tanpa
    pengaktifan `agentRuntime` secara eksplisit, model `github-copilot/*` tetap menggunakan
    penyedia bawaan. Lihat [harness SDK Copilot](/id/plugins/copilot) untuk kontrak
    runtime lengkap.

  </Tab>

  <Tab title="Plugin Proxy Copilot (copilot-proxy)">
    Gunakan ekstensi VS Code **Copilot Proxy** sebagai jembatan lokal. OpenClaw berkomunikasi dengan
    endpoint `/v1` proxy (default `http://localhost:3000/v1`) dan menggunakan
    daftar model yang Anda konfigurasikan.

    Plugin `copilot-proxy` disertakan bersama OpenClaw dan diaktifkan secara default.
    Konfigurasikan URL dasar dan ID model dengan:

    ```bash
    openclaw models auth login --provider copilot-proxy --set-default
    ```

    <Note>
    Pilih opsi ini jika Anda sudah menjalankan Copilot Proxy di VS Code atau perlu merutekan
    melalui layanan tersebut. Ekstensi VS Code harus tetap berjalan.
    </Note>

  </Tab>
</Tabs>

## GitHub Enterprise (residensi data)

Jika organisasi Anda menggunakan tenant GitHub Enterprise dengan residensi data (host
`*.ghe.com` seperti `your-org.ghe.com`), Copilot berada pada endpoint lokal
tenant, bukan `github.com` publik. OpenClaw menyediakan ini sebagai
pilihan autentikasi kelas utama sehingga Anda tidak perlu mengedit URL secara manual.

<Steps>
  <Step title="Pilih opsi autentikasi Enterprise">
    Dalam proses orientasi atau `openclaw models auth`, pilih
    **GitHub Copilot (Enterprise / data residency)**. Anda akan diminta memasukkan
    domain Enterprise Anda (misalnya `your-org.ghe.com`), lalu proses masuk
    perangkat dijalankan pada tenant tersebut.

    Masukkan hanya akar tenant (`your-org.ghe.com`). Host layanan turunan seperti
    `api.your-org.ghe.com` atau `copilot-api.your-org.ghe.com` tidak diterima;
    OpenClaw memperoleh endpoint tersebut secara otomatis dari akar tenant.

    ```bash
    openclaw models auth login --provider github-copilot --method device-enterprise
    ```

  </Step>
  <Step title="Domain dipertahankan dalam konfigurasi">
    Host yang dipilih disimpan di bawah parameter penyedia sehingga penyegaran token
    dan penyelesaian berikutnya secara otomatis menargetkan tenant:

    ```json5
    {
      models: {
        providers: {
          "github-copilot": { params: { githubDomain: "your-org.ghe.com" } },
        },
      },
    }
    ```

  </Step>
</Steps>

Alur perangkat, pertukaran token, dan penyelesaian masing-masing menggunakan
`https://your-org.ghe.com/login/device/code`,
`https://api.your-org.ghe.com/copilot_internal/v2/token`, dan
`https://copilot-api.your-org.ghe.com`. Token residensi data membawa
penanda tenant dan tidak memiliki petunjuk proxy, sehingga URL dasar penyelesaian beralih ke
host Copilot tenant, bukan endpoint publik.

<Note>
Mengganti domain selalu menjalankan ulang proses masuk perangkat. Jika Anda sudah memiliki
token Copilot tersimpan dan memilih domain berbeda (`github.com` publik ↔ tenant
`*.ghe.com`, atau dari satu tenant ke tenant lain), OpenClaw tidak akan menggunakan kembali token yang ada —
OpenClaw memaksa proses masuk baru agar cakupan token sesuai dengan domain yang ditulis ke
konfigurasi. Menjalankan ulang proses masuk untuk domain yang *sama* tetap menawarkan penggunaan kembali token
saat ini. Beralih kembali ke `github.com` publik akan menghapus `githubDomain`
yang dipertahankan sehingga konfigurasi kembali ke default.
</Note>

<Note>
Variabel lingkungan `COPILOT_GITHUB_DOMAIN` menimpa domain yang ditentukan
untuk setiap jalur Copilot yang menggunakannya — proses masuk perangkat Enterprise
(`--method device-enterprise`), pintasan mandiri
`openclaw models auth login-github-copilot`, penyegaran token, penyematan,
dan penyelesaian. Tetapkan ke host `*.ghe.com` Anda untuk penyiapan yang sepenuhnya
tanpa antarmuka atau untuk CI. Biarkan tidak ditetapkan (dan parameter konfigurasi tidak ada) untuk menggunakan
`github.com` publik. Proses masuk mempertahankan domain tempat token diterbitkan (dan menghapusnya saat masuk
melalui `github.com` publik), sehingga perutean tetap benar bahkan setelah
variabel lingkungan tidak lagi ditetapkan.
</Note>

## Flag opsional

| Perintah                                                               | Flag            | Deskripsi                                                 |
| ---------------------------------------------------------------------- | --------------- | --------------------------------------------------------- |
| `openclaw models auth login-github-copilot`                            | `--yes`         | Timpa profil autentikasi yang ada tanpa meminta konfirmasi |
| `openclaw models auth login --provider github-copilot --method device` | `--set-default` | Terapkan juga model default yang direkomendasikan penyedia |

```bash
# Lewati konfirmasi masuk ulang
openclaw models auth login-github-copilot --yes

# Masuk dan tetapkan model default dalam satu langkah
openclaw models auth login --provider github-copilot --method device --set-default
```

## Orientasi noninteraktif

Alur masuk perangkat memerlukan TTY interaktif. Untuk penyiapan tanpa antarmuka, impor
token akses OAuth GitHub yang ada dengan `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Anda juga dapat menghilangkan `--auth-choice`; meneruskan `--github-copilot-token` akan menyimpulkan
pilihan autentikasi penyedia GitHub Copilot. Jika flag dihilangkan, proses orientasi akan
beralih ke `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, lalu `GITHUB_TOKEN`. Gunakan
`--secret-input-mode ref` dengan `COPILOT_GITHUB_TOKEN` yang telah ditetapkan untuk menyimpan
`tokenRef` berbasis lingkungan, bukan teks biasa di `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="TTY interaktif diperlukan">
    Alur masuk perangkat memerlukan TTY interaktif. Jalankan langsung di
    terminal, bukan dalam skrip noninteraktif atau pipeline CI.
  </Accordion>

  <Accordion title="Ketersediaan model bergantung pada paket Anda">
    Ketersediaan model Copilot bergantung pada paket GitHub Anda. Jika sebuah model
    ditolak, coba ID lain (misalnya `github-copilot/gpt-5.5`). Lihat
    [model yang didukung untuk setiap paket Copilot](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    dari GitHub untuk daftar model saat ini.
  </Accordion>

  <Accordion title="Penyegaran katalog langsung dari API Copilot">
    Setelah jalur autentikasi masuk perangkat (atau variabel lingkungan) menentukan token GitHub,
    OpenClaw menyegarkan katalog model sesuai permintaan dari `${baseUrl}/models`
    (endpoint yang sama dengan yang digunakan Copilot di VS Code) agar runtime mengikuti
    hak akses per akun dan jendela konteks yang akurat tanpa perubahan
    manifes. Model Copilot yang baru diterbitkan akan terlihat tanpa peningkatan versi OpenClaw,
    dan jendela konteks mencerminkan batas sebenarnya per model
    (misalnya 400 ribu untuk seri gpt-5.x, 1 juta untuk varian internal
    `claude-opus-*-1m`).

    Katalog statis yang disertakan tetap menjadi cadangan yang terlihat ketika penemuan
    dinonaktifkan, pengguna tidak memiliki profil autentikasi GitHub, pertukaran token
    gagal, atau panggilan HTTPS `/models` mengalami galat. Untuk menonaktifkannya dan sepenuhnya
    mengandalkan katalog manifes statis (skenario luring/terisolasi dari jaringan):

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

  <Accordion title="Pemilihan transportasi">
    ID model Claude menggunakan transportasi Anthropic Messages secara otomatis.
    Model Gemini menggunakan transportasi OpenAI Chat Completions; model GPT dan seri o
    tetap menggunakan transportasi OpenAI Responses. OpenClaw memilih transportasi yang tepat
    berdasarkan referensi model.
  </Accordion>

  <Accordion title="Kompatibilitas permintaan">
    OpenClaw mengirim header permintaan bergaya IDE Copilot pada transportasi Copilot
    (versi editor/plugin VS Code dan ID integrasi `vscode-chat`),
    menandai giliran tindak lanjut hasil alat sebagai dimulai oleh agen, dan menetapkan header
    visi Copilot saat suatu giliran membawa masukan gambar.
  </Accordion>

  <Accordion title="Urutan resolusi variabel lingkungan">
    OpenClaw menentukan autentikasi Copilot dari variabel lingkungan berdasarkan
    urutan prioritas berikut:

    | Prioritas | Variabel               | Catatan                                  |
    | --------- | ---------------------- | ---------------------------------------- |
    | 1         | `COPILOT_GITHUB_TOKEN` | Prioritas tertinggi, khusus Copilot      |
    | 2         | `GH_TOKEN`             | Token CLI GitHub (cadangan)              |
    | 3         | `GITHUB_TOKEN`         | Token GitHub standar (prioritas terendah) |

    Ketika beberapa variabel ditetapkan, OpenClaw menggunakan variabel dengan prioritas tertinggi.
    Alur masuk perangkat (`openclaw models auth login-github-copilot`) menyimpan
    tokennya di penyimpanan profil autentikasi dan memiliki prioritas di atas semua variabel
    lingkungan.

  </Accordion>

  <Accordion title="Penyimpanan token">
    Proses masuk menyimpan token GitHub di penyimpanan profil autentikasi (ID profil
    `github-copilot:github`) dan menukarkannya dengan token API Copilot berumur
    pendek saat OpenClaw berjalan. Anda tidak perlu mengelola token secara manual.
  </Accordion>
</AccordionGroup>

## Penyematan pencarian memori

GitHub Copilot juga dapat berfungsi sebagai penyedia penyematan untuk
[pencarian memori](/id/concepts/memory-search). Jika Anda memiliki langganan Copilot dan
telah masuk, OpenClaw dapat menggunakannya untuk penyematan tanpa kunci API terpisah.

### Konfigurasi

Tetapkan `memorySearch.provider` secara eksplisit untuk menggunakan penyematan GitHub Copilot. Jika
token GitHub tersedia, OpenClaw menemukan model penyematan yang tersedia dari
API Copilot dan secara otomatis memilih yang terbaik.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Opsional: timpa model yang ditemukan secara otomatis
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Cara kerjanya

1. OpenClaw menentukan token GitHub Anda (dari variabel lingkungan atau profil autentikasi).
2. Menukarkannya dengan token API Copilot berumur pendek.
3. Mengueri endpoint `/models` Copilot untuk menemukan model penyematan yang tersedia.
4. Memilih model terbaik (urutan preferensi: `text-embedding-3-small`,
   `text-embedding-3-large`, `text-embedding-ada-002`).
5. Mengirim permintaan penyematan ke endpoint `/embeddings` Copilot.

Ketersediaan model bergantung pada paket GitHub Anda. Jika tidak ada model penyematan yang
tersedia, OpenClaw melewati Copilot dan mencoba penyedia berikutnya.

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku pengalihan saat gagal.
  </Card>
  <Card title="OAuth dan autentikasi" href="/id/gateway/authentication" icon="key">
    Detail autentikasi dan aturan penggunaan kembali kredensial.
  </Card>
</CardGroup>
