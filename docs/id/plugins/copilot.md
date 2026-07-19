---
read_when:
    - Anda ingin menggunakan harness GitHub Copilot SDK untuk agen
    - Anda memerlukan contoh konfigurasi untuk runtime `copilot`
    - Anda sedang menghubungkan agen ke langganan Copilot (github / openclaw / copilot) dan ingin menjalankannya melalui Copilot CLI
summary: Jalankan giliran agen tersemat OpenClaw melalui harness GitHub Copilot SDK eksternal
title: Harness Copilot SDK
x-i18n:
    generated_at: "2026-07-19T05:10:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8644ef9037e05e88a10b059d1a13386a93128c70ac47b834b93099e0368fb1ed
    source_path: plugins/copilot.md
    workflow: 16
---

Plugin eksternal `@openclaw/copilot` menjalankan giliran agen Copilot langganan tertanam
melalui GitHub Copilot CLI (`@github/copilot-sdk`), bukan melalui
harness bawaan OpenClaw. Sesi Copilot CLI memiliki loop agen tingkat rendah:
eksekusi alat native, compaction native (`infiniteSessions`), dan status utas
yang dikelola CLI di bawah `copilotHome`. OpenClaw tetap memiliki saluran
obrolan, file sesi, pemilihan model, alat dinamis (dijembatani), persetujuan,
pengiriman media, cerminan transkrip yang terlihat, pertanyaan sampingan `/btw` (lihat
[Pertanyaan sampingan (`/btw`)](#side-questions-btw)), dan `openclaw doctor`.

Untuk pembagian model/penyedia/runtime yang lebih luas, mulai dari
[Runtime agen](/id/concepts/agent-runtimes).

## Persyaratan

- OpenClaw dengan Plugin `@openclaw/copilot` terinstal.
- Jika konfigurasi Anda menggunakan `plugins.allow`, sertakan `copilot` (id manifes yang
  dideklarasikan Plugin). Entri daftar izin untuk nama paket npm
  `@openclaw/copilot` tidak akan cocok dan membuat Plugin tetap diblokir, meskipun
  `agentRuntime.id: "copilot"` telah ditetapkan.
- Langganan GitHub Copilot yang dapat menjalankan Copilot CLI, atau
  variabel lingkungan `gitHubToken` / entri profil autentikasi untuk proses headless atau cron.
- Direktori `copilotHome` yang dapat ditulisi. Nilai default-nya adalah `<agentDir>/copilot` ketika
  OpenClaw menyediakan direktori agen, atau
  `~/.openclaw/agents/<agentId>/copilot` jika tidak.

`openclaw doctor` menjalankan [kontrak doctor](#doctor) Plugin untuk
kepemilikan status sesi dan migrasi konfigurasi mendatang. Perintah ini tidak memeriksa
lingkungan Copilot CLI.

## Instalasi

Runtime Copilot dikirim sebagai Plugin eksternal agar paket inti `openclaw`
tidak menyertakan `@github/copilot-sdk` atau biner CLI `@github/copilot-<platform>-<arch>`
khusus platformnya (total sekitar 260 MB).
Instal hanya untuk agen yang memilih menggunakan runtime ini:

```bash
openclaw plugins install @openclaw/copilot
```

Wizard penyiapan menginstal Plugin secara otomatis saat pertama kali Anda memilih
model `github-copilot/*` **dan** konfigurasi Anda merutekan model tersebut (atau
penyedianya) ke runtime Copilot melalui `agentRuntime: { id: "copilot" }`; lihat
[Mulai cepat](#quickstart). Tanpa pilihan tersebut, OpenClaw menggunakan penyedia
GitHub Copilot bawaannya dan tidak pernah menginstal Plugin ini.

Runtime menyelesaikan SDK dalam urutan berikut:

1. `import("@github/copilot-sdk")` dari paket `@openclaw/copilot`
   yang terinstal.
2. Direktori fallback `~/.openclaw/npm-runtime/copilot/` (target instalasi
   sesuai permintaan lama).

SDK yang tidak ditemukan memunculkan satu kesalahan dengan kode `COPILOT_SDK_MISSING` dan
perintah instalasi ulang di atas.

## Mulai cepat

Sematkan satu model (atau satu penyedia) ke harness:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/auto",
      models: {
        "github-copilot/auto": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

Tetapkan `agentRuntime.id` pada satu entri model untuk merutekan hanya model tersebut melalui
harness, atau pada penyedia untuk merutekan setiap model di bawah penyedia tersebut.

`github-copilot/auto` adalah titik awal portabel. Model Copilot bernama bergantung
pada kebijakan akun dan organisasi; pastikan Copilot CLI terautentikasi Anda
benar-benar menyediakan suatu model sebelum menyematkannya.

## Penyedia yang didukung

Harness mendukung penyedia kanonis `github-copilot` (dimiliki oleh
`extensions/github-copilot`), serta entri `models.providers` khusus ketika
model memiliki `baseUrl` yang tidak kosong dan salah satu bentuk `api` berikut:

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (completion yang kompatibel dengan OpenAI)
- `openai-completions`
- `openai-responses`

Id penyedia native (`openai`, `anthropic`, `google`, `ollama`) tetap dimiliki oleh
runtime native masing-masing. Gunakan id penyedia khusus yang berbeda untuk merutekan endpoint
melalui BYOK Copilot.

Endpoint BYOK Copilot harus berupa URL HTTPS publik. Harness memberikan
proxy loopback per percobaan kepada SDK Copilot, lalu meneruskan lalu lintas penyedia
melalui jalur fetch terlindungi OpenClaw agar penyematan DNS dan kebijakan SSRF tetap
dimiliki oleh OpenClaw. Gunakan runtime native OpenClaw untuk Ollama lokal, LM
Studio, atau server model LAN.

## BYOK

BYOK Copilot menggunakan kontrak penyedia khusus tingkat sesi milik SDK. OpenClaw
meneruskan endpoint model yang telah diselesaikan, kunci API, mode token bearer, header, id
model, serta batas konteks/output; logika transportasi penyedia tetap berada di SDK, bukan
inti.

```json5
{
  agents: {
    defaults: {
      model: "custom-proxy/llama-3.1-8b",
      models: {
        "custom-proxy/llama-3.1-8b": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "https://api.example.com/v1",
        apiKey: "${CUSTOM_PROXY_API_KEY}",
        api: "openai-responses",
        authHeader: true,
        models: [{ id: "llama-3.1-8b", name: "Llama 3.1 8B" }],
      },
    },
  },
}
```

Sesi BYOK diberi kunci secara terpisah dari sesi langganan dan dari endpoint
atau kredensial BYOK lainnya. Merotasi kunci, header, model, atau endpoint
memulai sesi SDK Copilot baru alih-alih melanjutkan status yang tidak kompatibel.

## Autentikasi

Urutan prioritas, diterapkan per agen selama `runCopilotAttempt`:

1. **`useLoggedInUser: true` eksplisit** pada input percobaan — menggunakan
   pengguna Copilot CLI yang telah masuk di bawah `copilotHome` milik agen.
2. **`gitHubToken` eksplisit** pada input percobaan (memerlukan `profileId` +
   `profileVersion`). Untuk pemanggilan CLI langsung dan pengujian yang perlu
   melewati penyelesaian profil autentikasi.
3. **`resolvedApiKey` + `authProfileId` yang diselesaikan kontrak** — jalur utama
   produksi. Inti menyelesaikan profil autentikasi `github-copilot` yang dikonfigurasi
   untuk agen (`src/infra/provider-usage.auth.ts:resolveProviderAuths`) sebelum
   memanggil harness, sehingga profil autentikasi `github-copilot:<profile>` berfungsi
   secara menyeluruh untuk penyiapan headless, cron, atau multiprofil tanpa variabel lingkungan.
4. **Fallback variabel lingkungan**, diperiksa dalam urutan berikut (nilai pertama yang tidak kosong digunakan,
   string kosong dianggap tidak ada; mencerminkan prioritas penyedia `github-copilot`
   yang dikirim dalam `extensions/github-copilot/auth.ts`):
   1. `OPENCLAW_GITHUB_TOKEN` — penggantian khusus harness; memungkinkan Anda menyematkan
      token untuk harness OpenClaw tanpa mengganggu konfigurasi `gh` /
      Copilot CLI di seluruh sistem.
   2. `COPILOT_GITHUB_TOKEN` — variabel lingkungan standar SDK / CLI Copilot.
   3. `GH_TOKEN` — variabel lingkungan standar CLI `gh`.
   4. `GITHUB_TOKEN` — fallback token GitHub generik.

   Id profil kumpulan yang disintesis adalah `env:<NAME>`; versi profilnya adalah
   sidik jari sha256 token yang tidak dapat dibalik, sehingga merotasi nilai lingkungan
   membatalkan kumpulan klien dengan bersih.

5. **`useLoggedInUser` default** ketika tidak tersedia sinyal token.

Setiap agen mendapatkan `copilotHome` sendiri agar token, sesi, dan
konfigurasi Copilot CLI tidak pernah bocor antaragen pada mesin yang sama. Default:
`<agentDir>/copilot` (menjaga status SDK tetap di luar direktori yang sama dengan
`models.json` / `auth-profiles.json` milik OpenClaw), atau
`~/.openclaw/agents/<agentId>/copilot` ketika tidak ada direktori agen yang diberikan.
Ganti dengan `copilotHome: <path>` pada input percobaan untuk lokasi
khusus (misalnya, mount bersama untuk migrasi).

Pengujian harness langsung menggunakan `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` untuk token
langsung. Penyiapan pengujian langsung bersama menghapus `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`,
dan `GITHUB_TOKEN` setelah menempatkan profil autentikasi nyata ke home pengujian yang
terisolasi, sehingga nilai `gh auth token` yang diteruskan melalui variabel khusus
menghindari pengujian yang dilewati secara keliru tanpa bocor ke suite yang tidak terkait.

## Permukaan konfigurasi

Harness membaca konfigurasi dari input per percobaan (`runCopilotAttempt({...})`)
serta sekumpulan kecil nilai default lingkungan di dalam `extensions/copilot/src/`:

| Bidang                    | Tujuan                                                                                                                                                                                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | Direktori status CLI per agen (nilai default di atas).                                                                                                                                                                                                                                                 |
| `model`                  | String atau `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Hilangkan untuk menggunakan pemilihan model normal agen; harness memverifikasi bahwa penyedia yang telah diselesaikan didukung.                                                                                                                   |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. Dipetakan dari penyelesaian `ThinkLevel` / `ReasoningLevel` OpenClaw dalam `auto-reply/thinking.ts`.                                                                                                                                                          |
| `infiniteSessionConfig`  | Penggantian opsional untuk blok `infiniteSessions` SDK yang digerakkan oleh `harness.compact`. Aman dibiarkan apa adanya.                                                                                                                                                                                        |
| `hooksConfig`            | Konfigurasi `SessionHooks` SDK Copilot native opsional untuk callback alat/MCP, prompt pengguna, sesi, dan kesalahan. Terpisah dari hook siklus hidup portabel OpenClaw.                                                                                                                                   |
| `permissionPolicy`       | Penggantian opsional untuk handler `onPermissionRequest` SDK bagi jenis alat SDK bawaan (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). Nilai default-nya adalah `rejectAllPolicy` sebagai pengaman; lihat [Izin dan ask_user](#permissions-and-ask_user) untuk alasan handler ini tidak pernah benar-benar dipicu. |
| `enableSessionTelemetry` | Flag telemetri sesi SDK opsional.                                                                                                                                                                                                                                                            |

Hook Plugin OpenClaw tidak memerlukan konfigurasi percobaan khusus Copilot. Harness
menjalankan `before_prompt_build` (serta hook kompatibilitas lama `before_agent_start`),
`llm_input`, `llm_output`, dan `agent_end` melalui helper
harness standar. Compaction SDK yang berhasil juga menjalankan
`before_compaction` dan `after_compaction`. Alat OpenClaw yang dijembatani menjalankan
`before_tool_call` dan melaporkan `after_tool_call`; `hooksConfig` tetap digunakan untuk
callback khusus SDK native tanpa padanan portabel.

Tidak ada bagian lain di OpenClaw yang perlu mengetahui bidang-bidang ini. Plugin lain,
saluran, dan kode inti hanya melihat bentuk standar `AgentHarnessAttemptParams` /
`AgentHarnessAttemptResult`.

## Compaction

Ketika `harness.compact` dijalankan, harness SDK Copilot:

1. Melanjutkan sesi SDK yang dilacak tanpa meneruskan pekerjaan tertunda.
2. Memanggil RPC compaction riwayat dengan cakupan sesi milik SDK.
3. Mengembalikan hasil compaction SDK tanpa menulis file penanda kompatibilitas
   di bawah ruang kerja.

Cerminan transkrip pada sisi OpenClaw (di bawah) terus menerima pesan
pascacompaction, sehingga riwayat obrolan yang terlihat oleh pengguna tetap konsisten.

## Pencerminan transkrip

`runCopilotAttempt` menulis ganda pesan yang dapat dicerminkan dari setiap giliran ke
transkrip audit OpenClaw melalui
`extensions/copilot/src/dual-write-transcripts.ts`. Cermin tersebut dibatasi per
sesi (`copilot:${sessionId}`) dan diberi kunci per pesan
(`${role}:${sha256_16(role,content)}`), sehingga entri giliran sebelumnya yang dipancarkan ulang
bertabrakan dengan kunci yang sudah ada di disk, alih-alih diduplikasi.

Dua lapisan penahanan kegagalan membungkus cermin tersebut agar kegagalan penulisan
transkrip tidak pernah menggagalkan upaya: pembungkus upaya terbaik internal, ditambah
`.catch(...)` pertahanan berlapis pada tingkat upaya. Kegagalan dicatat dalam log, bukan
ditampilkan.

## Pertanyaan sampingan (`/btw`)

`/btw` **bukan** fitur native pada harness ini. `createCopilotAgentHarness()`
sengaja membiarkan `harness.runSideQuestion` tidak terdefinisi
(ditegaskan dalam `extensions/copilot/harness.test.ts`, `describe("runSideQuestion")`),
sehingga dispatcher `/btw` milik OpenClaw (`src/agents/btw.ts`) beralih ke
jalur yang sama seperti yang digunakannya untuk setiap runtime non-Codex: penyedia model
yang dikonfigurasi dipanggil secara langsung dengan prompt pertanyaan sampingan singkat dan dialirkan kembali melalui
`streamSimple` (tanpa sesi CLI, tanpa slot pool tambahan).

Hal ini membuat sesi Copilot CLI tetap dicadangkan untuk loop giliran utama agen, dan
menjaga perilaku `/btw` tetap identik dengan runtime non-Codex lainnya.

## Doctor

`extensions/copilot/doctor-contract-api.ts` dimuat secara otomatis oleh
`src/plugins/doctor-contract-registry.ts`. Modul ini menyediakan:

- `legacyConfigRules` kosong (belum ada bidang yang dipensiunkan).
- `normalizeCompatibilityConfig` tanpa operasi (dipertahankan agar penghentian penggunaan bidang di masa mendatang
  memiliki lokasi tetap di dalam pohon sumber).
- Satu entri `sessionRouteStateOwners`: penyedia `github-copilot`, runtime
  `copilot`, kunci sesi CLI `copilot`, prefiks profil autentikasi `github-copilot:`.

## Keterbatasan

- Harness mengklaim `github-copilot` beserta ID penyedia BYOK kustom tanpa pemilik.
  ID penyedia native yang dimiliki manifes tetap berada pada runtime pemiliknya bahkan ketika
  `agentRuntime.id` dipaksa menjadi `copilot`.
- Tidak ada antarmuka TUI; TUI milik PI tetap menjadi fallback untuk runtime tanpa
  antarmuka sejawat.
- Status sesi PI tidak dimigrasikan ketika agen beralih ke `copilot`.
  Pemilihan dilakukan per upaya; sesi PI yang ada tetap valid.
- `ask_user` menggunakan runtime pertanyaan gateway yang netral terhadap penyedia. Control
  UI menampilkan kartu pertanyaan yang sama seperti pertanyaan OpenClaw lainnya, saluran yang didukung
  merender tombol pilihan, dan pesan teks biasa berikutnya dalam antrean
  menyelesaikan catatan gateway tersebut sebelum permintaan SDK dikembalikan.

## Izin dan ask_user

Penerapan izin untuk alat OpenClaw yang dijembatani berlangsung **di dalam pembungkus
alat**, bukan melalui callback `onPermissionRequest` milik SDK. `wrapToolWithBeforeToolCallHook`
yang sama dengan yang digunakan PI
(`src/agents/agent-tools.before-tool-call.ts`) diterapkan oleh
`createOpenClawCodingTools` pada setiap alat pengodean: deteksi loop, kebijakan
Plugin tepercaya, hook sebelum pemanggilan alat, dan persetujuan Plugin dua fase melalui
gateway (`plugin.approval.request`) semuanya berjalan melalui jalur kode yang persis sama
seperti upaya PI native.

Setiap alat SDK yang dikembalikan oleh jembatan alat Copilot ditandai dengan:

- `overridesBuiltInTool: true` — menggantikan alat bawaan Copilot CLI
  dengan nama yang sama (edit, read, write, bash, ...) sehingga setiap pemanggilan alat dirutekan kembali
  ke OpenClaw.
- `skipPermission: true` — memberi tahu SDK agar tidak memicu
  `onPermissionRequest({kind: "custom-tool"})` sebelum menjalankan alat. `execute()`
  yang dibungkus sudah melakukan pemeriksaan kebijakan OpenClaw yang lebih lengkap; prompt
  tingkat SDK akan melewati penerapan OpenClaw (izinkan-semua)
  atau memblokir setiap pemanggilan alat (tolak-semua) — keduanya tidak menyamai
  paritas PI.

Harness Codex di dalam pohon sumber menggunakan pemisahan yang sama: alat OpenClaw yang dijembatani
dibungkus (`extensions/codex/src/app-server/dynamic-tools.ts`) dan jenis persetujuan native milik
codex-app-server
(`item/commandExecution/requestApproval`, `item/fileChange/requestApproval`,
`item/permissions/requestApproval`) dirutekan melalui `plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). Padanan dalam SDK Copilot
— `rejectAllPolicy` yang menolak secara default untuk setiap jenis non-`custom-tool`
yang mencapai `onPermissionRequest` — merupakan jaring pengaman yang sama, dan
dalam praktiknya tidak pernah dipicu karena `overridesBuiltInTool: true` menggantikan setiap
alat bawaan.

Agar lapisan alat terbungkus dapat mengambil keputusan kebijakan yang setara dengan PI,
harness meneruskan konteks alat upaya PI secara lengkap ke
`createOpenClawCodingTools`: identitas (`senderIsOwner`, `memberRoleIds`,
`ownerOnlyToolAllowlist`, ...), saluran/perutean (`groupId`,
`currentChannelId`, `replyToMode`, pengaturan alat pesan), autentikasi
(`authProfileStore`), identitas eksekusi (`sessionKey` / `runSessionKey` yang diturunkan
dari `sandboxSessionKey`, `runId`), konteks model (`modelApi`,
`modelContextWindowTokens`, `modelCompat`, `modelHasVision`), dan hook eksekusi
(`onToolOutcome`, `onYield`). Tanpa bidang-bidang tersebut, daftar izin khusus pemilik
secara diam-diam menolak secara default, kebijakan kepercayaan Plugin tidak dapat ditetapkan ke cakupan yang tepat,
dan `session_status: "current"` ditetapkan ke kunci sandbox yang kedaluwarsa. Pembuat
jembatan adalah `extensions/copilot/src/tool-bridge.ts`, yang mencerminkan pemanggilan otoritatif PI
di `src/agents/embedded-agent-runner/run/attempt.ts:1262`.
`runAttempt` menetapkan konteks sandbox melalui seam bersama
`resolveSandboxContext`, memberikan direktori kerja efektif kepada SDK,
dan meneruskan `sandbox` beserta ruang kerja pemunculan subagen ke jembatan
alat. Jembatan tersebut juga meneruskan kontrol konstruksi alat terbatas yang
dapat diterapkannya pada batas SDK: `includeCoreTools`, daftar izin alat
runtime, dan `toolConstructionPlan`.

Jembatan juga menggunakan pembantu permukaan alat harness bersama dari
`openclaw/plugin-sdk/agent-harness-tool-runtime` untuk paritas PI. Ketika
pencarian alat diaktifkan, SDK melihat alat kontrol ringkas beserta eksekutor
katalog tersembunyi, bukan setiap skema alat OpenClaw. Ketika mode kode
diaktifkan, pembantu membangun permukaan kontrol mode kode dan siklus hidup katalog
yang sama dengan yang digunakan harness agen lainnya. Default ramping untuk model lokal,
pemfilteran skema yang kompatibel dengan runtime, hidrasi direktori, dan pembersihan
katalog semuanya tetap berada di pembantu bersama agar harness Copilot dan yang berdekatan
dengan Codex tidak menyimpang.

### Token GitHub tingkat sesi

Kontrak SDK Copilot membedakan token GitHub **tingkat klien**
(`CopilotClientOptions.gitHubToken`, mengautentikasi proses CLI itu sendiri)
dari token **tingkat sesi** (`SessionConfig.gitHubToken`, menentukan
pengecualian konten, perutean model, dan kuota untuk sesi tersebut; dipatuhi pada
`createSession` maupun `resumeSession`). Harness menetapkan autentikasi satu kali melalui
`resolveCopilotAuth` dan mengatur kedua bidang ketika mode autentikasi adalah `gitHubToken`
(`auth.gitHubToken` eksplisit atau `resolvedApiKey` yang ditetapkan berdasarkan kontrak dari
profil autentikasi `github-copilot` yang dikonfigurasi). Ketika mode yang ditetapkan adalah
`useLoggedInUser`, bidang tingkat sesi dihilangkan agar SDK tetap
menurunkan identitas dari identitas yang sudah masuk.

`ask_user` menggunakan `SessionConfig.onUserInputRequest`. Jembatan mendaftarkan pilihan SDK
atau prompt teks bebas tanpa opsi sebagai pertanyaan gateway, menerima indeks
atau label pilihan untuk permintaan dengan pilihan tetap, dan menerima jawaban bebas
ketika permintaan SDK mengizinkannya. Membatalkan upaya OpenClaw akan membatalkan
catatan gateway dan mengembalikan jawaban SDK kosong.

## Terkait

- [Runtime agen](/id/concepts/agent-runtimes)
- [Harness Codex](/id/plugins/codex-harness)
- [Plugin harness agen (referensi SDK)](/id/plugins/sdk-agent-harness)
