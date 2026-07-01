---
read_when:
    - Anda melihat peringatan OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Anda melihat peringatan OPENCLAW_EXTENSION_API_DEPRECATED
    - Anda menggunakan api.registerEmbeddedExtensionFactory sebelum OpenClaw 2026.4.25
    - Anda sedang memperbarui Plugin ke arsitektur Plugin modern
    - Anda memelihara Plugin OpenClaw eksternal
sidebarTitle: Migrate to SDK
summary: Migrasikan dari lapisan kompatibilitas mundur lama ke SDK Plugin modern
title: Migrasi SDK Plugin
x-i18n:
    generated_at: "2026-07-01T13:23:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9f6f9b4334ca3bdbcc6602cfe2bb1499d5758de95a9163e0ef75619a712a1c3
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw telah berpindah dari lapisan kompatibilitas mundur yang luas ke arsitektur Plugin modern
dengan impor yang terfokus dan terdokumentasi. Jika Plugin Anda dibuat sebelum
arsitektur baru, panduan ini membantu Anda bermigrasi.

## Apa yang berubah

Sistem Plugin lama menyediakan dua permukaan yang sangat terbuka yang memungkinkan Plugin mengimpor
apa pun yang mereka butuhkan dari satu titik masuk:

- **`openclaw/plugin-sdk/compat`** - satu impor yang mengekspor ulang puluhan
  helper. Ini diperkenalkan untuk menjaga agar Plugin lama berbasis hook tetap berfungsi saat
  arsitektur Plugin baru sedang dibangun.
- **`openclaw/plugin-sdk/infra-runtime`** - barrel helper runtime yang luas yang
  mencampur event sistem, status Heartbeat, antrean pengiriman, helper fetch/proxy,
  helper file, tipe persetujuan, dan utilitas yang tidak terkait.
- **`openclaw/plugin-sdk/config-runtime`** - barrel kompatibilitas konfigurasi yang luas
  yang masih membawa helper load/write langsung yang sudah deprecated selama jendela
  migrasi.
- **`openclaw/extension-api`** - bridge yang memberi Plugin akses langsung ke
  helper sisi host seperti runner agen tertanam.
- **`api.registerEmbeddedExtensionFactory(...)`** - hook ekstensi bawaan khusus embedded-runner
  yang telah dihapus, yang dapat mengamati event embedded-runner seperti
  `tool_result`.

Permukaan impor yang luas sekarang **deprecated**. Permukaan tersebut masih berfungsi saat runtime,
tetapi Plugin baru tidak boleh menggunakannya, dan Plugin yang ada harus bermigrasi sebelum
rilis mayor berikutnya menghapusnya. API registrasi factory ekstensi khusus embedded-runner
telah dihapus; gunakan middleware hasil tool sebagai gantinya.

OpenClaw tidak menghapus atau menafsirkan ulang perilaku Plugin yang terdokumentasi dalam
perubahan yang sama yang memperkenalkan pengganti. Perubahan kontrak yang breaking harus terlebih dahulu
melewati adapter kompatibilitas, diagnostik, dokumentasi, dan jendela deprecation.
Ini berlaku untuk impor SDK, field manifest, API setup, hook, dan perilaku
registrasi runtime.

<Warning>
  Lapisan kompatibilitas mundur akan dihapus dalam rilis mayor mendatang.
  Plugin yang masih mengimpor dari permukaan ini akan rusak saat itu terjadi.
  Registrasi factory ekstensi tertanam lama sudah tidak lagi dimuat.
</Warning>

## Mengapa ini berubah

Pendekatan lama menyebabkan masalah:

- **Startup lambat** - mengimpor satu helper memuat puluhan modul yang tidak terkait
- **Dependensi sirkular** - ekspor ulang yang luas memudahkan terbentuknya siklus impor
- **Permukaan API tidak jelas** - tidak ada cara untuk mengetahui ekspor mana yang stabil vs internal

SDK Plugin modern memperbaiki ini: setiap path impor (`openclaw/plugin-sdk/\<subpath\>`)
adalah modul kecil dan mandiri dengan tujuan yang jelas serta kontrak terdokumentasi.

Seam kemudahan penyedia lama untuk channel bawaan juga sudah hilang.
Seam helper bermerek channel adalah pintasan privat mono-repo, bukan kontrak
Plugin yang stabil. Gunakan subpath SDK generik yang sempit sebagai gantinya. Di dalam workspace
Plugin bawaan, simpan helper milik penyedia di `api.ts` atau
`runtime-api.ts` milik Plugin tersebut.

Contoh penyedia bawaan saat ini:

- Anthropic menyimpan helper stream khusus Claude di seam `api.ts` /
  `contract-api.ts` miliknya sendiri
- OpenAI menyimpan builder penyedia, helper model default, dan builder penyedia realtime
  di `api.ts` miliknya sendiri
- OpenRouter menyimpan builder penyedia dan helper onboarding/konfigurasi di
  `api.ts` miliknya sendiri

## Rencana migrasi Talk dan suara realtime

Kode Talk untuk suara realtime, telefoni, rapat, dan browser sedang dipindahkan dari
pencatatan giliran lokal permukaan ke controller sesi Talk bersama yang diekspor oleh
`openclaw/plugin-sdk/realtime-voice`. Controller baru memiliki envelope event Talk
umum, status giliran aktif, status capture, status output-audio, riwayat event
terbaru, dan penolakan giliran usang. Plugin penyedia harus tetap memiliki sesi realtime
khusus vendor; Plugin permukaan harus tetap memiliki kekhasan capture,
playback, telefoni, dan rapat.

Migrasi Talk ini sengaja dibuat breaking-clean:

1. Simpan primitif controller/runtime bersama di
   `plugin-sdk/realtime-voice`.
2. Pindahkan permukaan bawaan ke controller bersama: relay browser,
   handoff managed-room, realtime voice-call, STT streaming voice-call, Google
   Meet realtime, dan native push-to-talk.
3. Ganti keluarga RPC Talk lama dengan API final `talk.session.*` dan
   `talk.client.*`.
4. Iklankan satu channel event Talk live di Gateway
   `hello-ok.features.events`: `talk.event`.
5. Hapus endpoint HTTP realtime lama dan semua path override instruksi saat request.

Kode baru tidak boleh memanggil `createTalkEventSequencer(...)` secara langsung kecuali sedang
mengimplementasikan adapter level rendah atau fixture test. Lebih baik gunakan controller bersama
agar event berskala giliran tidak dapat dipancarkan tanpa id giliran, panggilan `turnEnd` /
`turnCancel` yang usang tidak dapat menghapus giliran aktif yang lebih baru, dan event lifecycle
output-audio tetap konsisten di seluruh telefoni, rapat, relay browser, handoff
managed-room, dan klien Talk native.

Bentuk API publik target adalah:

```typescript
// Gateway-owned Talk session API.
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// Client-owned provider session API.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

Sesi WebRTC/provider-websocket milik browser menggunakan `talk.client.create`,
karena browser memiliki negosiasi penyedia dan transport media sementara
Gateway memiliki kredensial, instruksi, dan kebijakan tool. `talk.session.*` adalah
permukaan umum yang dikelola Gateway untuk gateway-relay realtime, gateway-relay
transcription, dan sesi STT/TTS native managed-room.

Konfigurasi lama yang menempatkan selector realtime di samping `talk.provider` /
`talk.providers` harus diperbaiki dengan `openclaw doctor --fix`; Talk runtime
tidak menafsirkan ulang konfigurasi penyedia speech/TTS sebagai konfigurasi penyedia realtime.

Kombinasi `talk.session.create` yang didukung sengaja dibuat kecil:

| Mode            | Transport       | Otak            | Pemilik            | Catatan                                                                                                            |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio penyedia full-duplex dijembatani melalui Gateway; panggilan tool dirutekan melalui tool agent-consult.      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Hanya STT streaming; pemanggil mengirim audio input dan menerima event transkrip.                                  |
| `stt-tts`       | `managed-room`  | `agent-consult` | Ruang native/klien | Ruang bergaya push-to-talk dan walkie-talkie tempat klien memiliki capture/playback dan Gateway memiliki status giliran. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Ruang native/klien | Mode ruang khusus admin untuk permukaan first-party tepercaya yang mengeksekusi aksi tool Gateway secara langsung. |

Peta metode yang dihapus:

| Lama                             | Baru                                                     |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` or `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

Kosakata kontrol terpadu juga sengaja dibuat sempit:

  | Metode                          | Berlaku untuk                                           | Kontrak                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Tambahkan potongan audio PCM base64 ke sesi penyedia yang dimiliki oleh koneksi Gateway yang sama.                                                                                            |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Mulai giliran pengguna managed-room.                                                                                                                                                          |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Akhiri giliran aktif setelah validasi giliran usang.                                                                                                                                         |
  | `talk.session.cancelTurn`       | semua sesi milik Gateway                              | Batalkan pekerjaan capture/penyedia/agent/TTS aktif untuk satu giliran.                                                                                                                                |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Hentikan keluaran audio asisten tanpa harus mengakhiri giliran pengguna.                                                                                                                    |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Selesaikan panggilan alat penyedia yang dipancarkan oleh relay; teruskan `options.willContinue` untuk keluaran sementara atau `options.suppressResponse` untuk memenuhi panggilan tanpa respons asisten lain. |
  | `talk.session.steer`            | sesi Talk yang didukung agent                              | Kirim kontrol lisan `status`, `steer`, `cancel`, atau `followup` ke proses tertanam aktif yang di-resolve dari sesi Talk.                                                                |
  | `talk.session.close`            | semua sesi terpadu                                    | Hentikan sesi relay atau cabut status managed-room, lalu lupakan id sesi terpadu.                                                                                                    |

  Jangan memperkenalkan kasus khusus penyedia atau platform di core agar ini berfungsi.
  Core memiliki semantik sesi Talk. Plugin penyedia memiliki penyiapan sesi vendor.
  Panggilan suara dan Google Meet memiliki adaptor telepon/rapat. Browser dan aplikasi native
  memiliki UX capture/pemutaran perangkat.

  ## Kebijakan kompatibilitas

  Untuk plugin eksternal, pekerjaan kompatibilitas mengikuti urutan ini:

  1. tambahkan kontrak baru
  2. pertahankan perilaku lama yang dihubungkan melalui adaptor kompatibilitas
  3. pancarkan diagnostik atau peringatan yang menyebutkan jalur lama dan penggantinya
  4. cakup kedua jalur dalam pengujian
  5. dokumentasikan deprekasi dan jalur migrasi
  6. hapus hanya setelah jendela migrasi yang diumumkan, biasanya dalam rilis mayor

  Maintainer dapat mengaudit antrean migrasi saat ini dengan
  `pnpm plugins:boundary-report`. Gunakan `pnpm plugins:boundary-report:summary` untuk
  jumlah ringkas, `--owner <id>` untuk satu plugin atau pemilik kompatibilitas, dan
  `pnpm plugins:boundary-report:ci` saat gate CI harus gagal pada catatan
  kompatibilitas yang jatuh tempo, impor SDK tercadangkan lintas-pemilik, atau subpath SDK
  tercadangkan yang tidak digunakan. Laporan mengelompokkan catatan
  kompatibilitas yang dideprekasi berdasarkan tanggal penghapusan, menghitung referensi code/docs lokal,
  menampilkan impor SDK tercadangkan lintas-pemilik, dan merangkum bridge SDK
  memory-host privat agar pembersihan kompatibilitas tetap eksplisit alih-alih
  mengandalkan pencarian ad hoc. Subpath SDK tercadangkan harus memiliki penggunaan pemilik yang dilacak;
  ekspor helper tercadangkan yang tidak digunakan harus dihapus dari SDK publik.

  Jika field manifest masih diterima, penulis plugin dapat terus menggunakannya sampai
  docs dan diagnostik menyatakan sebaliknya. Kode baru sebaiknya memilih pengganti yang terdokumentasi,
  tetapi plugin yang ada tidak boleh rusak selama rilis minor biasa.

  ## Cara bermigrasi

  <Steps>
  <Step title="Migrasikan helper muat/tulis config runtime">
    Plugin bundled harus berhenti memanggil
    `api.runtime.config.loadConfig()` dan
    `api.runtime.config.writeConfigFile(...)` secara langsung. Lebih pilih config yang
    sudah diteruskan ke jalur panggilan aktif. Handler berumur panjang yang membutuhkan
    snapshot proses saat ini dapat menggunakan `api.runtime.config.current()`. Alat agent
    berumur panjang harus menggunakan `ctx.getRuntimeConfig()` milik konteks alat di dalam
    `execute` agar alat yang dibuat sebelum penulisan config tetap melihat config runtime
    yang sudah disegarkan.

    Penulisan config harus melalui helper transaksional dan memilih kebijakan
    setelah-tulis:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Gunakan `afterWrite: { mode: "restart", reason: "..." }` saat pemanggil tahu
    perubahan tersebut memerlukan restart gateway yang bersih, dan
    `afterWrite: { mode: "none", reason: "..." }` hanya saat pemanggil memiliki
    tindak lanjutnya dan sengaja ingin menekan perencana pemuatan ulang.
    Hasil mutasi mencakup ringkasan `followUp` bertipe untuk pengujian dan logging;
    gateway tetap bertanggung jawab untuk menerapkan atau menjadwalkan restart.
    `loadConfig` dan `writeConfigFile` tetap menjadi helper kompatibilitas yang
    dideprekasi untuk plugin eksternal selama jendela migrasi dan memperingatkan sekali dengan
    kode kompatibilitas `runtime-config-load-write`. Plugin bundled dan kode runtime
    repo dilindungi oleh guardrail scanner di
    `pnpm check:deprecated-api-usage` dan
    `pnpm check:no-runtime-action-load-config`: penggunaan plugin produksi baru
    langsung gagal, penulisan config langsung gagal, metode server gateway harus menggunakan
    snapshot runtime permintaan, helper kirim/aksi/klien channel runtime
    harus menerima config dari batasnya, dan modul runtime berumur panjang memiliki
    nol panggilan ambient `loadConfig()` yang diizinkan.

    Kode plugin baru juga harus menghindari pengimporan barrel kompatibilitas luas
    `openclaw/plugin-sdk/config-runtime`. Gunakan subpath SDK sempit yang sesuai
    dengan pekerjaannya:

    | Kebutuhan | Impor |
    | --- | --- |
    | Tipe config seperti `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Assertion config yang sudah dimuat dan pencarian config plugin-entry | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Pembacaan snapshot runtime saat ini | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Penulisan config | `openclaw/plugin-sdk/config-mutation` |
    | Helper penyimpanan sesi | `openclaw/plugin-sdk/session-store-runtime` |
    | Config tabel Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helper runtime kebijakan grup | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolusi input rahasia | `openclaw/plugin-sdk/secret-input-runtime` |
    | Override model/sesi | `openclaw/plugin-sdk/model-session-runtime` |

    Plugin bundled dan pengujiannya dijaga scanner terhadap barrel luas
    agar impor dan mock tetap lokal pada perilaku yang dibutuhkan. Barrel luas
    masih ada untuk kompatibilitas eksternal, tetapi kode baru sebaiknya tidak
    bergantung padanya.

  </Step>

  <Step title="Migrasikan ekstensi hasil alat tertanam ke middleware">
    Plugin bundled harus mengganti handler hasil alat
    `api.registerEmbeddedExtensionFactory(...)` khusus embedded-runner dengan
    middleware yang netral runtime.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Perbarui manifest plugin pada saat yang sama:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Plugin terinstal juga dapat mendaftarkan middleware hasil alat saat
    diaktifkan secara eksplisit dan mendeklarasikan setiap runtime yang ditargetkan di
    `contracts.agentToolResultMiddleware`. Pendaftaran middleware terinstal yang
    tidak dideklarasikan akan ditolak.

  </Step>

  <Step title="Migrasikan handler native persetujuan ke fakta kapabilitas">
    Plugin channel yang mendukung persetujuan kini mengekspos perilaku persetujuan native melalui
    `approvalCapability.nativeRuntime` plus registry runtime-context bersama.

    Perubahan utama:

    - Ganti `approvalCapability.handler.loadRuntime(...)` dengan
      `approvalCapability.nativeRuntime`
    - Pindahkan auth/delivery khusus persetujuan dari wiring `plugin.auth` /
      `plugin.approvals` legacy ke `approvalCapability`
    - `ChannelPlugin.approvals` telah dihapus dari kontrak plugin-channel publik;
      pindahkan field delivery/native/render ke `approvalCapability`
    - `plugin.auth` tetap ada hanya untuk alur login/logout channel; hook auth persetujuan
      di sana tidak lagi dibaca oleh core
    - Daftarkan objek runtime milik channel seperti klien, token, atau aplikasi Bolt
      melalui `openclaw/plugin-sdk/channel-runtime-context`
    - Jangan kirim pemberitahuan reroute milik plugin dari handler persetujuan native;
      core kini memiliki pemberitahuan routed-elsewhere dari hasil delivery aktual
    - Saat meneruskan `channelRuntime` ke `createChannelManager(...)`, sediakan
      surface `createPluginRuntime().channel` yang nyata. Stub parsial ditolak.

    Lihat `/plugins/sdk-channel-plugins` untuk tata letak kapabilitas persetujuan saat ini.

  </Step>

  <Step title="Audit perilaku fallback wrapper Windows">
    Jika plugin Anda menggunakan `openclaw/plugin-sdk/windows-spawn`, wrapper Windows
    `.cmd`/`.bat` yang tidak terselesaikan kini gagal tertutup kecuali Anda secara eksplisit meneruskan
    `allowShellFallback: true`.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Jika pemanggil Anda tidak sengaja bergantung pada fallback shell, jangan setel
    `allowShellFallback` dan tangani error yang dilempar sebagai gantinya.

  </Step>

  <Step title="Temukan impor yang dideprekasi">
    Cari plugin Anda untuk impor dari salah satu surface yang dideprekasi:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Ganti dengan impor terfokus">
    Setiap ekspor dari surface lama dipetakan ke path impor modern tertentu:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Untuk helper sisi host, gunakan runtime plugin yang diinjeksi alih-alih mengimpor
    secara langsung:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Pola yang sama berlaku untuk helper bridge lama lainnya:

    | Impor lama | Padanan modern |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper penyimpanan sesi | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` masih ada untuk kompatibilitas
    eksternal, tetapi kode baru sebaiknya mengimpor permukaan helper terfokus
    yang benar-benar dibutuhkan:

    | Kebutuhan | Impor |
    | --- | --- |
    | Helper antrean peristiwa sistem | `openclaw/plugin-sdk/system-event-runtime` |
    | Helper bangun Heartbeat, peristiwa, dan visibilitas | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Pengosongan antrean pengiriman tertunda | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetri aktivitas kanal | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cache dedupe dalam memori | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helper jalur file/media lokal yang aman | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch yang sadar dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Helper proxy dan fetch terlindungi | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipe kebijakan dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipe permintaan/penyelesaian persetujuan | `openclaw/plugin-sdk/approval-runtime` |
    | Payload balasan persetujuan dan helper perintah | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helper pemformatan kesalahan | `openclaw/plugin-sdk/error-runtime` |
    | Penantian kesiapan transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helper token aman | `openclaw/plugin-sdk/secure-random-runtime` |
    | Konkurensi tugas asinkron terbatas | `openclaw/plugin-sdk/concurrency-runtime` |
    | Koersi numerik | `openclaw/plugin-sdk/number-runtime` |
    | Kunci asinkron lokal proses | `openclaw/plugin-sdk/async-lock-runtime` |
    | Kunci file | `openclaw/plugin-sdk/file-lock` |

    Plugin bawaan dilindungi pemindai dari `infra-runtime`, sehingga kode repo
    tidak dapat mundur ke barrel yang luas.

  </Step>

  <Step title="Migrate channel route helpers">
    Kode rute kanal baru sebaiknya menggunakan `openclaw/plugin-sdk/channel-route`.
    Nama route-key dan comparable-target yang lebih lama tetap ada sebagai alias
    kompatibilitas selama jendela migrasi, tetapi Plugin baru sebaiknya memakai
    nama rute yang menjelaskan perilaku secara langsung:

    | Helper lama | Helper modern |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Helper rute modern menormalkan `{ channel, to, accountId, threadId }`
    secara konsisten di seluruh persetujuan native, penekanan balasan, dedupe
    masuk, pengiriman Cron, dan perutean sesi.

    Jangan tambahkan penggunaan baru atas `ChannelMessagingAdapter.parseExplicitTarget` atau
    helper loaded-route berbasis parser (`parseExplicitTargetForLoadedChannel`
    atau `resolveRouteTargetForLoadedChannel`) atau
    `resolveChannelRouteTargetWithParser(...)` dari `plugin-sdk/channel-route`.
    Hook tersebut sudah tidak digunakan lagi dan tetap ada hanya untuk Plugin
    yang lebih lama selama jendela migrasi. Plugin kanal baru sebaiknya menggunakan
    `messaging.targetResolver.resolveTarget(...)` untuk normalisasi id target
    dan fallback ketika direktori tidak cocok, `messaging.inferTargetChatType(...)` saat core
    memerlukan jenis peer lebih awal, dan `messaging.resolveOutboundSessionRoute(...)`
    untuk sesi native provider dan identitas thread.

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referensi jalur impor

  <Accordion title="Tabel path impor umum">
  | Path impor | Tujuan | Ekspor utama |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Pembantu entri Plugin kanonis | `definePluginEntry` |
  | `plugin-sdk/core` | Ekspor ulang payung lama untuk definisi/pembangun entri kanal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Ekspor skema konfigurasi root | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Pembantu entri penyedia tunggal | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definisi dan pembangun entri kanal yang terfokus | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Pembantu wizard penyiapan bersama | Penerjemah penyiapan, prompt allowlist, pembangun status penyiapan |
  | `plugin-sdk/setup-runtime` | Pembantu runtime saat penyiapan | `createSetupTranslator`, adaptor patch penyiapan yang aman diimpor, pembantu catatan pencarian, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy penyiapan terdelegasi |
  | `plugin-sdk/setup-adapter-runtime` | Alias adaptor penyiapan yang tidak digunakan lagi | Gunakan `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Pembantu perkakas penyiapan | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Pembantu multi-akun | Pembantu daftar akun/konfigurasi/gerbang tindakan |
  | `plugin-sdk/account-id` | Pembantu ID akun | `DEFAULT_ACCOUNT_ID`, normalisasi ID akun |
  | `plugin-sdk/account-resolution` | Pembantu pencarian akun | Pembantu pencarian akun + fallback default |
  | `plugin-sdk/account-helpers` | Pembantu akun sempit | Pembantu daftar akun/tindakan akun |
  | `plugin-sdk/channel-setup` | Adaptor wizard penyiapan | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ditambah `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitif pemasangan DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Pengawatan prefiks balasan, pengetikan, dan pengiriman sumber | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Factory adaptor konfigurasi dan pembantu akses DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Pembangun skema konfigurasi | Primitif skema konfigurasi kanal bersama dan hanya pembangun generik |
  | `plugin-sdk/bundled-channel-config-schema` | Skema konfigurasi bundel | Hanya Plugin bundel yang dipelihara OpenClaw; Plugin baru harus mendefinisikan skema lokal Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Skema konfigurasi bundel yang tidak digunakan lagi | Hanya alias kompatibilitas; gunakan `plugin-sdk/bundled-channel-config-schema` untuk Plugin bundel yang dipelihara |
  | `plugin-sdk/telegram-command-config` | Pembantu konfigurasi perintah Telegram | Normalisasi nama perintah, pemangkasan deskripsi, validasi duplikat/konflik |
  | `plugin-sdk/channel-policy` | Resolusi kebijakan grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Fasad kompatibilitas yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Pembantu amplop masuk | Pembantu rute bersama + pembangun amplop |
  | `plugin-sdk/channel-inbound` | Pembantu penerimaan masuk | Pembuatan konteks, pemformatan, root, runner, pengiriman balasan yang disiapkan, dan predikat pengiriman |
  | `plugin-sdk/messaging-targets` | Path impor parsing target yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-targets` untuk pembantu parsing target generik, `plugin-sdk/channel-route` untuk perbandingan rute, dan `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` milik Plugin untuk resolusi target khusus penyedia |
  | `plugin-sdk/outbound-media` | Pembantu media keluar | Pemuatan media keluar bersama |
  | `plugin-sdk/outbound-send-deps` | Fasad kompatibilitas yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Pembantu siklus hidup pesan keluar | Adaptor pesan, tanda terima, pembantu pengiriman tahan lama, pembantu pratinjau langsung/streaming, opsi balasan, pembantu siklus hidup, identitas keluar, dan perencanaan payload |
  | `plugin-sdk/channel-streaming` | Fasad kompatibilitas yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Fasad kompatibilitas yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Pembantu pengikatan thread | Siklus hidup pengikatan thread dan pembantu adaptor |
  | `plugin-sdk/agent-media-payload` | Pembantu payload media lama | Pembangun payload media agen untuk tata letak field lama |
  | `plugin-sdk/channel-runtime` | Shim kompatibilitas yang tidak digunakan lagi | Hanya utilitas runtime kanal lama |
  | `plugin-sdk/channel-send-result` | Tipe hasil pengiriman | Tipe hasil balasan |
  | `plugin-sdk/runtime-store` | Penyimpanan Plugin persisten | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Pembantu runtime luas | Pembantu runtime/logging/cadangan/instalasi Plugin |
  | `plugin-sdk/runtime-env` | Pembantu env runtime sempit | Pembantu logger/env runtime, timeout, retry, dan backoff |
  | `plugin-sdk/plugin-runtime` | Pembantu runtime Plugin bersama | Pembantu perintah/hook/http/interaktif Plugin |
  | `plugin-sdk/hook-runtime` | Pembantu pipeline hook | Pembantu pipeline webhook/hook internal bersama |
  | `plugin-sdk/lazy-runtime` | Pembantu runtime malas | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Pembantu proses | Pembantu exec bersama |
  | `plugin-sdk/cli-runtime` | Pembantu runtime CLI | Pemformatan perintah, penantian, pembantu versi |
  | `plugin-sdk/gateway-runtime` | Pembantu Gateway | Klien Gateway, pembantu mulai siap event-loop, resolusi host LAN yang diiklankan, dan pembantu patch status kanal |
  | `plugin-sdk/config-runtime` | Shim kompatibilitas konfigurasi yang tidak digunakan lagi | Lebih utamakan `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, dan `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Pembantu perintah Telegram | Pembantu validasi perintah Telegram yang stabil terhadap fallback saat permukaan kontrak Telegram bundel tidak tersedia |
  | `plugin-sdk/approval-runtime` | Pembantu prompt persetujuan | Payload persetujuan exec/Plugin, pembantu kapabilitas/profil persetujuan, pembantu routing/runtime persetujuan native, dan pemformatan path tampilan persetujuan terstruktur |
  | `plugin-sdk/approval-auth-runtime` | Pembantu auth persetujuan | Resolusi pemberi persetujuan, auth tindakan dalam chat yang sama |
  | `plugin-sdk/approval-client-runtime` | Pembantu klien persetujuan | Pembantu profil/filter persetujuan exec native |
  | `plugin-sdk/approval-delivery-runtime` | Pembantu pengiriman persetujuan | Adaptor kapabilitas/pengiriman persetujuan native |
  | `plugin-sdk/approval-gateway-runtime` | Pembantu Gateway persetujuan | Pembantu resolusi Gateway persetujuan bersama |
  | `plugin-sdk/approval-handler-adapter-runtime` | Pembantu adaptor persetujuan | Pembantu pemuatan adaptor persetujuan native ringan untuk entrypoint kanal hot |
  | `plugin-sdk/approval-handler-runtime` | Pembantu handler persetujuan | Pembantu runtime handler persetujuan yang lebih luas; utamakan seam adaptor/Gateway yang lebih sempit saat sudah cukup |
  | `plugin-sdk/approval-native-runtime` | Pembantu target persetujuan | Pembantu pengikatan target/akun persetujuan native |
  | `plugin-sdk/approval-reply-runtime` | Pembantu balasan persetujuan | Pembantu payload balasan persetujuan exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Pembantu konteks runtime kanal | Pembantu register/get/watch konteks runtime kanal generik |
  | `plugin-sdk/security-runtime` | Pembantu keamanan | Pembantu trust bersama, gerbang DM, file/path berbatas root, konten eksternal, dan pengumpulan rahasia |
  | `plugin-sdk/ssrf-policy` | Pembantu kebijakan SSRF | Pembantu allowlist host dan kebijakan jaringan privat |
  | `plugin-sdk/ssrf-runtime` | Pembantu runtime SSRF | Dispatcher tersemat, fetch terlindungi, pembantu kebijakan SSRF |
  | `plugin-sdk/system-event-runtime` | Pembantu event sistem | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Pembantu Heartbeat | Pembantu bangun, event, dan visibilitas Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Pembantu antrean pengiriman | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Pembantu aktivitas kanal | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Pembantu dedupe | Cache dedupe dalam memori |
  | `plugin-sdk/file-access-runtime` | Pembantu akses file | Pembantu path file/media lokal yang aman |
  | `plugin-sdk/transport-ready-runtime` | Pembantu kesiapan transport | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Pembantu kebijakan persetujuan exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Pembantu cache berbatas | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Pembantu gerbang diagnostik | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Pembantu pemformatan error | `formatUncaughtError`, `isApprovalNotFoundError`, pembantu grafik error |
  | `plugin-sdk/fetch-runtime` | Pembantu fetch/proxy terbungkus | `resolveFetch`, pembantu proxy, pembantu opsi EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Pembantu normalisasi host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Pembantu retry | `RetryConfig`, `retryAsync`, runner kebijakan |
  | `plugin-sdk/allow-from` | Pemformatan allowlist dan pemetaan input | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gerbang perintah dan pembantu permukaan perintah | `resolveControlCommandGate`, pembantu otorisasi pengirim, pembantu registry perintah termasuk pemformatan menu argumen dinamis |
  | `plugin-sdk/command-status` | Perender status/bantuan perintah | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing input rahasia | Pembantu input rahasia |
  | `plugin-sdk/webhook-ingress` | Pembantu permintaan Webhook | Utilitas target Webhook |
  | `plugin-sdk/webhook-request-guards` | Pembantu guard body Webhook | Pembantu baca/batas body permintaan |
  | `plugin-sdk/reply-runtime` | Runtime balasan bersama | Pengiriman masuk, heartbeat, perencana balasan, pemotongan |
  | `plugin-sdk/reply-dispatch-runtime` | Pembantu pengiriman balasan sempit | Finalisasi, pengiriman penyedia, dan pembantu label percakapan |
  | `plugin-sdk/reply-history` | Pembantu riwayat balasan | `createChannelHistoryWindow`; ekspor kompatibilitas pembantu map yang tidak digunakan lagi seperti `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, dan `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Perencanaan referensi balasan | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Pembantu potongan balasan | Pembantu pemotongan teks/markdown |
  | `plugin-sdk/session-store-runtime` | Pembantu penyimpanan sesi | Pembantu path penyimpanan + updated-at |
  | `plugin-sdk/state-paths` | Pembantu path state | Pembantu direktori state dan OAuth |
  | `plugin-sdk/routing` | Pembantu routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, pembantu normalisasi session-key |
  | `plugin-sdk/status-helpers` | Pembantu status kanal | Pembuat ringkasan status kanal/akun, default runtime-state, pembantu metadata isu |
  | `plugin-sdk/target-resolver-runtime` | Pembantu resolver target | Pembantu resolver target bersama |
  | `plugin-sdk/string-normalization-runtime` | Pembantu normalisasi string | Pembantu normalisasi slug/string |
  | `plugin-sdk/request-url` | Pembantu URL permintaan | Mengekstrak URL string dari input mirip permintaan |
  | `plugin-sdk/run-command` | Pembantu perintah berbatas waktu | Runner perintah berbatas waktu dengan stdout/stderr yang dinormalisasi |
  | `plugin-sdk/param-readers` | Pembaca parameter | Pembaca parameter tool/CLI umum |
  | `plugin-sdk/tool-payload` | Ekstraksi payload tool | Mengekstrak payload yang dinormalisasi dari objek hasil tool |
  | `plugin-sdk/tool-send` | Ekstraksi pengiriman tool | Mengekstrak field target pengiriman kanonis dari argumen tool |
  | `plugin-sdk/temp-path` | Pembantu path sementara | Pembantu path unduhan sementara bersama |
  | `plugin-sdk/logging-core` | Pembantu logging | Logger subsistem dan pembantu redaksi |
  | `plugin-sdk/markdown-table-runtime` | Pembantu tabel Markdown | Pembantu mode tabel Markdown |
  | `plugin-sdk/reply-payload` | Tipe balasan pesan | Tipe payload balasan |
  | `plugin-sdk/provider-setup` | Pembantu penyiapan penyedia lokal/self-hosted terkurasi | Pembantu penemuan/konfigurasi penyedia self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Pembantu penyiapan penyedia self-hosted kompatibel OpenAI yang terfokus | Pembantu penemuan/konfigurasi penyedia self-hosted yang sama |
  | `plugin-sdk/provider-auth-runtime` | Pembantu autentikasi runtime penyedia | Pembantu resolusi API-key runtime |
  | `plugin-sdk/provider-auth-api-key` | Pembantu penyiapan API-key penyedia | Pembantu onboarding/penulisan profil API-key |
  | `plugin-sdk/provider-auth-result` | Pembantu hasil autentikasi penyedia | Pembuat hasil autentikasi OAuth standar |
  | `plugin-sdk/provider-selection-runtime` | Pembantu pemilihan penyedia | Pemilihan penyedia yang dikonfigurasi atau otomatis dan penggabungan konfigurasi penyedia mentah |
  | `plugin-sdk/provider-env-vars` | Pembantu variabel lingkungan penyedia | Pembantu pencarian variabel lingkungan autentikasi penyedia |
  | `plugin-sdk/provider-model-shared` | Pembantu model/replay penyedia bersama | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, pembuat kebijakan replay bersama, pembantu endpoint penyedia, dan pembantu normalisasi model-id |
  | `plugin-sdk/provider-catalog-shared` | Pembantu katalog penyedia bersama | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch onboarding penyedia | Pembantu konfigurasi onboarding |
  | `plugin-sdk/provider-http` | Pembantu HTTP penyedia | Pembantu kapabilitas HTTP/endpoint penyedia generik, termasuk pembantu formulir multipart transkripsi audio |
  | `plugin-sdk/provider-web-fetch` | Pembantu web-fetch penyedia | Pembantu pendaftaran/cache penyedia web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Pembantu konfigurasi web-search penyedia | Pembantu konfigurasi/kredensial web-search yang sempit untuk penyedia yang tidak memerlukan pengkabelan aktivasi Plugin |
  | `plugin-sdk/provider-web-search-contract` | Pembantu kontrak web-search penyedia | Pembantu kontrak konfigurasi/kredensial web-search yang sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial berskup |
  | `plugin-sdk/provider-web-search` | Pembantu web-search penyedia | Pembantu pendaftaran/cache/runtime penyedia web-search |
  | `plugin-sdk/provider-tools` | Pembantu kompatibilitas tool/skema penyedia | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, dan pembersihan skema DeepSeek/Gemini/OpenAI + diagnostik |
  | `plugin-sdk/provider-usage` | Pembantu penggunaan penyedia | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, dan pembantu penggunaan penyedia lainnya |
  | `plugin-sdk/provider-stream` | Pembantu wrapper stream penyedia | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe wrapper stream, dan pembantu wrapper bersama Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Pembantu transport penyedia | Pembantu transport penyedia native seperti fetch terlindungi, ekstraksi teks hasil tool, transformasi pesan transport, dan stream peristiwa transport yang dapat ditulis |
  | `plugin-sdk/keyed-async-queue` | Antrean async terurut | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Pembantu media bersama | Pembantu pengambilan/transformasi/penyimpanan media, probing dimensi video berbasis ffprobe, dan pembuat payload media |
  | `plugin-sdk/media-generation-runtime` | Pembantu pembuatan media bersama | Pembantu failover bersama, pemilihan kandidat, dan pesan model yang hilang untuk pembuatan gambar/video/musik |
  | `plugin-sdk/media-understanding` | Pembantu pemahaman media | Tipe penyedia pemahaman media beserta ekspor pembantu gambar/audio yang menghadap penyedia |
  | `plugin-sdk/text-runtime` | Ekspor kompatibilitas teks luas yang tidak digunakan lagi | Gunakan `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`, dan `logging-core` |
  | `plugin-sdk/text-chunking` | Pembantu pemecahan teks | Pembantu pemecahan teks keluar |
  | `plugin-sdk/speech` | Pembantu speech | Tipe penyedia speech beserta pembantu directive, registry, validasi yang menghadap penyedia, dan pembuat TTS kompatibel OpenAI |
  | `plugin-sdk/speech-core` | Inti speech bersama | Tipe penyedia speech, registry, directive, normalisasi |
  | `plugin-sdk/realtime-transcription` | Pembantu transkripsi real-time | Tipe penyedia, pembantu registry, dan pembantu sesi WebSocket bersama |
  | `plugin-sdk/realtime-voice` | Pembantu suara real-time | Tipe penyedia, pembantu registry/resolusi, pembantu sesi bridge, antrean talk-back agen bersama, kontrol suara active-run, kesehatan transkrip/peristiwa, penekanan echo, pencocokan pertanyaan konsultasi, koordinasi konsultasi paksa, pelacakan konteks giliran, pelacakan aktivitas output, dan pembantu konsultasi konteks cepat |
  | `plugin-sdk/image-generation` | Pembantu pembuatan gambar | Tipe penyedia pembuatan gambar beserta pembantu aset gambar/URL data dan pembuat penyedia gambar kompatibel OpenAI |
  | `plugin-sdk/image-generation-core` | Inti pembuatan gambar bersama | Tipe pembuatan gambar, failover, autentikasi, dan pembantu registry |
  | `plugin-sdk/music-generation` | Pembantu pembuatan musik | Tipe penyedia/permintaan/hasil pembuatan musik |
  | `plugin-sdk/music-generation-core` | Inti pembuatan musik bersama | Tipe pembuatan musik, pembantu failover, pencarian penyedia, dan parsing model-ref |
  | `plugin-sdk/video-generation` | Pembantu pembuatan video | Tipe penyedia/permintaan/hasil pembuatan video |
  | `plugin-sdk/video-generation-core` | Inti pembuatan video bersama | Tipe pembuatan video, pembantu failover, pencarian penyedia, dan parsing model-ref |
  | `plugin-sdk/interactive-runtime` | Pembantu balasan interaktif | Normalisasi/reduksi payload balasan interaktif |
  | `plugin-sdk/channel-config-primitives` | Primitif konfigurasi kanal | Primitif skema konfigurasi kanal yang sempit |
  | `plugin-sdk/channel-config-writes` | Pembantu penulisan konfigurasi kanal | Pembantu otorisasi penulisan konfigurasi kanal |
  | `plugin-sdk/channel-plugin-common` | Prelude kanal bersama | Ekspor prelude Plugin kanal bersama |
  | `plugin-sdk/channel-status` | Pembantu status kanal | Pembantu snapshot/ringkasan status kanal bersama |
  | `plugin-sdk/allowlist-config-edit` | Pembantu konfigurasi allowlist | Pembantu edit/baca konfigurasi allowlist |
  | `plugin-sdk/group-access` | Pembantu akses grup | Pembantu keputusan akses grup bersama |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fasad kompatibilitas yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Pembantu guard Direct-DM | Pembantu kebijakan guard pra-crypto yang sempit |
  | `plugin-sdk/extension-shared` | Pembantu ekstensi bersama | Primitif pembantu kanal/status pasif dan proksi ambient |
  | `plugin-sdk/webhook-targets` | Pembantu target Webhook | Registry target Webhook dan pembantu pemasangan rute |
  | `plugin-sdk/webhook-path` | Alias path webhook yang tidak digunakan lagi | Gunakan `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Pembantu media web bersama | Pembantu pemuatan media jarak jauh/lokal |
  | `plugin-sdk/zod` | Re-ekspor kompatibilitas Zod yang tidak digunakan lagi | Impor `zod` dari `zod` secara langsung |
  | `plugin-sdk/memory-core` | Pembantu memory-core bawaan | Permukaan pembantu pengelola memori/konfigurasi/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime mesin memori | Fasad runtime indeks/pencarian memori |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registry embedding memori | Pembantu registry penyedia embedding memori ringan |
  | `plugin-sdk/memory-core-host-engine-foundation` | Mesin foundation host memori | Ekspor mesin foundation host memori |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Mesin embedding host memori | Kontrak embedding memori, akses registry, penyedia lokal, dan pembantu batch/jarak jauh generik; penyedia jarak jauh konkret berada di Plugin pemiliknya |
  | `plugin-sdk/memory-core-host-engine-qmd` | Mesin QMD host memori | Ekspor mesin QMD host memori |
  | `plugin-sdk/memory-core-host-engine-storage` | Mesin penyimpanan host memori | Ekspor mesin penyimpanan host memori |
  | `plugin-sdk/memory-core-host-multimodal` | Pembantu multimodal host memori | Pembantu multimodal host memori |
  | `plugin-sdk/memory-core-host-query` | Pembantu kueri host memori | Pembantu kueri host memori |
  | `plugin-sdk/memory-core-host-secret` | Pembantu rahasia host memori | Pembantu rahasia host memori |
  | `plugin-sdk/memory-core-host-events` | Alias peristiwa memori yang tidak digunakan lagi | Gunakan `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Pembantu status host memori | Pembantu status host memori |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI host memori | Pembantu runtime CLI host memori |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime inti host memori | Pembantu runtime inti host memori |
  | `plugin-sdk/memory-core-host-runtime-files` | Pembantu file/runtime host memori | Pembantu file/runtime host memori |
  | `plugin-sdk/memory-host-core` | Alias runtime inti host memori | Alias netral vendor untuk pembantu runtime inti host memori |
  | `plugin-sdk/memory-host-events` | Alias jurnal peristiwa host memori | Alias netral vendor untuk pembantu jurnal peristiwa host memori |
  | `plugin-sdk/memory-host-files` | Alias file/runtime memori yang tidak digunakan lagi | Gunakan `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Pembantu markdown terkelola | Pembantu managed-markdown bersama untuk Plugin yang berdekatan dengan memori |
  | `plugin-sdk/memory-host-search` | Fasad pencarian memori aktif | Fasad runtime search-manager active-memory malas |
  | `plugin-sdk/memory-host-status` | Alias status host memori yang tidak digunakan lagi | Gunakan `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Utilitas pengujian | Barrel kompatibilitas repo-lokal yang tidak digunakan lagi; gunakan subpath pengujian repo-lokal terfokus seperti `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`, dan `plugin-sdk/test-fixtures` |
</Accordion>

Tabel ini sengaja berisi subset migrasi umum, bukan seluruh permukaan SDK
lengkap. Inventaris titik masuk compiler berada di
`scripts/lib/plugin-sdk-entrypoints.json`; ekspor paket dibuat dari
subset publik.

Seam helper Plugin bawaan yang dicadangkan telah dihentikan dari peta ekspor
SDK publik kecuali fasad kompatibilitas yang didokumentasikan secara eksplisit
seperti shim `plugin-sdk/discord` yang sudah usang dan dipertahankan untuk paket
`@openclaw/discord@2026.3.13` yang telah dipublikasikan. Helper khusus pemilik
berada di dalam paket plugin pemiliknya; perilaku host bersama sebaiknya
dipindahkan melalui kontrak SDK generik seperti `plugin-sdk/gateway-runtime`,
`plugin-sdk/security-runtime`, dan `plugin-sdk/plugin-config-runtime`.

Gunakan impor paling sempit yang sesuai dengan tugasnya. Jika Anda tidak dapat
menemukan ekspor, periksa sumber di `src/plugin-sdk/` atau tanyakan kepada
maintainer kontrak generik mana yang seharusnya memilikinya.

## Penghentian aktif

Penghentian yang lebih sempit yang berlaku di seluruh SDK plugin, kontrak
provider, permukaan runtime, dan manifes. Masing-masing masih berfungsi hari ini
tetapi akan dihapus dalam rilis mayor mendatang. Entri di bawah setiap item
memetakan API lama ke pengganti kanonisnya.

<AccordionGroup>
  <Accordion title="builder bantuan command-auth → command-status">
    **Lama (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Baru (`openclaw/plugin-sdk/command-status`)**: tanda tangan yang sama, ekspor
    yang sama - hanya diimpor dari subpath yang lebih sempit. `command-auth`
    mengekspornya ulang sebagai stub kompatibilitas.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Helper gating mention → resolveInboundMentionDecision">
    **Lama**: `resolveInboundMentionRequirement({ facts, policy })` dan
    `shouldDropInboundForMention(...)` dari
    `openclaw/plugin-sdk/channel-inbound` atau
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Baru**: `resolveInboundMentionDecision({ facts, policy })` - mengembalikan
    satu objek keputusan, bukan dua panggilan terpisah.

    Plugin channel downstream (Slack, Discord, Matrix, MS Teams) sudah beralih.

  </Accordion>

  <Accordion title="Shim runtime channel dan helper tindakan channel">
    `openclaw/plugin-sdk/channel-runtime` adalah shim kompatibilitas untuk
    plugin channel lama. Jangan mengimpornya dari kode baru; gunakan
    `openclaw/plugin-sdk/channel-runtime-context` untuk mendaftarkan objek
    runtime.

    Helper `channelActions*` di `openclaw/plugin-sdk/channel-actions` sudah
    usang bersama ekspor channel "actions" mentah. Ekspos kemampuan melalui
    permukaan semantik `presentation` sebagai gantinya - plugin channel
    mendeklarasikan apa yang mereka render (kartu, tombol, pilihan), bukan nama
    tindakan mentah mana yang mereka terima.

  </Accordion>

  <Accordion title="Helper tool() provider pencarian web → createTool() pada plugin">
    **Lama**: factory `tool()` dari `openclaw/plugin-sdk/provider-web-search`.

    **Baru**: implementasikan `createTool(...)` langsung pada plugin provider.
    OpenClaw tidak lagi membutuhkan helper SDK untuk mendaftarkan wrapper tool.

  </Accordion>

  <Accordion title="Envelope channel plaintext → BodyForAgent">
    **Lama**: `formatInboundEnvelope(...)` (dan
    `ChannelMessageForAgent.channelEnvelope`) untuk membuat envelope prompt
    plaintext datar dari pesan channel masuk.

    **Baru**: `BodyForAgent` ditambah blok konteks pengguna terstruktur. Plugin
    channel melampirkan metadata routing (thread, topik, balasan-ke, reaksi)
    sebagai field bertipe, bukan menggabungkannya ke dalam string prompt. Helper
    `formatAgentEnvelope(...)` masih didukung untuk envelope sintetis yang
    menghadap asisten, tetapi envelope plaintext masuk sedang dihentikan.

    Area terdampak: `inbound_claim`, `message_received`, dan plugin channel
    kustom apa pun yang melakukan pascaproses teks `channelEnvelope`.

  </Accordion>

  <Accordion title="hook deactivate → gateway_stop">
    **Lama**: `api.on("deactivate", handler)`.

    **Baru**: `api.on("gateway_stop", handler)`. Event dan konteksnya adalah
    kontrak pembersihan shutdown yang sama; hanya nama hook yang berubah.

    ```typescript
    // Before
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // After
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` tetap terhubung sebagai alias kompatibilitas usang sampai
    setelah 2026-08-16.

  </Accordion>

  <Accordion title="hook subagent_spawning → pengikatan thread core">
    **Lama**: `api.on("subagent_spawning", handler)` yang mengembalikan
    `threadBindingReady` atau `deliveryOrigin`.

    **Baru**: biarkan core menyiapkan pengikatan subagent `thread: true` melalui
    adapter pengikatan sesi channel. Gunakan `api.on("subagent_spawned", handler)`
    hanya untuk observasi pascapeluncuran.

    ```typescript
    // Before
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // After
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`, `PluginHookSubagentSpawningEvent`,
    `PluginHookSubagentSpawningResult`, dan
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` tetap ada hanya
    sebagai permukaan kompatibilitas usang sementara plugin eksternal bermigrasi.

  </Accordion>

  <Accordion title="Tipe discovery provider → tipe katalog provider">
    Empat alias tipe discovery sekarang menjadi wrapper tipis di atas tipe era
    katalog:

    | Alias lama                | Tipe baru                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Ditambah bag statis `ProviderCapabilities` lama - plugin provider sebaiknya
    menggunakan hook provider eksplisit seperti `buildReplayPolicy`,
    `normalizeToolSchemas`, dan `wrapStreamFn`, bukan objek statis.

  </Accordion>

  <Accordion title="Hook kebijakan thinking → resolveThinkingProfile">
    **Lama** (tiga hook terpisah pada `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, dan
    `resolveDefaultThinkingLevel(ctx)`.

    **Baru**: satu `resolveThinkingProfile(ctx)` yang mengembalikan
    `ProviderThinkingProfile` dengan `id` kanonis, `label` opsional, dan daftar
    level berperingkat. OpenClaw secara otomatis menurunkan nilai tersimpan yang
    usang berdasarkan peringkat profil.

    Konteks mencakup `provider`, `modelId`, `reasoning` gabungan opsional, dan
    fakta `compat` model gabungan opsional. Plugin provider dapat menggunakan
    fakta katalog tersebut untuk mengekspos profil khusus model hanya ketika
    kontrak permintaan yang dikonfigurasi mendukungnya.

    Implementasikan satu hook, bukan tiga. Hook lama tetap berfungsi selama
    jendela penghentian tetapi tidak dikomposisikan dengan hasil profil.

  </Accordion>

  <Accordion title="Provider auth eksternal → contracts.externalAuthProviders">
    **Lama**: mengimplementasikan hook auth eksternal tanpa mendeklarasikan
    provider di manifes plugin.

    **Baru**: deklarasikan `contracts.externalAuthProviders` di manifes plugin
    **dan** implementasikan `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Lookup env-var provider → setup.providers[].envVars">
    Field manifes **lama**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Baru**: cerminkan lookup env-var yang sama ke `setup.providers[].envVars`
    pada manifes. Ini mengonsolidasikan metadata env setup/status di satu
    tempat dan menghindari menjalankan runtime plugin hanya untuk menjawab
    lookup env-var.

    `providerAuthEnvVars` tetap didukung melalui adapter kompatibilitas sampai
    jendela penghentian ditutup.

  </Accordion>

  <Accordion title="Registrasi plugin memori → registerMemoryCapability">
    **Lama**: tiga panggilan terpisah -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Baru**: satu panggilan pada API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Slot yang sama, satu panggilan registrasi. Helper prompt dan corpus aditif
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) tidak
    terdampak.

  </Accordion>

  <Accordion title="API provider embedding memori">
    **Lama**: `api.registerMemoryEmbeddingProvider(...)` ditambah
    `contracts.memoryEmbeddingProviders`.

    **Baru**: `api.registerEmbeddingProvider(...)` ditambah
    `contracts.embeddingProviders`.

    Kontrak provider embedding generik dapat digunakan ulang di luar memori dan
    merupakan jalur yang didukung untuk provider baru. API registrasi khusus
    memori tetap terhubung sebagai kompatibilitas usang sementara provider yang
    ada bermigrasi. Inspeksi plugin melaporkan penggunaan non-bawaan sebagai
    utang kompatibilitas.

  </Accordion>

  <Accordion title="Tipe pesan sesi subagent diganti nama">
    Dua alias tipe lama masih diekspor dari `src/plugins/runtime/types.ts`:

    | Lama                          | Baru                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Metode runtime `readSession` sudah usang dan digantikan oleh
    `getSessionMessages`. Tanda tangan yang sama; metode lama meneruskan
    panggilan ke yang baru.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Lama**: `runtime.tasks.flow` (tunggal) mengembalikan accessor task-flow
    langsung.

    **Baru**: `runtime.tasks.managedFlows` mempertahankan runtime mutasi
    TaskFlow terkelola untuk plugin yang membuat, memperbarui, membatalkan, atau
    menjalankan tugas anak dari sebuah flow. Gunakan `runtime.tasks.flows` ketika
    plugin hanya membutuhkan pembacaan berbasis DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Factory extension tertanam → middleware hasil tool agen">
    Dicakup dalam "Cara bermigrasi → Migrasikan extension hasil tool tertanam ke
    middleware" di atas. Disertakan di sini untuk kelengkapan: jalur khusus
    embedded-runner yang dihapus `api.registerEmbeddedExtensionFactory(...)`
    digantikan oleh `api.registerAgentToolResultMiddleware(...)` dengan daftar
    runtime eksplisit di `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` yang diekspor ulang dari `openclaw/plugin-sdk` sekarang
    adalah alias satu baris untuk `OpenClawConfig`. Gunakan nama kanonisnya.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Penghentian tingkat extension (di dalam plugin channel/provider bawaan di bawah
`extensions/`) dilacak di dalam barrel `api.ts` dan `runtime-api.ts` mereka
sendiri. Penghentian tersebut tidak memengaruhi kontrak plugin pihak ketiga dan
tidak tercantum di sini. Jika Anda memakai barrel lokal milik plugin bawaan
secara langsung, baca komentar penghentian di barrel tersebut sebelum upgrade.
</Note>

## Linimasa penghapusan

| Kapan                    | Apa yang terjadi                                                               |
| ------------------------ | ------------------------------------------------------------------------------ |
| **Sekarang**             | Permukaan yang tidak digunakan lagi menghasilkan peringatan runtime            |
| **Rilis mayor berikutnya** | Permukaan yang tidak digunakan lagi akan dihapus; Plugin yang masih menggunakannya akan gagal |

Semua Plugin inti sudah dimigrasikan. Plugin eksternal sebaiknya bermigrasi
sebelum rilis mayor berikutnya.

## Menyembunyikan peringatan sementara

Tetapkan variabel lingkungan ini saat Anda mengerjakan migrasi:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Ini adalah celah sementara, bukan solusi permanen.

## Terkait

- [Memulai](/id/plugins/building-plugins) - buat Plugin pertama Anda
- [Ikhtisar SDK](/id/plugins/sdk-overview) - referensi impor subpath lengkap
- [Plugin Channel](/id/plugins/sdk-channel-plugins) - membangun Plugin channel
- [Plugin Provider](/id/plugins/sdk-provider-plugins) - membangun Plugin provider
- [Internal Plugin](/id/plugins/architecture) - pembahasan arsitektur mendalam
- [Manifest Plugin](/id/plugins/manifest) - referensi skema manifest
