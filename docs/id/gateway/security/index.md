---
read_when:
    - Menambahkan fitur yang memperluas akses atau otomatisasi
summary: Pertimbangan keamanan dan model ancaman untuk menjalankan Gateway AI dengan akses shell
title: Keamanan
x-i18n:
    generated_at: "2026-05-07T01:52:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 076b3254955a7bec22788b6f11fc69dc17f6fa7f5bcf48def27deaf567526a55
    source_path: gateway/security/index.md
    workflow: 16
---

<Warning>
  **Model kepercayaan asisten pribadi.** Panduan ini mengasumsikan satu batas
  operator tepercaya per gateway (model pengguna tunggal, asisten pribadi).
  OpenClaw **bukan** batas keamanan multi-tenant yang bermusuhan untuk beberapa
  pengguna adversarial yang berbagi satu agent atau gateway. Jika Anda memerlukan operasi
  dengan kepercayaan campuran atau pengguna adversarial, pisahkan batas kepercayaan (gateway +
  kredensial terpisah, idealnya pengguna OS atau host terpisah).
</Warning>

## Cakupan lebih dulu: model keamanan asisten pribadi

Panduan keamanan OpenClaw mengasumsikan deployment **asisten pribadi**: satu batas operator tepercaya, dengan kemungkinan banyak agent.

- Postur keamanan yang didukung: satu pengguna/batas kepercayaan per gateway (utamakan satu pengguna OS/host/VPS per batas).
- Bukan batas keamanan yang didukung: satu gateway/agent bersama yang digunakan oleh pengguna yang saling tidak tepercaya atau adversarial.
- Jika isolasi pengguna adversarial diperlukan, pisahkan berdasarkan batas kepercayaan (gateway + kredensial terpisah, dan idealnya pengguna/host OS terpisah).
- Jika beberapa pengguna yang tidak tepercaya dapat mengirim pesan ke satu agent dengan tool aktif, anggap mereka berbagi otoritas tool terdelegasi yang sama untuk agent tersebut.

Halaman ini menjelaskan hardening **di dalam model tersebut**. Halaman ini tidak mengklaim isolasi multi-tenant yang bermusuhan pada satu gateway bersama.

## Pemeriksaan cepat: `openclaw security audit`

Lihat juga: [Verifikasi Formal (Model Keamanan)](/id/security/formal-verification)

Jalankan ini secara rutin (terutama setelah mengubah konfigurasi atau membuka permukaan jaringan):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` sengaja tetap sempit: ini mengubah kebijakan grup terbuka
yang umum menjadi allowlist, memulihkan `logging.redactSensitive: "tools"`, memperketat
izin state/konfigurasi/file include, dan menggunakan reset ACL Windows alih-alih
POSIX `chmod` saat berjalan di Windows.

Ini menandai footgun umum (paparan auth Gateway, paparan kontrol browser, allowlist yang ditingkatkan, izin filesystem, persetujuan exec yang permisif, dan paparan tool channel terbuka).

OpenClaw adalah produk sekaligus eksperimen: Anda menghubungkan perilaku model frontier ke permukaan messaging nyata dan tool nyata. **Tidak ada setup yang "aman sempurna".** Tujuannya adalah bersikap sadar tentang:

- siapa yang dapat berbicara dengan bot Anda
- di mana bot diizinkan bertindak
- apa yang dapat disentuh bot

Mulailah dengan akses terkecil yang tetap berfungsi, lalu perluas saat Anda makin percaya diri.

### Deployment dan kepercayaan host

OpenClaw mengasumsikan batas host dan konfigurasi tepercaya:

- Jika seseorang dapat memodifikasi state/konfigurasi host Gateway (`~/.openclaw`, termasuk `openclaw.json`), perlakukan mereka sebagai operator tepercaya.
- Menjalankan satu Gateway untuk beberapa operator yang saling tidak tepercaya/adversarial **bukan setup yang direkomendasikan**.
- Untuk tim dengan kepercayaan campuran, pisahkan batas kepercayaan dengan gateway terpisah (atau minimal pengguna/host OS terpisah).
- Default yang direkomendasikan: satu pengguna per mesin/host (atau VPS), satu gateway untuk pengguna tersebut, dan satu atau beberapa agent di gateway tersebut.
- Di dalam satu instance Gateway, akses operator yang terautentikasi adalah peran control-plane tepercaya, bukan peran tenant per pengguna.
- Identifier sesi (`sessionKey`, ID sesi, label) adalah selector routing, bukan token otorisasi.
- Jika beberapa orang dapat mengirim pesan ke satu agent dengan tool aktif, masing-masing dari mereka dapat mengarahkan set izin yang sama. Isolasi sesi/memori per pengguna membantu privasi, tetapi tidak mengubah agent bersama menjadi otorisasi host per pengguna.

### Operasi file aman

OpenClaw menggunakan `@openclaw/fs-safe` untuk akses file yang dibatasi root, write atomik, ekstraksi arsip, workspace sementara, dan helper file rahasia. Default OpenClaw untuk helper Python POSIX opsional fs-safe adalah **nonaktif**; tetapkan `OPENCLAW_FS_SAFE_PYTHON_MODE=auto` atau `require` hanya saat Anda menginginkan hardening mutasi relatif fd tambahan dan dapat mendukung runtime Python.

Detail: [Operasi file aman](/id/gateway/security/secure-file-operations).

### Workspace Slack bersama: risiko nyata

Jika "semua orang di Slack dapat mengirim pesan ke bot", risiko intinya adalah otoritas tool terdelegasi:

- pengirim mana pun yang diizinkan dapat memicu panggilan tool (`exec`, browser, tool jaringan/file) dalam kebijakan agent;
- injeksi prompt/konten dari satu pengirim dapat menyebabkan tindakan yang memengaruhi state, perangkat, atau output bersama;
- jika satu agent bersama memiliki kredensial/file sensitif, pengirim mana pun yang diizinkan berpotensi mendorong eksfiltrasi melalui penggunaan tool.

Gunakan agent/gateway terpisah dengan tool minimal untuk workflow tim; jaga agent data pribadi tetap privat.

### Agent bersama perusahaan: pola yang dapat diterima

Ini dapat diterima saat semua orang yang menggunakan agent tersebut berada dalam batas kepercayaan yang sama (misalnya satu tim perusahaan) dan agent tersebut dibatasi secara ketat untuk bisnis.

- jalankan di mesin/VM/container khusus;
- gunakan pengguna OS khusus + browser/profil/akun khusus untuk runtime tersebut;
- jangan masuk ke akun Apple/Google pribadi atau profil browser/password-manager pribadi di runtime tersebut.

Jika Anda mencampur identitas pribadi dan perusahaan pada runtime yang sama, Anda meruntuhkan pemisahan dan meningkatkan risiko paparan data pribadi.

## Konsep kepercayaan Gateway dan node

Perlakukan Gateway dan node sebagai satu domain kepercayaan operator, dengan peran berbeda:

- **Gateway** adalah control plane dan permukaan kebijakan (`gateway.auth`, kebijakan tool, routing).
- **Node** adalah permukaan eksekusi jarak jauh yang dipasangkan ke Gateway tersebut (perintah, tindakan perangkat, kapabilitas lokal host).
- Pemanggil yang terautentikasi ke Gateway dipercaya pada cakupan Gateway. Setelah pairing, tindakan node adalah tindakan operator tepercaya pada node tersebut.
- Tingkat cakupan operator dan pemeriksaan saat persetujuan dirangkum di
  [Cakupan operator](/id/gateway/operator-scopes).
- Klien backend loopback langsung yang terautentikasi dengan token/kata sandi
  gateway bersama dapat membuat RPC control-plane internal tanpa menyajikan identitas
  perangkat pengguna. Ini bukan bypass pairing jarak jauh atau browser: klien jaringan,
  klien node, klien token perangkat, dan identitas perangkat eksplisit
  tetap melewati pairing dan penegakan peningkatan cakupan.
- `sessionKey` adalah pemilihan routing/konteks, bukan auth per pengguna.
- Persetujuan exec (allowlist + tanya) adalah guardrail untuk niat operator, bukan isolasi multi-tenant yang bermusuhan.
- Default produk OpenClaw untuk setup operator tunggal tepercaya adalah bahwa exec host pada `gateway`/`node` diizinkan tanpa prompt persetujuan (`security="full"`, `ask="off"` kecuali Anda memperketatnya). Default itu adalah UX yang disengaja, bukan kerentanan dengan sendirinya.
- Persetujuan exec mengikat konteks permintaan persis dan operand file lokal langsung dengan upaya terbaik; persetujuan itu tidak memodelkan secara semantik setiap path loader runtime/interpreter. Gunakan sandboxing dan isolasi host untuk batas yang kuat.

Jika Anda memerlukan isolasi pengguna bermusuhan, pisahkan batas kepercayaan berdasarkan pengguna/host OS dan jalankan gateway terpisah.

## Matriks batas kepercayaan

Gunakan ini sebagai model cepat saat melakukan triage risiko:

| Batas atau kontrol                                        | Artinya                                           | Salah baca umum                                                               |
| --------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth` (token/password/trusted-proxy/device auth) | Mengautentikasi pemanggil ke API gateway          | "Perlu tanda tangan per pesan pada setiap frame agar aman"                    |
| `sessionKey`                                              | Kunci routing untuk pemilihan konteks/sesi        | "Kunci sesi adalah batas auth pengguna"                                       |
| Guardrail prompt/konten                                   | Mengurangi risiko penyalahgunaan model            | "Injeksi prompt saja membuktikan bypass auth"                                 |
| `canvas.eval` / evaluasi browser                          | Kapabilitas operator yang disengaja saat diaktifkan | "Primitive JS eval apa pun otomatis merupakan kerentanan dalam model kepercayaan ini" |
| Shell `!` TUI lokal                                       | Eksekusi lokal yang dipicu operator secara eksplisit | "Perintah kemudahan shell lokal adalah injeksi jarak jauh"                  |
| Pairing Node dan perintah node                            | Eksekusi jarak jauh tingkat operator pada perangkat yang dipasangkan | "Kontrol perangkat jarak jauh harus diperlakukan sebagai akses pengguna tidak tepercaya secara default" |
| `gateway.nodes.pairing.autoApproveCidrs`                  | Kebijakan enrollment node jaringan tepercaya yang opt-in | "Allowlist yang nonaktif secara default adalah kerentanan pairing otomatis" |

## Batas multi-agent dan sub-agent

OpenClaw dapat menjalankan banyak agent di dalam satu Gateway, tetapi agent tersebut tetap berada
di dalam batas operator tepercaya yang sama kecuali Anda memisahkan deployment berdasarkan
Gateway, pengguna OS, host, atau sandbox. Perlakukan delegasi sub-agent sebagai keputusan
kebijakan tool dan sandboxing, bukan sebagai lapisan otorisasi multi-tenant yang bermusuhan.

Perilaku yang diharapkan di dalam satu Gateway tepercaya:

- Operator yang terautentikasi dapat merutekan pekerjaan ke sesi dan agent yang
  diizinkan untuk mereka gunakan oleh konfigurasi.
- `sessionKey`, ID sesi, label, dan kunci sesi sub-agent memilih
  konteks percakapan. Mereka bukan kredensial bearer dan bukan batas
  otorisasi per pengguna.
- Sub-agent memiliki sesi terpisah secara default. `sessions_spawn` native menggunakan
  konteks terisolasi kecuali pemanggil secara eksplisit meminta `context: "fork"`;
  sesi lanjutan yang terikat thread menggunakan konteks fork karena melanjutkan
  thread percakapan.
- Sub-agent yang di-fork dapat melihat konteks transcript yang sengaja diberikan kepadanya.
  Itu diharapkan. Ini menjadi masalah keamanan hanya jika menerima konteks yang
  menurut kebijakan tidak boleh diterimanya.
- Akses tool berasal dari profil efektif, kebijakan channel/grup/provider,
  kebijakan sandbox, kebijakan per-agent, dan lapisan pembatasan sub-agent. Profil
  tool yang luas sengaja memberi kapabilitas luas.
- Profil auth sub-agent di-resolve berdasarkan ID agent target. Auth agent utama dapat
  tersedia sebagai fallback kecuali Anda memisahkan kredensial/deployment; jangan mengandalkan
  identitas sub-agent saja untuk isolasi rahasia yang kuat.

Yang dihitung sebagai bypass batas nyata:

- `sessions_spawn` berfungsi meskipun kebijakan tool efektif menolaknya.
- Child berjalan tanpa sandbox meskipun requester disandbox atau panggilan
  memerlukan `sandbox: "require"`.
- Child menerima tool sesi, tool sistem, atau akses agent target yang
  ditolak oleh konfigurasi yang di-resolve.
- Sub-agent leaf mengontrol, membunuh, mengarahkan, atau mengirim pesan ke sesi sibling yang
  tidak dibuatnya.
- Sub-agent melihat transcript, memori, kredensial, atau file yang dikecualikan
  oleh kebijakan eksplisit atau batas sandbox.
- Pemanggil Gateway/API tanpa auth Gateway yang diperlukan atau identitas trusted-proxy/perangkat
  dapat memicu eksekusi agent atau tool.

Knob hardening:

- Biarkan `sessions_spawn` ditolak kecuali agent benar-benar membutuhkan delegasi.
- Utamakan `tools.profile: "messaging"` atau profil sempit lain untuk agent yang
  berbicara ke channel eksternal.
- Tetapkan `agents.list[].subagents.requireAgentId: true` untuk agent yang dapat men-spawn
  pekerjaan, agar pemilihan target eksplisit.
- Jaga `agents.defaults.subagents.allowAgents` dan
  `agents.list[].subagents.allowAgents` tetap sempit; hindari `["*"]` untuk agent yang
  menerima input tidak tepercaya.
- Gunakan `tools.subagents.tools.allow` agar tool sub-agent menjadi allow-only alih-alih
  mewarisi profil parent yang luas.
- Untuk workflow yang harus tetap disandbox, gunakan `sessions_spawn` dengan
  `sandbox: "require"`.
- Gunakan gateway, pengguna OS, host, profil browser, dan kredensial terpisah saat
  agent atau pengguna saling tidak tepercaya.

## Bukan kerentanan berdasarkan desain

<Accordion title="Common findings that are out of scope">

Pola ini sering dilaporkan dan biasanya ditutup tanpa tindakan kecuali
bypass batas nyata didemonstrasikan:

- Rantai khusus prompt-injection tanpa bypass kebijakan, auth, atau sandbox.
- Klaim yang mengasumsikan operasi multi-tenant yang bermusuhan pada satu host atau
  config bersama.
- Klaim yang mengklasifikasikan akses read-path operator normal (misalnya
  `sessions.list` / `sessions.preview` / `chat.history`) sebagai IDOR dalam
  penyiapan shared-gateway.
- Klaim yang memperlakukan pewarisan transkrip `context: "fork"` yang diharapkan sebagai
  bypass batas ketika peminta secara eksplisit melakukan fork pada konteks tersebut.
- Klaim yang memperlakukan akses tool sub-agent yang luas sebagai bypass ketika profile
  atau allowlist yang dikonfigurasi memang sengaja memberikan tool tersebut.
- Temuan deployment khusus localhost (misalnya HSTS pada gateway khusus loopback).
- Temuan tanda tangan inbound webhook Discord untuk jalur inbound yang tidak
  ada di repo ini.
- Laporan yang memperlakukan metadata pairing node sebagai lapisan approval
  per-command kedua yang tersembunyi untuk `system.run`, padahal batas eksekusi
  sebenarnya tetap kebijakan command node global gateway ditambah approval exec
  milik node itu sendiri.
- Laporan yang memperlakukan `gateway.nodes.pairing.autoApproveCidrs` yang dikonfigurasi sebagai
  vulnerability dengan sendirinya. Pengaturan ini dinonaktifkan secara default, membutuhkan
  entri CIDR/IP eksplisit, hanya berlaku untuk pairing pertama kali `role: node` dengan
  tanpa scope yang diminta, dan tidak meng-auto-approve operator/browser/Control UI,
  WebChat, upgrade peran, upgrade scope, perubahan metadata, perubahan public-key,
  atau jalur header trusted-proxy loopback host yang sama kecuali auth trusted-proxy loopback diaktifkan secara eksplisit.
- Temuan "Missing per-user authorization" yang memperlakukan `sessionKey` sebagai
  token auth.

</Accordion>

## Baseline yang diperkuat dalam 60 detik

Gunakan baseline ini terlebih dahulu, lalu aktifkan ulang tool secara selektif per agent tepercaya:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { mode: "token", token: "replace-with-long-random-token" },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
  channels: {
    whatsapp: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
  },
}
```

Ini menjaga Gateway tetap khusus lokal, mengisolasi DM, dan menonaktifkan tool control-plane/runtime secara default.

## Aturan cepat inbox bersama

Jika lebih dari satu orang dapat mengirim DM ke bot Anda:

- Tetapkan `session.dmScope: "per-channel-peer"` (atau `"per-account-channel-peer"` untuk channel multi-akun).
- Pertahankan `dmPolicy: "pairing"` atau allowlist ketat.
- Jangan pernah menggabungkan DM bersama dengan akses tool yang luas.
- Ini memperkuat inbox kooperatif/bersama, tetapi tidak dirancang sebagai isolasi co-tenant yang bermusuhan ketika pengguna berbagi akses tulis host/config.

## Model visibilitas konteks

OpenClaw memisahkan dua konsep:

- **Otorisasi trigger**: siapa yang dapat memicu agent (`dmPolicy`, `groupPolicy`, allowlist, gerbang mention).
- **Visibilitas konteks**: konteks tambahan apa yang diinjeksi ke input model (isi balasan, teks yang dikutip, riwayat thread, metadata yang diteruskan).

Allowlist mengatur trigger dan otorisasi command. Pengaturan `contextVisibility` mengontrol bagaimana konteks tambahan (balasan yang dikutip, root thread, riwayat yang diambil) difilter:

- `contextVisibility: "all"` (default) mempertahankan konteks tambahan sebagaimana diterima.
- `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim yang diizinkan oleh pemeriksaan allowlist aktif.
- `contextVisibility: "allowlist_quote"` berperilaku seperti `allowlist`, tetapi tetap mempertahankan satu balasan eksplisit yang dikutip.

Tetapkan `contextVisibility` per channel atau per ruang/percakapan. Lihat [Obrolan Grup](/id/channels/groups#context-visibility-and-allowlists) untuk detail penyiapan.

Panduan triase advisory:

- Klaim yang hanya menunjukkan "model dapat melihat teks yang dikutip atau historis dari pengirim yang tidak ada di allowlist" adalah temuan hardening yang dapat ditangani dengan `contextVisibility`, bukan bypass batas auth atau sandbox dengan sendirinya.
- Agar berdampak pada security, laporan tetap membutuhkan bypass batas kepercayaan yang didemonstrasikan (auth, kebijakan, sandbox, approval, atau batas terdokumentasi lainnya).

## Apa yang diperiksa audit (tingkat tinggi)

- **Akses inbound** (kebijakan DM, kebijakan grup, allowlist): dapatkah orang asing memicu bot?
- **Radius dampak tool** (tool elevated + ruang terbuka): dapatkah prompt injection berubah menjadi tindakan shell/file/network?
- **Penyimpangan approval exec** (`security=full`, `autoAllowSkills`, allowlist interpreter tanpa `strictInlineEval`): apakah guardrail host-exec masih melakukan apa yang Anda kira?
  - `security="full"` adalah peringatan postur yang luas, bukan bukti bug. Ini adalah default yang dipilih untuk penyiapan personal-assistant tepercaya; perketat hanya ketika threat model Anda membutuhkan approval atau guardrail allowlist.
- **Paparan jaringan** (bind/auth Gateway, Tailscale Serve/Funnel, token auth lemah/pendek).
- **Paparan kontrol browser** (node jarak jauh, port relay, endpoint CDP jarak jauh).
- **Kebersihan disk lokal** (permission, symlink, include config, jalur "synced folder").
- **Plugin** (plugin dimuat tanpa allowlist eksplisit).
- **Penyimpangan/misconfig kebijakan** (pengaturan sandbox docker dikonfigurasi tetapi mode sandbox mati; pola `gateway.nodes.denyCommands` tidak efektif karena pencocokan hanya nama command persis (misalnya `system.run`) dan tidak memeriksa teks shell; entri `gateway.nodes.allowCommands` berbahaya; `tools.profile="minimal"` global ditimpa oleh profile per-agent; tool milik plugin dapat dijangkau di bawah kebijakan tool permisif).
- **Penyimpangan ekspektasi runtime** (misalnya mengasumsikan exec implisit masih berarti `sandbox` ketika `tools.exec.host` sekarang default ke `auto`, atau menetapkan `tools.exec.host="sandbox"` secara eksplisit saat mode sandbox mati).
- **Kebersihan model** (peringatkan ketika model yang dikonfigurasi tampak legacy; bukan blok keras).

Jika Anda menjalankan `--deep`, OpenClaw juga mencoba probe Gateway live dengan upaya terbaik.

## Peta penyimpanan credential

Gunakan ini saat mengaudit akses atau memutuskan apa yang perlu dicadangkan:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bot Telegram**: config/env atau `channels.telegram.tokenFile` (hanya file biasa; symlink ditolak)
- **Token bot Discord**: config/env atau SecretRef (provider env/file/exec)
- **Token Slack**: config/env (`channels.slack.*`)
- **Allowlist pairing**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (akun default)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (akun non-default)
- **Profile auth model**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **State runtime Codex**: `~/.openclaw/agents/<agentId>/agent/codex-home/`
- **Payload secret berbasis file (opsional)**: `~/.openclaw/secrets.json`
- **Impor OAuth legacy**: `~/.openclaw/credentials/oauth.json`

## Checklist audit security

Ketika audit mencetak temuan, perlakukan ini sebagai urutan prioritas:

1. **Apa pun yang "open" + tool aktif**: kunci DM/grup terlebih dahulu (pairing/allowlist), lalu perketat kebijakan tool/sandboxing.
2. **Paparan jaringan publik** (bind LAN, Funnel, auth hilang): perbaiki segera.
3. **Paparan jarak jauh kontrol browser**: perlakukan seperti akses operator (hanya tailnet, pairing node secara sengaja, hindari paparan publik).
4. **Permission**: pastikan state/config/credential/auth tidak dapat dibaca group/world.
5. **Plugin**: hanya muat yang Anda percayai secara eksplisit.
6. **Pilihan model**: pilih model modern yang diperkuat instruksi untuk bot apa pun dengan tool.

## Glosarium audit security

Setiap temuan audit diberi kunci oleh `checkId` terstruktur (misalnya
`gateway.bind_no_auth` atau `tools.exec.security_full_configured`). Kelas severity
kritis yang umum:

- `fs.*` - permission filesystem pada state, config, credential, profile auth.
- `gateway.*` - mode bind, auth, Tailscale, Control UI, penyiapan trusted-proxy.
- `hooks.*`, `browser.*`, `sandbox.*`, `tools.exec.*` - hardening per surface.
- `plugins.*`, `skills.*` - rantai pasok plugin/skill dan temuan scan.
- `security.exposure.*` - pemeriksaan lintas aspek ketika kebijakan akses bertemu radius dampak tool.

Lihat katalog lengkap dengan tingkat severity, kunci perbaikan, dan dukungan auto-fix di
[Pemeriksaan audit security](/id/gateway/security/audit-checks).

## Control UI melalui HTTP

Control UI membutuhkan **secure context** (HTTPS atau localhost) untuk menghasilkan
identitas perangkat. `gateway.controlUi.allowInsecureAuth` adalah toggle kompatibilitas lokal:

- Di localhost, ini mengizinkan auth Control UI tanpa identitas perangkat ketika halaman
  dimuat melalui HTTP yang tidak aman.
- Ini tidak mem-bypass pemeriksaan pairing.
- Ini tidak melonggarkan persyaratan identitas perangkat jarak jauh (non-localhost).

Utamakan HTTPS (Tailscale Serve) atau buka UI di `127.0.0.1`.

Hanya untuk skenario break-glass, `gateway.controlUi.dangerouslyDisableDeviceAuth`
menonaktifkan pemeriksaan identitas perangkat sepenuhnya. Ini adalah penurunan security yang parah;
biarkan mati kecuali Anda sedang aktif melakukan debugging dan dapat segera mengembalikannya.

Terpisah dari flag berbahaya tersebut, `gateway.auth.mode: "trusted-proxy"` yang berhasil
dapat memasukkan sesi Control UI **operator** tanpa identitas perangkat. Itu adalah
perilaku auth-mode yang disengaja, bukan pintasan `allowInsecureAuth`, dan tetap
tidak meluas ke sesi Control UI dengan peran node.

`openclaw security audit` memperingatkan ketika pengaturan ini diaktifkan.

## Ringkasan flag tidak aman atau berbahaya

`openclaw security audit` memunculkan `config.insecure_or_dangerous_flags` ketika
switch debug tidak aman/berbahaya yang dikenal diaktifkan. Biarkan ini tidak disetel di
production.

<AccordionGroup>
  <Accordion title="Flag yang dilacak audit saat ini">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`

  </Accordion>

  <Accordion title="Semua kunci `dangerous*` / `dangerously*` dalam skema config">
    Control UI dan browser:

    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    Pencocokan nama channel (channel bawaan dan plugin; juga tersedia per
    `accounts.<accountId>` jika berlaku):

    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.synology-chat.dangerouslyAllowNameMatching` (channel plugin)
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath` (channel plugin)
    - `channels.zalouser.dangerouslyAllowNameMatching` (channel plugin)
    - `channels.irc.dangerouslyAllowNameMatching` (channel plugin)
    - `channels.mattermost.dangerouslyAllowNameMatching` (channel plugin)

    Paparan jaringan:

    - `channels.telegram.network.dangerouslyAllowPrivateNetwork` (juga per akun)

    Sandbox Docker (default + per-agent):

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## Konfigurasi reverse proxy

Jika Anda menjalankan Gateway di belakang reverse proxy (nginx, Caddy, Traefik, dll.), konfigurasikan
`gateway.trustedProxies` untuk penanganan IP forwarded-client yang benar.

Ketika Gateway mendeteksi header proxy dari alamat yang **tidak** ada di `trustedProxies`, Gateway **tidak** akan memperlakukan koneksi sebagai klien lokal. Jika auth gateway dinonaktifkan, koneksi tersebut ditolak. Ini mencegah bypass autentikasi ketika koneksi yang diproxy seharusnya tampak berasal dari localhost dan menerima kepercayaan otomatis.

`gateway.trustedProxies` juga memasok `gateway.auth.mode: "trusted-proxy"`, tetapi mode autentikasi tersebut lebih ketat:

- autentikasi trusted-proxy **gagal tertutup pada proksi bersumber loopback secara bawaan**
- proksi balik loopback host yang sama dapat menggunakan `gateway.trustedProxies` untuk deteksi klien lokal dan penanganan IP yang diteruskan
- proksi balik loopback host yang sama dapat memenuhi `gateway.auth.mode: "trusted-proxy"` hanya ketika `gateway.auth.trustedProxy.allowLoopback = true`; jika tidak, gunakan autentikasi token/kata sandi

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # reverse proxy IP
  # Optional. Default false.
  # Only enable if your proxy cannot provide X-Forwarded-For.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

Ketika `trustedProxies` dikonfigurasi, Gateway menggunakan `X-Forwarded-For` untuk menentukan IP klien. `X-Real-IP` diabaikan secara bawaan kecuali `gateway.allowRealIpFallback: true` ditetapkan secara eksplisit.

Header proksi tepercaya tidak membuat pemasangan perangkat Node otomatis tepercaya.
`gateway.nodes.pairing.autoApproveCidrs` adalah kebijakan operator terpisah yang dinonaktifkan secara bawaan. Bahkan ketika diaktifkan, jalur header trusted-proxy bersumber loopback dikecualikan dari persetujuan otomatis Node karena pemanggil lokal dapat memalsukan header tersebut, termasuk ketika autentikasi trusted-proxy loopback diaktifkan secara eksplisit.

Perilaku proksi balik yang baik (timpa header penerusan yang masuk):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

Perilaku proksi balik yang buruk (tambahkan/pertahankan header penerusan yang tidak tepercaya):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## Catatan HSTS dan origin

- Gateway OpenClaw mengutamakan lokal/loopback. Jika Anda mengakhiri TLS di proksi balik, tetapkan HSTS pada domain HTTPS yang menghadap proksi di sana.
- Jika Gateway sendiri mengakhiri HTTPS, Anda dapat menetapkan `gateway.http.securityHeaders.strictTransportSecurity` untuk memancarkan header HSTS dari respons OpenClaw.
- Panduan deployment terperinci ada di [Autentikasi Proksi Tepercaya](/id/gateway/trusted-proxy-auth#tls-termination-and-hsts).
- Untuk deployment Control UI non-loopback, `gateway.controlUi.allowedOrigins` diperlukan secara bawaan.
- `gateway.controlUi.allowedOrigins: ["*"]` adalah kebijakan origin browser izinkan-semua yang eksplisit, bukan bawaan yang diperkeras. Hindari di luar pengujian lokal yang dikontrol ketat.
- Kegagalan autentikasi origin browser pada loopback tetap dibatasi lajunya bahkan ketika pengecualian loopback umum diaktifkan, tetapi kunci penguncian dicakup per nilai `Origin` yang dinormalisasi alih-alih satu bucket localhost bersama.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` mengaktifkan mode fallback origin header Host; perlakukan sebagai kebijakan berbahaya yang dipilih operator.
- Perlakukan DNS rebinding dan perilaku header host proksi sebagai perhatian pengerasan deployment; jaga `trustedProxies` tetap ketat dan hindari mengekspos Gateway langsung ke internet publik.

## Log sesi lokal berada di disk

OpenClaw menyimpan transkrip sesi di disk di bawah `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
Ini diperlukan untuk kesinambungan sesi dan (opsional) pengindeksan memori sesi, tetapi ini juga berarti
**proses/pengguna apa pun dengan akses sistem file dapat membaca log tersebut**. Perlakukan akses disk sebagai batas kepercayaan dan kunci izin pada `~/.openclaw` (lihat bagian audit di bawah). Jika Anda memerlukan isolasi yang lebih kuat antar agen, jalankan mereka di bawah pengguna OS terpisah atau host terpisah.

## Eksekusi Node (system.run)

Jika Node macOS dipasangkan, Gateway dapat memanggil `system.run` pada Node tersebut. Ini adalah **eksekusi kode jarak jauh** di Mac:

- Memerlukan pemasangan Node (persetujuan + token).
- Pemasangan Node Gateway bukan permukaan persetujuan per perintah. Ini menetapkan identitas/kepercayaan Node dan penerbitan token.
- Gateway menerapkan kebijakan perintah Node global yang kasar melalui `gateway.nodes.allowCommands` / `denyCommands`.
- Dikontrol di Mac melalui **Settings → Exec approvals** (keamanan + tanya + allowlist).
- Kebijakan `system.run` per Node adalah file persetujuan eksekusi milik Node itu sendiri (`exec.approvals.node.*`), yang dapat lebih ketat atau lebih longgar daripada kebijakan ID perintah global Gateway.
- Node yang berjalan dengan `security="full"` dan `ask="off"` mengikuti model operator tepercaya bawaan. Perlakukan itu sebagai perilaku yang diharapkan kecuali deployment Anda secara eksplisit memerlukan sikap persetujuan atau allowlist yang lebih ketat.
- Mode persetujuan mengikat konteks permintaan yang persis dan, jika memungkinkan, satu operand skrip/file lokal konkret. Jika OpenClaw tidak dapat mengidentifikasi persis satu file lokal langsung untuk perintah interpreter/runtime, eksekusi yang didukung persetujuan ditolak alih-alih menjanjikan cakupan semantik penuh.
- Untuk `host=node`, eksekusi yang didukung persetujuan juga menyimpan `systemRunPlan` yang disiapkan secara kanonis; penerusan yang disetujui kemudian menggunakan ulang rencana tersimpan tersebut, dan validasi Gateway menolak edit pemanggil pada konteks perintah/cwd/sesi setelah permintaan persetujuan dibuat.
- Jika Anda tidak menginginkan eksekusi jarak jauh, tetapkan keamanan ke **deny** dan hapus pemasangan Node untuk Mac tersebut.

Perbedaan ini penting untuk triase:

- Node terpasang yang tersambung kembali dan mengiklankan daftar perintah berbeda bukanlah, dengan sendirinya, kerentanan jika kebijakan global Gateway dan persetujuan eksekusi lokal Node masih menegakkan batas eksekusi yang sebenarnya.
- Laporan yang memperlakukan metadata pemasangan Node sebagai lapisan persetujuan per perintah tersembunyi kedua biasanya adalah kebingungan kebijakan/UX, bukan bypass batas keamanan.

## Skills dinamis (watcher / Node jarak jauh)

OpenClaw dapat menyegarkan daftar Skills di tengah sesi:

- **Watcher Skills**: perubahan pada `SKILL.md` dapat memperbarui snapshot Skills pada giliran agen berikutnya.
- **Node jarak jauh**: menghubungkan Node macOS dapat membuat Skills khusus macOS memenuhi syarat (berdasarkan probing bin).

Perlakukan folder Skills sebagai **kode tepercaya** dan batasi siapa yang dapat memodifikasinya.

## Model ancaman

Asisten AI Anda dapat:

- Menjalankan perintah shell arbitrer
- Membaca/menulis file
- Mengakses layanan jaringan
- Mengirim pesan kepada siapa pun (jika Anda memberinya akses WhatsApp)

Orang yang mengirimi Anda pesan dapat:

- Mencoba menipu AI Anda agar melakukan hal buruk
- Melakukan rekayasa sosial untuk mengakses data Anda
- Menyelidiki detail infrastruktur

## Konsep inti: kontrol akses sebelum kecerdasan

Sebagian besar kegagalan di sini bukan eksploit canggih - melainkan "seseorang mengirim pesan ke bot dan bot melakukan apa yang mereka minta."

Sikap OpenClaw:

- **Identitas dahulu:** putuskan siapa yang dapat berbicara dengan bot (pemasangan DM / allowlist / "open" eksplisit).
- **Cakupan berikutnya:** putuskan di mana bot diizinkan bertindak (allowlist grup + gating mention, alat, sandboxing, izin perangkat).
- **Model terakhir:** asumsikan model dapat dimanipulasi; desain agar manipulasi memiliki radius dampak terbatas.

## Model otorisasi perintah

Perintah slash dan direktif hanya dihormati untuk **pengirim yang diotorisasi**. Otorisasi diturunkan dari
allowlist/pemasangan channel ditambah `commands.useAccessGroups` (lihat [Konfigurasi](/id/gateway/configuration)
dan [Perintah slash](/id/tools/slash-commands)). Jika allowlist channel kosong atau menyertakan `"*"`,
perintah secara efektif terbuka untuk channel tersebut.

`/exec` adalah kemudahan khusus sesi untuk operator yang diotorisasi. Ini **tidak** menulis konfigurasi atau
mengubah sesi lain.

## Risiko alat control plane

Dua alat bawaan dapat membuat perubahan control plane persisten:

- `gateway` dapat memeriksa konfigurasi dengan `config.schema.lookup` / `config.get`, dan dapat membuat perubahan persisten dengan `config.apply`, `config.patch`, dan `update.run`.
- `cron` dapat membuat job terjadwal yang terus berjalan setelah chat/tugas asli berakhir.

Alat runtime `gateway` khusus pemilik tetap menolak untuk menulis ulang
`tools.exec.ask` atau `tools.exec.security`; alias lama `tools.bash.*` dinormalisasi ke jalur eksekusi terlindungi yang sama sebelum penulisan.
Edit `gateway config.apply` dan `gateway config.patch` yang digerakkan agen
gagal tertutup secara bawaan: hanya serangkaian sempit jalur prompt, model, dan gating mention
yang dapat disetel agen. Karena itu, pohon konfigurasi sensitif baru terlindungi
kecuali sengaja ditambahkan ke allowlist.

Untuk agen/permukaan apa pun yang menangani konten tidak tepercaya, tolak ini secara bawaan:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` hanya memblokir tindakan restart. Ini tidak menonaktifkan tindakan konfigurasi/pembaruan `gateway`.

## Plugin

Plugin berjalan **dalam proses** bersama Gateway. Perlakukan sebagai kode tepercaya:

- Hanya instal Plugin dari sumber yang Anda percayai.
- Lebih sukai allowlist `plugins.allow` eksplisit.
- Tinjau konfigurasi Plugin sebelum mengaktifkan.
- Mulai ulang Gateway setelah perubahan Plugin.
- Jika Anda menginstal atau memperbarui Plugin (`openclaw plugins install <package>`, `openclaw plugins update <id>`), perlakukan seperti menjalankan kode tidak tepercaya:
  - Jalur instalasi adalah direktori per Plugin di bawah akar instalasi Plugin aktif.
  - OpenClaw menjalankan pemindaian kode berbahaya bawaan sebelum instalasi/pembaruan. Temuan `critical` memblokir secara bawaan.
  - Instalasi Plugin npm dan git menjalankan konvergensi dependensi package-manager hanya selama alur instalasi/pembaruan eksplisit. Jalur lokal dan arsip diperlakukan sebagai paket Plugin mandiri; OpenClaw menyalin/merujuknya tanpa menjalankan `npm install`.
  - Lebih sukai versi yang dipin dan persis (`@scope/pkg@1.2.3`), dan periksa kode yang dibongkar di disk sebelum mengaktifkan.
  - `--dangerously-force-unsafe-install` hanya untuk situasi break-glass pada false positive pemindaian bawaan dalam alur instalasi/pembaruan Plugin. Ini tidak melewati blok kebijakan hook `before_install` Plugin dan tidak melewati kegagalan pemindaian.
  - Instalasi dependensi Skills yang didukung Gateway mengikuti pemisahan berbahaya/mencurigakan yang sama: temuan `critical` bawaan memblokir kecuali pemanggil secara eksplisit menetapkan `dangerouslyForceUnsafeInstall`, sementara temuan mencurigakan tetap hanya memperingatkan. `openclaw skills install` tetap menjadi alur unduh/instal Skills ClawHub yang terpisah.

Detail: [Plugin](/id/tools/plugin)

## Model akses DM: pemasangan, allowlist, terbuka, dinonaktifkan

Semua channel yang saat ini mendukung DM mendukung kebijakan DM (`dmPolicy` atau `*.dm.policy`) yang menggating DM masuk **sebelum** pesan diproses:

- `pairing` (bawaan): pengirim tidak dikenal menerima kode pemasangan singkat dan bot mengabaikan pesan mereka hingga disetujui. Kode kedaluwarsa setelah 1 jam; DM berulang tidak akan mengirim ulang kode hingga permintaan baru dibuat. Permintaan tertunda dibatasi pada **3 per channel** secara bawaan.
- `allowlist`: pengirim tidak dikenal diblokir (tanpa handshake pemasangan).
- `open`: izinkan siapa pun mengirim DM (publik). **Memerlukan** allowlist channel untuk menyertakan `"*"` (opt-in eksplisit).
- `disabled`: abaikan DM masuk sepenuhnya.

Setujui melalui CLI:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

Detail + file di disk: [Pemasangan](/id/channels/pairing)

## Isolasi sesi DM (mode multi-pengguna)

Secara bawaan, OpenClaw merutekan **semua DM ke sesi utama** agar asisten Anda memiliki kesinambungan lintas perangkat dan channel. Jika **beberapa orang** dapat mengirim DM ke bot (DM terbuka atau allowlist multi-orang), pertimbangkan untuk mengisolasi sesi DM:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

Ini mencegah kebocoran konteks lintas pengguna sambil tetap menjaga chat grup tetap terisolasi.

Ini adalah batas konteks perpesanan, bukan batas admin host. Jika pengguna saling bermusuhan dan berbagi host/konfigurasi Gateway yang sama, jalankan Gateway terpisah per batas kepercayaan sebagai gantinya.

### Mode DM aman (direkomendasikan)

Perlakukan cuplikan di atas sebagai **mode DM aman**:

- Bawaan: `session.dmScope: "main"` (semua DM berbagi satu sesi untuk kesinambungan).
- Bawaan onboarding CLI lokal: menulis `session.dmScope: "per-channel-peer"` ketika belum ditetapkan (mempertahankan nilai eksplisit yang sudah ada).
- Mode DM aman: `session.dmScope: "per-channel-peer"` (setiap pasangan channel+pengirim mendapatkan konteks DM terisolasi).
- Isolasi peer lintas channel: `session.dmScope: "per-peer"` (setiap pengirim mendapatkan satu sesi di semua channel dengan tipe yang sama).

Jika Anda menjalankan beberapa akun pada saluran yang sama, gunakan `per-account-channel-peer` sebagai gantinya. Jika orang yang sama menghubungi Anda di beberapa saluran, gunakan `session.identityLinks` untuk menggabungkan sesi DM tersebut menjadi satu identitas kanonis. Lihat [Manajemen Sesi](/id/concepts/session) dan [Konfigurasi](/id/gateway/configuration).

## Daftar izin untuk DM dan grup

OpenClaw memiliki dua lapisan "siapa yang dapat memicu saya?" yang terpisah:

- **Daftar izin DM** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; lama: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): siapa yang diizinkan berbicara dengan bot dalam pesan langsung.
  - Saat `dmPolicy="pairing"`, persetujuan ditulis ke penyimpanan daftar izin pairing bercakupan akun di bawah `~/.openclaw/credentials/` (`<channel>-allowFrom.json` untuk akun default, `<channel>-<accountId>-allowFrom.json` untuk akun non-default), digabungkan dengan daftar izin konfigurasi.
- **Daftar izin grup** (khusus saluran): grup/saluran/guild mana yang pesannya akan diterima bot sama sekali.
  - Pola umum:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: default per grup seperti `requireMention`; saat ditetapkan, ini juga bertindak sebagai daftar izin grup (sertakan `"*"` untuk mempertahankan perilaku izinkan-semua).
    - `groupPolicy="allowlist"` + `groupAllowFrom`: membatasi siapa yang dapat memicu bot _di dalam_ sesi grup (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
    - `channels.discord.guilds` / `channels.slack.channels`: daftar izin per permukaan + default penyebutan.
  - Pemeriksaan grup berjalan dalam urutan ini: `groupPolicy`/daftar izin grup terlebih dahulu, aktivasi penyebutan/balasan kedua.
  - Membalas pesan bot (penyebutan implisit) **tidak** melewati daftar izin pengirim seperti `groupAllowFrom`.
  - **Catatan keamanan:** perlakukan `dmPolicy="open"` dan `groupPolicy="open"` sebagai pengaturan pilihan terakhir. Pengaturan tersebut sebaiknya nyaris tidak digunakan; pilih pairing + daftar izin kecuali Anda sepenuhnya memercayai setiap anggota ruangan.

Detail: [Konfigurasi](/id/gateway/configuration) dan [Grup](/id/channels/groups)

## Injeksi prompt (apa itu, mengapa penting)

Injeksi prompt adalah saat penyerang merancang pesan yang memanipulasi model agar melakukan sesuatu yang tidak aman ("abaikan instruksi Anda", "dump filesystem Anda", "ikuti tautan ini dan jalankan perintah", dll.).

Bahkan dengan prompt sistem yang kuat, **injeksi prompt belum terselesaikan**. Pagar pengaman prompt sistem hanyalah panduan lunak; penegakan keras berasal dari kebijakan alat, persetujuan eksekusi, sandboxing, dan daftar izin saluran (dan operator dapat menonaktifkannya sesuai desain). Hal yang membantu dalam praktik:

- Kunci DM masuk (pairing/daftar izin).
- Pilih gating penyebutan di grup; hindari bot "selalu aktif" di ruang publik.
- Perlakukan tautan, lampiran, dan instruksi yang ditempelkan sebagai berbahaya secara default.
- Jalankan eksekusi alat sensitif dalam sandbox; jauhkan rahasia dari filesystem yang dapat dijangkau agen.
- Catatan: sandboxing bersifat opt-in. Jika mode sandbox mati, `host=auto` implisit akan meresolusikan ke host gateway. `host=sandbox` eksplisit tetap gagal tertutup karena tidak ada runtime sandbox yang tersedia. Tetapkan `host=gateway` jika Anda ingin perilaku tersebut eksplisit dalam konfigurasi.
- Batasi alat berisiko tinggi (`exec`, `browser`, `web_fetch`, `web_search`) ke agen tepercaya atau daftar izin eksplisit.
- Jika Anda memasukkan interpreter ke daftar izin (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`), aktifkan `tools.exec.strictInlineEval` agar bentuk eval inline tetap memerlukan persetujuan eksplisit.
- Analisis persetujuan shell juga menolak bentuk ekspansi parameter POSIX (`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`) di dalam **heredoc tanpa kutip**, sehingga isi heredoc yang masuk daftar izin tidak dapat menyelundupkan ekspansi shell melewati tinjauan daftar izin sebagai teks biasa. Beri tanda kutip pada terminator heredoc (misalnya `<<'EOF'`) untuk memilih semantik isi literal; heredoc tanpa kutip yang akan mengekspansi variabel ditolak.
- **Pilihan model penting:** model lama/lebih kecil/legacy jauh kurang tangguh terhadap injeksi prompt dan penyalahgunaan alat. Untuk agen yang mengaktifkan alat, gunakan model generasi terbaru yang paling kuat dan diperkeras untuk instruksi yang tersedia.

Tanda bahaya yang perlu diperlakukan sebagai tidak tepercaya:

- "Baca file/URL ini dan lakukan persis seperti yang dikatakannya."
- "Abaikan prompt sistem atau aturan keselamatan Anda."
- "Ungkapkan instruksi tersembunyi atau output alat Anda."
- "Tempelkan seluruh isi ~/.openclaw atau log Anda."

## Sanitasi token khusus konten eksternal

OpenClaw menghapus literal token khusus templat chat LLM self-hosted umum dari konten eksternal terbungkus dan metadata sebelum mencapai model. Keluarga penanda yang tercakup mencakup token peran/giliran Qwen/ChatML, Llama, Gemma, Mistral, Phi, dan GPT-OSS.

Mengapa:

- Backend kompatibel OpenAI yang menjadi front untuk model self-hosted terkadang mempertahankan token khusus yang muncul dalam teks pengguna, alih-alih menyamarkannya. Penyerang yang dapat menulis ke konten eksternal masuk (halaman yang diambil, isi email, output alat isi file) jika tidak demikian dapat menyuntikkan batas peran `assistant` atau `system` sintetis dan keluar dari pagar pengaman konten terbungkus.
- Sanitasi terjadi di lapisan pembungkusan konten eksternal, sehingga berlaku seragam di seluruh alat fetch/read dan konten saluran masuk, bukan per penyedia.
- Respons model keluar sudah memiliki sanitizer terpisah yang menghapus `<tool_call>`, `<function_calls>`, `<system-reminder>`, `<previous_response>`, dan scaffolding runtime internal serupa yang bocor dari balasan yang terlihat pengguna di batas pengiriman saluran akhir. Sanitizer konten eksternal adalah padanan untuk sisi masuk.

Ini tidak menggantikan hardening lain di halaman ini - `dmPolicy`, daftar izin, persetujuan eksekusi, sandboxing, dan `contextVisibility` tetap melakukan pekerjaan utama. Ini menutup satu bypass khusus lapisan tokenizer terhadap stack self-hosted yang meneruskan teks pengguna dengan token khusus tetap utuh.

## Flag bypass konten eksternal tidak aman

OpenClaw menyertakan flag bypass eksplisit yang menonaktifkan pembungkusan keselamatan konten eksternal:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Field payload Cron `allowUnsafeExternalContent`

Panduan:

- Biarkan ini tidak ditetapkan/false di produksi.
- Aktifkan hanya sementara untuk debugging dengan cakupan ketat.
- Jika diaktifkan, isolasi agen tersebut (sandbox + alat minimal + namespace sesi khusus).

Catatan risiko hook:

- Payload hook adalah konten tidak tepercaya, bahkan saat pengiriman berasal dari sistem yang Anda kontrol (konten mail/docs/web dapat membawa injeksi prompt).
- Tingkatan model yang lemah meningkatkan risiko ini. Untuk otomatisasi berbasis hook, pilih tingkatan model modern yang kuat dan pertahankan kebijakan alat yang ketat (`tools.profile: "messaging"` atau lebih ketat), ditambah sandboxing jika memungkinkan.

### Injeksi prompt tidak memerlukan DM publik

Meskipun **hanya Anda** yang dapat mengirim pesan ke bot, injeksi prompt tetap dapat terjadi melalui
**konten tidak tepercaya** apa pun yang dibaca bot (hasil web search/fetch, halaman browser,
email, docs, lampiran, log/kode yang ditempelkan). Dengan kata lain: pengirim bukan
satu-satunya permukaan ancaman; **konten itu sendiri** dapat membawa instruksi adversarial.

Saat alat diaktifkan, risiko umumnya adalah mengeksfiltrasi konteks atau memicu
panggilan alat. Kurangi radius dampak dengan:

- Menggunakan **agen pembaca** hanya-baca atau tanpa alat untuk merangkum konten tidak tepercaya,
  lalu meneruskan ringkasan ke agen utama Anda.
- Menonaktifkan `web_search` / `web_fetch` / `browser` untuk agen yang mengaktifkan alat kecuali diperlukan.
- Untuk input URL OpenResponses (`input_file` / `input_image`), tetapkan
  `gateway.http.endpoints.responses.files.urlAllowlist` dan
  `gateway.http.endpoints.responses.images.urlAllowlist` secara ketat, dan pertahankan `maxUrlParts` rendah.
  Daftar izin kosong diperlakukan sebagai tidak ditetapkan; gunakan `files.allowUrl: false` / `images.allowUrl: false`
  jika Anda ingin menonaktifkan pengambilan URL sepenuhnya.
- Untuk input file OpenResponses, teks `input_file` yang didekodekan tetap disuntikkan sebagai
  **konten eksternal tidak tepercaya**. Jangan mengandalkan teks file sebagai tepercaya hanya karena
  Gateway mendekodenya secara lokal. Blok yang disuntikkan tetap membawa penanda batas
  `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` eksplisit ditambah metadata `Source: External`,
  meskipun jalur ini menghilangkan banner `SECURITY NOTICE:` yang lebih panjang.
- Pembungkusan berbasis penanda yang sama diterapkan saat pemahaman media mengekstrak teks
  dari dokumen terlampir sebelum menambahkan teks tersebut ke prompt media.
- Mengaktifkan sandboxing dan daftar izin alat yang ketat untuk agen apa pun yang menyentuh input tidak tepercaya.
- Menjauhkan rahasia dari prompt; berikan melalui env/konfigurasi pada host gateway sebagai gantinya.

### Backend LLM self-hosted

Backend self-hosted kompatibel OpenAI seperti vLLM, SGLang, TGI, LM Studio,
atau stack tokenizer Hugging Face kustom dapat berbeda dari penyedia ter-hosting dalam cara
token khusus templat chat ditangani. Jika backend mentokenisasi string literal
seperti `<|im_start|>`, `<|start_header_id|>`, atau `<start_of_turn>` sebagai
token struktural templat chat di dalam konten pengguna, teks tidak tepercaya dapat mencoba
memalsukan batas peran di lapisan tokenizer.

OpenClaw menghapus literal token khusus keluarga model umum dari konten
eksternal terbungkus sebelum mengirimkannya ke model. Tetap aktifkan pembungkusan konten eksternal,
dan pilih pengaturan backend yang memisahkan atau meng-escape token khusus
dalam konten yang disediakan pengguna jika tersedia. Penyedia ter-hosting seperti OpenAI
dan Anthropic sudah menerapkan sanitasi sisi permintaan mereka sendiri.

### Kekuatan model (catatan keamanan)

Ketahanan terhadap injeksi prompt **tidak** seragam di seluruh tingkatan model. Model yang lebih kecil/lebih murah umumnya lebih rentan terhadap penyalahgunaan alat dan pembajakan instruksi, terutama di bawah prompt adversarial.

<Warning>
Untuk agen yang mengaktifkan alat atau agen yang membaca konten tidak tepercaya, risiko injeksi prompt dengan model lama/lebih kecil sering kali terlalu tinggi. Jangan jalankan beban kerja tersebut pada tingkatan model yang lemah.
</Warning>

Rekomendasi:

- **Gunakan model generasi terbaru dengan tingkatan terbaik** untuk bot apa pun yang dapat menjalankan alat atau menyentuh file/jaringan.
- **Jangan gunakan tingkatan lama/lebih lemah/lebih kecil** untuk agen yang mengaktifkan alat atau kotak masuk tidak tepercaya; risiko injeksi prompt terlalu tinggi.
- Jika Anda harus menggunakan model yang lebih kecil, **kurangi radius dampak** (alat hanya-baca, sandboxing kuat, akses filesystem minimal, daftar izin ketat).
- Saat menjalankan model kecil, **aktifkan sandboxing untuk semua sesi** dan **nonaktifkan web_search/web_fetch/browser** kecuali input dikontrol ketat.
- Untuk asisten pribadi hanya-chat dengan input tepercaya dan tanpa alat, model yang lebih kecil biasanya baik-baik saja.

## Reasoning dan output verbose di grup

`/reasoning`, `/verbose`, dan `/trace` dapat mengekspos reasoning internal, output
alat, atau diagnostik Plugin yang
tidak dimaksudkan untuk saluran publik. Dalam pengaturan grup, perlakukan itu sebagai **debug
saja** dan biarkan nonaktif kecuali Anda secara eksplisit membutuhkannya.

Panduan:

- Biarkan `/reasoning`, `/verbose`, dan `/trace` dinonaktifkan di ruang publik.
- Jika Anda mengaktifkannya, lakukan hanya di DM tepercaya atau ruang yang dikontrol ketat.
- Ingat: output verbose dan trace dapat menyertakan argumen alat, URL, diagnostik Plugin, dan data yang dilihat model.

## Contoh hardening konfigurasi

### Izin file

Jaga konfigurasi + state tetap privat di host gateway:

- `~/.openclaw/openclaw.json`: `600` (hanya baca/tulis pengguna)
- `~/.openclaw`: `700` (hanya pengguna)

`openclaw doctor` dapat memperingatkan dan menawarkan untuk memperketat izin ini.

### Paparan jaringan (bind, port, firewall)

Gateway memultipleks **WebSocket + HTTP** pada satu port:

- Default: `18789`
- Konfigurasi/flag/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

Permukaan HTTP ini mencakup Control UI dan host canvas:

- Control UI (aset SPA) (path dasar default `/`)
- Host canvas: `/__openclaw__/canvas/` dan `/__openclaw__/a2ui/` (HTML/JS arbitrer; perlakukan sebagai konten tidak tepercaya)

Jika Anda memuat konten canvas di browser normal, perlakukan seperti halaman web tidak tepercaya lainnya:

- Jangan mengekspos host canvas ke jaringan/pengguna tidak tepercaya.
- Jangan membuat konten canvas berbagi origin yang sama dengan permukaan web berprivilege kecuali Anda sepenuhnya memahami implikasinya.

Mode bind mengontrol tempat Gateway mendengarkan:

- `gateway.bind: "loopback"` (default): hanya klien lokal yang dapat terhubung.
- Bind non-loopback (`"lan"`, `"tailnet"`, `"custom"`) memperluas permukaan serangan. Gunakan hanya dengan auth gateway (token/kata sandi bersama atau proxy tepercaya yang dikonfigurasi dengan benar) dan firewall nyata.

Aturan praktis:

- Lebih pilih Tailscale Serve daripada bind LAN (Serve menjaga Gateway tetap pada loopback, dan Tailscale menangani akses).
- Jika Anda harus bind ke LAN, batasi port dengan firewall ke allowlist IP sumber yang ketat; jangan port-forward secara luas.
- Jangan pernah mengekspos Gateway tanpa autentikasi pada `0.0.0.0`.

### Publikasi port Docker dengan UFW

Jika Anda menjalankan OpenClaw dengan Docker pada VPS, ingat bahwa port container yang dipublikasikan
(`-p HOST:CONTAINER` atau Compose `ports:`) dirutekan melalui chain forwarding Docker,
bukan hanya aturan host `INPUT`.

Agar lalu lintas Docker tetap selaras dengan kebijakan firewall Anda, berlakukan aturan di
`DOCKER-USER` (chain ini dievaluasi sebelum aturan accept milik Docker).
Pada banyak distro modern, `iptables`/`ip6tables` menggunakan frontend `iptables-nft`
dan tetap menerapkan aturan ini ke backend nftables.

Contoh allowlist minimal (IPv4):

```bash
# /etc/ufw/after.rules (append as its own *filter section)
*filter
:DOCKER-USER - [0:0]
-A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
-A DOCKER-USER -s 127.0.0.0/8 -j RETURN
-A DOCKER-USER -s 10.0.0.0/8 -j RETURN
-A DOCKER-USER -s 172.16.0.0/12 -j RETURN
-A DOCKER-USER -s 192.168.0.0/16 -j RETURN
-A DOCKER-USER -s 100.64.0.0/10 -j RETURN
-A DOCKER-USER -p tcp --dport 80 -j RETURN
-A DOCKER-USER -p tcp --dport 443 -j RETURN
-A DOCKER-USER -m conntrack --ctstate NEW -j DROP
-A DOCKER-USER -j RETURN
COMMIT
```

IPv6 memiliki tabel terpisah. Tambahkan kebijakan yang sesuai di `/etc/ufw/after6.rules` jika
Docker IPv6 diaktifkan.

Hindari hardcoding nama antarmuka seperti `eth0` dalam cuplikan dokumentasi. Nama antarmuka
berbeda-beda di berbagai image VPS (`ens3`, `enp*`, dll.) dan ketidaksesuaian dapat secara tidak sengaja
melewati aturan deny Anda.

Validasi cepat setelah reload:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

Port eksternal yang diharapkan seharusnya hanya yang sengaja Anda ekspos (untuk sebagian besar
setup: SSH + port reverse proxy Anda).

### Penemuan mDNS/Bonjour

Saat Plugin `bonjour` bawaan diaktifkan, Gateway menyiarkan keberadaannya melalui mDNS (`_openclaw-gw._tcp` pada port 5353) untuk penemuan perangkat lokal. Dalam mode penuh, ini mencakup record TXT yang dapat mengekspos detail operasional:

- `cliPath`: path filesystem lengkap ke biner CLI (mengungkap nama pengguna dan lokasi instalasi)
- `sshPort`: mengiklankan ketersediaan SSH pada host
- `displayName`, `lanHost`: informasi hostname

**Pertimbangan keamanan operasional:** Menyiarkan detail infrastruktur membuat pengintaian lebih mudah bagi siapa pun di jaringan lokal. Bahkan info yang "tidak berbahaya" seperti path filesystem dan ketersediaan SSH membantu penyerang memetakan lingkungan Anda.

**Rekomendasi:**

1. **Biarkan Bonjour dinonaktifkan kecuali penemuan LAN diperlukan.** Bonjour otomatis berjalan pada host macOS dan bersifat opt-in di tempat lain; URL Gateway langsung, Tailnet, SSH, atau DNS-SD area luas menghindari multicast lokal.

2. **Mode minimal** (default saat Bonjour diaktifkan, direkomendasikan untuk gateway yang terekspos): hilangkan field sensitif dari siaran mDNS:

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

3. **Nonaktifkan mode mDNS** jika Anda ingin tetap mengaktifkan Plugin tetapi menekan penemuan perangkat lokal:

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

4. **Mode penuh** (opt-in): sertakan `cliPath` + `sshPort` dalam record TXT:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

5. **Variabel lingkungan** (alternatif): setel `OPENCLAW_DISABLE_BONJOUR=1` untuk menonaktifkan mDNS tanpa perubahan config.

Saat Bonjour diaktifkan dalam mode minimal, Gateway menyiarkan cukup informasi untuk penemuan perangkat (`role`, `gatewayPort`, `transport`) tetapi menghilangkan `cliPath` dan `sshPort`. Aplikasi yang membutuhkan informasi path CLI dapat mengambilnya melalui koneksi WebSocket yang terautentikasi sebagai gantinya.

### Kunci WebSocket Gateway (auth lokal)

Auth Gateway **wajib secara default**. Jika tidak ada path auth gateway yang valid yang dikonfigurasi,
Gateway menolak koneksi WebSocket (fail-closed).

Onboarding menghasilkan token secara default (bahkan untuk loopback) sehingga
klien lokal harus melakukan autentikasi.

Setel token agar **semua** klien WS harus melakukan autentikasi:

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor dapat membuatkannya untuk Anda: `openclaw doctor --generate-gateway-token`.

<Note>
`gateway.remote.token` dan `gateway.remote.password` adalah sumber kredensial klien. Keduanya **tidak** melindungi akses WS lokal dengan sendirinya. Path panggilan lokal dapat menggunakan `gateway.remote.*` sebagai fallback hanya ketika `gateway.auth.*` belum disetel. Jika `gateway.auth.token` atau `gateway.auth.password` dikonfigurasi secara eksplisit melalui SecretRef dan tidak terselesaikan, resolusi gagal tertutup (tidak ada fallback jarak jauh yang menutupi).
</Note>
Opsional: pin TLS jarak jauh dengan `gateway.remote.tlsFingerprint` saat menggunakan `wss://`.
Plaintext `ws://` adalah loopback-only secara default. Untuk path jaringan privat tepercaya,
setel `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` pada proses klien sebagai
break-glass. Ini sengaja hanya lingkungan proses, bukan key config
`openclaw.json`.
Penyandingan mobile serta rute gateway manual atau hasil pindai Android lebih ketat:
cleartext diterima untuk loopback, tetapi private-LAN, link-local, `.local`, dan
hostname tanpa titik harus menggunakan TLS kecuali Anda secara eksplisit memilih path cleartext
jaringan privat tepercaya.

Penyandingan perangkat lokal:

- Penyandingan perangkat disetujui otomatis untuk koneksi local loopback langsung agar
  klien host yang sama tetap lancar.
- OpenClaw juga memiliki path self-connect backend/container-local yang sempit untuk
  alur helper rahasia bersama tepercaya.
- Koneksi Tailnet dan LAN, termasuk bind tailnet host yang sama, diperlakukan sebagai
  jarak jauh untuk penyandingan dan tetap memerlukan persetujuan.
- Bukti forwarded-header pada permintaan loopback menggugurkan
  lokalitas loopback. Persetujuan otomatis metadata-upgrade dibatasi secara sempit. Lihat
  [Penyandingan Gateway](/id/gateway/pairing) untuk kedua aturan.

Mode auth:

- `gateway.auth.mode: "token"`: token bearer bersama (direkomendasikan untuk sebagian besar setup).
- `gateway.auth.mode: "password"`: auth kata sandi (lebih pilih menyetel melalui env: `OPENCLAW_GATEWAY_PASSWORD`).
- `gateway.auth.mode: "trusted-proxy"`: percaya reverse proxy yang sadar identitas untuk mengautentikasi pengguna dan meneruskan identitas melalui header (lihat [Auth Proxy Tepercaya](/id/gateway/trusted-proxy-auth)).

Checklist rotasi (token/kata sandi):

1. Buat/setel rahasia baru (`gateway.auth.token` atau `OPENCLAW_GATEWAY_PASSWORD`).
2. Mulai ulang Gateway (atau mulai ulang aplikasi macOS jika aplikasi tersebut mengawasi Gateway).
3. Perbarui klien jarak jauh apa pun (`gateway.remote.token` / `.password` pada mesin yang memanggil Gateway).
4. Verifikasi bahwa Anda tidak lagi dapat terhubung dengan kredensial lama.

### Header identitas Tailscale Serve

Saat `gateway.auth.allowTailscale` adalah `true` (default untuk Serve), OpenClaw
menerima header identitas Tailscale Serve (`tailscale-user-login`) untuk autentikasi Control
UI/WebSocket. OpenClaw memverifikasi identitas dengan menyelesaikan alamat
`x-forwarded-for` melalui daemon Tailscale lokal (`tailscale whois`)
dan mencocokkannya dengan header. Ini hanya terpicu untuk permintaan yang mengenai loopback
dan menyertakan `x-forwarded-for`, `x-forwarded-proto`, dan `x-forwarded-host` seperti
yang diinjeksi oleh Tailscale.
Untuk path pemeriksaan identitas async ini, percobaan gagal untuk `{scope, ip}` yang sama
diserialkan sebelum limiter mencatat kegagalan. Retry buruk yang konkuren
dari satu klien Serve karena itu dapat mengunci percobaan kedua secara langsung
alih-alih berpacu lewat sebagai dua ketidakcocokan biasa.
Endpoint HTTP API (misalnya `/v1/*`, `/tools/invoke`, dan `/api/channels/*`)
**tidak** menggunakan auth header identitas Tailscale. Endpoint tersebut tetap mengikuti mode auth HTTP
yang dikonfigurasi gateway.

Catatan batas penting:

- Auth bearer HTTP Gateway secara efektif adalah akses operator semua-atau-tidak-sama-sekali.
- Perlakukan kredensial yang dapat memanggil `/v1/chat/completions`, `/v1/responses`, atau `/api/channels/*` sebagai rahasia operator akses penuh untuk gateway tersebut.
- Pada permukaan HTTP yang kompatibel dengan OpenAI, auth bearer rahasia bersama memulihkan scope operator default penuh (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) dan semantik owner untuk giliran agen; nilai `x-openclaw-scopes` yang lebih sempit tidak mengurangi path rahasia bersama tersebut.
- Semantik scope per permintaan pada HTTP hanya berlaku ketika permintaan berasal dari mode pembawa identitas seperti auth proxy tepercaya atau `gateway.auth.mode="none"` pada ingress privat.
- Dalam mode pembawa identitas tersebut, menghilangkan `x-openclaw-scopes` akan fallback ke set scope default operator normal; kirim header secara eksplisit saat Anda menginginkan set scope yang lebih sempit.
- `/tools/invoke` mengikuti aturan rahasia bersama yang sama: auth bearer token/kata sandi juga diperlakukan sebagai akses operator penuh di sana, sementara mode pembawa identitas tetap menghormati scope yang dideklarasikan.
- Jangan bagikan kredensial ini dengan pemanggil yang tidak tepercaya; lebih pilih gateway terpisah per batas kepercayaan.

**Asumsi kepercayaan:** auth Serve tanpa token mengasumsikan host gateway tepercaya.
Jangan perlakukan ini sebagai perlindungan terhadap proses host yang sama yang berbahaya. Jika kode lokal
yang tidak tepercaya dapat berjalan pada host gateway, nonaktifkan `gateway.auth.allowTailscale`
dan wajibkan auth rahasia bersama eksplisit dengan `gateway.auth.mode: "token"` atau
`"password"`.

**Aturan keamanan:** jangan teruskan header ini dari reverse proxy Anda sendiri. Jika
Anda mengakhiri TLS atau melakukan proxy di depan gateway, nonaktifkan
`gateway.auth.allowTailscale` dan gunakan auth rahasia bersama (`gateway.auth.mode:
"token"` atau `"password"`) atau [Auth Proxy Tepercaya](/id/gateway/trusted-proxy-auth)
sebagai gantinya.

Proxy tepercaya:

- Jika Anda mengakhiri TLS di depan Gateway, setel `gateway.trustedProxies` ke IP proxy Anda.
- OpenClaw akan memercayai `x-forwarded-for` (atau `x-real-ip`) dari IP tersebut untuk menentukan IP klien untuk pemeriksaan penyandingan lokal dan pemeriksaan auth HTTP/lokal.
- Pastikan proxy Anda **menimpa** `x-forwarded-for` dan memblokir akses langsung ke port Gateway.

Lihat [Tailscale](/id/gateway/tailscale) dan [Ikhtisar Web](/id/web).

### Kontrol browser melalui host node (direkomendasikan)

Jika Gateway Anda jarak jauh tetapi browser berjalan pada mesin lain, jalankan **host node**
pada mesin browser dan biarkan Gateway mem-proxy tindakan browser (lihat [Alat browser](/id/tools/browser)).
Perlakukan penyandingan node seperti akses admin.

Pola yang direkomendasikan:

- Pertahankan Gateway dan host node pada tailnet yang sama (Tailscale).
- Sandingkan node secara sengaja; nonaktifkan routing proxy browser jika Anda tidak membutuhkannya.

Hindari:

- Mengekspos port relay/kontrol melalui LAN atau Internet publik.
- Tailscale Funnel untuk endpoint kontrol browser (eksposur publik).

### Rahasia di disk

Anggap apa pun di bawah `~/.openclaw/` (atau `$OPENCLAW_STATE_DIR/`) dapat berisi rahasia atau data privat:

- `openclaw.json`: config dapat mencakup token (gateway, gateway jarak jauh), pengaturan provider, dan allowlist.
- `credentials/**`: kredensial channel (contoh: kredensial WhatsApp), allowlist penyandingan, impor OAuth lama.
- `agents/<agentId>/agent/auth-profiles.json`: key API, profil token, token OAuth, dan `keyRef`/`tokenRef` opsional.
- `agents/<agentId>/agent/codex-home/**`: akun app-server Codex per agen, config, skills, plugins, status thread native, dan diagnostik.
- `secrets.json` (opsional): payload rahasia berbasis file yang digunakan oleh provider SecretRef `file` (`secrets.providers`).
- `agents/<agentId>/agent/auth.json`: file kompatibilitas lama. Entri `api_key` statis dibersihkan saat ditemukan.
- `agents/<agentId>/sessions/**`: transkrip sesi (`*.jsonl`) + metadata routing (`sessions.json`) yang dapat berisi pesan privat dan output alat.
- paket Plugin bawaan: Plugin terinstal (plus `node_modules/` miliknya).
- `sandboxes/**`: workspace sandbox alat; dapat mengakumulasi salinan file yang Anda baca/tulis di dalam sandbox.

Tips pengerasan keamanan:

- Jaga izin tetap ketat (`700` pada direktori, `600` pada file).
- Gunakan enkripsi seluruh disk pada host gateway.
- Lebih baik gunakan akun pengguna OS khusus untuk Gateway jika host digunakan bersama.

### File `.env` workspace

OpenClaw memuat file `.env` lokal workspace untuk agen dan alat, tetapi tidak pernah membiarkan file tersebut diam-diam menimpa kontrol runtime gateway.

- Kunci apa pun yang dimulai dengan `OPENCLAW_*` diblokir dari file `.env` workspace yang tidak tepercaya.
- Pengaturan endpoint channel untuk Matrix, Mattermost, IRC, dan Synology Chat juga diblokir dari override `.env` workspace, sehingga workspace yang dikloning tidak dapat mengalihkan lalu lintas konektor bawaan melalui konfigurasi endpoint lokal. Kunci env endpoint (seperti `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`) harus berasal dari lingkungan proses gateway atau `env.shellEnv`, bukan dari `.env` yang dimuat dari workspace.
- Blokir ini bersifat gagal-tertutup: variabel kontrol runtime baru yang ditambahkan pada rilis mendatang tidak dapat diwarisi dari `.env` yang di-check-in atau dipasok penyerang; kunci tersebut diabaikan dan gateway mempertahankan nilainya sendiri.
- Variabel lingkungan proses/OS tepercaya (shell milik gateway, unit launchd/systemd, app bundle) tetap berlaku - ini hanya membatasi pemuatan file `.env`.

Alasan: file `.env` workspace sering berada di dekat kode agen, tidak sengaja di-commit, atau ditulis oleh alat. Memblokir seluruh prefiks `OPENCLAW_*` berarti penambahan flag `OPENCLAW_*` baru nanti tidak akan pernah mengalami regresi menjadi pewarisan diam-diam dari status workspace.

### Log dan transkrip (redaksi dan retensi)

Log dan transkrip dapat membocorkan info sensitif bahkan ketika kontrol akses sudah benar:

- Log Gateway dapat menyertakan ringkasan alat, error, dan URL.
- Transkrip sesi dapat menyertakan rahasia yang ditempel, isi file, output perintah, dan tautan.

Rekomendasi:

- Biarkan redaksi log dan transkrip aktif (`logging.redactSensitive: "tools"`; default).
- Tambahkan pola khusus untuk lingkungan Anda melalui `logging.redactPatterns` (token, hostname, URL internal).
- Saat membagikan diagnostik, lebih baik gunakan `openclaw status --all` (dapat ditempel, rahasia direduksi) daripada log mentah.
- Pangkas transkrip sesi dan file log lama jika Anda tidak memerlukan retensi panjang.

Detail: [Logging](/id/gateway/logging)

### DM: pairing secara default

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### Grup: wajibkan mention di mana-mana

```json
{
  "channels": {
    "whatsapp": {
      "groups": {
        "*": { "requireMention": true }
      }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "groupChat": { "mentionPatterns": ["@openclaw", "@mybot"] }
      }
    ]
  }
}
```

Di obrolan grup, hanya respons ketika disebut secara eksplisit.

### Nomor terpisah (WhatsApp, Signal, Telegram)

Untuk channel berbasis nomor telepon, pertimbangkan menjalankan AI Anda pada nomor telepon yang terpisah dari nomor pribadi Anda:

- Nomor pribadi: Percakapan Anda tetap privat
- Nomor bot: AI menangani ini, dengan batasan yang sesuai

### Mode baca-saja (melalui sandbox dan alat)

Anda dapat membuat profil baca-saja dengan menggabungkan:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (atau `"none"` untuk tanpa akses workspace)
- daftar allow/deny alat yang memblokir `write`, `edit`, `apply_patch`, `exec`, `process`, dll.

Opsi pengerasan tambahan:

- `tools.exec.applyPatch.workspaceOnly: true` (default): memastikan `apply_patch` tidak dapat menulis/menghapus di luar direktori workspace bahkan ketika sandboxing dimatikan. Atur ke `false` hanya jika Anda sengaja ingin `apply_patch` menyentuh file di luar workspace.
- `tools.fs.workspaceOnly: true` (opsional): membatasi path `read`/`write`/`edit`/`apply_patch` dan path pemuatan otomatis gambar prompt native ke direktori workspace (berguna jika Anda mengizinkan path absolut saat ini dan menginginkan satu pagar pembatas).
- Jaga root sistem file tetap sempit: hindari root yang luas seperti direktori home Anda untuk workspace agen/workspace sandbox. Root yang luas dapat mengekspos file lokal sensitif (misalnya status/konfig di bawah `~/.openclaw`) ke alat sistem file.

### Baseline aman (salin/tempel)

Satu konfigurasi "default aman" yang menjaga Gateway tetap privat, mewajibkan pairing DM, dan menghindari bot grup yang selalu aktif:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    port: 18789,
    auth: { mode: "token", token: "your-long-random-token" },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

Jika Anda juga menginginkan eksekusi alat yang "lebih aman secara default", tambahkan sandbox + deny alat berbahaya untuk agen non-pemilik apa pun (contoh di bawah pada "Profil akses per agen").

Baseline bawaan untuk giliran agen berbasis chat: pengirim non-pemilik tidak dapat menggunakan alat `cron` atau `gateway`.

## Sandboxing (direkomendasikan)

Dokumen khusus: [Sandboxing](/id/gateway/sandboxing)

Dua pendekatan yang saling melengkapi:

- **Jalankan seluruh Gateway di Docker** (batas kontainer): [Docker](/id/install/docker)
- **Sandbox alat** (`agents.defaults.sandbox`, host gateway + alat yang diisolasi sandbox; Docker adalah backend default): [Sandboxing](/id/gateway/sandboxing)

<Note>
Untuk mencegah akses lintas agen, biarkan `agents.defaults.sandbox.scope` pada `"agent"` (default) atau `"session"` untuk isolasi per sesi yang lebih ketat. `scope: "shared"` menggunakan satu kontainer atau workspace.
</Note>

Pertimbangkan juga akses workspace agen di dalam sandbox:

- `agents.defaults.sandbox.workspaceAccess: "none"` (default) menjaga workspace agen tetap tidak dapat diakses; alat berjalan terhadap workspace sandbox di bawah `~/.openclaw/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` memasang workspace agen sebagai baca-saja di `/agent` (menonaktifkan `write`/`edit`/`apply_patch`)
- `agents.defaults.sandbox.workspaceAccess: "rw"` memasang workspace agen sebagai baca/tulis di `/workspace`
- `sandbox.docker.binds` tambahan divalidasi terhadap path sumber yang dinormalisasi dan dikanonisasi. Trik symlink induk dan alias home kanonis tetap gagal-tertutup jika resolve ke root yang diblokir seperti `/etc`, `/var/run`, atau direktori kredensial di bawah home OS.

<Warning>
`tools.elevated` adalah pintu keluar baseline global yang menjalankan exec di luar sandbox. Host efektif adalah `gateway` secara default, atau `node` ketika target exec dikonfigurasi ke `node`. Jaga `tools.elevated.allowFrom` tetap ketat dan jangan aktifkan untuk orang asing. Anda dapat membatasi elevated lebih lanjut per agen melalui `agents.list[].tools.elevated`. Lihat [Mode elevated](/id/tools/elevated).
</Warning>

### Pagar pembatas delegasi sub-agen

Jika Anda mengizinkan alat sesi, perlakukan run sub-agen yang didelegasikan sebagai keputusan batas lain:

- Deny `sessions_spawn` kecuali agen benar-benar membutuhkan delegasi.
- Jaga `agents.defaults.subagents.allowAgents` dan override per agen `agents.list[].subagents.allowAgents` apa pun tetap terbatas pada agen target yang diketahui aman.
- Untuk workflow apa pun yang harus tetap tersandbox, panggil `sessions_spawn` dengan `sandbox: "require"` (default adalah `inherit`).
- `sandbox: "require"` gagal cepat ketika runtime child target tidak tersandbox.

## Risiko kontrol browser

Mengaktifkan kontrol browser memberi model kemampuan untuk mengendalikan browser nyata.
Jika profil browser tersebut sudah berisi sesi yang login, model dapat
mengakses akun dan data tersebut. Perlakukan profil browser sebagai **status sensitif**:

- Lebih baik gunakan profil khusus untuk agen (profil default `openclaw`).
- Hindari mengarahkan agen ke profil pribadi yang Anda gunakan sehari-hari.
- Biarkan kontrol browser host dinonaktifkan untuk agen tersandbox kecuali Anda memercayainya.
- API kontrol browser local loopback mandiri hanya menghormati autentikasi shared-secret
  (auth bearer token gateway atau kata sandi gateway). API ini tidak menggunakan
  header identitas trusted-proxy atau Tailscale Serve.
- Perlakukan unduhan browser sebagai input yang tidak tepercaya; lebih baik gunakan direktori unduhan yang terisolasi.
- Nonaktifkan sinkronisasi browser/pengelola kata sandi di profil agen jika memungkinkan (mengurangi blast radius).
- Untuk gateway jarak jauh, anggap "kontrol browser" setara dengan "akses operator" ke apa pun yang dapat dijangkau profil tersebut.
- Jaga Gateway dan host node hanya untuk tailnet; hindari mengekspos port kontrol browser ke LAN atau Internet publik.
- Nonaktifkan routing proxy browser ketika Anda tidak membutuhkannya (`gateway.nodes.browser.mode="off"`).
- Mode sesi-eksisting Chrome MCP **tidak** "lebih aman"; mode ini dapat bertindak sebagai Anda pada apa pun yang dapat dijangkau profil Chrome host tersebut.

### Kebijakan SSRF browser (ketat secara default)

Kebijakan navigasi browser OpenClaw ketat secara default: tujuan privat/internal tetap diblokir kecuali Anda ikut serta secara eksplisit.

- Default: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` tidak disetel, sehingga navigasi browser tetap memblokir tujuan privat/internal/penggunaan-khusus.
- Alias legacy: `browser.ssrfPolicy.allowPrivateNetwork` masih diterima untuk kompatibilitas.
- Mode opt-in: setel `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` untuk mengizinkan tujuan privat/internal/penggunaan-khusus.
- Dalam mode ketat, gunakan `hostnameAllowlist` (pola seperti `*.example.com`) dan `allowedHostnames` (pengecualian host persis, termasuk nama yang diblokir seperti `localhost`) untuk pengecualian eksplisit.
- Navigasi diperiksa sebelum request dan diperiksa ulang secara upaya-terbaik pada URL final `http(s)` setelah navigasi untuk mengurangi pivot berbasis redirect.

Contoh kebijakan ketat:

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"],
    },
  },
}
```

## Profil akses per agen (multi-agen)

Dengan routing multi-agen, setiap agen dapat memiliki sandbox + kebijakan alatnya sendiri:
gunakan ini untuk memberikan **akses penuh**, **baca-saja**, atau **tanpa akses** per agen.
Lihat [Multi-Agent Sandbox & Tools](/id/tools/multi-agent-sandbox-tools) untuk detail lengkap
dan aturan presedensi.

Kasus penggunaan umum:

- Agen pribadi: akses penuh, tanpa sandbox
- Agen keluarga/kerja: tersandbox + alat baca-saja
- Agen publik: tersandbox + tanpa alat sistem file/shell

### Contoh: akses penuh (tanpa sandbox)

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

### Contoh: alat baca-saja + workspace baca-saja

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "ro",
        },
        tools: {
          allow: ["read"],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

### Contoh: tanpa akses sistem file/shell (pesan provider diizinkan)

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "none",
        },
        // Session tools can reveal sensitive data from transcripts. By default OpenClaw limits these tools
        // to the current session + spawned subagent sessions, but you can clamp further if needed.
        // See `tools.sessions.visibility` in the configuration reference.
        tools: {
          sessions: { visibility: "tree" }, // self | tree | agent | all
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

## Respons insiden

Jika AI Anda melakukan sesuatu yang buruk:

### Kendalikan

1. **Hentikan:** hentikan aplikasi macOS (jika aplikasi tersebut mengawasi Gateway) atau akhiri proses `openclaw gateway` Anda.
2. **Tutup paparan:** atur `gateway.bind: "loopback"` (atau nonaktifkan Tailscale Funnel/Serve) sampai Anda memahami apa yang terjadi.
3. **Bekukan akses:** alihkan DM/grup berisiko ke `dmPolicy: "disabled"` / wajibkan penyebutan, dan hapus entri izinkan-semua `"*"` jika Anda memilikinya.

### Rotasi (anggap kompromi jika rahasia bocor)

1. Rotasi autentikasi Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) dan mulai ulang.
2. Rotasi rahasia klien jarak jauh (`gateway.remote.token` / `.password`) di mesin mana pun yang dapat memanggil Gateway.
3. Rotasi kredensial penyedia/API (kredensial WhatsApp, token Slack/Discord, kunci model/API di `auth-profiles.json`, dan nilai payload rahasia terenkripsi saat digunakan).

### Audit

1. Periksa log Gateway: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (atau `logging.file`).
2. Tinjau transkrip yang relevan: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. Tinjau perubahan konfigurasi terbaru (apa pun yang dapat memperluas akses: `gateway.bind`, `gateway.auth`, kebijakan DM/grup, `tools.elevated`, perubahan plugin).
4. Jalankan kembali `openclaw security audit --deep` dan pastikan temuan kritis telah diselesaikan.

### Kumpulkan untuk laporan

- Stempel waktu, OS host gateway + versi OpenClaw
- Transkrip sesi + potongan akhir log singkat (setelah disunting)
- Apa yang dikirim penyerang + apa yang dilakukan agen
- Apakah Gateway terekspos di luar loopback (LAN/Tailscale Funnel/Serve)

## Pemindaian rahasia

CI menjalankan hook pra-commit `detect-private-key` pada repositori. Jika
gagal, hapus atau rotasi materi kunci yang telah di-commit, lalu reproduksi secara lokal:

```bash
pre-commit run --all-files detect-private-key
```

## Melaporkan masalah keamanan

Menemukan kerentanan di OpenClaw? Harap laporkan secara bertanggung jawab:

1. Email: [security@openclaw.ai](mailto:security@openclaw.ai)
2. Jangan posting secara publik sampai diperbaiki
3. Kami akan memberi kredit kepada Anda (kecuali Anda lebih memilih anonim)
