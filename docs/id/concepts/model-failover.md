---
read_when:
    - Mendiagnosis rotasi profil autentikasi, masa tunggu, atau perilaku fallback model
    - Memperbarui aturan failover untuk profil autentikasi atau model
    - Memahami bagaimana penggantian model sesi berinteraksi dengan percobaan ulang fallback
sidebarTitle: Model failover
summary: Cara OpenClaw merotasi profil autentikasi dan beralih ke model lain sebagai cadangan
title: Failover model
x-i18n:
    generated_at: "2026-07-20T03:46:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e520ed160969b57bd50c2ed647ff7c0e60ec19ab983db226241b6301dafb503d
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw menangani kegagalan dalam dua tahap:

1. **Rotasi profil autentikasi** dalam penyedia saat ini.
2. **Fallback model** ke model berikutnya dalam `agents.defaults.model.fallbacks`.

## Alur runtime

<Steps>
  <Step title="Selesaikan status sesi">
    Selesaikan model sesi aktif dan preferensi profil autentikasi.
  </Step>
  <Step title="Bangun rantai kandidat">
    Bangun rantai kandidat model dari pilihan model saat ini dan kebijakan fallback untuk sumber pilihan tersebut. Default yang dikonfigurasi, model utama tugas cron, dan model fallback yang dipilih otomatis dapat menggunakan fallback yang dikonfigurasi; pilihan sesi pengguna yang eksplisit bersifat ketat.
  </Step>
  <Step title="Coba penyedia saat ini">
    Coba penyedia saat ini dengan aturan rotasi/cooldown profil autentikasi.
  </Step>
  <Step title="Lanjutkan saat terjadi galat yang layak memicu failover">
    Jika penyedia tersebut kehabisan opsi dengan galat yang layak memicu failover, lanjutkan ke kandidat model berikutnya.
  </Step>
  <Step title="Gunakan fallback untuk giliran saat ini">
    Jalankan kandidat fallback yang berhasil tanpa mengubah penyedia/model yang dipilih sesi.
  </Step>
  <Step title="Coba ulang kegagalan murni akibat kelebihan beban secara aman">
    Jika setiap kandidat gagal hanya karena penyedia mengalami kelebihan beban, coba ulang seluruh rantai lokal-giliran hingga 10 kali dengan backoff eksponensial selama belum ada eksekusi alat atau keluaran asisten yang dimulai. Setelah 30 detik, kirim satu pemberitahuan status agar pengguna tidak dibiarkan menunggu tanpa informasi.
  </Step>
  <Step title="Lempar FallbackSummaryError jika semua opsi habis">
    Jika setiap kandidat gagal, lempar `FallbackSummaryError` dengan detail setiap percobaan dan waktu berakhirnya cooldown paling awal jika diketahui.
  </Step>
</Steps>

Eksekusi fallback bersifat lokal-giliran. Runner balasan hanya mempertahankan status pemberitahuan fallback agar `/status` dan pemberitahuan transisi dapat membedakan model yang dipilih dari model yang menjawab; runner tidak mempertahankan fallback sebagai pilihan model untuk giliran berikutnya.

## Kebijakan sumber pilihan

Sumber pilihan mengontrol apakah rantai fallback diizinkan:

- **Default yang dikonfigurasi**: `agents.defaults.model.primary` menggunakan `agents.defaults.model.fallbacks`.
- **Model utama agen**: `agents.list[].model` bersifat ketat kecuali objek model agen tersebut menyertakan `fallbacks` miliknya sendiri. Gunakan `fallbacks: []` untuk membuat perilaku ketat tersebut eksplisit, atau daftar yang tidak kosong untuk mengikutsertakan agen tersebut dalam fallback model.
- **Fallback runtime**: kandidat fallback hanya berlaku untuk giliran saat ini. Giliran berikutnya dimulai lagi dari model utama yang dipilih. OpenClaw tetap mengenali entri `modelOverrideSource: "auto"` yang disimpan sebelumnya, memeriksa asal yang dikonfigurasikan setiap 5 menit, dan menghapusnya setelah asal tersebut pulih. `/new`, `/reset`, dan `sessions.reset` juga menghapus entri tersebut.
- **Penggantian sesi pengguna**: `/model`, pemilih model, `session_status(model=...)`, dan `sessions.patch` menulis `modelOverrideSource: "user"`. Ini merupakan pilihan sesi yang persis. Jika penyedia/model yang dipilih gagal sebelum menghasilkan balasan, OpenClaw melaporkan kegagalan tersebut alih-alih menjawab dari fallback lain yang dikonfigurasi dan tidak terkait.
- **Penggantian sesi lama**: entri sesi lama mungkin memiliki `modelOverride` tanpa `modelOverrideSource`. OpenClaw memperlakukannya sebagai penggantian pengguna agar pilihan lama yang eksplisit tidak secara diam-diam diubah menjadi perilaku fallback.
- **Model payload Cron**: `payload.model` / `--model` tugas cron merupakan model utama tugas, bukan penggantian sesi pengguna. Model tersebut menggunakan fallback yang dikonfigurasi kecuali tugas menyediakan `payload.fallbacks`; `payload.fallbacks: []` membuat eksekusi cron bersifat ketat.

OpenClaw mengirim pemberitahuan yang terlihat saat suatu giliran berpindah ke fallback dan pemberitahuan lain saat giliran berikutnya berhasil menggunakan model utama yang dipilih. Status pemberitahuan yang dipertahankan mencegah pemberitahuan berulang ketika beberapa giliran berturut-turut menggunakan pasangan terpilih/aktif yang sama, sementara pilihan model itu sendiri tetap tidak berubah.

## Cache pelompatan kegagalan autentikasi

Secara default, setiap giliran baru mempertahankan perilaku percobaan ulang fallback yang ada: OpenClaw mencoba kembali setiap kandidat fallback yang dikonfigurasi, termasuk kandidat nonutama yang baru-baru ini gagal dengan `auth` atau `auth_permanent`.

Aktifkan penekanan kegagalan autentikasi berulang dengan:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Saat diaktifkan, OpenClaw mencatat penanda pelompatan dalam memori dengan cakupan sesi untuk kandidat fallback nonutama setelah kegagalan kelas autentikasi, yang dikunci berdasarkan ID sesi, penyedia, dan model. Kandidat utama tidak pernah dilewati, sehingga pilihan model pengguna yang eksplisit tetap menampilkan galat autentikasi yang sebenarnya. Cache bersifat lokal-proses dan dihapus saat Gateway dimulai ulang.

Nilainya merupakan TTL dalam milidetik. `0` atau tidak disetel akan menonaktifkan cache. Nilai positif dibatasi antara 1 detik dan 10 menit.

## Pemberitahuan fallback yang terlihat oleh pengguna

Saat sesi berpindah ke fallback yang dipilih otomatis, OpenClaw mengirim pemberitahuan status pada permukaan balasan yang sama:

```text
↪️ Fallback Model: <fallback> (dipilih <primary>; <reason>)
```

Saat pemeriksaan berikutnya berhasil dan sesi kembali ke model utama yang dipilih, OpenClaw mengirim:

```text
↪️ Fallback Model dihapus: <primary> (sebelumnya <fallback>)
```

Pemberitahuan ini merupakan pesan operasional, bukan konten asisten. Pesan dikirim sekali untuk setiap perubahan status, termasuk pada giliran yang hanya memiliki efek samping jika memungkinkan, tetapi transisi fallback lokal-giliran yang berulang tidak mengulanginya. Pengiriman melewati penekanan balasan sumber normal, tidak menggunakan slot balasan asisten pertama untuk saluran berutas, serta dikecualikan dari text-to-speech dan ekstraksi komitmen.

## Penyimpanan autentikasi (kunci + OAuth)

OpenClaw menggunakan **profil autentikasi** untuk kunci API dan token OAuth.

- Rahasia dan status perutean autentikasi runtime berada dalam `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- Konfigurasi `auth.profiles` / `auth.order` hanya berisi **metadata + perutean** (tanpa rahasia).
- Berkas OAuth lama yang hanya untuk impor: `~/.openclaw/credentials/oauth.json` (diimpor ke penyimpanan autentikasi per agen saat pertama kali digunakan).
- Berkas lama `auth-profiles.json`, `auth-state.json`, dan berkas per agen `auth.json` diimpor oleh `openclaw doctor --fix`.

Detail selengkapnya: [OAuth](/id/concepts/oauth)

Jenis kredensial:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` untuk beberapa penyedia)
- `type: "token"` → token statis bergaya bearer, yang dapat memiliki masa berlaku; OpenClaw tidak memperbaruinya (digunakan untuk `aws-sdk` dan mode autentikasi rantai kredensial lainnya)

## ID profil

Login OAuth membuat profil terpisah agar beberapa akun dapat digunakan bersama-sama.

- Default: `provider:default` saat tidak ada email yang tersedia.
- OAuth dengan email: `provider:<email>` (misalnya `google-antigravity:user@gmail.com`).

Profil berada dalam penyimpanan profil autentikasi per agen `openclaw-agent.sqlite`.

## Urutan rotasi

Saat penyedia memiliki beberapa profil, OpenClaw memilih urutan seperti berikut:

<Steps>
  <Step title="Konfigurasi eksplisit">
    `auth.order[provider]` (jika disetel).
  </Step>
  <Step title="Profil yang dikonfigurasi">
    `auth.profiles` yang difilter berdasarkan penyedia.
  </Step>
  <Step title="Profil tersimpan">
    Entri profil autentikasi SQLite per agen untuk penyedia tersebut.
  </Step>
</Steps>

Jika tidak ada urutan eksplisit yang dikonfigurasi, OpenClaw menggunakan urutan round-robin:

- **Kunci utama:** jenis profil (**OAuth, kemudian token statis, kemudian kunci API**).
- **Kunci sekunder untuk OAuth:** profil dengan token akses yang saat ini dapat digunakan ditempatkan sebelum
  profil yang token aksesnya telah kedaluwarsa. Profil OAuth yang kedaluwarsa tetap memenuhi syarat agar
  runtime dapat memperbaruinya ketika tidak ada profil setara yang dapat digunakan.
- **Kunci berikutnya:** `usageStats.lastUsed` (yang paling lama terlebih dahulu, dalam setiap tingkat jenis/status).
- **Profil yang sedang cooldown/dinonaktifkan** dipindahkan ke bagian akhir, diurutkan berdasarkan waktu berakhir paling awal.

### Kelekatan sesi (ramah-cache)

OpenClaw **menyematkan profil autentikasi yang dipilih untuk setiap sesi** agar cache penyedia tetap hangat. OpenClaw **tidak** melakukan rotasi pada setiap permintaan. Profil yang disematkan digunakan kembali hingga:

- sesi diatur ulang (`/new` / `/reset`)
- Compaction selesai (jumlah compaction bertambah)
- profil sedang dalam cooldown/dinonaktifkan

Pilihan manual melalui `/model …@<profileId>` menetapkan **penggantian pengguna** untuk sesi tersebut dan tidak dirotasi secara otomatis hingga sesi baru dimulai.

<Note>
Profil yang disematkan otomatis (dipilih oleh router sesi) diperlakukan sebagai **preferensi**: profil tersebut dicoba terlebih dahulu, tetapi OpenClaw dapat beralih ke profil lain saat terjadi pembatasan laju/waktu habis. Saat profil awal tersedia kembali, proses baru dapat kembali memprioritaskannya tanpa mengubah model atau runtime yang dipilih. Profil yang disematkan pengguna tetap terkunci pada profil tersebut; jika gagal dan fallback model dikonfigurasi, OpenClaw berpindah ke model berikutnya alih-alih beralih profil.
</Note>

### Langganan OpenAI Codex dengan cadangan kunci API

Untuk model agen OpenAI, autentikasi dan runtime terpisah. `openai/gpt-*` tetap berada pada harness Codex sementara autentikasi dapat berotasi antara profil langganan Codex dan cadangan kunci API OpenAI.

Gunakan `auth.order.openai` untuk urutan yang terlihat oleh pengguna:

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Gunakan `openai:*` untuk profil OAuth ChatGPT/Codex dan profil kunci API OpenAI. Saat langganan mencapai batas penggunaan Codex, OpenClaw mencatat waktu pengaturan ulang yang tepat ketika Codex menyediakannya, mencoba profil autentikasi berikutnya dalam urutan, dan mempertahankan proses di dalam harness Codex. Setelah waktu pengaturan ulang berlalu, profil langganan kembali memenuhi syarat dan pilihan otomatis berikutnya dapat kembali menggunakannya.

Gunakan profil yang disematkan pengguna hanya jika Anda ingin memaksakan satu akun/kunci untuk sesi tersebut. Profil yang disematkan pengguna sengaja dibuat ketat dan tidak secara diam-diam berpindah ke profil lain.

## Cooldown

Saat profil gagal karena galat autentikasi/pembatasan laju (atau waktu habis yang menyerupai pembatasan laju), OpenClaw menandainya sedang dalam cooldown dan berpindah ke profil berikutnya.

<AccordionGroup>
  <Accordion title="Yang masuk dalam kategori pembatasan laju / waktu habis">
    Kategori pembatasan laju tersebut lebih luas daripada sekadar `429`: kategori ini juga mencakup pesan penyedia seperti `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted`, dan batas jendela penggunaan berkala seperti `weekly limit reached` atau `monthly limit exhausted`.

    Galat format/permintaan tidak valid biasanya bersifat terminal karena mencoba ulang payload yang sama akan gagal dengan cara yang sama, sehingga OpenClaw menampilkannya alih-alih merotasi profil autentikasi. Jalur perbaikan percobaan ulang yang diketahui dapat diaktifkan secara eksplisit: misalnya, kegagalan validasi ID panggilan alat Cloud Code Assist disanitasi dan dicoba ulang satu kali melalui kebijakan `allowFormatRetry`. Galat alasan penghentian yang kompatibel dengan OpenAI seperti `Unhandled stop reason: error`, `stop reason: error`, dan `reason: error` diklasifikasikan sebagai sinyal waktu habis/failover.

    Teks server generik juga dapat masuk dalam kategori waktu habis tersebut ketika sumbernya cocok dengan pola sementara yang diketahui. Misalnya, pesan wrapper aliran runtime model tanpa konteks `An unknown error occurred` diperlakukan sebagai layak memicu failover untuk setiap penyedia karena runtime model bersama menghasilkannya ketika aliran penyedia berakhir dengan `stopReason: "aborted"` atau `stopReason: "error"` tanpa detail spesifik. Payload JSON `api_error` dengan teks server sementara seperti `internal server error`, `unknown error, 520`, `upstream error`, atau `backend error` juga diperlakukan sebagai waktu habis yang layak memicu failover.

    Teks upstream generik khusus OpenRouter seperti `Provider returned error` tanpa konteks diperlakukan sebagai waktu habis hanya ketika konteks penyedia benar-benar OpenRouter. Teks fallback internal generik seperti `LLM request failed with an unknown error.` tetap diperlakukan secara konservatif dan tidak memicu failover dengan sendirinya.

  </Accordion>
  <Accordion title="Batas retry-after SDK">
    Jika tidak dibatasi, beberapa SDK penyedia dapat tertidur selama jendela `Retry-After` yang panjang sebelum mengembalikan kendali ke OpenClaw. Untuk SDK berbasis Stainless seperti Anthropic dan OpenAI, secara default OpenClaw membatasi waktu tunggu internal SDK `retry-after-ms` / `retry-after` hingga 60 detik dan segera meneruskan respons yang dapat dicoba ulang dengan waktu tunggu lebih lama agar jalur failover ini dapat berjalan. Sesuaikan atau nonaktifkan batas tersebut dengan `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; lihat [Perilaku percobaan ulang](/id/concepts/retry).
  </Accordion>
  <Accordion title="Cooldown per model">
    Cooldown batas laju juga dapat diterapkan per model:

    - OpenClaw mencatat `cooldownModel` untuk kegagalan batas laju ketika id model yang gagal diketahui.
    - Model saudara pada penyedia yang sama masih dapat dicoba ketika cooldown diterapkan pada model yang berbeda.
    - Jendela penagihan/dinonaktifkan tetap memblokir seluruh profil di semua model.

  </Accordion>
</AccordionGroup>

Cooldown reguler (bukan penagihan dan bukan autentikasi permanen) meningkat berdasarkan jumlah kesalahan terkini profil:

- Kegagalan pertama: 30 detik
- Kegagalan kedua: 1 menit
- Kegagalan ketiga dan seterusnya: 5 menit (batas maksimum)

Penghitung direset setelah jendela kegagalan bawaan profil berlalu.

Status disimpan dalam status autentikasi SQLite per agen di bawah `usageStats`:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## Penonaktifan akibat penagihan

Kegagalan penagihan/kredit (misalnya "kredit tidak mencukupi" / "saldo kredit terlalu rendah") dianggap layak memicu failover, tetapi biasanya tidak bersifat sementara. Alih-alih menerapkan cooldown singkat, OpenClaw menandai profil sebagai **dinonaktifkan** (dengan backoff yang lebih lama) dan beralih ke profil/penyedia berikutnya.

<Note>
Tidak setiap respons yang menyerupai masalah penagihan adalah `402`, dan tidak setiap HTTP `402` masuk ke jalur ini. OpenClaw mempertahankan teks penagihan eksplisit dalam jalur penagihan meskipun penyedia mengembalikan `401` atau `403`, tetapi pencocok khusus penyedia tetap terbatas pada penyedia pemiliknya (misalnya OpenRouter `403 Key limit exceeded`).

Sementara itu, kesalahan sementara `402` terkait jendela penggunaan dan batas pengeluaran organisasi/ruang kerja diklasifikasikan sebagai `rate_limit` ketika pesannya tampak dapat dicoba ulang (misalnya `weekly usage limit exhausted`, `daily limit reached, resets tomorrow`, atau `organization spending limit exceeded`). Kesalahan tersebut tetap mengikuti jalur cooldown/failover singkat, bukan jalur penonaktifan penagihan yang panjang.
</Note>

Kegagalan autentikasi permanen dengan tingkat keyakinan tinggi (kunci dicabut/dinonaktifkan, ruang kerja dinonaktifkan) menggunakan jalur dinonaktifkan yang serupa, tetapi pulih jauh lebih cepat daripada masalah penagihan karena beberapa penyedia terkadang menampilkan payload yang tampak seperti masalah autentikasi selama insiden.

Status disimpan dalam status autentikasi SQLite per agen:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

Kesalahan kelebihan beban dan batas laju ditangani lebih agresif daripada cooldown penagihan: secara default, OpenClaw mengizinkan satu percobaan ulang profil autentikasi pada penyedia yang sama, lalu beralih ke fallback model terkonfigurasi berikutnya tanpa menunggu.

## Fallback model

Jika semua profil untuk suatu penyedia gagal, OpenClaw beralih ke model berikutnya dalam `agents.defaults.model.fallbacks`. Hal ini berlaku untuk kegagalan autentikasi, batas laju, dan batas waktu yang telah menghabiskan rotasi profil (kesalahan lain tidak melanjutkan fallback). Kesalahan penyedia yang tidak menyediakan detail memadai tetap diberi label secara tepat dalam status fallback: `empty_response` berarti penyedia tidak mengembalikan pesan atau status yang dapat digunakan, `no_error_details` berarti penyedia secara eksplisit mengembalikan `Unknown error (no error details in response)`, dan `unclassified` berarti OpenClaw mempertahankan pratinjau mentah, tetapi belum ada pengklasifikasi yang cocok.

Sinyal penyedia sibuk seperti `ModelNotReadyException` masuk ke kategori kelebihan beban dan mengikuti kebijakan satu rotasi lalu fallback yang sama seperti batas laju (lihat tabel default di atas).

Jika seluruh rantai kandidat habis hanya akibat kegagalan kelebihan beban, pelaksana balasan mencoba ulang rantai tersebut hingga 10 kali dalam giliran yang sama. Percobaan ulang seluruh giliran hanya diizinkan sebelum eksekusi alat atau keluaran asisten dimulai, sehingga menghindari mutasi atau pesan duplikat jika kelebihan beban terjadi setelah pekerjaan yang dapat diamati. Backoff dimulai dari 2.5 detik dan berlipat ganda hingga batas maksimum 30 detik. Setelah giliran menunggu selama 30 detik, OpenClaw mengirim satu pemberitahuan status sementara: `The AI service is temporarily overloaded. I’m still retrying; this may take a few minutes.` Percobaan ulang dan kandidat fallback yang berhasil tetap bersifat lokal untuk giliran tersebut; kesalahan server sementara biasa mempertahankan kebijakan satu percobaan ulang yang terpisah.

Ketika proses dimulai dari model utama default terkonfigurasi, model utama tugas cron, model utama agen dengan fallback eksplisit, atau penggantian fallback yang dipilih otomatis, OpenClaw dapat menelusuri rantai fallback terkonfigurasi yang sesuai. Model utama agen tanpa fallback eksplisit dan pilihan pengguna eksplisit (misalnya `/model ollama/qwen3.5:27b`, pemilih model, `sessions.patch`, atau penggantian penyedia/model CLI satu kali) bersifat ketat: jika penyedia/model tersebut tidak dapat dijangkau atau gagal sebelum menghasilkan balasan, OpenClaw melaporkan kegagalan alih-alih menjawab menggunakan fallback yang tidak terkait.

### Aturan rantai kandidat

OpenClaw menyusun daftar kandidat dari `provider/model` yang sedang diminta beserta fallback terkonfigurasi.

<AccordionGroup>
  <Accordion title="Aturan">
    - Model yang diminta selalu berada di urutan pertama.
    - Fallback eksplisit yang dikonfigurasi dideduplikasi, tetapi tidak difilter berdasarkan daftar model yang diizinkan. Fallback tersebut diperlakukan sebagai maksud eksplisit operator.
    - Jika proses saat ini sudah menggunakan fallback terkonfigurasi dalam keluarga penyedia yang sama, OpenClaw tetap menggunakan seluruh rantai terkonfigurasi.
    - Jika tidak ada penggantian fallback eksplisit yang diberikan, fallback terkonfigurasi dicoba sebelum model utama terkonfigurasi meskipun model yang diminta menggunakan penyedia berbeda.
    - Jika tidak ada penggantian fallback eksplisit yang diberikan kepada pelaksana fallback, model utama terkonfigurasi ditambahkan di akhir agar rantai dapat kembali ke default normal setelah kandidat sebelumnya habis.
    - Ketika pemanggil memberikan `fallbacksOverride`, pelaksana hanya menggunakan model yang diminta beserta daftar penggantian tersebut. Daftar kosong menonaktifkan fallback model dan mencegah model utama terkonfigurasi ditambahkan sebagai target percobaan ulang tersembunyi.

  </Accordion>
</AccordionGroup>

### Kesalahan yang melanjutkan fallback

<Tabs>
  <Tab title="Dilanjutkan pada">
    - kegagalan autentikasi
    - batas laju dan habisnya cooldown
    - kesalahan kelebihan beban/penyedia sibuk
    - kesalahan failover yang menyerupai batas waktu
    - penonaktifan akibat penagihan
    - `LiveSessionModelSwitchError`, yang dinormalisasi ke jalur failover agar model tersimpan yang kedaluwarsa tidak membuat perulangan percobaan ulang luar
    - kesalahan lain yang tidak dikenali ketika masih ada kandidat tersisa

  </Tab>
  <Tab title="Tidak dilanjutkan pada">
    - pembatalan eksplisit yang tidak menyerupai batas waktu/failover
    - kesalahan luapan konteks yang harus tetap berada dalam logika Compaction/percobaan ulang (misalnya `request_too_large`, `input token count exceeds the maximum number of input tokens`, `input exceeds the maximum number of tokens`, `input too long for the model`, atau `ollama error: context length exceeded`)
    - kesalahan akhir yang tidak diketahui ketika tidak ada kandidat tersisa
    - penolakan keamanan Claude Fable 5; permintaan langsung dengan kunci API menanganinya pada tingkat penyedia melalui fallback sisi server Anthropic ke `claude-opus-4-8` (lihat [Anthropic](/id/providers/anthropic#safety-refusal-fallback-claude-fable-5))

  </Tab>
</Tabs>

### Perilaku melewati cooldown dibandingkan dengan melakukan probe

Ketika setiap profil autentikasi untuk suatu penyedia sudah berada dalam cooldown, OpenClaw tidak otomatis melewati penyedia tersebut selamanya. OpenClaw mengambil keputusan per kandidat:

<AccordionGroup>
  <Accordion title="Keputusan per kandidat">
    - Kegagalan autentikasi persisten langsung melewati seluruh penyedia.
    - Penonaktifan akibat penagihan biasanya dilewati, tetapi kandidat utama masih dapat diperiksa secara terbatas agar pemulihan dapat terjadi tanpa memulai ulang.
    - Kandidat utama dapat diperiksa menjelang berakhirnya cooldown, dengan pembatasan per penyedia.
    - Fallback saudara pada penyedia yang sama dapat dicoba meskipun sedang dalam cooldown jika kegagalannya tampak sementara (`rate_limit`, `overloaded`, atau tidak diketahui). Hal ini khususnya relevan ketika batas laju diterapkan per model dan model saudara mungkin dapat segera pulih.
    - Probe cooldown sementara dibatasi satu kali per penyedia untuk setiap proses fallback agar satu penyedia tidak menghambat fallback lintas penyedia.

  </Accordion>
</AccordionGroup>

## Penggantian sesi dan pergantian model langsung

Perubahan model sesi merupakan status bersama. Pelaksana aktif, perintah `/model`, pembaruan Compaction/sesi, dan rekonsiliasi sesi langsung semuanya membaca atau menulis bagian dari entri sesi yang sama. Eksekusi fallback tidak menulis bidang pemilihan model, sehingga tidak dapat menggantikan pilihan manual yang lebih baru saat melakukan percobaan ulang.

Pergantian model langsung mengikuti aturan berikut:

- Hanya perubahan model eksplisit yang dipicu pengguna yang menandai pergantian langsung sebagai tertunda. Ini mencakup `/model`, `session_status(model=...)`, dan `sessions.patch`.
- Perubahan model yang dipicu sistem seperti rotasi fallback, penggantian Heartbeat, atau Compaction tidak pernah dengan sendirinya menandai pergantian langsung sebagai tertunda.
- Penggantian model yang dipicu pengguna diperlakukan sebagai pilihan persis untuk kebijakan fallback, sehingga penyedia terpilih yang tidak dapat dijangkau ditampilkan sebagai kegagalan alih-alih disamarkan oleh `agents.defaults.model.fallbacks`.
- Kandidat fallback runtime tetap bersifat lokal untuk giliran tersebut. Giliran berikutnya dimulai dari model yang sedang dipilih, termasuk pilihan manual yang diterima selama proses sebelumnya.
- Penggantian fallback otomatis yang tersimpan sebelumnya tetap didukung: OpenClaw secara berkala memeriksa asal terkonfigurasinya dan menghapus penggantian tersebut saat pulih; `/new`, `/reset`, dan `sessions.reset` segera menghapus penggantian yang bersumber otomatis.
- Balasan kepada pengguna mengumumkan transisi fallback dan pemulihan setelah fallback dihapus satu kali untuk setiap perubahan status. Giliran berulang dengan pasangan terpilih/aktif yang sama tidak mengulangi pemberitahuan.
- `/status` menampilkan model terpilih dan, ketika status fallback berbeda, model fallback aktif beserta alasannya.
- Rekonsiliasi sesi langsung memprioritaskan penggantian sesi tersimpan daripada bidang model runtime yang kedaluwarsa.
- Jika kesalahan pergantian langsung menunjuk ke kandidat berikutnya dalam rantai fallback aktif, OpenClaw langsung beralih ke model terpilih tersebut alih-alih menelusuri kandidat yang tidak terkait terlebih dahulu.

Proses aktif membawa kandidat pilihannya secara langsung. Rekonsiliasi langsung hanya mengubah kandidat tersebut untuk pergantian pengguna eksplisit yang tertunda, sehingga penggantian atau pengembalian fallback sementara tidak diperlukan.

## Observabilitas dan ringkasan kegagalan

`runWithModelFallback(...)` mencatat detail per percobaan yang digunakan untuk log dan pesan cooldown yang ditampilkan kepada pengguna:

- penyedia/model yang dicoba
- alasan (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found`, dan alasan failover serupa)
- status/kode opsional
- ringkasan kesalahan yang mudah dibaca manusia

Log `model_fallback_decision` terstruktur juga menyertakan bidang `fallbackStep*` datar ketika kandidat gagal, dilewati, atau fallback berikutnya berhasil. Bidang ini membuat transisi yang dicoba menjadi eksplisit (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) sehingga pengekspor log dan diagnostik dapat merekonstruksi kegagalan utama meskipun fallback terminal juga gagal.

Ketika setiap kandidat gagal, OpenClaw melempar `FallbackSummaryError`. Pelaksana balasan luar dapat menggunakannya untuk menyusun pesan yang lebih spesifik seperti "semua model untuk sementara terkena batas laju" dan menyertakan waktu berakhir cooldown terdekat jika diketahui.

Ringkasan cooldown tersebut mempertimbangkan model:

- batas laju cakupan model yang tidak terkait diabaikan untuk rantai penyedia/model yang dicoba
- jika blokir yang tersisa adalah batas laju cakupan model yang cocok, OpenClaw melaporkan waktu kedaluwarsa terakhir yang cocok dan masih memblokir model tersebut

## Konfigurasi terkait

Lihat [konfigurasi Gateway](/id/gateway/configuration) untuk:

- `auth.profiles` / `auth.order`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` perutean

Lihat [Model](/id/concepts/models) untuk ringkasan yang lebih luas tentang pemilihan model dan fallback.
