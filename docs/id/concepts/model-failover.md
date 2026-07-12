---
read_when:
    - Mendiagnosis rotasi profil autentikasi, masa tunggu, atau perilaku fallback model
    - Memperbarui aturan failover untuk profil autentikasi atau model
    - Memahami cara penggantian model sesi berinteraksi dengan percobaan ulang fallback
sidebarTitle: Model failover
summary: Cara OpenClaw merotasi profil autentikasi dan beralih ke model cadangan
title: Failover model
x-i18n:
    generated_at: "2026-07-12T14:05:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2da6399c8f5c6d9ab40486b553a41600a3c8eb64efa09e72784b81e42edbba61
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
    Bangun rantai kandidat model dari pilihan model saat ini dan kebijakan fallback untuk sumber pilihan tersebut. Nilai default yang dikonfigurasi, model utama tugas cron, dan model fallback yang dipilih otomatis dapat menggunakan fallback yang dikonfigurasi; pilihan sesi pengguna yang eksplisit bersifat ketat.
  </Step>
  <Step title="Coba penyedia saat ini">
    Coba penyedia saat ini dengan aturan rotasi/masa tunggu profil autentikasi.
  </Step>
  <Step title="Lanjutkan saat terjadi galat yang layak dialihkan">
    Jika penyedia tersebut kehabisan opsi karena galat yang layak dialihkan, pindah ke kandidat model berikutnya.
  </Step>
  <Step title="Persistensikan penggantian fallback">
    Persistensikan penggantian fallback yang dipilih sebelum percobaan ulang dimulai agar pembaca sesi lain melihat penyedia/model yang sama dengan yang akan digunakan oleh pelaksana. Penggantian model yang dipersistensikan ditandai dengan `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Batalkan secara terbatas saat gagal">
    Jika kandidat fallback gagal, batalkan hanya bidang penggantian sesi milik fallback ketika bidang tersebut masih cocok dengan kandidat yang gagal.
  </Step>
  <Step title="Lempar FallbackSummaryError jika semua opsi habis">
    Jika setiap kandidat gagal, lempar `FallbackSummaryError` dengan detail per percobaan dan waktu berakhirnya masa tunggu terdekat jika diketahui.
  </Step>
</Steps>

Ini sengaja lebih terbatas daripada "simpan dan pulihkan seluruh sesi." Pelaksana balasan hanya mempersistensikan bidang pemilihan model yang dimilikinya untuk fallback: `providerOverride`, `modelOverride`, `modelOverrideSource`, `authProfileOverride`, `authProfileOverrideSource`, `authProfileOverrideCompactionCount`. Hal ini mencegah percobaan ulang fallback yang gagal menimpa mutasi sesi lain yang lebih baru, seperti perubahan manual `/model` atau pembaruan rotasi sesi yang terjadi saat percobaan sedang berjalan.

## Kebijakan sumber pilihan

Sumber pilihan mengendalikan apakah rantai fallback diizinkan:

- **Default yang dikonfigurasi**: `agents.defaults.model.primary` menggunakan `agents.defaults.model.fallbacks`.
- **Model utama agen**: `agents.list[].model` bersifat ketat kecuali objek model agen tersebut menyertakan `fallbacks` miliknya sendiri. Gunakan `fallbacks: []` untuk menyatakan perilaku ketat secara eksplisit, atau daftar yang tidak kosong untuk mengikutsertakan agen tersebut dalam fallback model.
- **Penggantian fallback otomatis**: fallback runtime menulis `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"`, dan model asal yang dipilih sebelum mencoba kembali. Penggantian ini terus menelusuri rantai fallback yang dikonfigurasi tanpa memeriksa model utama pada setiap pesan, tetapi OpenClaw memeriksa model asal yang dikonfigurasi setiap 5 menit (tidak dapat dikonfigurasi) dan menghapus penggantian setelah model tersebut pulih. `/new`, `/reset`, dan `sessions.reset` juga menghapus penggantian yang bersumber otomatis. Proses Heartbeat tanpa `heartbeat.model` eksplisit menghapus penggantian otomatis langsung ketika asalnya tidak lagi cocok dengan default yang dikonfigurasi saat ini.
- **Penggantian sesi pengguna**: `/model`, pemilih model, `session_status(model=...)`, dan `sessions.patch` menulis `modelOverrideSource: "user"`. Ini adalah pilihan sesi yang tepat. Jika penyedia/model yang dipilih gagal sebelum menghasilkan balasan, OpenClaw melaporkan kegagalan tersebut alih-alih menjawab menggunakan fallback lain yang dikonfigurasi dan tidak terkait.
- **Penggantian sesi lama**: entri sesi lama mungkin memiliki `modelOverride` tanpa `modelOverrideSource`. OpenClaw memperlakukannya sebagai penggantian pengguna agar pilihan lama yang eksplisit tidak secara diam-diam diubah menjadi perilaku fallback.
- **Model muatan Cron**: `payload.model` / `--model` pada tugas cron adalah model utama tugas, bukan penggantian sesi pengguna. Model tersebut menggunakan fallback yang dikonfigurasi kecuali tugas menyediakan `payload.fallbacks`; `payload.fallbacks: []` membuat proses cron bersifat ketat.

OpenClaw mengingat pemeriksaan model utama terbaru untuk setiap sesi dan model utama agar model utama yang gagal tidak dicoba kembali pada setiap giliran. OpenClaw mengirim pemberitahuan yang terlihat ketika sesi berpindah ke fallback dan pemberitahuan lain ketika kembali ke model utama yang dipilih; pemberitahuan tersebut tidak diulangi pada setiap giliran fallback yang melekat.

## Cache pelewatan kegagalan autentikasi

Secara default, setiap giliran baru mempertahankan perilaku percobaan ulang fallback yang ada: OpenClaw mencoba kembali setiap kandidat fallback yang dikonfigurasi, termasuk kandidat nonutama yang baru-baru ini gagal dengan `auth` atau `auth_permanent`.

Aktifkan penekanan kegagalan autentikasi berulang dengan:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Saat diaktifkan, OpenClaw mencatat penanda pelewatan dalam memori yang terbatas pada sesi untuk kandidat fallback nonutama setelah kegagalan kelas autentikasi, dengan kunci berupa ID sesi, penyedia, dan model. Kandidat utama tidak pernah dilewati sehingga pilihan model pengguna yang eksplisit tetap menampilkan galat autentikasi yang sebenarnya. Cache ini bersifat lokal pada proses dan dihapus saat Gateway dimulai ulang.

Nilainya adalah TTL dalam milidetik. Nilai `0` atau tidak ditetapkan akan menonaktifkan cache. Nilai positif dibatasi antara 1 detik dan 10 menit.

## Pemberitahuan fallback yang terlihat oleh pengguna

Ketika sesi berpindah ke fallback yang dipilih otomatis, OpenClaw mengirim pemberitahuan status pada permukaan balasan yang sama:

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

Ketika pemeriksaan berikutnya berhasil dan sesi kembali ke model utama yang dipilih, OpenClaw mengirim:

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

Pemberitahuan ini adalah pesan operasional, bukan konten asisten. Pemberitahuan dikirim satu kali per perubahan status, termasuk pada giliran yang hanya memiliki efek samping jika memungkinkan, tetapi tidak diulangi pada giliran fallback yang melekat. Pengiriman melewati penekanan balasan sumber biasa, tidak menggunakan slot balasan asisten pertama untuk kanal berutas, serta dikecualikan dari teks-ke-ucapan dan ekstraksi komitmen.

## Penyimpanan autentikasi (kunci + OAuth)

OpenClaw menggunakan **profil autentikasi** untuk kunci API dan token OAuth.

- Rahasia dan status perutean autentikasi runtime berada di `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- Konfigurasi `auth.profiles` / `auth.order` hanya berisi **metadata + perutean** (tanpa rahasia).
- Berkas OAuth lama khusus impor: `~/.openclaw/credentials/oauth.json` (diimpor ke penyimpanan autentikasi per agen saat pertama kali digunakan).
- Berkas lama `auth-profiles.json`, `auth-state.json`, dan `auth.json` per agen diimpor oleh `openclaw doctor --fix`.

Detail selengkapnya: [OAuth](/id/concepts/oauth)

Jenis kredensial:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` untuk beberapa penyedia)
- `type: "token"` → token statis bergaya bearer, yang dapat memiliki masa berlaku; OpenClaw tidak memperbaruinya (digunakan untuk `aws-sdk` dan mode autentikasi rantai kredensial lainnya)

## ID profil

Proses masuk OAuth membuat profil terpisah agar beberapa akun dapat digunakan bersamaan.

- Default: `provider:default` ketika alamat surel tidak tersedia.
- OAuth dengan alamat surel: `provider:<email>` (misalnya `google-antigravity:user@gmail.com`).

Profil berada dalam penyimpanan profil autentikasi `openclaw-agent.sqlite` per agen.

## Urutan rotasi

Ketika penyedia memiliki beberapa profil, OpenClaw memilih urutan seperti berikut:

<Steps>
  <Step title="Konfigurasi eksplisit">
    `auth.order[provider]` (jika ditetapkan).
  </Step>
  <Step title="Profil yang dikonfigurasi">
    `auth.profiles` yang difilter berdasarkan penyedia.
  </Step>
  <Step title="Profil yang tersimpan">
    Entri profil autentikasi SQLite per agen untuk penyedia tersebut.
  </Step>
</Steps>

Jika tidak ada urutan eksplisit yang dikonfigurasi, OpenClaw menggunakan urutan bergilir:

- **Kunci utama:** jenis profil (**OAuth, lalu token statis, lalu kunci API**).
- **Kunci sekunder:** `usageStats.lastUsed` (yang terlama lebih dahulu, dalam setiap jenis).
- **Profil dalam masa tunggu/dinonaktifkan** dipindahkan ke bagian akhir dan diurutkan berdasarkan waktu berakhir terdekat.

### Kelekatan sesi (ramah cache)

OpenClaw **menyematkan profil autentikasi yang dipilih per sesi** agar cache penyedia tetap aktif. OpenClaw **tidak** melakukan rotasi pada setiap permintaan. Profil yang disematkan digunakan kembali hingga:

- sesi diatur ulang (`/new` / `/reset`)
- Compaction selesai (jumlah Compaction bertambah)
- profil berada dalam masa tunggu/dinonaktifkan

Pemilihan manual melalui `/model …@<profileId>` menetapkan **penggantian pengguna** untuk sesi tersebut dan tidak dirotasi otomatis hingga sesi baru dimulai.

<Note>
Profil yang disematkan otomatis (dipilih oleh perute sesi) diperlakukan sebagai **preferensi**: profil tersebut dicoba terlebih dahulu, tetapi OpenClaw dapat beralih ke profil lain saat terjadi batas laju/batas waktu. Ketika profil asli tersedia kembali, proses baru dapat kembali memprioritaskannya tanpa mengubah model atau runtime yang dipilih. Profil yang disematkan pengguna tetap terkunci pada profil tersebut; jika profil itu gagal dan fallback model dikonfigurasi, OpenClaw berpindah ke model berikutnya alih-alih mengganti profil.
</Note>

### Langganan OpenAI Codex dengan cadangan kunci API

Untuk model agen OpenAI, autentikasi dan runtime bersifat terpisah. `openai/gpt-*` tetap menggunakan perangkat Codex, sedangkan autentikasi dapat berotasi antara profil langganan Codex dan cadangan kunci API OpenAI.

Gunakan `auth.order.openai` untuk urutan yang ditampilkan kepada pengguna:

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Gunakan `openai:*` untuk profil OAuth ChatGPT/Codex dan profil kunci API OpenAI. Ketika langganan mencapai batas penggunaan Codex, OpenClaw mencatat waktu pengaturan ulang yang tepat jika disediakan oleh Codex, mencoba profil autentikasi berikutnya sesuai urutan, dan mempertahankan proses di dalam perangkat Codex. Setelah waktu pengaturan ulang berlalu, profil langganan kembali memenuhi syarat dan pemilihan otomatis berikutnya dapat kembali menggunakannya.

Gunakan profil yang disematkan pengguna hanya jika Anda ingin memaksakan penggunaan satu akun/kunci untuk sesi tersebut. Profil yang disematkan pengguna sengaja bersifat ketat dan tidak secara diam-diam beralih ke profil lain.

## Masa tunggu

Ketika profil gagal karena galat autentikasi/batas laju (atau batas waktu yang tampak seperti pembatasan laju), OpenClaw menandainya dalam masa tunggu dan berpindah ke profil berikutnya.

<AccordionGroup>
  <Accordion title="Hal yang masuk ke kategori batas laju / batas waktu">
    Kategori batas laju tersebut lebih luas daripada sekadar `429`: kategori ini juga mencakup pesan penyedia seperti `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted`, dan batas jendela penggunaan berkala seperti `weekly limit reached` atau `monthly limit exhausted`.

    Galat format/permintaan tidak valid biasanya bersifat terminal karena mencoba kembali muatan yang sama akan gagal dengan cara yang sama, sehingga OpenClaw menampilkannya alih-alih merotasi profil autentikasi. Jalur perbaikan melalui percobaan ulang yang dikenal dapat diaktifkan secara eksplisit: misalnya, kegagalan validasi ID pemanggilan alat Cloud Code Assist disanitasi dan dicoba kembali satu kali melalui kebijakan `allowFormatRetry`. Galat alasan berhenti yang kompatibel dengan OpenAI seperti `Unhandled stop reason: error`, `stop reason: error`, dan `reason: error` diklasifikasikan sebagai sinyal batas waktu/pengalihan.

    Teks server generik juga dapat masuk ke kategori batas waktu tersebut ketika sumbernya cocok dengan pola sementara yang dikenal. Misalnya, pesan pembungkus aliran runtime model tanpa detail `An unknown error occurred` dianggap layak dialihkan untuk setiap penyedia karena runtime model bersama menghasilkannya ketika aliran penyedia berakhir dengan `stopReason: "aborted"` atau `stopReason: "error"` tanpa detail spesifik. Muatan JSON `api_error` dengan teks server sementara seperti `internal server error`, `unknown error, 520`, `upstream error`, atau `backend error` juga dianggap sebagai batas waktu yang layak dialihkan.

    Teks upstream generik khusus OpenRouter seperti `Provider returned error` dianggap sebagai batas waktu hanya ketika konteks penyedianya memang OpenRouter. Teks fallback internal generik seperti `LLM request failed with an unknown error.` tetap ditangani secara konservatif dan tidak memicu pengalihan dengan sendirinya.

  </Accordion>
  <Accordion title="Batas retry-after SDK">
    Beberapa SDK penyedia dapat menunggu selama jendela `Retry-After` yang panjang sebelum mengembalikan kendali ke OpenClaw. Untuk SDK berbasis Stainless seperti Anthropic dan OpenAI, secara default OpenClaw membatasi waktu tunggu internal SDK untuk `retry-after-ms` / `retry-after` hingga 60 detik dan segera memunculkan respons yang dapat dicoba ulang dengan waktu tunggu lebih panjang agar jalur failover ini dapat berjalan. Sesuaikan atau nonaktifkan batas tersebut dengan `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; lihat [Perilaku percobaan ulang](/id/concepts/retry).
  </Accordion>
  <Accordion title="Cooldown menurut model">
    Cooldown batas laju juga dapat diterapkan menurut model:

    - OpenClaw mencatat `cooldownModel` untuk kegagalan batas laju ketika id model yang gagal diketahui.
    - Model lain dari penyedia yang sama masih dapat dicoba ketika cooldown diterapkan pada model yang berbeda.
    - Jendela penagihan/penonaktifan tetap memblokir seluruh profil untuk semua model.

  </Accordion>
</AccordionGroup>

Cooldown reguler (bukan penagihan dan bukan autentikasi permanen) meningkat sesuai jumlah kesalahan terbaru pada profil:

- Kegagalan ke-1: 30 detik
- Kegagalan ke-2: 1 menit
- Kegagalan ke-3 dan seterusnya: 5 menit (batas maksimum)

Penghitung direset setelah jendela kegagalan profil berlalu (`auth.cooldowns.failureWindowHours`, bawaan 24).

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

Kegagalan penagihan/kredit (misalnya "kredit tidak mencukupi" / "saldo kredit terlalu rendah") dianggap layak memicu failover, tetapi biasanya tidak bersifat sementara. Alih-alih menggunakan cooldown singkat, OpenClaw menandai profil sebagai **dinonaktifkan** (dengan backoff lebih lama) dan beralih ke profil/penyedia berikutnya.

<Note>
Tidak semua respons yang menyerupai masalah penagihan memiliki status `402`, dan tidak semua HTTP `402` masuk ke jalur ini. OpenClaw tetap menempatkan teks penagihan eksplisit pada jalur penagihan meskipun penyedia justru mengembalikan `401` atau `403`, tetapi pencocok khusus penyedia tetap dibatasi pada penyedia pemiliknya (misalnya OpenRouter `403 Key limit exceeded`).

Sementara itu, kesalahan sementara `402` terkait jendela penggunaan dan batas pengeluaran organisasi/ruang kerja diklasifikasikan sebagai `rate_limit` jika pesannya tampak dapat dicoba ulang (misalnya `weekly usage limit exhausted`, `daily limit reached, resets tomorrow`, atau `organization spending limit exceeded`). Kesalahan tersebut tetap berada di jalur cooldown/failover singkat, bukan jalur penonaktifan penagihan yang panjang.
</Note>

Kegagalan autentikasi permanen dengan tingkat keyakinan tinggi (kunci yang dicabut/dinonaktifkan, ruang kerja yang dinonaktifkan) masuk ke jalur penonaktifan serupa, tetapi pulih jauh lebih cepat daripada penagihan karena beberapa penyedia dapat menampilkan muatan yang tampak seperti kegagalan autentikasi secara sementara selama insiden.

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

Nilai bawaan (`auth.cooldowns.*`):

| Kunci                         | Bawaan | Tujuan                                                                         |
| ----------------------------- | ------ | ------------------------------------------------------------------------------ |
| `billingBackoffHours`         | 5      | Backoff penagihan dasar, berlipat ganda untuk setiap kegagalan penagihan       |
| `billingMaxHours`             | 24     | Batas maksimum backoff penagihan                                               |
| `authPermanentBackoffMinutes` | 10     | Backoff dasar untuk kegagalan autentikasi permanen berkeyakinan tinggi         |
| `authPermanentMaxMinutes`     | 60     | Batas maksimum backoff tersebut                                                |
| `failureWindowHours`          | 24     | Penghitung kegagalan direset jika tidak ada kegagalan dalam jendela ini        |
| `overloadedProfileRotations`  | 1      | Rotasi profil penyedia yang sama yang diizinkan sebelum fallback model saat beban berlebih |
| `overloadedBackoffMs`         | 0      | Penundaan tetap sebelum percobaan ulang rotasi akibat beban berlebih           |
| `rateLimitedProfileRotations` | 1      | Rotasi profil penyedia yang sama yang diizinkan sebelum fallback model saat terkena batas laju |

Kesalahan beban berlebih dan batas laju ditangani lebih agresif daripada cooldown penagihan: secara default, OpenClaw mengizinkan satu percobaan ulang profil autentikasi dari penyedia yang sama, lalu beralih ke fallback model terkonfigurasi berikutnya tanpa menunggu.

## Fallback model

Jika semua profil untuk suatu penyedia gagal, OpenClaw beralih ke model berikutnya dalam `agents.defaults.model.fallbacks`. Ini berlaku untuk kegagalan autentikasi, batas laju, dan batas waktu yang telah menghabiskan rotasi profil (kesalahan lain tidak melanjutkan fallback). Kesalahan penyedia yang tidak memberikan cukup detail tetap diberi label secara tepat dalam status fallback: `empty_response` berarti penyedia tidak mengembalikan pesan atau status yang dapat digunakan, `no_error_details` berarti penyedia secara eksplisit mengembalikan `Unknown error (no error details in response)`, dan `unclassified` berarti OpenClaw mempertahankan pratinjau mentah tetapi belum ada pengklasifikasi yang cocok.

Sinyal penyedia sibuk seperti `ModelNotReadyException` masuk ke kategori beban berlebih dan mengikuti kebijakan satu rotasi lalu fallback yang sama dengan batas laju (lihat tabel nilai bawaan di atas).

Ketika suatu proses dimulai dari model utama bawaan yang dikonfigurasi, model utama tugas Cron, model utama agen dengan fallback eksplisit, atau penggantian fallback yang dipilih otomatis, OpenClaw dapat menelusuri rantai fallback terkonfigurasi yang cocok. Model utama agen tanpa fallback eksplisit dan pilihan pengguna eksplisit (misalnya `/model ollama/qwen3.5:27b`, pemilih model, `sessions.patch`, atau penggantian penyedia/model CLI sekali pakai) bersifat ketat: jika penyedia/model tersebut tidak dapat dijangkau atau gagal sebelum menghasilkan balasan, OpenClaw melaporkan kegagalan alih-alih menjawab menggunakan fallback yang tidak berkaitan.

### Aturan rantai kandidat

OpenClaw menyusun daftar kandidat dari `provider/model` yang sedang diminta beserta fallback terkonfigurasi.

<AccordionGroup>
  <Accordion title="Aturan">
    - Model yang diminta selalu berada di urutan pertama.
    - Fallback eksplisit yang dikonfigurasi dideduplikasi, tetapi tidak difilter berdasarkan daftar model yang diizinkan. Fallback tersebut dianggap sebagai maksud eksplisit operator.
    - Jika proses saat ini sudah menggunakan fallback terkonfigurasi dalam keluarga penyedia yang sama, OpenClaw tetap menggunakan seluruh rantai terkonfigurasi.
    - Jika tidak ada penggantian fallback eksplisit yang diberikan, fallback terkonfigurasi dicoba sebelum model utama terkonfigurasi meskipun model yang diminta menggunakan penyedia berbeda.
    - Jika tidak ada penggantian fallback eksplisit yang diberikan kepada pelaksana fallback, model utama terkonfigurasi ditambahkan di akhir agar rantai dapat kembali ke nilai bawaan normal setelah kandidat sebelumnya habis.
    - Ketika pemanggil memberikan `fallbacksOverride`, pelaksana hanya menggunakan model yang diminta beserta daftar penggantian tersebut. Daftar kosong menonaktifkan fallback model dan mencegah model utama terkonfigurasi ditambahkan sebagai target percobaan ulang tersembunyi.

  </Accordion>
</AccordionGroup>

### Kesalahan yang melanjutkan fallback

<Tabs>
  <Tab title="Berlanjut pada">
    - kegagalan autentikasi
    - batas laju dan habisnya cooldown
    - kesalahan beban berlebih/penyedia sibuk
    - kesalahan failover yang menyerupai batas waktu
    - penonaktifan akibat penagihan
    - `LiveSessionModelSwitchError`, yang dinormalisasi ke jalur failover agar model tersimpan yang usang tidak membuat perulangan percobaan ulang luar
    - kesalahan lain yang tidak dikenali ketika masih ada kandidat tersisa

  </Tab>
  <Tab title="Tidak berlanjut pada">
    - pembatalan eksplisit yang tidak menyerupai batas waktu/failover
    - kesalahan luapan konteks yang harus tetap berada dalam logika Compaction/percobaan ulang (misalnya `request_too_large`, `input token count exceeds the maximum number of input tokens`, `input exceeds the maximum number of tokens`, `input too long for the model`, atau `ollama error: context length exceeded`)
    - kesalahan tak dikenal terakhir ketika tidak ada kandidat tersisa
    - penolakan keamanan Claude Fable 5; permintaan langsung dengan kunci API menanganinya pada tingkat penyedia melalui fallback sisi server Anthropic ke `claude-opus-4-8` (lihat [Anthropic](/id/providers/anthropic#safety-refusal-fallback-claude-fable-5))

  </Tab>
</Tabs>

### Perilaku melewati cooldown dibandingkan dengan pemeriksaan

Ketika setiap profil autentikasi suatu penyedia sudah berada dalam cooldown, OpenClaw tidak otomatis melewati penyedia tersebut selamanya. OpenClaw mengambil keputusan per kandidat:

<AccordionGroup>
  <Accordion title="Keputusan per kandidat">
    - Kegagalan autentikasi persisten langsung melewati seluruh penyedia.
    - Penonaktifan akibat penagihan biasanya dilewati, tetapi kandidat utama masih dapat diperiksa dengan pembatasan frekuensi agar pemulihan dapat terjadi tanpa memulai ulang.
    - Kandidat utama dapat diperiksa menjelang berakhirnya cooldown, dengan pembatasan frekuensi per penyedia.
    - Model fallback lain dari penyedia yang sama dapat dicoba meskipun sedang cooldown ketika kegagalannya tampak sementara (`rate_limit`, `overloaded`, atau tidak diketahui). Ini khususnya relevan ketika batas laju diterapkan pada model tertentu dan model lain mungkin masih dapat segera pulih.
    - Pemeriksaan cooldown sementara dibatasi satu kali per penyedia per proses fallback agar satu penyedia tidak menghambat fallback lintas penyedia.

  </Accordion>
</AccordionGroup>

## Penggantian sesi dan peralihan model langsung

Perubahan model sesi merupakan status bersama. Pelaksana aktif, perintah `/model`, pembaruan Compaction/sesi, dan rekonsiliasi sesi langsung semuanya membaca atau menulis bagian dari entri sesi yang sama.

Artinya, percobaan ulang fallback harus berkoordinasi dengan peralihan model langsung:

- Hanya perubahan model yang secara eksplisit dipicu pengguna yang menandai peralihan langsung sebagai tertunda. Ini mencakup `/model`, `session_status(model=...)`, dan `sessions.patch`.
- Perubahan model yang dipicu sistem seperti rotasi fallback, penggantian Heartbeat, atau Compaction tidak pernah menandai sendiri peralihan langsung sebagai tertunda.
- Penggantian model yang dipicu pengguna diperlakukan sebagai pilihan tepat untuk kebijakan fallback, sehingga penyedia terpilih yang tidak dapat dijangkau ditampilkan sebagai kegagalan alih-alih disamarkan oleh `agents.defaults.model.fallbacks`.
- Sebelum percobaan ulang fallback dimulai, pelaksana balasan menyimpan bidang penggantian fallback terpilih ke entri sesi.
- Penggantian fallback otomatis tetap terpilih pada giliran berikutnya agar OpenClaw tidak memeriksa model utama yang diketahui bermasalah pada setiap pesan. OpenClaw secara berkala memeriksa kembali asal yang dikonfigurasi dan menghapus penggantian otomatis setelah pulih; `/new`, `/reset`, dan `sessions.reset` segera menghapus penggantian yang bersumber otomatis.
- Balasan kepada pengguna mengumumkan transisi fallback dan pemulihan setelah fallback dihapus satu kali untuk setiap perubahan status. Giliran fallback yang tetap aktif tidak mengulangi pemberitahuan tersebut.
- `/status` menampilkan model terpilih dan, jika status fallback berbeda, model fallback aktif beserta alasannya.
- Rekonsiliasi sesi langsung mengutamakan penggantian sesi tersimpan daripada bidang model runtime yang usang.
- Jika kesalahan peralihan langsung menunjuk ke kandidat yang lebih akhir dalam rantai fallback aktif, OpenClaw langsung beralih ke model terpilih tersebut alih-alih menelusuri kandidat yang tidak berkaitan terlebih dahulu.
- Jika percobaan fallback gagal, pelaksana hanya mengembalikan bidang penggantian yang ditulisnya, dan hanya jika bidang tersebut masih cocok dengan kandidat yang gagal.

Hal ini mencegah kondisi berpacu klasik:

<Steps>
  <Step title="Model utama gagal">
    Model utama terpilih gagal.
  </Step>
  <Step title="Fallback dipilih dalam memori">
    Kandidat fallback dipilih dalam memori.
  </Step>
  <Step title="Penyimpanan sesi masih menunjukkan model utama lama">
    Penyimpanan sesi masih mencerminkan model utama lama.
  </Step>
  <Step title="Rekonsiliasi langsung membaca status usang">
    Rekonsiliasi sesi langsung membaca status sesi yang usang.
  </Step>
  <Step title="Percobaan ulang dikembalikan">
    Percobaan ulang dikembalikan ke model lama sebelum percobaan fallback dimulai.
  </Step>
</Steps>

Penggantian fallback yang disimpan menutup celah tersebut, dan pengembalian terbatas menjaga agar perubahan sesi manual atau runtime yang lebih baru tetap utuh.

## Observabilitas dan ringkasan kegagalan

`runWithModelFallback(...)` mencatat detail setiap percobaan yang menjadi masukan bagi log dan pesan cooldown yang ditampilkan kepada pengguna:

- penyedia/model yang dicoba
- alasan (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found`, dan alasan failover serupa)
- status/kode opsional
- ringkasan kesalahan yang mudah dipahami manusia

Log `model_fallback_decision` terstruktur juga menyertakan bidang datar `fallbackStep*` ketika suatu kandidat gagal, dilewati, atau fallback berikutnya berhasil. Bidang-bidang ini membuat transisi yang dicoba menjadi eksplisit (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) sehingga pengekspor log dan diagnostik dapat merekonstruksi kegagalan utama meskipun fallback terakhir juga gagal.

Ketika setiap kandidat gagal, OpenClaw melempar `FallbackSummaryError`. Pelaksana balasan luar dapat menggunakannya untuk menyusun pesan yang lebih spesifik, seperti "semua model untuk sementara terkena pembatasan laju", dan menyertakan waktu berakhir cooldown paling awal jika diketahui.

Ringkasan cooldown tersebut mempertimbangkan model:

- pembatasan laju dengan cakupan model yang tidak terkait diabaikan untuk rantai penyedia/model yang dicoba
- jika pemblokiran yang tersisa adalah pembatasan laju dengan cakupan model yang cocok, OpenClaw melaporkan waktu berakhir terakhir yang cocok dan masih memblokir model tersebut

## Konfigurasi terkait

Lihat [konfigurasi Gateway](/id/gateway/configuration) untuk:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.authPermanentBackoffMinutes` / `auth.cooldowns.authPermanentMaxMinutes`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- perutean `agents.defaults.imageModel`

Lihat [Model](/id/concepts/models) untuk ikhtisar yang lebih luas tentang pemilihan model dan fallback.
