---
read_when:
    - Anda melihat peringatan OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Anda melihat peringatan OPENCLAW_EXTENSION_API_DEPRECATED
    - Anda menggunakan api.registerEmbeddedExtensionFactory sebelum OpenClaw 2026.4.25
    - Anda sedang memperbarui plugin ke arsitektur plugin modern
    - Anda memelihara Plugin OpenClaw eksternal
sidebarTitle: Migrate to SDK
summary: Bermigrasi dari lapisan kompatibilitas mundur lama ke SDK plugin modern
title: Migrasi SDK Plugin
x-i18n:
    generated_at: "2026-07-04T15:37:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7873de40aea56f456781ecf8ac9a4705c958030f7c68f8a112ad3f0fce62f078
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw telah beralih dari lapisan kompatibilitas mundur yang luas ke arsitektur plugin
modern dengan impor yang terfokus dan terdokumentasi. Jika plugin Anda dibuat sebelum
arsitektur baru ini, panduan ini membantu Anda bermigrasi.

## Apa yang berubah

Sistem plugin lama menyediakan dua permukaan yang sangat terbuka yang memungkinkan plugin mengimpor
apa pun yang mereka perlukan dari satu titik masuk:

- **`openclaw/plugin-sdk/compat`** - satu impor yang mengekspor ulang puluhan
  helper. Ini diperkenalkan untuk menjaga agar plugin lama berbasis hook tetap berjalan saat
  arsitektur plugin baru sedang dibangun.
- **`openclaw/plugin-sdk/infra-runtime`** - barrel helper runtime yang luas yang
  mencampur event sistem, status heartbeat, antrean pengiriman, helper fetch/proxy,
  helper file, tipe approval, dan utilitas yang tidak terkait.
- **`openclaw/plugin-sdk/config-runtime`** - barrel kompatibilitas config yang luas
  yang masih membawa helper load/write langsung yang sudah deprecated selama jendela migrasi.
- **`openclaw/extension-api`** - jembatan yang memberi plugin akses langsung ke
  helper sisi host seperti embedded agent runner.
- **`api.registerEmbeddedExtensionFactory(...)`** - hook ekstensi bundled khusus embedded-runner
  yang telah dihapus dan sebelumnya dapat mengamati event embedded-runner seperti
  `tool_result`.

Permukaan impor yang luas kini **deprecated**. Permukaan ini masih berjalan saat runtime,
tetapi plugin baru tidak boleh menggunakannya, dan plugin yang ada sebaiknya bermigrasi sebelum
rilis mayor berikutnya menghapusnya. API pendaftaran extension factory khusus embedded-runner
telah dihapus; gunakan middleware tool-result sebagai gantinya.

OpenClaw tidak menghapus atau menafsirkan ulang perilaku plugin yang terdokumentasi dalam perubahan yang sama
yang memperkenalkan pengganti. Perubahan kontrak yang breaking harus terlebih dahulu melalui
adapter kompatibilitas, diagnostik, dokumentasi, dan jendela deprecation.
Ini berlaku untuk impor SDK, field manifest, API setup, hook, dan perilaku
pendaftaran runtime.

<Warning>
  Lapisan kompatibilitas mundur akan dihapus dalam rilis mayor mendatang.
  Plugin yang masih mengimpor dari permukaan ini akan rusak saat itu terjadi.
  Pendaftaran legacy embedded extension factory sudah tidak lagi dimuat.
</Warning>

## Mengapa ini berubah

Pendekatan lama menyebabkan masalah:

- **Startup lambat** - mengimpor satu helper memuat puluhan modul yang tidak terkait
- **Dependensi melingkar** - re-export yang luas memudahkan terciptanya siklus impor
- **Permukaan API tidak jelas** - tidak ada cara untuk mengetahui ekspor mana yang stabil vs internal

SDK plugin modern memperbaiki ini: setiap jalur impor (`openclaw/plugin-sdk/\<subpath\>`)
adalah modul kecil dan mandiri dengan tujuan yang jelas serta kontrak terdokumentasi.

Seam kemudahan provider legacy untuk channel bundled juga sudah hilang.
Seam helper bermerek channel adalah pintasan mono-repo privat, bukan kontrak
plugin yang stabil. Gunakan subpath SDK generik yang sempit sebagai gantinya. Di dalam workspace
plugin bundled, simpan helper milik provider di `api.ts` atau
`runtime-api.ts` milik plugin itu sendiri.

Contoh provider bundled saat ini:

- Anthropic menyimpan helper stream khusus Claude di seam `api.ts` /
  `contract-api.ts` miliknya sendiri
- OpenAI menyimpan builder provider, helper default-model, dan builder provider realtime
  di `api.ts` miliknya sendiri
- OpenRouter menyimpan builder provider dan helper onboarding/config di
  `api.ts` miliknya sendiri

## Rencana migrasi Talk dan suara realtime

Kode suara realtime, telephony, meeting, dan Talk browser sedang dipindahkan dari
pencatatan turn lokal-permukaan ke controller sesi Talk bersama yang diekspor oleh
`openclaw/plugin-sdk/realtime-voice`. Controller baru memiliki envelope event Talk
umum, status turn aktif, status capture, status output-audio, riwayat event
terbaru, dan penolakan stale-turn. Plugin provider harus tetap memiliki sesi realtime
khusus vendor; plugin permukaan harus tetap memiliki kekhasan capture,
playback, telephony, dan meeting.

Migrasi Talk ini sengaja breaking-clean:

1. Simpan controller/primitif runtime bersama di
   `plugin-sdk/realtime-voice`.
2. Pindahkan permukaan bundled ke controller bersama: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime, dan native push-to-talk.
3. Ganti keluarga RPC Talk lama dengan API final `talk.session.*` dan
   `talk.client.*`.
4. Umumkan satu channel event Talk live di Gateway
   `hello-ok.features.events`: `talk.event`.
5. Hapus endpoint HTTP realtime lama dan jalur override instruksi pada waktu request apa pun.

Kode baru tidak boleh memanggil `createTalkEventSequencer(...)` secara langsung kecuali sedang
mengimplementasikan adapter tingkat rendah atau fixture test. Utamakan controller bersama
agar event yang dibatasi turn tidak dapat dipancarkan tanpa turn id, panggilan stale `turnEnd` /
`turnCancel` tidak dapat menghapus turn aktif yang lebih baru, dan event lifecycle output-audio
tetap konsisten di telephony, meeting, browser relay, managed-room
handoff, dan native Talk client.

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

Sesi WebRTC/provider-websocket yang dimiliki browser menggunakan `talk.client.create`,
karena browser memiliki negosiasi provider dan transport media sementara
Gateway memiliki kredensial, instruksi, dan kebijakan tool. `talk.session.*` adalah
permukaan umum yang dikelola Gateway untuk gateway-relay realtime, gateway-relay
transcription, dan sesi STT/TTS native managed-room.

Config legacy yang menempatkan selector realtime di sebelah `talk.provider` /
`talk.providers` harus diperbaiki dengan `openclaw doctor --fix`; runtime Talk
tidak menafsirkan ulang config provider speech/TTS sebagai config provider realtime.

Kombinasi `talk.session.create` yang didukung sengaja dibuat kecil:

| Mode            | Transport       | Brain           | Pemilik            | Catatan                                                                                                            |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio provider full-duplex dijembatani melalui Gateway; panggilan tool dirutekan melalui tool agent-consult.       |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Hanya streaming STT; pemanggil mengirim audio input dan menerima event transkrip.                                  |
| `stt-tts`       | `managed-room`  | `agent-consult` | Ruang native/client | Ruang bergaya push-to-talk dan walkie-talkie tempat client memiliki capture/playback dan Gateway memiliki status turn. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Ruang native/client | Mode ruang khusus admin untuk permukaan first-party tepercaya yang menjalankan aksi tool Gateway secara langsung.  |

Peta metode yang dihapus:

| Lama                             | Baru                                                     |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` atau `talk.session.cancelTurn` |
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

  | Metode                         | Berlaku untuk                                          | Kontrak                                                                                                                                                                                     |
  | ------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`     | `realtime/gateway-relay`, `transcription/gateway-relay` | Tambahkan potongan audio PCM base64 ke sesi penyedia yang dimiliki oleh koneksi Gateway yang sama.                                                                                          |
  | `talk.session.startTurn`       | `stt-tts/managed-room`                                 | Mulai giliran pengguna managed-room.                                                                                                                                                        |
  | `talk.session.endTurn`         | `stt-tts/managed-room`                                 | Akhiri giliran aktif setelah validasi giliran usang.                                                                                                                                        |
  | `talk.session.cancelTurn`      | semua sesi milik Gateway                               | Batalkan pekerjaan capture/penyedia/agen/TTS aktif untuk satu giliran.                                                                                                                      |
  | `talk.session.cancelOutput`    | `realtime/gateway-relay`                               | Hentikan output audio asisten tanpa harus mengakhiri giliran pengguna.                                                                                                                      |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                              | Selesaikan panggilan tool penyedia yang dikeluarkan oleh relay; kirim `options.willContinue` untuk output sementara atau `options.suppressResponse` untuk memenuhi panggilan tanpa respons asisten lain. |
  | `talk.session.steer`           | sesi Talk berbasis agen                                | Kirim kontrol lisan `status`, `steer`, `cancel`, atau `followup` ke run tertanam aktif yang di-resolve dari sesi Talk.                                                                      |
  | `talk.session.close`           | semua sesi terpadu                                     | Hentikan sesi relay atau cabut state managed-room, lalu lupakan id sesi terpadu.                                                                                                            |

  Jangan memperkenalkan kasus khusus penyedia atau platform di core agar ini berfungsi.
  Core memiliki semantik sesi Talk. Plugin penyedia memiliki penyiapan sesi vendor.
  Voice-call dan Google Meet memiliki adaptor telepon/meeting. Browser dan aplikasi native
  memiliki UX capture/playback perangkat.

  ## Kebijakan kompatibilitas

  Untuk plugin eksternal, pekerjaan kompatibilitas mengikuti urutan ini:

  1. tambahkan kontrak baru
  2. pertahankan perilaku lama yang disambungkan melalui adaptor kompatibilitas
  3. keluarkan diagnostik atau peringatan yang menyebutkan jalur lama dan penggantinya
  4. cakup kedua jalur dalam pengujian
  5. dokumentasikan deprekasi dan jalur migrasi
  6. hapus hanya setelah jendela migrasi yang diumumkan, biasanya dalam rilis mayor

  Maintainer dapat mengaudit antrean migrasi saat ini dengan
  `pnpm plugins:boundary-report`. Gunakan `pnpm plugins:boundary-report:summary` untuk
  jumlah ringkas, `--owner <id>` untuk satu plugin atau pemilik kompatibilitas, dan
  `pnpm plugins:boundary-report:ci` ketika gate CI harus gagal pada catatan
  kompatibilitas yang jatuh tempo, impor SDK cadangan lintas pemilik, atau subpath SDK
  cadangan yang tidak digunakan. Laporan mengelompokkan catatan
  kompatibilitas yang dideprekasi berdasarkan tanggal penghapusan, menghitung referensi kode/dokumen lokal,
  menampilkan impor SDK cadangan lintas pemilik, dan merangkum bridge SDK
  memory-host privat agar pembersihan kompatibilitas tetap eksplisit alih-alih
  mengandalkan pencarian ad hoc. Subpath SDK cadangan harus memiliki penggunaan pemilik yang dilacak;
  ekspor helper cadangan yang tidak digunakan harus dihapus dari SDK publik.

  Jika field manifest masih diterima, penulis plugin dapat tetap menggunakannya sampai
  dokumen dan diagnostik menyatakan sebaliknya. Kode baru sebaiknya memilih pengganti
  yang terdokumentasi, tetapi plugin yang sudah ada tidak boleh rusak selama rilis minor
  biasa.

  ## Cara bermigrasi

  <Steps>
  <Step title="Migrasikan helper muat/tulis konfigurasi runtime">
    Plugin bundled harus berhenti memanggil
    `api.runtime.config.loadConfig()` dan
    `api.runtime.config.writeConfigFile(...)` secara langsung. Pilih konfigurasi yang
    sudah diteruskan ke jalur panggilan aktif. Handler berumur panjang yang memerlukan
    snapshot proses saat ini dapat menggunakan `api.runtime.config.current()`. Tool agen
    berumur panjang harus menggunakan `ctx.getRuntimeConfig()` milik konteks tool di dalam
    `execute` sehingga tool yang dibuat sebelum penulisan konfigurasi tetap melihat
    konfigurasi runtime yang diperbarui.

    Penulisan konfigurasi harus melalui helper transaksional dan memilih kebijakan
    setelah-penulisan:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Gunakan `afterWrite: { mode: "restart", reason: "..." }` ketika pemanggil tahu
    perubahan tersebut memerlukan restart gateway yang bersih, dan
    `afterWrite: { mode: "none", reason: "..." }` hanya ketika pemanggil memiliki
    tindak lanjutnya dan sengaja ingin menekan perencana reload.
    Hasil mutasi menyertakan ringkasan `followUp` bertipe untuk pengujian dan logging;
    gateway tetap bertanggung jawab untuk menerapkan atau menjadwalkan restart.
    `loadConfig` dan `writeConfigFile` tetap menjadi helper kompatibilitas yang
    dideprekasi untuk plugin eksternal selama jendela migrasi dan memperingatkan sekali dengan
    kode kompatibilitas `runtime-config-load-write`. Plugin bundled dan kode runtime repo
    dilindungi oleh guardrail pemindai di
    `pnpm check:deprecated-api-usage` dan
    `pnpm check:no-runtime-action-load-config`: penggunaan plugin produksi baru
    langsung gagal, penulisan konfigurasi langsung gagal, metode server gateway harus menggunakan
    snapshot runtime request, helper send/action/client channel runtime
    harus menerima konfigurasi dari batasnya, dan modul runtime berumur panjang memiliki
    nol panggilan ambient `loadConfig()` yang diizinkan.

    Kode plugin baru juga harus menghindari pengimporan barrel kompatibilitas luas
    `openclaw/plugin-sdk/config-runtime`. Gunakan subpath SDK sempit yang cocok
    dengan tugasnya:

    | Kebutuhan | Impor |
    | --- | --- |
    | Tipe konfigurasi seperti `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Assertion konfigurasi yang sudah dimuat dan lookup konfigurasi entry plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Pembacaan snapshot runtime saat ini | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Penulisan konfigurasi | `openclaw/plugin-sdk/config-mutation` |
    | Helper penyimpanan sesi | `openclaw/plugin-sdk/session-store-runtime` |
    | Konfigurasi tabel Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helper runtime kebijakan grup | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolusi input secret | `openclaw/plugin-sdk/secret-input-runtime` |
    | Override model/sesi | `openclaw/plugin-sdk/model-session-runtime` |

    Plugin bundled dan pengujiannya dijaga pemindai terhadap barrel luas
    sehingga impor dan mock tetap lokal pada perilaku yang mereka butuhkan. Barrel luas
    masih ada untuk kompatibilitas eksternal, tetapi kode baru tidak boleh
    bergantung padanya.

  </Step>

  <Step title="Migrasikan ekstensi tool-result tertanam ke middleware">
    Plugin bundled harus mengganti handler tool-result
    `api.registerEmbeddedExtensionFactory(...)` yang hanya untuk embedded-runner dengan
    middleware netral-runtime.

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

    Plugin terinstal juga dapat mendaftarkan middleware tool-result ketika mereka
    diaktifkan secara eksplisit dan mendeklarasikan setiap runtime yang ditargetkan di
    `contracts.agentToolResultMiddleware`. Pendaftaran middleware terinstal yang
    tidak dideklarasikan akan ditolak.

  </Step>

  <Step title="Migrasikan handler native approval ke fakta kapabilitas">
    Plugin channel yang mendukung approval sekarang mengekspos perilaku approval native melalui
    `approvalCapability.nativeRuntime` plus registry runtime-context bersama.

    Perubahan utama:

    - Ganti `approvalCapability.handler.loadRuntime(...)` dengan
      `approvalCapability.nativeRuntime`
    - Pindahkan auth/delivery khusus approval dari wiring lama `plugin.auth` /
      `plugin.approvals` ke `approvalCapability`
    - `ChannelPlugin.approvals` telah dihapus dari kontrak channel-plugin publik;
      pindahkan field delivery/native/render ke `approvalCapability`
    - `plugin.auth` tetap hanya untuk alur login/logout channel; hook auth approval
      di sana tidak lagi dibaca oleh core
    - Daftarkan objek runtime milik channel seperti client, token, atau aplikasi Bolt
      melalui `openclaw/plugin-sdk/channel-runtime-context`
    - Jangan mengirim pemberitahuan reroute milik plugin dari handler approval native;
      core sekarang memiliki pemberitahuan routed-elsewhere dari hasil delivery aktual
    - Saat meneruskan `channelRuntime` ke `createChannelManager(...)`, sediakan
      surface `createPluginRuntime().channel` yang nyata. Stub parsial ditolak.

    Lihat `/plugins/sdk-channel-plugins` untuk layout kapabilitas approval saat ini.

  </Step>

  <Step title="Audit perilaku fallback wrapper Windows">
    Jika plugin Anda menggunakan `openclaw/plugin-sdk/windows-spawn`, wrapper Windows
    `.cmd`/`.bat` yang tidak ter-resolve sekarang gagal tertutup kecuali Anda secara eksplisit meneruskan
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

    Jika pemanggil Anda tidak sengaja bergantung pada fallback shell, jangan set
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
    Setiap ekspor dari surface lama dipetakan ke jalur impor modern tertentu:

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
    yang benar-benar dibutuhkannya:

    | Kebutuhan | Impor |
    | --- | --- |
    | Helper antrean peristiwa sistem | `openclaw/plugin-sdk/system-event-runtime` |
    | Helper bangun, peristiwa, dan visibilitas Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Pengurasan antrean pengiriman tertunda | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetri aktivitas channel | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cache dedupe dalam memori dan berbasis penyimpanan persisten | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helper path file/media lokal yang aman | `openclaw/plugin-sdk/file-access-runtime` |
    | `fetch` yang sadar dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Helper proxy dan `fetch` terlindungi | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipe kebijakan dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipe permintaan/resolusi persetujuan | `openclaw/plugin-sdk/approval-runtime` |
    | Helper payload balasan persetujuan dan perintah | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helper pemformatan error | `openclaw/plugin-sdk/error-runtime` |
    | Penantian kesiapan transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helper token aman | `openclaw/plugin-sdk/secure-random-runtime` |
    | Konkurensi tugas asinkron berbatas | `openclaw/plugin-sdk/concurrency-runtime` |
    | Koersi numerik | `openclaw/plugin-sdk/number-runtime` |
    | Lock asinkron lokal proses | `openclaw/plugin-sdk/async-lock-runtime` |
    | Lock file | `openclaw/plugin-sdk/file-lock` |

    Plugin bawaan dijaga scanner agar tidak memakai `infra-runtime`, sehingga
    kode repo tidak dapat mundur kembali ke barrel luas.

  </Step>

  <Step title="Migrate channel route helpers">
    Kode route channel baru sebaiknya menggunakan `openclaw/plugin-sdk/channel-route`.
    Nama route-key dan comparable-target yang lebih lama tetap ada sebagai alias
    kompatibilitas selama jendela migrasi, tetapi Plugin baru sebaiknya menggunakan nama route
    yang menjelaskan perilaku secara langsung:

    | Helper lama | Helper modern |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Helper route modern menormalkan `{ channel, to, accountId, threadId }`
    secara konsisten di seluruh persetujuan native, penekanan balasan, dedupe masuk,
    pengiriman Cron, dan routing sesi.

    Jangan tambahkan penggunaan baru `ChannelMessagingAdapter.parseExplicitTarget` atau
    helper loaded-route berbasis parser (`parseExplicitTargetForLoadedChannel`
    atau `resolveRouteTargetForLoadedChannel`) maupun
    `resolveChannelRouteTargetWithParser(...)` dari `plugin-sdk/channel-route`.
    Hook tersebut sudah usang dan tetap ada hanya untuk Plugin lama selama
    jendela migrasi. Plugin channel baru sebaiknya menggunakan
    `messaging.targetResolver.resolveTarget(...)` untuk normalisasi id target
    dan fallback saat direktori tidak cocok, `messaging.inferTargetChatType(...)` saat core
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

## Referensi path impor

  <Accordion title="Tabel jalur impor umum">
  | Jalur impor | Tujuan | Ekspor utama |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Pembantu entri plugin kanonis | `definePluginEntry` |
  | `plugin-sdk/core` | Ekspor ulang payung lama untuk definisi/pembangun entri channel | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Ekspor skema konfigurasi root | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Pembantu entri penyedia tunggal | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definisi dan pembangun entri channel terfokus | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Pembantu wizard penyiapan bersama | Penerjemah penyiapan, prompt daftar izin, pembangun status penyiapan |
  | `plugin-sdk/setup-runtime` | Pembantu runtime saat penyiapan | `createSetupTranslator`, adaptor patch penyiapan yang aman diimpor, pembantu catatan pencarian, `promptResolvedAllowFrom`, `splitSetupEntries`, proksi penyiapan terdelegasi |
  | `plugin-sdk/setup-adapter-runtime` | Alias adaptor penyiapan yang tidak digunakan lagi | Gunakan `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Pembantu perkakas penyiapan | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Pembantu multi-akun | Pembantu daftar akun/konfigurasi/gerbang tindakan |
  | `plugin-sdk/account-id` | Pembantu ID akun | `DEFAULT_ACCOUNT_ID`, normalisasi ID akun |
  | `plugin-sdk/account-resolution` | Pembantu pencarian akun | Pembantu pencarian akun + cadangan default |
  | `plugin-sdk/account-helpers` | Pembantu akun sempit | Pembantu daftar akun/tindakan akun |
  | `plugin-sdk/channel-setup` | Adaptor wizard penyiapan | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitif pemasangan DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Pengawatan prefiks balasan, pengetikan, dan pengiriman sumber | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Pabrik adaptor konfigurasi dan pembantu akses DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Pembangun skema konfigurasi | Primitif skema konfigurasi channel bersama dan pembangun generik saja |
  | `plugin-sdk/bundled-channel-config-schema` | Skema konfigurasi bawaan | Hanya plugin bawaan yang dipelihara OpenClaw; plugin baru harus mendefinisikan skema lokal plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Skema konfigurasi bawaan yang tidak digunakan lagi | Alias kompatibilitas saja; gunakan `plugin-sdk/bundled-channel-config-schema` untuk plugin bawaan yang dipelihara |
  | `plugin-sdk/telegram-command-config` | Pembantu konfigurasi perintah Telegram | Normalisasi nama perintah, pemangkasan deskripsi, validasi duplikat/konflik |
  | `plugin-sdk/channel-policy` | Resolusi kebijakan grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Fasad kompatibilitas yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Pembantu amplop masuk | Pembantu route bersama + pembangun amplop |
  | `plugin-sdk/channel-inbound` | Pembantu penerimaan masuk | Pembangunan konteks, pemformatan, root, runner, pengiriman balasan yang disiapkan, dan predikat pengiriman |
  | `plugin-sdk/messaging-targets` | Jalur impor parsing target yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-targets` untuk pembantu parsing target generik, `plugin-sdk/channel-route` untuk perbandingan route, dan `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` milik plugin untuk resolusi target spesifik penyedia |
  | `plugin-sdk/outbound-media` | Pembantu media keluar | Pemuatan media keluar bersama |
  | `plugin-sdk/outbound-send-deps` | Fasad kompatibilitas yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Pembantu siklus hidup pesan keluar | Adaptor pesan, tanda terima, pembantu pengiriman tahan lama, pembantu pratinjau langsung/pengaliran, opsi balasan, pembantu siklus hidup, identitas keluar, dan perencanaan payload |
  | `plugin-sdk/channel-streaming` | Fasad kompatibilitas yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Fasad kompatibilitas yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Pembantu pengikatan thread | Pembantu siklus hidup dan adaptor pengikatan thread |
  | `plugin-sdk/agent-media-payload` | Pembantu payload media lama | Pembangun payload media agen untuk tata letak field lama |
  | `plugin-sdk/channel-runtime` | Shim kompatibilitas yang tidak digunakan lagi | Hanya utilitas runtime channel lama |
  | `plugin-sdk/channel-send-result` | Tipe hasil pengiriman | Tipe hasil balasan |
  | `plugin-sdk/runtime-store` | Penyimpanan plugin persisten | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Pembantu runtime luas | Pembantu runtime/pencatatan/cadangan/instalasi plugin |
  | `plugin-sdk/runtime-env` | Pembantu env runtime sempit | Pembantu logger/env runtime, batas waktu, percobaan ulang, dan backoff |
  | `plugin-sdk/plugin-runtime` | Pembantu runtime plugin bersama | Pembantu perintah/hook/http/interaktif plugin |
  | `plugin-sdk/hook-runtime` | Pembantu pipeline hook | Pembantu pipeline hook Webhook/internal bersama |
  | `plugin-sdk/lazy-runtime` | Pembantu runtime malas | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Pembantu proses | Pembantu eksekusi bersama |
  | `plugin-sdk/cli-runtime` | Pembantu runtime CLI | Pemformatan perintah, penantian, pembantu versi |
  | `plugin-sdk/gateway-runtime` | Pembantu Gateway | Klien Gateway, pembantu mulai siap loop peristiwa, resolusi host LAN yang diiklankan, dan pembantu patch status channel |
  | `plugin-sdk/config-runtime` | Shim kompatibilitas konfigurasi yang tidak digunakan lagi | Utamakan `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, dan `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Pembantu perintah Telegram | Pembantu validasi perintah Telegram yang stabil terhadap cadangan saat permukaan kontrak Telegram bawaan tidak tersedia |
  | `plugin-sdk/approval-runtime` | Pembantu prompt persetujuan | Payload persetujuan eksekusi/plugin, pembantu kapabilitas/profil persetujuan, pembantu routing/runtime persetujuan native, dan pemformatan jalur tampilan persetujuan terstruktur |
  | `plugin-sdk/approval-auth-runtime` | Pembantu autentikasi persetujuan | Resolusi pemberi persetujuan, autentikasi tindakan chat yang sama |
  | `plugin-sdk/approval-client-runtime` | Pembantu klien persetujuan | Pembantu profil/filter persetujuan eksekusi native |
  | `plugin-sdk/approval-delivery-runtime` | Pembantu pengiriman persetujuan | Adaptor kapabilitas/pengiriman persetujuan native |
  | `plugin-sdk/approval-gateway-runtime` | Pembantu Gateway persetujuan | Pembantu resolusi Gateway persetujuan bersama |
  | `plugin-sdk/approval-handler-adapter-runtime` | Pembantu adaptor persetujuan | Pembantu pemuatan adaptor persetujuan native ringan untuk titik entri channel panas |
  | `plugin-sdk/approval-handler-runtime` | Pembantu handler persetujuan | Pembantu runtime handler persetujuan yang lebih luas; utamakan celah adaptor/Gateway yang lebih sempit saat sudah cukup |
  | `plugin-sdk/approval-native-runtime` | Pembantu target persetujuan | Pembantu pengikatan target/akun persetujuan native |
  | `plugin-sdk/approval-reply-runtime` | Pembantu balasan persetujuan | Pembantu payload balasan persetujuan eksekusi/plugin |
  | `plugin-sdk/channel-runtime-context` | Pembantu konteks runtime channel | Pembantu register/get/watch konteks runtime channel generik |
  | `plugin-sdk/security-runtime` | Pembantu keamanan | Pembantu kepercayaan bersama, gerbang DM, file/jalur berbatas root, konten eksternal, dan pengumpulan rahasia |
  | `plugin-sdk/ssrf-policy` | Pembantu kebijakan SSRF | Pembantu daftar izin host dan kebijakan jaringan privat |
  | `plugin-sdk/ssrf-runtime` | Pembantu runtime SSRF | Dispatcher tersemat, fetch terlindungi, pembantu kebijakan SSRF |
  | `plugin-sdk/system-event-runtime` | Pembantu peristiwa sistem | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Pembantu Heartbeat | Pembantu bangun, peristiwa, dan visibilitas Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Pembantu antrean pengiriman | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Pembantu aktivitas channel | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Pembantu deduplikasi | Cache deduplikasi dalam memori dan berbasis persisten |
  | `plugin-sdk/file-access-runtime` | Pembantu akses file | Pembantu jalur file/media lokal yang aman |
  | `plugin-sdk/transport-ready-runtime` | Pembantu kesiapan transport | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Pembantu kebijakan persetujuan eksekusi | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Pembantu cache berbatas | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Pembantu gerbang diagnostik | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Pembantu pemformatan galat | `formatUncaughtError`, `isApprovalNotFoundError`, pembantu grafik galat |
  | `plugin-sdk/fetch-runtime` | Pembantu fetch/proksi terbungkus | `resolveFetch`, pembantu proksi, pembantu opsi EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Pembantu normalisasi host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Pembantu percobaan ulang | `RetryConfig`, `retryAsync`, runner kebijakan |
  | `plugin-sdk/allow-from` | Pemformatan daftar izin dan pemetaan input | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gerbang perintah dan pembantu permukaan perintah | `resolveControlCommandGate`, pembantu otorisasi pengirim, pembantu registry perintah termasuk pemformatan menu argumen dinamis |
  | `plugin-sdk/command-status` | Perender status/bantuan perintah | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing input rahasia | Pembantu input rahasia |
  | `plugin-sdk/webhook-ingress` | Pembantu permintaan Webhook | Utilitas target Webhook |
  | `plugin-sdk/webhook-request-guards` | Pembantu penjaga body Webhook | Pembantu baca/batas body permintaan |
  | `plugin-sdk/reply-runtime` | Runtime balasan bersama | Pengiriman masuk, Heartbeat, perencana balasan, pemotongan |
  | `plugin-sdk/reply-dispatch-runtime` | Pembantu pengiriman balasan sempit | Finalisasi, pengiriman penyedia, dan pembantu label percakapan |
  | `plugin-sdk/reply-history` | Pembantu riwayat balasan | `createChannelHistoryWindow`; ekspor kompatibilitas pembantu map yang tidak digunakan lagi seperti `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, dan `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Perencanaan referensi balasan | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Pembantu potongan balasan | Pembantu pemotongan teks/markdown |
  | `plugin-sdk/session-store-runtime` | Pembantu penyimpanan sesi | Pembantu jalur penyimpanan + waktu diperbarui |
  | `plugin-sdk/state-paths` | Pembantu jalur state | Pembantu direktori state dan OAuth |
  | `plugin-sdk/routing` | Pembantu routing/kunci sesi | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, pembantu normalisasi kunci sesi |
  | `plugin-sdk/status-helpers` | Pembantu status channel | Pembuat ringkasan status channel/akun, default status runtime, pembantu metadata isu |
  | `plugin-sdk/target-resolver-runtime` | Pembantu penyelesai target | Pembantu penyelesai target bersama |
  | `plugin-sdk/string-normalization-runtime` | Pembantu normalisasi string | Pembantu normalisasi slug/string |
  | `plugin-sdk/request-url` | Pembantu URL permintaan | Mengekstrak URL string dari input mirip permintaan |
  | `plugin-sdk/run-command` | Pembantu perintah berbatas waktu | Runner perintah berbatas waktu dengan stdout/stderr yang dinormalisasi |
  | `plugin-sdk/param-readers` | Pembaca param | Pembaca param tool/CLI umum |
  | `plugin-sdk/tool-payload` | Ekstraksi payload tool | Mengekstrak payload yang dinormalisasi dari objek hasil tool |
  | `plugin-sdk/tool-send` | Ekstraksi pengiriman tool | Mengekstrak bidang target pengiriman kanonis dari argumen tool |
  | `plugin-sdk/temp-path` | Pembantu path sementara | Pembantu path unduhan sementara bersama |
  | `plugin-sdk/logging-core` | Pembantu logging | Logger subsistem dan pembantu redaksi |
  | `plugin-sdk/markdown-table-runtime` | Pembantu tabel Markdown | Pembantu mode tabel Markdown |
  | `plugin-sdk/reply-payload` | Tipe balasan pesan | Tipe payload balasan |
  | `plugin-sdk/provider-setup` | Pembantu penyiapan penyedia lokal/self-hosted terkurasi | Pembantu penemuan/konfigurasi penyedia self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Pembantu penyiapan penyedia self-hosted kompatibel OpenAI yang terfokus | Pembantu penemuan/konfigurasi penyedia self-hosted yang sama |
  | `plugin-sdk/provider-auth-runtime` | Pembantu auth runtime penyedia | Pembantu resolusi kunci API runtime |
  | `plugin-sdk/provider-auth-api-key` | Pembantu penyiapan kunci API penyedia | Pembantu onboarding/penulisan profil kunci API |
  | `plugin-sdk/provider-auth-result` | Pembantu hasil auth penyedia | Pembuat hasil auth OAuth standar |
  | `plugin-sdk/provider-selection-runtime` | Pembantu pemilihan penyedia | Pemilihan penyedia terkonfigurasi-atau-otomatis dan penggabungan konfigurasi penyedia mentah |
  | `plugin-sdk/provider-env-vars` | Pembantu env-var penyedia | Pembantu lookup env-var auth penyedia |
  | `plugin-sdk/provider-model-shared` | Pembantu model/replay penyedia bersama | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, pembuat kebijakan replay bersama, pembantu endpoint penyedia, dan pembantu normalisasi ID model |
  | `plugin-sdk/provider-catalog-shared` | Pembantu katalog penyedia bersama | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch onboarding penyedia | Pembantu konfigurasi onboarding |
  | `plugin-sdk/provider-http` | Pembantu HTTP penyedia | Pembantu kapabilitas HTTP/endpoint penyedia generik, termasuk pembantu formulir multipart transkripsi audio |
  | `plugin-sdk/provider-web-fetch` | Pembantu web-fetch penyedia | Pembantu registrasi/cache penyedia web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Pembantu konfigurasi web-search penyedia | Pembantu konfigurasi/kredensial web-search yang sempit untuk penyedia yang tidak memerlukan wiring pengaktifan Plugin |
  | `plugin-sdk/provider-web-search-contract` | Pembantu kontrak web-search penyedia | Pembantu kontrak konfigurasi/kredensial web-search yang sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial terskop |
  | `plugin-sdk/provider-web-search` | Pembantu web-search penyedia | Pembantu registrasi/cache/runtime penyedia web-search |
  | `plugin-sdk/provider-tools` | Pembantu kompat tool/skema penyedia | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, dan pembersihan skema + diagnostik DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Pembantu penggunaan penyedia | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, dan pembantu penggunaan penyedia lainnya |
  | `plugin-sdk/provider-stream` | Pembantu wrapper stream penyedia | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe wrapper stream, dan pembantu wrapper bersama Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Pembantu transport penyedia | Pembantu transport penyedia native seperti fetch terjaga, ekstraksi teks hasil tool, transformasi pesan transport, dan stream peristiwa transport yang dapat ditulis |
  | `plugin-sdk/keyed-async-queue` | Antrean async berurutan | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Pembantu media bersama | Pembantu fetch/transform/store media, probing dimensi video berbasis ffprobe, dan pembuat payload media |
  | `plugin-sdk/media-generation-runtime` | Pembantu media-generation bersama | Pembantu failover bersama, pemilihan kandidat, dan pesan model yang hilang untuk pembuatan gambar/video/musik |
  | `plugin-sdk/media-understanding` | Pembantu media-understanding | Tipe penyedia pemahaman media plus ekspor pembantu gambar/audio untuk penyedia |
  | `plugin-sdk/text-runtime` | Ekspor kompatibilitas teks luas yang tidak digunakan lagi | Gunakan `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`, dan `logging-core` |
  | `plugin-sdk/text-chunking` | Pembantu pemotongan teks | Pembantu pemotongan teks keluar |
  | `plugin-sdk/speech` | Pembantu ucapan | Tipe penyedia ucapan plus pembantu direktif, registry, validasi untuk penyedia, dan pembuat TTS kompatibel OpenAI |
  | `plugin-sdk/speech-core` | Core ucapan bersama | Tipe penyedia ucapan, registry, direktif, normalisasi |
  | `plugin-sdk/realtime-transcription` | Pembantu transkripsi realtime | Tipe penyedia, pembantu registry, dan pembantu sesi WebSocket bersama |
  | `plugin-sdk/realtime-voice` | Pembantu suara realtime | Tipe penyedia, pembantu registry/resolusi, pembantu sesi bridge, antrean talk-back agen bersama, kontrol suara active-run, kesehatan transkrip/peristiwa, peredaman echo, pencocokan pertanyaan konsultasi, koordinasi forced-consult, pelacakan konteks giliran, pelacakan aktivitas output, dan pembantu konsultasi konteks cepat |
  | `plugin-sdk/image-generation` | Pembantu image-generation | Tipe penyedia pembuatan gambar plus pembantu URL aset/data gambar dan pembuat penyedia gambar kompatibel OpenAI |
  | `plugin-sdk/image-generation-core` | Core image-generation bersama | Tipe image-generation, failover, auth, dan pembantu registry |
  | `plugin-sdk/music-generation` | Pembantu music-generation | Tipe penyedia/permintaan/hasil music-generation |
  | `plugin-sdk/music-generation-core` | Core music-generation bersama | Tipe music-generation, pembantu failover, lookup penyedia, dan parsing ref model |
  | `plugin-sdk/video-generation` | Pembantu video-generation | Tipe penyedia/permintaan/hasil video-generation |
  | `plugin-sdk/video-generation-core` | Core video-generation bersama | Tipe video-generation, pembantu failover, lookup penyedia, dan parsing ref model |
  | `plugin-sdk/interactive-runtime` | Pembantu balasan interaktif | Normalisasi/reduksi payload balasan interaktif |
  | `plugin-sdk/channel-config-primitives` | Primitif konfigurasi channel | Primitif skema konfigurasi channel yang sempit |
  | `plugin-sdk/channel-config-writes` | Pembantu penulisan konfigurasi channel | Pembantu otorisasi penulisan konfigurasi channel |
  | `plugin-sdk/channel-plugin-common` | Prelude channel bersama | Ekspor prelude Plugin channel bersama |
  | `plugin-sdk/channel-status` | Pembantu status channel | Pembantu snapshot/ringkasan status channel bersama |
  | `plugin-sdk/allowlist-config-edit` | Pembantu konfigurasi allowlist | Pembantu edit/baca konfigurasi allowlist |
  | `plugin-sdk/group-access` | Pembantu akses grup | Pembantu keputusan akses grup bersama |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Facade kompatibilitas yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Pembantu guard Direct-DM | Pembantu kebijakan guard pre-crypto yang sempit |
  | `plugin-sdk/extension-shared` | Pembantu ekstensi bersama | Primitif pembantu passive-channel/status dan proxy ambient |
  | `plugin-sdk/webhook-targets` | Pembantu target Webhook | Registry target Webhook dan pembantu pemasangan rute |
  | `plugin-sdk/webhook-path` | Alias path webhook yang tidak digunakan lagi | Gunakan `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Pembantu media web bersama | Pembantu pemuatan media jarak jauh/lokal |
  | `plugin-sdk/zod` | Re-ekspor kompatibilitas Zod yang tidak digunakan lagi | Impor `zod` dari `zod` secara langsung |
  | `plugin-sdk/memory-core` | Pembantu memory-core bawaan | Permukaan pembantu manajer/konfigurasi/file/CLI memori |
  | `plugin-sdk/memory-core-engine-runtime` | Facade runtime mesin memori | Facade runtime indeks/pencarian memori |
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
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core host memori | Pembantu runtime core host memori |
  | `plugin-sdk/memory-core-host-runtime-files` | Pembantu file/runtime host memori | Pembantu file/runtime host memori |
  | `plugin-sdk/memory-host-core` | Alias runtime core host memori | Alias netral vendor untuk pembantu runtime core host memori |
  | `plugin-sdk/memory-host-events` | Alias jurnal peristiwa host memori | Alias netral vendor untuk pembantu jurnal peristiwa host memori |
  | `plugin-sdk/memory-host-files` | Alias file/runtime memori yang tidak digunakan lagi | Gunakan `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Pembantu markdown terkelola | Pembantu managed-markdown bersama untuk Plugin yang berdekatan dengan memori |
  | `plugin-sdk/memory-host-search` | Facade pencarian active memory | Facade runtime search-manager active-memory lazy |
  | `plugin-sdk/memory-host-status` | Alias status host memori yang tidak digunakan lagi | Gunakan `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Utilitas pengujian | Barrel kompatibilitas repo-lokal yang tidak digunakan lagi; gunakan subpath pengujian repo-lokal yang terfokus seperti `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`, dan `plugin-sdk/test-fixtures` |
</Accordion>

Tabel ini sengaja merupakan subset migrasi umum, bukan seluruh permukaan SDK. Inventaris entrypoint compiler berada di `scripts/lib/plugin-sdk-entrypoints.json`; ekspor paket dibuat dari subset publik.

Seam helper plugin bundel yang dicadangkan telah dihentikan dari peta ekspor SDK publik kecuali fasad kompatibilitas yang didokumentasikan secara eksplisit seperti shim `plugin-sdk/discord` yang sudah usang dan dipertahankan untuk paket `@openclaw/discord@2026.3.13` yang telah dipublikasikan. Helper khusus owner berada di dalam paket Plugin pemiliknya; perilaku host bersama harus bergerak melalui kontrak SDK generik seperti `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, dan `plugin-sdk/plugin-config-runtime`.

Gunakan impor paling sempit yang sesuai dengan tugas. Jika Anda tidak dapat menemukan ekspor, periksa sumber di `src/plugin-sdk/` atau tanyakan kepada maintainer kontrak generik mana yang seharusnya memilikinya.

## Penghentian aktif

Penghentian yang lebih sempit yang berlaku di seluruh SDK Plugin, kontrak provider, permukaan runtime, dan manifest. Masing-masing masih berfungsi saat ini tetapi akan dihapus dalam rilis mayor mendatang. Entri di bawah setiap item memetakan API lama ke pengganti kanonisnya.

<AccordionGroup>
  <Accordion title="pembangun bantuan command-auth → command-status">
    **Lama (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Baru (`openclaw/plugin-sdk/command-status`)**: signature yang sama, ekspor
    yang sama - hanya diimpor dari subpath yang lebih sempit. `command-auth`
    mengekspor ulang semuanya sebagai stub kompatibilitas.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Helper gating penyebutan → resolveInboundMentionDecision">
    **Lama**: `resolveInboundMentionRequirement({ facts, policy })` dan
    `shouldDropInboundForMention(...)` dari
    `openclaw/plugin-sdk/channel-inbound` atau
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Baru**: `resolveInboundMentionDecision({ facts, policy })` - mengembalikan
    satu objek keputusan, bukan dua panggilan terpisah.

    Plugin channel downstream (Slack, Discord, Matrix, MS Teams) sudah
    beralih.

  </Accordion>

  <Accordion title="Shim runtime channel dan helper aksi channel">
    `openclaw/plugin-sdk/channel-runtime` adalah shim kompatibilitas untuk Plugin
    channel lama. Jangan mengimpornya dari kode baru; gunakan
    `openclaw/plugin-sdk/channel-runtime-context` untuk mendaftarkan objek
    runtime.

    Helper `channelActions*` di `openclaw/plugin-sdk/channel-actions`
    dihentikan bersama ekspor channel "actions" mentah. Ekspos kemampuan
    melalui permukaan semantik `presentation` sebagai gantinya - Plugin channel
    mendeklarasikan apa yang mereka render (card, tombol, select), bukan nama
    aksi mentah mana yang mereka terima.

  </Accordion>

  <Accordion title="Helper tool() provider pencarian web → createTool() pada Plugin">
    **Lama**: factory `tool()` dari `openclaw/plugin-sdk/provider-web-search`.

    **Baru**: implementasikan `createTool(...)` langsung pada Plugin provider.
    OpenClaw tidak lagi membutuhkan helper SDK untuk mendaftarkan wrapper tool.

  </Accordion>

  <Accordion title="Envelope channel plaintext → BodyForAgent">
    **Lama**: `formatInboundEnvelope(...)` (dan
    `ChannelMessageForAgent.channelEnvelope`) untuk membuat envelope prompt
    plaintext datar dari pesan channel masuk.

    **Baru**: `BodyForAgent` plus blok konteks pengguna terstruktur. Plugin
    channel melampirkan metadata routing (thread, topik, reply-to, reaksi)
    sebagai field bertipe, bukan menggabungkannya ke string prompt. Helper
    `formatAgentEnvelope(...)` masih didukung untuk envelope sintetis yang
    menghadap asisten, tetapi envelope plaintext masuk sedang menuju
    penghentian.

    Area terdampak: `inbound_claim`, `message_received`, dan Plugin channel
    kustom apa pun yang memproses lanjutan teks `channelEnvelope`.

  </Accordion>

  <Accordion title="hook deactivate → gateway_stop">
    **Lama**: `api.on("deactivate", handler)`.

    **Baru**: `api.on("gateway_stop", handler)`. Event dan konteksnya adalah
    kontrak cleanup shutdown yang sama; hanya nama hook yang berubah.

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

    `deactivate` tetap terhubung sebagai alias kompatibilitas yang sudah usang
    hingga setelah 2026-08-16.

  </Accordion>

  <Accordion title="hook subagent_spawning → binding thread core">
    **Lama**: `api.on("subagent_spawning", handler)` yang mengembalikan
    `threadBindingReady` atau `deliveryOrigin`.

    **Baru**: biarkan core menyiapkan binding subagent `thread: true` melalui
    adapter binding sesi channel. Gunakan `api.on("subagent_spawned", handler)`
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
    sebagai permukaan kompatibilitas yang sudah usang sementara Plugin eksternal
    bermigrasi.

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

    Ditambah bag statis `ProviderCapabilities` lama - Plugin provider harus
    menggunakan hook provider eksplisit seperti `buildReplayPolicy`,
    `normalizeToolSchemas`, dan `wrapStreamFn`, bukan objek statis.

  </Accordion>

  <Accordion title="Hook kebijakan Thinking → resolveThinkingProfile">
    **Lama** (tiga hook terpisah pada `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, dan
    `resolveDefaultThinkingLevel(ctx)`.

    **Baru**: satu `resolveThinkingProfile(ctx)` yang mengembalikan
    `ProviderThinkingProfile` dengan `id` kanonis, `label` opsional, dan daftar
    level berperingkat. OpenClaw otomatis menurunkan nilai tersimpan yang usang
    berdasarkan peringkat profil.

    Konteks mencakup `provider`, `modelId`, `reasoning` gabungan opsional, dan
    fakta `compat` model gabungan opsional. Plugin provider dapat menggunakan
    fakta katalog tersebut untuk mengekspos profil khusus model hanya ketika
    kontrak request yang dikonfigurasi mendukungnya.

    Implementasikan satu hook, bukan tiga. Hook lama tetap berfungsi selama
    jendela penghentian tetapi tidak digabungkan dengan hasil profil.

  </Accordion>

  <Accordion title="Provider auth eksternal → contracts.externalAuthProviders">
    **Lama**: mengimplementasikan hook auth eksternal tanpa mendeklarasikan
    provider di manifest Plugin.

    **Baru**: deklarasikan `contracts.externalAuthProviders` di manifest Plugin
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
    Field manifest **lama**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Baru**: cerminkan lookup env-var yang sama ke `setup.providers[].envVars`
    pada manifest. Ini mengonsolidasikan metadata env setup/status di satu
    tempat dan menghindari boot runtime Plugin hanya untuk menjawab lookup
    env-var.

    `providerAuthEnvVars` tetap didukung melalui adapter kompatibilitas hingga
    jendela penghentian ditutup.

  </Accordion>

  <Accordion title="Registrasi Plugin memori → registerMemoryCapability">
    **Lama**: tiga panggilan terpisah -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Baru**: satu panggilan pada API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Slot yang sama, satu panggilan registrasi. Helper prompt dan korpus aditif
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) tidak
    terdampak.

  </Accordion>

  <Accordion title="API provider embedding memori">
    **Lama**: `api.registerMemoryEmbeddingProvider(...)` plus
    `contracts.memoryEmbeddingProviders`.

    **Baru**: `api.registerEmbeddingProvider(...)` plus
    `contracts.embeddingProviders`.

    Kontrak provider embedding generik dapat digunakan ulang di luar memori dan
    merupakan jalur yang didukung untuk provider baru. API registrasi khusus
    memori tetap terhubung sebagai kompatibilitas yang sudah usang sementara
    provider yang ada bermigrasi. Inspeksi Plugin melaporkan penggunaan
    non-bundel sebagai utang kompatibilitas.

  </Accordion>

  <Accordion title="Tipe pesan sesi subagent diganti nama">
    Dua alias tipe lama masih diekspor dari `src/plugins/runtime/types.ts`:

    | Lama                          | Baru                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Metode runtime `readSession` dihentikan demi `getSessionMessages`.
    Signature yang sama; metode lama meneruskan panggilan ke yang baru.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Lama**: `runtime.tasks.flow` (tunggal) mengembalikan accessor task-flow
    live.

    **Baru**: `runtime.tasks.managedFlows` mempertahankan runtime mutasi
    TaskFlow terkelola untuk Plugin yang membuat, memperbarui, membatalkan, atau
    menjalankan tugas anak dari flow. Gunakan `runtime.tasks.flows` ketika
    Plugin hanya membutuhkan pembacaan berbasis DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Factory extension tertanam → middleware tool-result agent">
    Dicakup dalam "Cara bermigrasi → Migrasikan extension tool-result tertanam
    ke middleware" di atas. Disertakan di sini demi kelengkapan: jalur
    `api.registerEmbeddedExtensionFactory(...)` khusus embedded-runner yang
    dihapus digantikan oleh `api.registerAgentToolResultMiddleware(...)` dengan
    daftar runtime eksplisit di `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` yang diekspor ulang dari `openclaw/plugin-sdk`
    sekarang adalah alias satu baris untuk `OpenClawConfig`. Utamakan nama
    kanonis.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Penghentian tingkat extension (di dalam Plugin channel/provider bundel di bawah
`extensions/`) dilacak di dalam barrel `api.ts` dan `runtime-api.ts` mereka
sendiri. Itu tidak memengaruhi kontrak Plugin pihak ketiga dan tidak
dicantumkan di sini. Jika Anda menggunakan barrel lokal Plugin bundel secara
langsung, baca komentar penghentian di barrel tersebut sebelum meningkatkan
versi.
</Note>

## Linimasa penghapusan

| Kapan                   | Apa yang terjadi                                                                 |
| ----------------------- | -------------------------------------------------------------------------------- |
| **Sekarang**            | Permukaan yang tidak digunakan lagi memunculkan peringatan saat runtime           |
| **Rilis mayor berikutnya** | Permukaan yang tidak digunakan lagi akan dihapus; Plugin yang masih menggunakannya akan gagal |

Semua Plugin inti sudah dimigrasikan. Plugin eksternal harus bermigrasi
sebelum rilis mayor berikutnya.

## Menekan peringatan untuk sementara

Tetapkan variabel lingkungan ini saat Anda mengerjakan migrasi:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Ini adalah jalan keluar sementara, bukan solusi permanen.

## Terkait

- [Memulai](/id/plugins/building-plugins) - bangun Plugin pertama Anda
- [Ikhtisar SDK](/id/plugins/sdk-overview) - referensi lengkap impor subpath
- [Plugin Channel](/id/plugins/sdk-channel-plugins) - membangun Plugin channel
- [Plugin Provider](/id/plugins/sdk-provider-plugins) - membangun Plugin provider
- [Internal Plugin](/id/plugins/architecture) - pendalaman arsitektur
- [Manifest Plugin](/id/plugins/manifest) - referensi skema manifest
