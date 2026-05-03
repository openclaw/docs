---
read_when:
    - Mengimplementasikan kait waktu proses penyedia, siklus hidup saluran, atau bundel paket
    - Pemecahan masalah urutan pemuatan Plugin atau status registri
    - Menambahkan kemampuan Plugin baru atau Plugin mesin konteks
summary: 'Internal arsitektur Plugin: pipeline pemuatan, registri, kait waktu jalan, rute HTTP, dan tabel referensi'
title: Internal arsitektur Plugin
x-i18n:
    generated_at: "2026-05-03T21:34:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898cbe2f97d666fc8bb2c2197cb786efb6d13a8842d8eb931fa3ce535bfd21fb
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Untuk model kemampuan publik, bentuk plugin, serta kontrak kepemilikan/eksekusi, lihat [Arsitektur plugin](/id/plugins/architecture). Halaman ini adalah referensi untuk mekanisme internal: pipeline pemuatan, registry, hook runtime, route HTTP Gateway, jalur impor, dan tabel skema.

## Pipeline pemuatan

Saat startup, OpenClaw secara garis besar melakukan ini:

1. menemukan root plugin kandidat
2. membaca manifes bundle native atau kompatibel dan metadata paket
3. menolak kandidat yang tidak aman
4. menormalkan config plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. menentukan pengaktifan untuk setiap kandidat
6. memuat modul native yang diaktifkan: modul bundel bawaan memakai loader native;
   sumber TypeScript lokal pihak ketiga memakai fallback Jiti darurat
7. memanggil hook native `register(api)` dan mengumpulkan registrasi ke registry plugin
8. mengekspos registry ke perintah/permukaan runtime

<Note>
`activate` adalah alias lama untuk `register` — loader menyelesaikan mana pun yang tersedia (`def.register ?? def.activate`) dan memanggilnya pada titik yang sama. Semua plugin bundel memakai `register`; utamakan `register` untuk plugin baru.
</Note>

Gate keamanan terjadi **sebelum** eksekusi runtime. Kandidat diblokir
ketika entri keluar dari root plugin, path dapat ditulis oleh semua pengguna, atau kepemilikan
path terlihat mencurigakan untuk plugin non-bundel.

Kandidat yang diblokir tetap terikat ke id plugin mereka untuk diagnostik. Jika config
masih merujuk id itu, validasi melaporkan plugin sebagai ada tetapi diblokir
dan mengarah kembali ke peringatan keamanan path alih-alih memperlakukan entri config
sebagai usang.

### Perilaku berbasis manifes

Manifes adalah sumber kebenaran control-plane. OpenClaw menggunakannya untuk:

- mengidentifikasi plugin
- menemukan channel/skills/skema config yang dideklarasikan atau kemampuan bundle
- memvalidasi `plugins.entries.<id>.config`
- melengkapi label/placeholder Control UI
- menampilkan metadata instal/katalog
- mempertahankan deskriptor aktivasi dan setup yang murah tanpa memuat runtime plugin

Untuk plugin native, modul runtime adalah bagian data-plane. Modul ini mendaftarkan
perilaku aktual seperti hook, tool, perintah, atau alur provider.

Blok manifes `activation` dan `setup` opsional tetap berada di control plane.
Keduanya adalah deskriptor metadata saja untuk perencanaan aktivasi dan penemuan setup;
keduanya tidak menggantikan registrasi runtime, `register(...)`, atau `setupEntry`.
Konsumen aktivasi live pertama sekarang memakai petunjuk perintah, channel, dan provider dari manifes
untuk mempersempit pemuatan plugin sebelum materialisasi registry yang lebih luas:

- pemuatan CLI mempersempit ke plugin yang memiliki perintah utama yang diminta
- resolusi setup/plugin channel mempersempit ke plugin yang memiliki id channel
  yang diminta
- resolusi setup/runtime provider eksplisit mempersempit ke plugin yang memiliki id provider
  yang diminta
- perencanaan startup Gateway memakai `activation.onStartup` untuk impor startup
  eksplisit dan opt-out startup; plugin tanpa metadata startup hanya dimuat
  melalui pemicu aktivasi yang lebih sempit

Preload runtime pada waktu permintaan yang meminta cakupan luas `all` tetap menurunkan
set id plugin efektif eksplisit dari config, perencanaan startup, channel yang dikonfigurasi,
slot, dan aturan auto-enable. Jika set turunan itu kosong, OpenClaw
memuat registry runtime kosong alih-alih memperluas ke setiap plugin yang dapat ditemukan.

Planner aktivasi mengekspos API hanya-id untuk caller yang ada dan API
plan untuk diagnostik baru. Entri plan melaporkan alasan plugin dipilih,
memisahkan petunjuk planner `activation.*` eksplisit dari fallback kepemilikan manifes
seperti `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, dan hook. Pemisahan alasan itu adalah batas kompatibilitas:
metadata plugin yang ada tetap berfungsi, sementara kode baru dapat mendeteksi petunjuk luas
atau perilaku fallback tanpa mengubah semantik pemuatan runtime.

Penemuan setup sekarang mengutamakan id milik deskriptor seperti `setup.providers` dan
`setup.cliBackends` untuk mempersempit plugin kandidat sebelum fallback ke
`setup-api` untuk plugin yang masih membutuhkan hook runtime saat setup. Daftar setup
provider memakai `providerAuthChoices` manifes, pilihan setup yang diturunkan dari deskriptor,
dan metadata katalog instal tanpa memuat runtime provider. `setup.requiresRuntime: false`
eksplisit adalah cutoff khusus deskriptor; `requiresRuntime` yang dihilangkan
mempertahankan fallback setup-api lama untuk kompatibilitas. Jika lebih dari satu
plugin yang ditemukan mengklaim id provider setup atau backend CLI yang dinormalkan sama,
lookup setup menolak owner yang ambigu alih-alih mengandalkan urutan penemuan. Saat runtime
setup benar-benar dijalankan, diagnostik registry melaporkan drift antara
`setup.providers` / `setup.cliBackends` dan provider atau backend CLI yang didaftarkan
oleh setup-api tanpa memblokir plugin lama.

### Batas cache plugin

OpenClaw tidak melakukan cache hasil penemuan plugin atau data registry manifes langsung
di balik jendela wall-clock. Instalasi, edit manifes, dan perubahan load-path
harus terlihat pada pembacaan metadata eksplisit berikutnya atau rebuild snapshot.
Parser file manifes dapat menyimpan cache tanda tangan file terbatas yang dikunci oleh
path manifes yang dibuka, inode, ukuran, dan timestamp; cache itu hanya menghindari
parsing ulang byte yang tidak berubah dan tidak boleh menyimpan jawaban penemuan,
registry, owner, atau policy.

Fast path metadata yang aman adalah kepemilikan objek eksplisit, bukan cache tersembunyi.
Hot path startup Gateway harus meneruskan `PluginMetadataSnapshot` saat ini,
`PluginLookUpTable` turunan, atau registry manifes eksplisit melalui rantai panggilan.
Validasi config, auto-enable startup, bootstrap plugin, dan pemilihan provider
dapat memakai ulang objek tersebut selama objek itu mewakili config dan inventaris
plugin saat ini. Lookup setup tetap merekonstruksi metadata manifes sesuai kebutuhan
kecuali path setup spesifik menerima registry manifes eksplisit; pertahankan itu
sebagai fallback cold-path alih-alih menambahkan cache lookup tersembunyi. Ketika input
berubah, rebuild dan ganti snapshot alih-alih memutasinya atau menyimpan
salinan historis.
View atas registry plugin aktif dan helper bootstrap channel bundel
harus dihitung ulang dari registry/root saat ini. Map berumur pendek boleh digunakan
dalam satu panggilan untuk dedupe pekerjaan atau menjaga reentry; map tersebut tidak boleh menjadi
cache metadata proses.

Untuk pemuatan plugin, lapisan cache persisten adalah pemuatan runtime. Lapisan ini dapat memakai ulang
state loader ketika kode atau artefak terinstal benar-benar dimuat, seperti:

- `PluginLoaderCacheState` dan registry runtime aktif yang kompatibel
- cache jiti/modul dan cache loader permukaan publik yang digunakan untuk menghindari impor
  permukaan runtime yang sama berulang kali
- cache filesystem untuk artefak plugin terinstal
- map per-panggilan berumur pendek untuk normalisasi path atau resolusi duplikat

Cache tersebut adalah detail implementasi data-plane. Cache tersebut tidak boleh menjawab
pertanyaan control-plane seperti "plugin mana yang memiliki provider ini?" kecuali
caller sengaja meminta pemuatan runtime.

Jangan tambahkan cache persisten atau wall-clock untuk:

- hasil penemuan
- registry manifes langsung
- registry manifes yang direkonstruksi dari indeks plugin terinstal
- lookup owner provider, supresi model, policy provider, atau metadata artefak publik
- jawaban turunan manifes lain apa pun ketika manifes, indeks terinstal,
  atau load path yang berubah harus terlihat pada pembacaan metadata berikutnya

Caller yang membangun ulang metadata manifes dari indeks plugin terinstal yang dipersistenkan
merekonstruksi registry tersebut sesuai kebutuhan. Indeks terinstal adalah state source-plane
yang durable; itu bukan cache metadata dalam proses yang tersembunyi.

## Model registry

Plugin yang dimuat tidak memutasi global core acak secara langsung. Plugin mendaftar ke
registry plugin pusat.

Registry melacak:

- record plugin (identitas, sumber, asal, status, diagnostik)
- tool
- hook legacy dan hook bertipe
- channel
- provider
- handler RPC gateway
- route HTTP
- registrar CLI
- layanan latar belakang
- perintah milik plugin

Fitur core kemudian membaca dari registry itu alih-alih berbicara langsung dengan modul plugin.
Ini menjaga pemuatan satu arah:

- modul plugin -> registrasi registry
- runtime core -> konsumsi registry

Pemisahan itu penting untuk kemudahan pemeliharaan. Artinya sebagian besar permukaan core hanya
membutuhkan satu titik integrasi: "baca registry", bukan "perlakukan setiap modul plugin
secara khusus".

## Callback pengikatan percakapan

Plugin yang mengikat percakapan dapat bereaksi ketika approval diselesaikan.

Gunakan `api.onConversationBindingResolved(...)` untuk menerima callback setelah permintaan bind
disetujui atau ditolak:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Field payload callback:

- `status`: `"approved"` atau `"denied"`
- `decision`: `"allow-once"`, `"allow-always"`, atau `"deny"`
- `binding`: binding yang diselesaikan untuk permintaan yang disetujui
- `request`: ringkasan permintaan asli, petunjuk detach, id pengirim, dan
  metadata percakapan

Callback ini hanya notifikasi. Callback ini tidak mengubah siapa yang diizinkan mengikat
percakapan, dan berjalan setelah penanganan approval core selesai.

## Hook runtime provider

Plugin provider memiliki tiga lapisan:

- **Metadata manifes** untuk lookup murah sebelum runtime:
  `setup.providers[].envVars`, kompatibilitas lama `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices`, dan `channelEnvVars`.
- **Hook saat config**: `catalog` (`discovery` legacy) plus
  `applyConfigDefaults`.
- **Hook runtime**: lebih dari 40 hook opsional yang mencakup auth, resolusi model,
  pembungkus stream, level thinking, policy replay, dan endpoint penggunaan. Lihat
  daftar lengkap di [Urutan dan penggunaan hook](#hook-order-and-usage).

OpenClaw tetap memiliki loop agent generik, failover, penanganan transkrip, dan
policy tool. Hook ini adalah permukaan ekstensi untuk perilaku spesifik provider
tanpa membutuhkan transport inferensi kustom utuh.

Gunakan `setup.providers[].envVars` manifes ketika provider memiliki kredensial berbasis env
yang harus terlihat oleh path auth/status/pemilih-model generik tanpa
memuat runtime plugin. `providerAuthEnvVars` yang deprecated masih dibaca oleh
adapter kompatibilitas selama jendela deprecation, dan plugin non-bundel
yang menggunakannya menerima diagnostik manifes. Gunakan `providerAuthAliases` manifes
ketika satu id provider harus memakai ulang env var, profil auth, auth berbasis config,
dan pilihan onboarding API-key milik id provider lain. Gunakan `providerAuthChoices` manifes
ketika permukaan CLI onboarding/pilihan-auth harus mengetahui id pilihan provider,
label grup, dan wiring auth satu-flag sederhana tanpa
memuat runtime provider. Pertahankan `envVars` runtime provider untuk petunjuk yang dihadapkan ke operator
seperti label onboarding atau var setup client-id/client-secret OAuth.

Gunakan `channelEnvVars` manifes ketika channel memiliki auth atau setup berbasis env yang
harus terlihat oleh fallback shell-env generik, pemeriksaan config/status, atau prompt setup
tanpa memuat runtime channel.

### Urutan dan penggunaan hook

Untuk plugin model/provider, OpenClaw memanggil hook dalam urutan kasar ini.
Kolom "Kapan digunakan" adalah panduan keputusan cepat.
Field provider khusus kompatibilitas yang tidak lagi dipanggil OpenClaw, seperti
`ProviderPlugin.capabilities` dan `suppressBuiltInModel`, sengaja tidak
dicantumkan di sini.

| #   | Hook                              | Fungsinya                                                                                                   | Kapan digunakan                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Menerbitkan konfigurasi penyedia ke `models.providers` selama pembuatan `models.json`                                | Penyedia memiliki katalog atau default URL dasar                                                                                                  |
| 2   | `applyConfigDefaults`             | Menerapkan default konfigurasi global milik penyedia selama materialisasi konfigurasi                                      | Default bergantung pada mode auth, env, atau semantik keluarga model penyedia                                                                         |
| --  | _(pencarian model bawaan)_         | OpenClaw mencoba jalur registry/katalog normal terlebih dahulu                                                          | _(bukan hook Plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | Menormalisasi alias model-id lawas atau pratinjau sebelum pencarian                                                     | Penyedia memiliki pembersihan alias sebelum resolusi model kanonis                                                                                 |
| 4   | `normalizeTransport`              | Menormalisasi `api` / `baseUrl` keluarga penyedia sebelum perakitan model generik                                      | Penyedia memiliki pembersihan transport untuk id penyedia kustom dalam keluarga transport yang sama                                                          |
| 5   | `normalizeConfig`                 | Menormalisasi `models.providers.<id>` sebelum resolusi runtime/penyedia                                           | Penyedia memerlukan pembersihan konfigurasi yang seharusnya berada bersama Plugin; helper keluarga Google bawaan juga menopang entri konfigurasi Google yang didukung   |
| 6   | `applyNativeStreamingUsageCompat` | Menerapkan penulisan ulang kompat native streaming-usage ke penyedia konfigurasi                                               | Penyedia memerlukan perbaikan metadata penggunaan streaming native yang digerakkan endpoint                                                                          |
| 7   | `resolveConfigApiKey`             | Meresolusikan auth penanda env untuk penyedia konfigurasi sebelum pemuatan auth runtime                                       | Penyedia memiliki resolusi API-key penanda env milik penyedia; `amazon-bedrock` juga memiliki resolver penanda env AWS bawaan di sini                  |
| 8   | `resolveSyntheticAuth`            | Memunculkan auth lokal/self-hosted atau berbasis konfigurasi tanpa menyimpan plaintext                                   | Penyedia dapat beroperasi dengan penanda kredensial sintetis/lokal                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | Melapisi profil auth eksternal milik penyedia; default `persistence` adalah `runtime-only` untuk kredensial milik CLI/aplikasi | Penyedia menggunakan kembali kredensial auth eksternal tanpa menyimpan token refresh yang disalin; deklarasikan `contracts.externalAuthProviders` di manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Menurunkan prioritas placeholder profil sintetis tersimpan di belakang auth berbasis env/konfigurasi                                      | Penyedia menyimpan profil placeholder sintetis yang tidak boleh menang dalam prioritas                                                                 |
| 11  | `resolveDynamicModel`             | Fallback sinkron untuk id model milik penyedia yang belum ada di registry lokal                                       | Penyedia menerima id model upstream sembarang                                                                                                 |
| 12  | `prepareDynamicModel`             | Pemanasan asinkron, lalu `resolveDynamicModel` berjalan lagi                                                           | Penyedia memerlukan metadata jaringan sebelum meresolusikan id yang tidak dikenal                                                                                  |
| 13  | `normalizeResolvedModel`          | Penulisan ulang akhir sebelum runner tertanam menggunakan model yang telah diresolusikan                                               | Penyedia memerlukan penulisan ulang transport tetapi tetap menggunakan transport inti                                                                             |
| 14  | `contributeResolvedModelCompat`   | Menyumbangkan flag kompat untuk model vendor di belakang transport lain yang kompatibel                                  | Penyedia mengenali modelnya sendiri pada transport proxy tanpa mengambil alih penyedia                                                       |
| 15  | `normalizeToolSchemas`            | Menormalisasi skema tool sebelum runner tertanam melihatnya                                                    | Penyedia memerlukan pembersihan skema keluarga transport                                                                                                |
| 16  | `inspectToolSchemas`              | Memunculkan diagnostik skema milik penyedia setelah normalisasi                                                  | Penyedia menginginkan peringatan kata kunci tanpa mengajari core aturan khusus penyedia                                                                 |
| 17  | `resolveReasoningOutputMode`      | Memilih kontrak output reasoning native vs bertag                                                              | Penyedia memerlukan reasoning/output akhir bertag alih-alih field native                                                                         |
| 18  | `prepareExtraParams`              | Normalisasi param permintaan sebelum wrapper opsi stream generik                                              | Penyedia memerlukan param permintaan default atau pembersihan param per penyedia                                                                           |
| 19  | `createStreamFn`                  | Mengganti sepenuhnya jalur stream normal dengan transport kustom                                                   | Penyedia memerlukan protokol wire kustom, bukan sekadar wrapper                                                                                     |
| 20  | `wrapStreamFn`                    | Wrapper stream setelah wrapper generik diterapkan                                                              | Penyedia memerlukan wrapper kompat header/body/model permintaan tanpa transport kustom                                                          |
| 21  | `resolveTransportTurnState`       | Melampirkan header atau metadata transport native per turn                                                           | Penyedia ingin transport generik mengirim identitas turn native penyedia                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | Melampirkan header WebSocket native atau kebijakan jeda sesi                                                    | Penyedia ingin transport WS generik menyesuaikan header sesi atau kebijakan fallback                                                               |
| 23  | `formatApiKey`                    | Formatter profil auth: profil tersimpan menjadi string `apiKey` runtime                                     | Penyedia menyimpan metadata auth tambahan dan memerlukan bentuk token runtime kustom                                                                    |
| 24  | `refreshOAuth`                    | Override refresh OAuth untuk endpoint refresh kustom atau kebijakan kegagalan refresh                                  | Penyedia tidak cocok dengan refresher `pi-ai` bersama                                                                                           |
| 25  | `buildAuthDoctorHint`             | Petunjuk perbaikan yang ditambahkan saat refresh OAuth gagal                                                                  | Penyedia memerlukan panduan perbaikan auth milik penyedia setelah kegagalan refresh                                                                      |
| 26  | `matchesContextOverflowError`     | Pencocok overflow context-window milik penyedia                                                                 | Penyedia memiliki error overflow mentah yang akan terlewat oleh heuristik generik                                                                                |
| 27  | `classifyFailoverReason`          | Klasifikasi alasan failover milik penyedia                                                                  | Penyedia dapat memetakan error API/transport mentah ke rate-limit/overload/dll.                                                                          |
| 28  | `isCacheTtlEligible`              | Kebijakan prompt-cache untuk penyedia proxy/backhaul                                                               | Penyedia memerlukan gating TTL cache khusus proxy                                                                                                |
| 29  | `buildMissingAuthMessage`         | Pengganti pesan pemulihan missing-auth generik                                                      | Penyedia memerlukan petunjuk pemulihan missing-auth khusus penyedia                                                                                 |
| 30  | `augmentModelCatalog`             | Baris katalog sintetis/akhir yang ditambahkan setelah discovery                                                          | Penyedia memerlukan baris kompat maju sintetis di `models list` dan picker                                                                     |
| 31  | `resolveThinkingProfile`          | Set level `/think` khusus model, label tampilan, dan default                                                 | Penyedia mengekspos ladder thinking kustom atau label biner untuk model yang dipilih                                                                 |
| 32  | `isBinaryThinking`                | Hook kompatibilitas toggle reasoning aktif/nonaktif                                                                     | Penyedia hanya mengekspos thinking biner aktif/nonaktif                                                                                                  |
| 33  | `supportsXHighThinking`           | Hook kompatibilitas dukungan reasoning `xhigh`                                                                   | Penyedia menginginkan `xhigh` hanya pada subset model                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | Hook kompatibilitas level `/think` default                                                                      | Penyedia memiliki kebijakan `/think` default untuk keluarga model                                                                                      |
| 35  | `isModernModelRef`                | Pencocok model modern untuk filter profil live dan pemilihan smoke                                              | Penyedia memiliki pencocokan model pilihan live/smoke                                                                                             |
| 36  | `prepareRuntimeAuth`              | Menukar kredensial terkonfigurasi menjadi token/kunci runtime aktual tepat sebelum inferensi                       | Penyedia memerlukan pertukaran token atau kredensial permintaan berumur pendek                                                                             |
| 37  | `resolveUsageAuth`                | Menentukan kredensial penggunaan/penagihan untuk `/usage` dan permukaan status terkait                                     | Penyedia memerlukan penguraian token penggunaan/kuota khusus atau kredensial penggunaan yang berbeda                                                               |
| 38  | `fetchUsageSnapshot`              | Mengambil dan menormalkan snapshot penggunaan/kuota khusus penyedia setelah autentikasi diselesaikan                             | Penyedia memerlukan endpoint penggunaan khusus penyedia atau pengurai payload                                                                           |
| 39  | `createEmbeddingProvider`         | Membangun adaptor embedding milik penyedia untuk memori/pencarian                                                     | Perilaku embedding memori berada di Plugin penyedia                                                                                    |
| 40  | `buildReplayPolicy`               | Mengembalikan kebijakan replay yang mengontrol penanganan transkrip untuk penyedia                                        | Penyedia memerlukan kebijakan transkrip khusus (misalnya, penghapusan blok pemikiran)                                                               |
| 41  | `sanitizeReplayHistory`           | Menulis ulang riwayat replay setelah pembersihan transkrip generik                                                        | Penyedia memerlukan penulisan ulang replay khusus penyedia di luar helper Compaction bersama                                                             |
| 42  | `validateReplayTurns`             | Validasi akhir giliran replay atau pembentukan ulang sebelum runner tertanam                                           | Transport penyedia memerlukan validasi giliran yang lebih ketat setelah sanitasi generik                                                                    |
| 43  | `onModelSelected`                 | Menjalankan efek samping pasca-pemilihan milik penyedia                                                                 | Penyedia memerlukan telemetri atau status milik penyedia saat model menjadi aktif                                                                  |

`normalizeModelId`, `normalizeTransport`, dan `normalizeConfig` terlebih dahulu memeriksa
plugin penyedia yang cocok, lalu melanjutkan ke plugin penyedia lain yang mendukung hook
hingga ada yang benar-benar mengubah id model atau transport/config. Itu menjaga
shim alias/compat penyedia tetap berfungsi tanpa mengharuskan pemanggil mengetahui
plugin bawaan mana yang memiliki penulisan ulang tersebut. Jika tidak ada hook penyedia
yang menulis ulang entri config keluarga Google yang didukung, normalizer config
Google bawaan tetap menerapkan pembersihan kompatibilitas tersebut.

Jika penyedia membutuhkan protokol wire yang sepenuhnya kustom atau eksekutor permintaan
kustom, itu adalah kelas ekstensi yang berbeda. Hook ini ditujukan untuk perilaku penyedia
yang tetap berjalan pada loop inferensi normal OpenClaw.

### Contoh penyedia

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Contoh bawaan

Plugin penyedia bawaan menggabungkan hook di atas agar sesuai dengan kebutuhan katalog,
auth, thinking, replay, dan penggunaan masing-masing vendor. Set hook yang otoritatif berada bersama
setiap plugin di bawah `extensions/`; halaman ini menggambarkan bentuknya, bukan
mencerminkan daftarnya.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI mendaftarkan `catalog` ditambah
    `resolveDynamicModel` / `prepareDynamicModel` agar mereka dapat menampilkan id
    model upstream sebelum katalog statis OpenClaw.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai memasangkan
    `prepareRuntimeAuth` atau `formatApiKey` dengan `resolveUsageAuth` +
    `fetchUsageSnapshot` untuk memiliki pertukaran token dan integrasi `/usage`.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Keluarga bernama bersama (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) memungkinkan penyedia ikut memakai
    kebijakan transkrip melalui `buildReplayPolicy` alih-alih setiap plugin
    mengimplementasikan ulang pembersihan.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`, dan
    `volcengine` hanya mendaftarkan `catalog` dan menggunakan loop inferensi bersama.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Header beta, `/fast` / `serviceTier`, dan `context1m` berada di dalam
    seam publik `api.ts` / `contract-api.ts` milik plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), bukan di
    SDK generik.
  </Accordion>
</AccordionGroup>

## Helper runtime

Plugin dapat mengakses helper inti tertentu melalui `api.runtime`. Untuk TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Catatan:

- `textToSpeech` mengembalikan payload output TTS inti normal untuk permukaan file/catatan suara.
- Menggunakan konfigurasi inti `messages.tts` dan pemilihan penyedia.
- Mengembalikan buffer audio PCM + laju sampel. Plugin harus melakukan resampling/encoding untuk penyedia.
- `listVoices` bersifat opsional per penyedia. Gunakan untuk pemilih suara atau alur penyiapan milik vendor.
- Daftar suara dapat menyertakan metadata yang lebih kaya seperti lokal, gender, dan tag kepribadian untuk pemilih yang sadar penyedia.
- OpenAI dan ElevenLabs mendukung telefoni saat ini. Microsoft tidak.

Plugin juga dapat mendaftarkan penyedia ucapan melalui `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Catatan:

- Pertahankan kebijakan TTS, fallback, dan pengiriman balasan di inti.
- Gunakan penyedia ucapan untuk perilaku sintesis milik vendor.
- Input Microsoft lama `edge` dinormalisasi ke id penyedia `microsoft`.
- Model kepemilikan yang disarankan berorientasi perusahaan: satu plugin vendor dapat memiliki
  penyedia teks, ucapan, gambar, dan media masa depan seiring OpenClaw menambahkan
  kontrak kemampuan tersebut.

Untuk pemahaman gambar/audio/video, plugin mendaftarkan satu penyedia
pemahaman media bertipe, bukan bag key/value generik:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Catatan:

- Pertahankan orkestrasi, fallback, config, dan wiring channel di inti.
- Pertahankan perilaku vendor di plugin penyedia.
- Ekspansi aditif harus tetap bertipe: metode opsional baru, field hasil opsional baru, kemampuan opsional baru.
- Pembuatan video sudah mengikuti pola yang sama:
  - inti memiliki kontrak kemampuan dan helper runtime
  - plugin vendor mendaftarkan `api.registerVideoGenerationProvider(...)`
  - plugin fitur/channel menggunakan `api.runtime.videoGeneration.*`

Untuk helper runtime pemahaman media, plugin dapat memanggil:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Untuk transkripsi audio, plugin dapat menggunakan runtime pemahaman media
atau alias STT yang lebih lama:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Catatan:

- `api.runtime.mediaUnderstanding.*` adalah permukaan bersama yang disarankan untuk
  pemahaman gambar/audio/video.
- Menggunakan konfigurasi audio pemahaman media inti (`tools.media.audio`) dan urutan fallback penyedia.
- Mengembalikan `{ text: undefined }` ketika tidak ada output transkripsi yang dihasilkan (misalnya input dilewati/tidak didukung).
- `api.runtime.stt.transcribeAudioFile(...)` tetap ada sebagai alias kompatibilitas.

Plugin juga dapat meluncurkan run subagen latar belakang melalui `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Catatan:

- `provider` dan `model` adalah override opsional per run, bukan perubahan sesi persisten.
- OpenClaw hanya menghormati field override tersebut untuk pemanggil tepercaya.
- Untuk run fallback milik plugin, operator harus ikut serta dengan `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gunakan `plugins.entries.<id>.subagent.allowedModels` untuk membatasi plugin tepercaya ke target kanonis `provider/model` tertentu, atau `"*"` untuk mengizinkan target apa pun secara eksplisit.
- Run subagen plugin yang tidak tepercaya tetap berfungsi, tetapi permintaan override ditolak alih-alih diam-diam memakai fallback.
- Sesi subagen yang dibuat plugin ditandai dengan id plugin pembuatnya. Fallback `api.runtime.subagent.deleteSession(...)` hanya dapat menghapus sesi yang dimiliki tersebut; penghapusan sesi arbitrer tetap memerlukan permintaan Gateway berskop admin.

Untuk pencarian web, plugin dapat menggunakan helper runtime bersama alih-alih
masuk ke wiring alat agen:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Plugin juga dapat mendaftarkan penyedia pencarian web melalui
`api.registerWebSearchProvider(...)`.

Catatan:

- Pertahankan pemilihan penyedia, resolusi kredensial, dan semantik permintaan bersama di inti.
- Gunakan penyedia pencarian web untuk transport pencarian spesifik vendor.
- `api.runtime.webSearch.*` adalah permukaan bersama yang disarankan untuk plugin fitur/channel yang membutuhkan perilaku pencarian tanpa bergantung pada wrapper alat agen.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: menghasilkan gambar menggunakan rantai penyedia pembuatan gambar yang dikonfigurasi.
- `listProviders(...)`: mencantumkan penyedia pembuatan gambar yang tersedia dan kemampuannya.

## Rute HTTP Gateway

Plugin dapat mengekspos endpoint HTTP dengan `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Field rute:

- `path`: path rute di bawah server HTTP gateway.
- `auth`: wajib. Gunakan `"gateway"` untuk mewajibkan auth gateway normal, atau `"plugin"` untuk verifikasi auth/webhook yang dikelola plugin.
- `match`: opsional. `"exact"` (default) atau `"prefix"`.
- `replaceExisting`: opsional. Memungkinkan plugin yang sama mengganti registrasi rute miliknya yang sudah ada.
- `handler`: kembalikan `true` ketika rute menangani permintaan.

Catatan:

- `api.registerHttpHandler(...)` telah dihapus dan akan menyebabkan error pemuatan plugin. Gunakan `api.registerHttpRoute(...)` sebagai gantinya.
- Route Plugin harus mendeklarasikan `auth` secara eksplisit.
- Konflik `path + match` yang persis ditolak kecuali `replaceExisting: true`, dan satu Plugin tidak dapat menggantikan route milik Plugin lain.
- Route yang tumpang tindih dengan level `auth` berbeda ditolak. Pertahankan rantai fallthrough `exact`/`prefix` hanya pada level auth yang sama.
- Route `auth: "plugin"` **tidak** menerima cakupan runtime operator secara otomatis. Route ini ditujukan untuk webhook/verifikasi tanda tangan yang dikelola Plugin, bukan panggilan helper Gateway yang memiliki privilese.
- Route `auth: "gateway"` berjalan di dalam cakupan runtime permintaan Gateway, tetapi cakupan itu sengaja konservatif:
  - auth bearer shared-secret (`gateway.auth.mode = "token"` / `"password"`) mempertahankan cakupan runtime route Plugin tetap pada `operator.write`, bahkan jika pemanggil mengirim `x-openclaw-scopes`
  - mode HTTP tepercaya yang membawa identitas (misalnya `trusted-proxy` atau `gateway.auth.mode = "none"` pada ingress privat) menghormati `x-openclaw-scopes` hanya ketika header tersebut ada secara eksplisit
  - jika `x-openclaw-scopes` tidak ada pada permintaan route Plugin yang membawa identitas tersebut, cakupan runtime kembali ke `operator.write`
- Aturan praktis: jangan menganggap route Plugin dengan auth gateway sebagai permukaan admin implisit. Jika route Anda memerlukan perilaku khusus admin, wajibkan mode auth yang membawa identitas dan dokumentasikan kontrak header `x-openclaw-scopes` yang eksplisit.

## Jalur impor SDK Plugin

Gunakan subjalur SDK yang sempit alih-alih barrel root `openclaw/plugin-sdk` yang monolitik saat membuat Plugin baru. Subjalur inti:

| Subjalur                            | Tujuan                                             |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitif pendaftaran Plugin                       |
| `openclaw/plugin-sdk/channel-core`  | Helper entri/pembuatan saluran                    |
| `openclaw/plugin-sdk/core`          | Helper bersama generik dan kontrak payung         |
| `openclaw/plugin-sdk/config-schema` | Skema Zod root `openclaw.json` (`OpenClawSchema`) |

Plugin saluran memilih dari rangkaian seam yang sempit — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, dan `channel-actions`. Perilaku persetujuan sebaiknya dikonsolidasikan
pada satu kontrak `approvalCapability` alih-alih mencampurnya di berbagai
field Plugin yang tidak terkait. Lihat [Plugin saluran](/id/plugins/sdk-channel-plugins).

Helper runtime dan konfigurasi berada di bawah subjalur `*-runtime` yang
terfokus dan sesuai (`approval-runtime`, `agent-runtime`, `lazy-runtime`,
`directory-runtime`, `text-runtime`, `runtime-store`, `system-event-runtime`,
`heartbeat-runtime`, `channel-activity-runtime`, dll.). Utamakan `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot`, dan `config-mutation`
alih-alih barrel kompatibilitas `config-runtime` yang luas.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
dan `openclaw/plugin-sdk/infra-runtime` adalah shim kompatibilitas yang tidak lagi disarankan untuk
Plugin lama. Kode baru sebaiknya mengimpor primitif generik yang lebih sempit.
</Info>

Titik entri internal repo (per root paket Plugin bawaan):

- `index.js` — entri Plugin bawaan
- `api.js` — barrel helper/tipe
- `runtime-api.js` — barrel khusus runtime
- `setup-entry.js` — entri Plugin setup

Plugin eksternal sebaiknya hanya mengimpor subjalur `openclaw/plugin-sdk/*`. Jangan pernah
mengimpor `src/*` milik paket Plugin lain dari core atau dari Plugin lain.
Titik entri yang dimuat melalui facade mengutamakan snapshot konfigurasi runtime aktif jika ada,
lalu fallback ke file konfigurasi yang di-resolve di disk.

Subjalur khusus capability seperti `image-generation`, `media-understanding`,
dan `speech` ada karena Plugin bawaan menggunakannya saat ini. Subjalur tersebut tidak
otomatis menjadi kontrak eksternal jangka panjang yang dibekukan — periksa halaman referensi SDK
yang relevan saat bergantung padanya.

## Skema alat pesan

Plugin sebaiknya memiliki kontribusi skema `describeMessageTool(...)` khusus saluran
untuk primitif non-pesan seperti reaksi, tanda baca, dan polling.
Presentasi pengiriman bersama sebaiknya menggunakan kontrak generik `MessagePresentation`
alih-alih field tombol, komponen, blok, atau kartu native penyedia.
Lihat [Presentasi Pesan](/id/plugins/message-presentation) untuk kontrak,
aturan fallback, pemetaan penyedia, dan checklist penulis Plugin.

Plugin yang dapat mengirim mendeklarasikan apa yang dapat dirender melalui capability pesan:

- `presentation` untuk blok presentasi semantik (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` untuk permintaan pengiriman yang disematkan

Core memutuskan apakah akan merender presentasi secara native atau menurunkannya menjadi teks.
Jangan mengekspos escape hatch UI native penyedia dari alat pesan generik.
Helper SDK yang tidak lagi disarankan untuk skema native lama tetap diekspor untuk Plugin
pihak ketiga yang sudah ada, tetapi Plugin baru sebaiknya tidak menggunakannya.

## Resolusi target saluran

Plugin saluran sebaiknya memiliki semantik target khusus saluran. Pertahankan host
outbound bersama tetap generik dan gunakan permukaan adapter pesan untuk aturan penyedia:

- `messaging.inferTargetChatType({ to })` menentukan apakah target yang dinormalisasi
  harus diperlakukan sebagai `direct`, `group`, atau `channel` sebelum lookup direktori.
- `messaging.targetResolver.looksLikeId(raw, normalized)` memberi tahu core apakah
  input harus langsung menuju resolusi mirip id alih-alih pencarian direktori.
- `messaging.targetResolver.resolveTarget(...)` adalah fallback Plugin ketika
  core memerlukan resolusi akhir milik penyedia setelah normalisasi atau setelah
  direktori tidak menemukan hasil.
- `messaging.resolveOutboundSessionRoute(...)` memiliki konstruksi route sesi
  khusus penyedia setelah target di-resolve.

Pembagian yang direkomendasikan:

- Gunakan `inferTargetChatType` untuk keputusan kategori yang harus terjadi sebelum
  mencari peers/grup.
- Gunakan `looksLikeId` untuk pemeriksaan "perlakukan ini sebagai id target eksplisit/native".
- Gunakan `resolveTarget` untuk fallback normalisasi khusus penyedia, bukan untuk
  pencarian direktori yang luas.
- Simpan id native penyedia seperti id chat, id thread, JID, handle, dan id room
  di dalam nilai `target` atau params khusus penyedia, bukan di field SDK generik.

## Direktori berbasis konfigurasi

Plugin yang menurunkan entri direktori dari konfigurasi sebaiknya mempertahankan logika itu di
Plugin dan menggunakan ulang helper bersama dari
`openclaw/plugin-sdk/directory-runtime`.

Gunakan ini ketika saluran memerlukan peers/grup berbasis konfigurasi seperti:

- peer DM yang digerakkan oleh allowlist
- peta saluran/grup yang dikonfigurasi
- fallback direktori statis dalam cakupan akun

Helper bersama di `directory-runtime` hanya menangani operasi generik:

- pemfilteran kueri
- penerapan batas
- helper deduplikasi/normalisasi
- pembuatan `ChannelDirectoryEntry[]`

Inspeksi akun dan normalisasi id khusus saluran sebaiknya tetap berada dalam
implementasi Plugin.

## Katalog penyedia

Plugin penyedia dapat mendefinisikan katalog model untuk inferensi dengan
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` mengembalikan bentuk yang sama seperti yang ditulis OpenClaw ke
`models.providers`:

- `{ provider }` untuk satu entri penyedia
- `{ providers }` untuk beberapa entri penyedia

Gunakan `catalog` ketika Plugin memiliki id model khusus penyedia, default URL dasar,
atau metadata model yang dibatasi auth.

`catalog.order` mengontrol kapan katalog Plugin digabung relatif terhadap penyedia implisit
bawaan OpenClaw:

- `simple`: penyedia berbasis API-key polos atau env
- `profile`: penyedia yang muncul ketika profil auth ada
- `paired`: penyedia yang menyintesis beberapa entri penyedia terkait
- `late`: lintasan terakhir, setelah penyedia implisit lainnya

Penyedia yang lebih belakangan menang pada tabrakan key, sehingga Plugin dapat secara sengaja mengganti
entri penyedia bawaan dengan id penyedia yang sama.

Kompatibilitas:

- `discovery` masih berfungsi sebagai alias lama
- jika `catalog` dan `discovery` sama-sama didaftarkan, OpenClaw menggunakan `catalog`

## Inspeksi saluran read-only

Jika Plugin Anda mendaftarkan saluran, utamakan penerapan
`plugin.config.inspectAccount(cfg, accountId)` bersama `resolveAccount(...)`.

Alasannya:

- `resolveAccount(...)` adalah jalur runtime. Jalur ini boleh mengasumsikan kredensial
  telah dimaterialisasi sepenuhnya dan dapat gagal cepat ketika secret yang diperlukan tidak ada.
- Jalur perintah read-only seperti `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, dan alur perbaikan
  doctor/config tidak seharusnya perlu mematerialisasi kredensial runtime hanya untuk
  mendeskripsikan konfigurasi.

Perilaku `inspectAccount(...)` yang direkomendasikan:

- Kembalikan hanya status akun deskriptif.
- Pertahankan `enabled` dan `configured`.
- Sertakan field sumber/status kredensial ketika relevan, seperti:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Anda tidak perlu mengembalikan nilai token mentah hanya untuk melaporkan
  ketersediaan read-only. Mengembalikan `tokenStatus: "available"` (dan field sumber
  yang sesuai) sudah cukup untuk perintah bergaya status.
- Gunakan `configured_unavailable` ketika kredensial dikonfigurasi melalui SecretRef tetapi
  tidak tersedia di jalur perintah saat ini.

Ini memungkinkan perintah read-only melaporkan "dikonfigurasi tetapi tidak tersedia di jalur
perintah ini" alih-alih crash atau salah melaporkan akun sebagai tidak dikonfigurasi.

## Pack paket

Direktori Plugin dapat menyertakan `package.json` dengan `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Setiap entri menjadi Plugin. Jika pack mencantumkan beberapa ekstensi, id Plugin
menjadi `name/<fileBase>`.

Jika Plugin Anda mengimpor deps npm, instal deps tersebut di direktori itu agar
`node_modules` tersedia (`npm install` / `pnpm install`).

Guardrail keamanan: setiap entri `openclaw.extensions` harus tetap berada di dalam direktori Plugin
setelah resolusi symlink. Entri yang keluar dari direktori paket ditolak.

Catatan keamanan: `openclaw plugins install` menginstal dependensi Plugin dengan
`npm install --omit=dev --ignore-scripts` lokal proyek (tanpa skrip lifecycle,
tanpa dependensi dev saat runtime), mengabaikan pengaturan npm install global yang diwarisi.
Pertahankan pohon dependensi Plugin sebagai "JS/TS murni" dan hindari paket yang memerlukan
build `postinstall`.

Opsional: `openclaw.setupEntry` dapat menunjuk ke modul khusus setup yang ringan.
Ketika OpenClaw memerlukan permukaan setup untuk Plugin saluran yang dinonaktifkan, atau
ketika Plugin saluran diaktifkan tetapi masih belum dikonfigurasi, OpenClaw memuat `setupEntry`
alih-alih entri Plugin penuh. Ini membuat startup dan setup lebih ringan
ketika entri Plugin utama Anda juga merangkai alat, hook, atau kode khusus runtime lainnya.

Opsional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
dapat membuat Plugin saluran menggunakan jalur `setupEntry` yang sama selama fase startup
pra-listen Gateway, bahkan ketika saluran sudah dikonfigurasi.

Gunakan ini hanya ketika `setupEntry` sepenuhnya mencakup permukaan startup yang harus ada
sebelum Gateway mulai mendengarkan. Dalam praktiknya, itu berarti entri setup
harus mendaftarkan setiap capability milik saluran yang dibutuhkan startup, seperti:

- pendaftaran saluran itu sendiri
- route HTTP apa pun yang harus tersedia sebelum Gateway mulai mendengarkan
- metode, alat, atau layanan Gateway apa pun yang harus ada selama jendela yang sama

Jika entri penuh Anda masih memiliki capability startup wajib apa pun, jangan aktifkan
flag ini. Pertahankan Plugin pada perilaku default dan biarkan OpenClaw memuat
entri penuh selama startup.

Saluran bawaan juga dapat memublikasikan helper permukaan kontrak khusus setup yang dapat
dikonsultasikan core sebelum runtime saluran penuh dimuat. Permukaan promosi setup
saat ini adalah:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core menggunakan permukaan itu ketika perlu mempromosikan konfigurasi saluran akun tunggal lama ke `channels.<id>.accounts.*` tanpa memuat entri Plugin penuh. Matrix adalah contoh bundel saat ini: ia hanya memindahkan kunci auth/bootstrap ke akun bernama yang dipromosikan ketika akun bernama sudah ada, dan dapat mempertahankan kunci akun default non-kanonis yang dikonfigurasi alih-alih selalu membuat `accounts.default`.

Adapter patch penyiapan tersebut menjaga penemuan permukaan kontrak bundel tetap lazy. Waktu impor tetap ringan; permukaan promosi dimuat hanya saat pertama kali digunakan alih-alih memasuki ulang startup saluran bundel saat impor modul.

Ketika permukaan startup tersebut menyertakan metode RPC Gateway, pertahankan pada prefiks khusus Plugin. Namespace admin core (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu di-resolve ke `operator.admin`, meskipun Plugin meminta cakupan yang lebih sempit.

Contoh:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Metadata katalog saluran

Plugin saluran dapat mengiklankan metadata penyiapan/penemuan melalui `openclaw.channel` dan petunjuk instalasi melalui `openclaw.install`. Ini menjaga katalog core tetap bebas data.

Contoh:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Field `openclaw.channel` yang berguna di luar contoh minimal:

- `detailLabel`: label sekunder untuk permukaan katalog/status yang lebih kaya
- `docsLabel`: menimpa teks tautan untuk tautan dokumen
- `preferOver`: id Plugin/saluran berprioritas lebih rendah yang harus dikalahkan oleh entri katalog ini
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrol salinan permukaan pemilihan
- `markdownCapable`: menandai saluran sebagai mendukung markdown untuk keputusan pemformatan keluar
- `exposure.configured`: sembunyikan saluran dari permukaan daftar saluran terkonfigurasi ketika diatur ke `false`
- `exposure.setup`: sembunyikan saluran dari pemilih penyiapan/konfigurasi interaktif ketika diatur ke `false`
- `exposure.docs`: tandai saluran sebagai internal/privat untuk permukaan navigasi dokumen
- `showConfigured` / `showInSetup`: alias lama yang masih diterima untuk kompatibilitas; utamakan `exposure`
- `quickstartAllowFrom`: ikutkan saluran ke alur quickstart standar `allowFrom`
- `forceAccountBinding`: wajibkan pengikatan akun eksplisit meskipun hanya ada satu akun
- `preferSessionLookupForAnnounceTarget`: utamakan pencarian sesi saat me-resolve target pengumuman

OpenClaw juga dapat menggabungkan **katalog saluran eksternal** (misalnya, ekspor registry MPM). Letakkan file JSON di salah satu dari:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Atau arahkan `OPENCLAW_PLUGIN_CATALOG_PATHS` (atau `OPENCLAW_MPM_CATALOG_PATHS`) ke satu atau beberapa file JSON (dipisahkan koma/titik koma/`PATH`). Setiap file harus berisi `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser juga menerima `"packages"` atau `"plugins"` sebagai alias lama untuk kunci `"entries"`.

Entri katalog saluran yang dihasilkan dan entri katalog instalasi penyedia mengekspos fakta sumber instalasi yang dinormalisasi di samping blok mentah `openclaw.install`. Fakta yang dinormalisasi mengidentifikasi apakah spec npm adalah versi eksak atau selector mengambang, apakah metadata integritas yang diharapkan tersedia, dan apakah path sumber lokal juga tersedia. Ketika identitas katalog/paket diketahui, fakta yang dinormalisasi memperingatkan jika nama paket npm yang di-parse menyimpang dari identitas tersebut. Fakta tersebut juga memperingatkan ketika `defaultChoice` tidak valid atau menunjuk ke sumber yang tidak tersedia, dan ketika metadata integritas npm tersedia tanpa sumber npm yang valid. Konsumen harus memperlakukan `installSource` sebagai field opsional aditif sehingga entri buatan tangan dan shim katalog tidak perlu menyintesisnya. Ini memungkinkan onboarding dan diagnostik menjelaskan status bidang sumber tanpa mengimpor runtime Plugin.

Entri npm eksternal resmi sebaiknya mengutamakan `npmSpec` eksak plus `expectedIntegrity`. Nama paket polos dan dist-tag tetap berfungsi untuk kompatibilitas, tetapi memunculkan peringatan bidang sumber agar katalog dapat bergerak menuju instalasi yang dipin dan diperiksa integritasnya tanpa merusak Plugin yang sudah ada. Ketika onboarding menginstal dari path katalog lokal, ia merekam entri indeks Plugin terkelola dengan `source: "path"` dan `sourcePath` relatif workspace bila memungkinkan. Path pemuatan operasional absolut tetap berada di `plugins.load.paths`; catatan instalasi menghindari duplikasi path workstation lokal ke dalam konfigurasi jangka panjang. Ini membuat instalasi pengembangan lokal terlihat oleh diagnostik bidang sumber tanpa menambahkan permukaan pengungkapan path filesystem mentah kedua. Indeks Plugin `plugins/installs.json` yang dipertahankan adalah sumber kebenaran instalasi dan dapat disegarkan tanpa memuat modul runtime Plugin. Map `installRecords`-nya tetap tahan lama meskipun manifes Plugin hilang atau tidak valid; array `plugins`-nya adalah tampilan manifes yang dapat dibangun ulang.

## Plugin mesin konteks

Plugin mesin konteks memiliki orkestrasi konteks sesi untuk ingest, assembly, dan Compaction. Daftarkan dari Plugin Anda dengan `api.registerContextEngine(id, factory)`, lalu pilih mesin aktif dengan `plugins.slots.contextEngine`.

Gunakan ini ketika Plugin Anda perlu mengganti atau memperluas pipeline konteks default, bukan hanya menambahkan pencarian memori atau hook.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Factory `ctx` mengekspos nilai opsional `config`, `agentDir`, dan `workspaceDir` untuk inisialisasi saat konstruksi.

Jika mesin Anda **tidak** memiliki algoritma Compaction, tetap implementasikan `compact()` dan delegasikan secara eksplisit:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", (ctx) => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Menambahkan kapabilitas baru

Ketika Plugin memerlukan perilaku yang tidak cocok dengan API saat ini, jangan melewati sistem Plugin dengan akses privat ke dalam. Tambahkan kapabilitas yang belum ada.

Urutan yang direkomendasikan:

1. definisikan kontrak core
   Tentukan perilaku bersama apa yang harus dimiliki core: kebijakan, fallback, penggabungan konfigurasi, lifecycle, semantik yang menghadap saluran, dan bentuk helper runtime.
2. tambahkan permukaan registrasi/runtime Plugin bertipe
   Perluas `OpenClawPluginApi` dan/atau `api.runtime` dengan permukaan kapabilitas bertipe terkecil yang berguna.
3. hubungkan konsumen core + saluran/fitur
   Saluran dan Plugin fitur harus memakai kapabilitas baru melalui core, bukan dengan mengimpor implementasi vendor secara langsung.
4. daftarkan implementasi vendor
   Plugin vendor kemudian mendaftarkan backend mereka ke kapabilitas tersebut.
5. tambahkan cakupan kontrak
   Tambahkan pengujian agar kepemilikan dan bentuk registrasi tetap eksplisit seiring waktu.

Beginilah OpenClaw tetap berpendirian tanpa menjadi hardcoded ke sudut pandang satu penyedia. Lihat [Capability Cookbook](/id/plugins/architecture) untuk checklist file konkret dan contoh yang dikerjakan.

### Checklist kapabilitas

Ketika Anda menambahkan kapabilitas baru, implementasi biasanya harus menyentuh permukaan ini bersama-sama:

- tipe kontrak core di `src/<capability>/types.ts`
- helper runner/runtime core di `src/<capability>/runtime.ts`
- permukaan registrasi API Plugin di `src/plugins/types.ts`
- wiring registry Plugin di `src/plugins/registry.ts`
- eksposur runtime Plugin di `src/plugins/runtime/*` ketika Plugin fitur/saluran perlu mengonsumsinya
- helper capture/pengujian di `src/test-utils/plugin-registration.ts`
- assertion kepemilikan/kontrak di `src/plugins/contracts/registry.ts`
- dokumen operator/Plugin di `docs/`

Jika salah satu permukaan tersebut tidak ada, itu biasanya tanda bahwa kapabilitas belum terintegrasi sepenuhnya.

### Template kapabilitas

Pola minimal:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Pola pengujian kontrak:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Itu membuat aturan tetap sederhana:

- core memiliki kontrak kapabilitas + orkestrasi
- Plugin vendor memiliki implementasi vendor
- Plugin fitur/saluran mengonsumsi helper runtime
- pengujian kontrak menjaga kepemilikan tetap eksplisit

## Terkait

- [Arsitektur Plugin](/id/plugins/architecture) — model dan bentuk kapabilitas publik
- [Subpath SDK Plugin](/id/plugins/sdk-subpaths)
- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Membangun Plugin](/id/plugins/building-plugins)
