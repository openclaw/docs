---
read_when:
    - Anda ingin mengubah model default atau melihat status autentikasi penyedia
    - Anda ingin memindai model/penyedia yang tersedia dan men-debug profil autentikasi
summary: Referensi CLI untuk `openclaw models` (status/daftar/atur/pindai, alias, fallback, autentikasi)
title: Model
x-i18n:
    generated_at: "2026-07-19T04:51:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f7405c25694f04afe9c3029a8af64ae3ae7e1bdcf4c4ac31b8b84ff512d6a90e
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Penemuan, pemindaian, dan konfigurasi model (model default, fallback, profil autentikasi).

Terkait:

- Penyedia + model: [Model](/id/providers/models)
- Konsep pemilihan model + perintah garis miring `/models`: [Konsep model](/id/concepts/models)
- Penyiapan autentikasi penyedia: [Memulai](/id/start/getting-started)

## Perintah umum

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
openclaw models scan
```

Subperintah `status` dan `auth` menerima `--agent <id>` untuk menargetkan agen yang dikonfigurasi; `list`, `scan`, `aliases`, serta `fallbacks`/`image-fallbacks` selalu menggunakan agen default yang dikonfigurasi, sedangkan `set`/`set-image` langsung menolak `--agent`. Jika dihilangkan, perintah yang mendukung `--agent` menggunakan `OPENCLAW_AGENT_DIR` jika ditetapkan; jika tidak, perintah tersebut menggunakan agen default yang dikonfigurasi.

### Status

`openclaw models status` menampilkan default/fallback yang telah ditetapkan beserta ikhtisar autentikasi. Untuk runtime agen milik plugin seperti Codex, perintah ini juga memeriksa apakah plugin pemilik diaktifkan dan lulus verifikasi payload saat mulai. Rute dengan kredensial yang valid tetapi runtime tidak tersedia melaporkan `status: unavailable`, bukan `usable`; keluaran JSON menyertakan `authStatus`, `runtimeStatus`, dan diagnostik runtime terbatas secara terpisah. Jika snapshot penggunaan penyedia tersedia, bagian status OAuth/kunci API menyertakan jendela penggunaan penyedia dan snapshot kuota. Penyedia jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI, OpenAI, MiniMax, Xiaomi, dan z.ai. Autentikasi penggunaan berasal dari hook khusus penyedia jika tersedia; jika tidak, OpenClaw menggunakan kredensial OAuth/kunci API yang cocok dari profil autentikasi, env, atau konfigurasi sebagai fallback.

Dalam keluaran `--json`, `auth.providers` adalah ikhtisar penyedia yang mempertimbangkan env/konfigurasi/penyimpanan, sedangkan `auth.oauth` hanya menunjukkan kondisi profil penyimpanan autentikasi.

Opsi:

| Flag                      | Efek                                                                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `--json`                  | Keluaran JSON; diagnostik profil autentikasi, penyedia, dan proses mulai dikirim ke stderr agar stdout tetap dapat disalurkan ke `jq`.                            |
| `--plain`                 | Keluaran teks biasa.                                                                                                                       |
| `--check`                 | Keluar dengan nilai bukan nol jika autentikasi akan kedaluwarsa/sudah kedaluwarsa atau runtime agen yang dipilih tidak tersedia: `1` = tidak tersedia/kedaluwarsa/tidak ada, `2` = akan kedaluwarsa. |
| `--probe`                 | Probe langsung terhadap profil autentikasi yang dikonfigurasi. Mengirim permintaan nyata; dapat menggunakan token dan memicu batas laju.                                       |
| `--probe-provider <name>` | Hanya melakukan probe terhadap satu penyedia.                                                                                                                 |
| `--probe-profile <id>`    | Melakukan probe terhadap ID profil autentikasi tertentu (dapat diulang atau dipisahkan dengan koma).                                                                             |
| `--probe-timeout <ms>`    | Batas waktu per probe.                                                                                                                       |
| `--probe-concurrency <n>` | Probe serentak.                                                                                                                       |
| `--probe-max-tokens <n>`  | Token maksimum probe (upaya terbaik).                                                                                                          |
| `--agent <id>`            | ID agen yang dikonfigurasi; menggantikan `OPENCLAW_AGENT_DIR`.                                                                                     |

Baris probe dapat berasal dari profil autentikasi, kredensial env, atau `models.json`. Kelompok status probe: `ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`.

Kode detail/alasan probe yang mungkin muncul saat probe tidak pernah mencapai panggilan model:

- `excluded_by_auth_order`: profil tersimpan tersedia, tetapi `auth.order.<provider>` eksplisit menghilangkannya, sehingga probe melaporkan pengecualian tersebut alih-alih mencobanya.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`: profil tersedia tetapi tidak memenuhi syarat atau tidak dapat ditetapkan.
- `ineligible_profile`: profil tidak kompatibel dengan konfigurasi penyedia karena alasan lain.
- `no_model`: autentikasi penyedia tersedia, tetapi OpenClaw tidak dapat menetapkan kandidat model yang dapat diprobe untuk penyedia tersebut.

Untuk pemecahan masalah OAuth OpenAI ChatGPT/Codex, `openclaw models status`, `openclaw models auth list --provider openai`, dan `openclaw config get agents.defaults.model --json` adalah cara tercepat untuk memastikan apakah agen memiliki profil OAuth `openai` yang dapat digunakan untuk `openai/*` melalui runtime Codex native. Lihat [Penyiapan penyedia OpenAI](/id/providers/openai#check-and-recover-codex-oauth-routing).

### Daftar

`openclaw models list` bersifat hanya-baca: perintah ini membaca konfigurasi, profil autentikasi, status katalog yang ada, dan baris katalog milik penyedia, tetapi tidak pernah menulis ulang `models.json`.

Opsi: `--all` (katalog lengkap), `--local` (filter ke model lokal), `--provider <id>`, `--json`, `--plain`.

Catatan:

- Kolom `Auth` bersifat hanya-baca. Untuk rute model milik penyedia seperti OpenAI, kolom ini mencocokkan rute API/URL dasar setiap baris dengan profil yang memenuhi syarat dalam `auth.order` efektif, kredensial env/konfigurasi, dan SecretRef dengan cakupan perintah yang telah ditetapkan. Baris OpenAI konkret tetap berstatus tidak diketahui jika kebijakan rutenya tidak tersedia, alih-alih meminjam autentikasi tingkat penyedia; pemeriksaan lama khusus penyedia dan penyedia lain tetap mempertahankan perilaku tingkat penyedia. Metadata autentikasi sintetis plugin hanya merupakan petunjuk kemampuan runtime, bukan bukti autentikasi akun native, sehingga rute yang bergantung pada akun tetap berstatus tidak diketahui tanpa bukti positif dari registri. Perintah ini tidak memuat runtime penyedia, membaca rahasia keychain, memanggil API penyedia, atau membuktikan kesiapan eksekusi secara pasti.
- `models list --all --provider <id>` dapat menyertakan baris katalog statis milik penyedia dari manifes plugin atau metadata katalog penyedia bawaan, meskipun Anda belum melakukan autentikasi dengan penyedia tersebut. Baris tersebut tetap ditampilkan sebagai tidak tersedia hingga autentikasi yang cocok dikonfigurasi.
- `models list` menjaga bidang kendali tetap responsif saat penemuan katalog penyedia berjalan lambat. Tampilan default dan yang dikonfigurasi beralih ke baris model yang dikonfigurasi atau sintetis setelah menunggu sebentar dan membiarkan penemuan selesai di latar belakang. Gunakan `--all` jika Anda memerlukan katalog lengkap hasil penemuan yang tepat dan bersedia menunggu penemuan penyedia.
- `models list --all` yang luas menggabungkan baris katalog manifes di atas baris registri tanpa memuat hook tambahan runtime penyedia. Jalur cepat manifes yang difilter berdasarkan penyedia hanya menggunakan penyedia yang ditandai `static`; penyedia yang ditandai `refreshable` tetap didukung registri/cache dan menambahkan baris manifes sebagai pelengkap, sedangkan penyedia yang ditandai `runtime` tetap menggunakan penemuan registri/runtime.
- `models list` menjaga metadata model native dan batas runtime tetap terpisah. Dalam keluaran tabel, `Ctx` menampilkan `contextTokens/contextWindow` saat batas runtime efektif berbeda dari jendela konteks native; baris JSON menyertakan `contextTokens` saat penyedia mengekspos batas tersebut.
- Untuk rute milik penyedia, `models list` memproyeksikan satu baris logis penyedia/model ke rute yang dipilih. `Input` dan `Ctx` hanya berasal dari baris katalog rute fisik yang sama persis, dengan penggantian logis eksplisit yang dikonfigurasi diterapkan terakhir; pemilihan rute yang belum ditetapkan menampilkan kolom kemampuan yang tidak diketahui, alih-alih meminjam metadata rute saudara.
- `models list --provider <id>` memfilter berdasarkan ID penyedia, seperti `moonshot` atau `openai`. Opsi ini tidak menerima label tampilan dari pemilih penyedia interaktif, seperti `Moonshot AI`.
- Referensi model diurai dengan memisahkannya pada `/` **pertama**. Jika ID model menyertakan `/` (gaya OpenRouter), sertakan prefiks penyedia (contoh: `openrouter/moonshotai/kimi-k2`).
- Jika penyedia dihilangkan, OpenClaw terlebih dahulu menetapkan input sebagai alias, kemudian sebagai kecocokan penyedia terkonfigurasi yang unik untuk ID model yang sama persis, dan baru setelah itu beralih ke penyedia default yang dikonfigurasi dengan peringatan penghentian penggunaan. Jika penyedia tersebut tidak lagi menyediakan model default yang dikonfigurasi, OpenClaw beralih ke penyedia/model terkonfigurasi pertama, alih-alih menampilkan default lama dari penyedia yang telah dihapus.
- `models status` dapat menampilkan `marker(<value>)` dalam keluaran autentikasi untuk placeholder nonrahasia (misalnya `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`), alih-alih menyamarkannya sebagai rahasia.

### Menetapkan model default/gambar

```bash
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
```

`set` menulis `agents.defaults.model.primary`; `set-image` menulis `agents.defaults.imageModel.primary`. Keduanya menerima `provider/model` atau alias yang dikonfigurasi. `set` juga memperbaiki instalasi plugin runtime Codex/Copilot saat model yang baru dipilih memerlukannya; `set-image` tidak. Kedua perintah tersebut tidak menerima `--agent`; keduanya selalu menulis default agen.

### Pindai

`models scan` membaca katalog publik `:free` milik OpenRouter dan memeringkat kandidat untuk digunakan sebagai fallback. Katalog itu sendiri bersifat publik, sehingga pemindaian metadata saja tidak memerlukan kunci OpenRouter.

Secara default, OpenClaw mencoba melakukan probe terhadap dukungan alat dan gambar dengan panggilan model langsung. Jika tidak ada kunci OpenRouter yang dikonfigurasi, perintah beralih ke keluaran metadata saja dan menjelaskan bahwa model `:free` tetap memerlukan `OPENROUTER_API_KEY` untuk probe dan inferensi.

Opsi:

- `--no-probe` (metadata saja; tanpa pencarian konfigurasi/rahasia)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (batas waktu permintaan katalog dan per probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` dan `--set-image` memerlukan probe langsung; hasil pemindaian metadata saja bersifat informatif dan tidak diterapkan ke konfigurasi.

## Alias

```bash
openclaw models aliases list [--json] [--plain]
openclaw models aliases add <alias> <model-or-alias>
openclaw models aliases remove <alias>
```

Alias disimpan per entri model sebagai `agents.defaults.models.<key>.alias`. `add` terlebih dahulu menetapkan `<model-or-alias>` ke kunci penyedia/model kanonis, sehingga membuat alias dari alias akan mengarahkannya ulang, bukan merantainya.
Menambahkan alias tidak mengubah `agents.defaults.modelPolicy.allow` atau membatasi penggantian model.

## Fallback

```bash
openclaw models fallbacks list [--json] [--plain]
openclaw models fallbacks add <model-or-alias>
openclaw models fallbacks remove <model-or-alias>
openclaw models fallbacks clear
```

Mengelola `agents.defaults.model.fallbacks`. `openclaw models image-fallbacks list|add|remove|clear` mengelola daftar paralel `agents.defaults.imageModel.fallbacks` dengan bentuk subperintah yang sama.

## Profil autentikasi

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth login-github-copilot
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token --provider <id>
openclaw models auth order get --provider <id>
openclaw models auth order set --provider <id> <profileIds...>
openclaw models auth order clear --provider <id>
```

`models auth add` adalah pembantu autentikasi interaktif. Perintah ini dapat menjalankan alur autentikasi penyedia (OAuth/kunci API) atau memandu Anda untuk menempelkan token secara manual, bergantung pada penyedia yang Anda pilih.

`models auth list` mencantumkan profil autentikasi yang tersimpan untuk agen yang dipilih tanpa mencetak token, kunci API, atau materi rahasia OAuth. Gunakan `--provider <id>` untuk memfilter satu penyedia, seperti `openai`, dan `--json` untuk pembuatan skrip.

`models auth login` menjalankan alur autentikasi Plugin penyedia (OAuth/kunci API). Gunakan `openclaw plugins list` untuk melihat penyedia yang telah terinstal. `login` menerima `--profile-id <id>` untuk penyedia yang mendukung profil bernama saat masuk (gunakan ini untuk memisahkan beberapa proses masuk bagi penyedia yang sama), `--method <id>` untuk memilih metode autentikasi tertentu, `--device-code` sebagai pintasan untuk `--method device-code`, `--set-default` untuk menerapkan model default yang direkomendasikan penyedia, dan `--force` untuk terlebih dahulu menghapus profil yang ada bagi penyedia tersebut (gunakan ketika profil OAuth yang di-cache macet atau Anda ingin beralih akun).

`models auth login-github-copilot` adalah pintasan untuk `models auth login --provider github-copilot --method device` (alur perangkat GitHub); perintah ini menerima `--yes` untuk menimpa profil yang ada tanpa meminta konfirmasi.

Gunakan `openclaw models auth --agent <id> <subcommand>` untuk menulis hasil autentikasi ke penyimpanan agen tertentu yang telah dikonfigurasi. Flag induk `--agent` dipatuhi oleh `add`, `list`, `login`, `paste-api-key`, `setup-token`, `paste-token`, `login-github-copilot`, dan `order get`/`set`/`clear`.

Untuk model OpenAI, `--provider openai` secara default menggunakan proses masuk akun ChatGPT/Codex. Gunakan `--method api-key` hanya ketika Anda ingin menambahkan profil kunci API OpenAI, biasanya sebagai cadangan untuk batas langganan Codex. Jalankan `openclaw doctor --fix` untuk memigrasikan status autentikasi/profil awalan OpenAI Codex lawas yang lebih lama ke `openai`.

Contoh:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

Catatan:

- `paste-api-key` menerima kunci API yang dibuat di tempat lain, meminta nilai kunci, dan menuliskannya ke id profil default `<provider>:manual` kecuali Anda meneruskan `--profile-id`. Dalam otomatisasi, salurkan kunci melalui stdin, misalnya `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- `setup-token` dan `paste-token` tetap menjadi perintah token generik untuk penyedia yang menyediakan metode autentikasi token.
- `setup-token` memerlukan TTY interaktif dan menjalankan metode autentikasi token milik penyedia (secara default menggunakan metode `setup-token` milik penyedia tersebut jika tersedia).
- `paste-token` memerlukan `--provider`, secara default meminta nilai token, dan menuliskannya ke id profil default `<provider>:manual` kecuali Anda meneruskan `--profile-id`. Dalam otomatisasi, salurkan token melalui stdin alih-alih meneruskannya sebagai argumen agar kredensial penyedia tidak muncul dalam riwayat shell atau daftar proses.
- `paste-token --expires-in <duration>` menyimpan kedaluwarsa token absolut dari durasi relatif seperti `365d` atau `12h`.
- Untuk `openai`, kunci API OpenAI dan materi token ChatGPT/OAuth memiliki bentuk autentikasi yang berbeda. Gunakan `paste-api-key` untuk kunci API OpenAI `sk-...` dan `paste-token` hanya untuk materi autentikasi token.
- Anthropic: `setup-token`/`paste-token` merupakan jalur autentikasi OpenClaw yang didukung untuk `anthropic`, tetapi OpenClaw lebih memilih menggunakan kembali CLI Claude (`claude -p`) pada host jika tersedia.
- `auth order get/set/clear` mengelola penggantian urutan profil autentikasi per agen untuk satu penyedia, yang disimpan di `auth-state.json` (terpisah dari kunci konfigurasi `auth.order.<provider>`). `set` menerima satu atau beberapa id profil dalam urutan prioritas; `clear` kembali menggunakan urutan konfigurasi/round-robin.

## Terkait

- [Referensi CLI](/id/cli)
- [Pemilihan model](/id/concepts/model-providers)
- [Failover model](/id/concepts/model-failover)
