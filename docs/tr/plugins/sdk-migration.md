---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED uyarısını görüyorsunuz
    - OPENCLAW_EXTENSION_API_DEPRECATED uyarısını görüyorsunuz
    - OpenClaw 2026.4.25'ten önce api.registerEmbeddedExtensionFactory kullandınız
    - Bir Plugin'i modern Plugin mimarisine güncelliyorsunuz
    - Harici bir OpenClaw Plugin'inin bakımını yapıyorsunuz
sidebarTitle: Migrate to SDK
summary: Eski geriye dönük uyumluluk katmanından modern Plugin SDK'ye geçiş yapın
title: Plugin SDK geçişi
x-i18n:
    generated_at: "2026-05-10T19:48:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7595b41c15ce36dd8d2a3faf320cc9847b013b1f4807c02b8b97c6feaee4415
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw, geniş bir geriye dönük uyumluluk katmanından odaklı, belgelenmiş import'lara sahip modern bir plugin
mimarisine geçti. Plugin'iniz yeni mimariden önce oluşturulduysa
bu kılavuz geçiş yapmanıza yardımcı olur.

## Neler değişiyor

Eski plugin sistemi, plugin'lerin ihtiyaç duydukları her şeyi tek bir giriş noktasından
import etmesine olanak tanıyan iki çok geniş yüzey sağlıyordu:

- **`openclaw/plugin-sdk/compat`** - düzinelerce yardımcıyı yeniden dışa aktaran
  tek bir import. Yeni plugin mimarisi geliştirilirken eski hook tabanlı
  plugin'lerin çalışmaya devam etmesini sağlamak için kullanıma sunulmuştu.
- **`openclaw/plugin-sdk/infra-runtime`** - sistem olaylarını, Heartbeat durumunu,
  teslimat kuyruklarını, fetch/proxy yardımcılarını, dosya yardımcılarını,
  onay türlerini ve ilgisiz yardımcıları karıştıran geniş bir runtime yardımcı barrel'ı.
- **`openclaw/plugin-sdk/config-runtime`** - geçiş penceresi sırasında hâlâ
  kullanımdan kaldırılmış doğrudan load/write yardımcılarını taşıyan geniş bir yapılandırma uyumluluğu barrel'ı.
- **`openclaw/extension-api`** - plugin'lere gömülü agent runner gibi
  host tarafı yardımcılara doğrudan erişim veren bir köprü.
- **`api.registerEmbeddedExtensionFactory(...)`** - `tool_result` gibi
  gömülü-runner olaylarını gözlemleyebilen, kaldırılmış Pi'ye özel paketli
  extension hook'u.

Geniş import yüzeyleri artık **kullanımdan kaldırıldı**. Runtime'da hâlâ çalışırlar,
ancak yeni plugin'ler bunları kullanmamalıdır ve mevcut plugin'ler bunları kaldıracak
sonraki major sürümden önce geçiş yapmalıdır. Pi'ye özel gömülü extension factory
kayıt API'si kaldırıldı; bunun yerine tool-result middleware kullanın.

OpenClaw, yerine geçecek bir şeyi tanıtan aynı değişiklikte belgelenmiş plugin davranışını
kaldırmaz veya yeniden yorumlamaz. Sözleşmeyi bozan değişiklikler önce bir
uyumluluk adapter'ından, diagnostics'ten, dokümantasyondan ve bir kullanımdan kaldırma penceresinden
geçmelidir. Bu SDK import'ları, manifest alanları, kurulum API'leri, hook'lar ve runtime
kayıt davranışı için geçerlidir.

<Warning>
  Geriye dönük uyumluluk katmanı gelecekteki bir major sürümde kaldırılacaktır.
  Hâlâ bu yüzeylerden import eden plugin'ler bu gerçekleştiğinde bozulacaktır.
  Pi'ye özel gömülü extension factory kayıtları artık zaten yüklenmiyor.
</Warning>

## Bu neden değişti

Eski yaklaşım sorunlara neden oldu:

- **Yavaş başlangıç** - tek bir yardımcıyı import etmek düzinelerce ilgisiz modülü yüklüyordu
- **Döngüsel bağımlılıklar** - geniş yeniden dışa aktarımlar import döngüleri oluşturmayı kolaylaştırıyordu
- **Belirsiz API yüzeyi** - hangi dışa aktarımların kararlı, hangilerinin internal olduğunu anlamanın yolu yoktu

Modern plugin SDK bunu düzeltir: her import yolu (`openclaw/plugin-sdk/\<subpath\>`)
net bir amaca ve belgelenmiş bir sözleşmeye sahip küçük, kendi kendine yeterli bir modüldür.

Paketli kanallar için legacy sağlayıcı kolaylık seams'leri de kaldırıldı.
Kanal markalı yardımcı seams'ler kararlı plugin sözleşmeleri değil, özel mono-repo kısayollarıydı.
Bunun yerine dar generic SDK alt yollarını kullanın. Paketli plugin çalışma alanı içinde,
sağlayıcıya ait yardımcıları ilgili plugin'in kendi `api.ts` veya `runtime-api.ts` dosyasında tutun.

Mevcut paketli sağlayıcı örnekleri:

- Anthropic, Claude'a özgü stream yardımcılarını kendi `api.ts` /
  `contract-api.ts` seam'inde tutar
- OpenAI, sağlayıcı builder'larını, varsayılan-model yardımcılarını ve realtime sağlayıcı
  builder'larını kendi `api.ts` dosyasında tutar
- OpenRouter, sağlayıcı builder'ını ve onboarding/config yardımcılarını kendi
  `api.ts` dosyasında tutar

## Talk ve realtime ses geçiş planı

Realtime ses, telefoni, toplantı ve tarayıcı Talk kodu, yüzey-yerel turn kayıt tutmadan
`openclaw/plugin-sdk/realtime-voice` tarafından dışa aktarılan paylaşılan bir Talk oturum denetleyicisine taşınıyor.
Yeni denetleyici ortak Talk olay zarfını, aktif turn durumunu, capture durumunu, çıkış-ses durumunu, yakın
olay geçmişini ve eski-turn reddini yönetir. Sağlayıcı plugin'ler vendor'a özgü realtime
oturumları yönetmeye devam etmelidir; yüzey plugin'leri capture, playback, telefoni ve toplantı
özelliklerini yönetmeye devam etmelidir.

Bu Talk geçişi kasıtlı olarak temiz şekilde breaking'dir:

1. Paylaşılan controller/runtime primitive'lerini
   `plugin-sdk/realtime-voice` içinde tutun.
2. Paketli yüzeyleri paylaşılan denetleyiciye taşıyın: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime ve native push-to-talk.
3. Eski Talk RPC ailelerini nihai `talk.session.*` ve
   `talk.client.*` API'siyle değiştirin.
4. Gateway `hello-ok.features.events` içinde tek bir canlı Talk olay kanalını
   duyurun: `talk.event`.
5. Eski realtime HTTP endpoint'ini ve request-time instruction
   override yolunu silin.

Yeni kod, düşük seviyeli bir adapter veya test fixture uygulamıyorsa
`createTalkEventSequencer(...)` öğesini doğrudan çağırmamalıdır. Paylaşılan denetleyiciyi tercih edin;
böylece turn kapsamlı olaylar turn id olmadan yayımlanamaz, eski `turnEnd` /
`turnCancel` çağrıları daha yeni bir aktif turn'ü temizleyemez ve output-audio yaşam döngüsü
olayları telefoni, toplantılar, browser relay, managed-room handoff ve native Talk istemcileri
arasında tutarlı kalır.

Hedef genel API şekli şöyledir:

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
```

Tarayıcıya ait WebRTC/provider-websocket oturumları `talk.client.create` kullanır,
çünkü tarayıcı sağlayıcı negotiation ve media transport'u yönetirken
Gateway kimlik bilgilerini, talimatları ve tool politikasını yönetir. `talk.session.*`,
gateway-relay realtime, gateway-relay transcription ve managed-room native STT/TTS oturumları için
ortak Gateway tarafından yönetilen yüzeydir.

Realtime seçicileri `talk.provider` /
`talk.providers` yanına koyan legacy config'ler `openclaw doctor --fix` ile onarılmalıdır; runtime Talk
speech/TTS sağlayıcı config'ini realtime sağlayıcı config'i olarak yeniden yorumlamaz.

Desteklenen `talk.session.create` kombinasyonları kasıtlı olarak azdır:

| Mod             | Transport       | Brain           | Sahip              | Notlar                                                                                                             |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Gateway üzerinden köprülenen full-duplex sağlayıcı sesi; tool çağrıları agent-consult tool'u üzerinden yönlendirilir. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Yalnızca streaming STT; çağıranlar input audio gönderir ve transcript olayları alır.                               |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | İstemcinin capture/playback'i yönettiği ve Gateway'in turn durumunu yönettiği push-to-talk ve walkie-talkie tarzı odalar. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | Gateway tool action'larını doğrudan yürüten güvenilir first-party yüzeyler için admin'e özel oda modu.             |

Kaldırılan method haritası:

| Eski                             | Yeni                                                     |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` veya `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

Birleşik kontrol söz varlığı da bilinçli olarak dardır:

| Method                          | Şunlara uygulanır                                      | Sözleşme                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Aynı Gateway bağlantısının sahip olduğu sağlayıcı oturumuna base64 PCM audio chunk ekler.                                                                                                |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Bir managed-room kullanıcı turn'ü başlatır.                                                                                                                                              |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Eski-turn doğrulamasından sonra aktif turn'ü sonlandırır.                                                                                                                                |
| `talk.session.cancelTurn`       | tüm Gateway'e ait oturumlar                             | Bir turn için aktif capture/provider/agent/TTS işini iptal eder.                                                                                                                         |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Kullanıcı turn'ünü mutlaka sonlandırmadan assistant audio output'u durdurur.                                                                                                             |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Relay tarafından yayımlanan sağlayıcı tool çağrısını tamamlar; ara çıktı için `options.willContinue` veya başka bir assistant yanıtı olmadan çağrıyı karşılamak için `options.suppressResponse` geçirin. |
| `talk.session.close`            | tüm birleşik oturumlar                                  | Relay oturumlarını durdurur veya managed-room durumunu iptal eder, ardından birleşik session id'yi unutur.                                                                               |

  Bunu çalıştırmak için core içine provider veya platforma özel durumlar eklemeyin.
  Core, Talk oturumu semantiğinin sahibidir. Provider Plugin'leri, satıcı oturumu kurulumunun sahibidir.
  Sesli arama ve Google Meet, telefon/Toplantı bağdaştırıcılarının sahibidir. Tarayıcı ve yerel
  uygulamalar, cihaz yakalama/oynatma UX'inin sahibidir.

  ## Uyumluluk ilkesi

  Harici Plugin'ler için uyumluluk çalışması şu sırayı izler:

  1. yeni sözleşmeyi ekleyin
  2. eski davranışı bir uyumluluk bağdaştırıcısı üzerinden bağlı tutun
  3. eski yolu ve yerine kullanılacak seçeneği adlandıran bir tanılama veya uyarı yayınlayın
  4. testlerde her iki yolu da kapsayın
  5. kullanımdan kaldırmayı ve geçiş yolunu belgeleyin
  6. yalnızca duyurulan geçiş penceresinden sonra kaldırın; bu genellikle büyük bir sürümdedir

  Maintainer'lar mevcut geçiş kuyruğunu
  `pnpm plugins:boundary-report` ile denetleyebilir. Kompakt sayımlar için
  `pnpm plugins:boundary-report:summary`, tek bir Plugin veya uyumluluk sahibi için
  `--owner <id>`, bir CI kapısının zamanı gelmiş uyumluluk kayıtları,
  sahipler arası ayrılmış SDK içe aktarımları veya kullanılmayan ayrılmış SDK
  alt yolları nedeniyle başarısız olması gerektiğinde
  `pnpm plugins:boundary-report:ci` kullanın. Rapor, kullanımdan kaldırılmış
  uyumluluk kayıtlarını kaldırma tarihine göre gruplar, yerel kod/belge referanslarını sayar,
  sahipler arası ayrılmış SDK içe aktarımlarını ortaya çıkarır ve özel
  memory-host SDK köprüsünü özetler; böylece uyumluluk temizliği geçici aramalara
  dayanmak yerine açık kalır. Ayrılmış SDK alt yollarında takip edilen sahip kullanımı bulunmalıdır;
  kullanılmayan ayrılmış yardımcı dışa aktarımları public SDK'dan kaldırılmalıdır.

  Bir manifest alanı hâlâ kabul ediliyorsa, Plugin yazarları belgeler ve
  tanılamalar aksini söyleyene kadar onu kullanmaya devam edebilir. Yeni kod,
  belgelenen yerine kullanılacak seçeneği tercih etmelidir; ancak mevcut Plugin'ler
  olağan minor sürümler sırasında bozulmamalıdır.

  ## Nasıl geçiş yapılır

  <Steps>
  <Step title="Çalışma zamanı yapılandırma yükleme/yazma yardımcılarını geçirin">
    Paketlenmiş Plugin'ler doğrudan
    `api.runtime.config.loadConfig()` ve
    `api.runtime.config.writeConfigFile(...)` çağırmayı bırakmalıdır. Aktif çağrı yoluna
    zaten geçirilmiş olan yapılandırmayı tercih edin. Geçerli süreç anlık görüntüsüne
    ihtiyaç duyan uzun ömürlü işleyiciler `api.runtime.config.current()` kullanabilir. Uzun ömürlü
    agent araçları, bir yapılandırma yazma işleminden önce oluşturulan bir aracın hâlâ yenilenmiş
    çalışma zamanı yapılandırmasını görmesi için `execute` içinde araç bağlamının
    `ctx.getRuntimeConfig()` yöntemini kullanmalıdır.

    Yapılandırma yazmaları işlem temelli yardımcılar üzerinden geçmeli ve bir
    yazma sonrası ilkesi seçmelidir:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Çağıran taraf değişikliğin temiz bir gateway restart gerektirdiğini bildiğinde
    `afterWrite: { mode: "restart", reason: "..." }`, yalnızca çağıran taraf devam işinin
    sahibi olduğunda ve reload planner'ı bilinçli olarak bastırmak istediğinde
    `afterWrite: { mode: "none", reason: "..." }` kullanın.
    Mutation sonuçları testler ve logging için türlendirilmiş bir `followUp` özeti içerir;
    Gateway, restart'ı uygulama veya zamanlama sorumluluğunu korur.
    `loadConfig` ve `writeConfigFile`, geçiş penceresi sırasında harici Plugin'ler
    için kullanımdan kaldırılmış uyumluluk yardımcıları olarak kalır ve
    `runtime-config-load-write` uyumluluk koduyla bir kez uyarır. Paketlenmiş Plugin'ler ve repo
    çalışma zamanı kodu, `pnpm check:deprecated-api-usage` ve
    `pnpm check:no-runtime-action-load-config` içinde tarayıcı korumalarıyla korunur:
    yeni production Plugin kullanımı doğrudan başarısız olur, doğrudan yapılandırma yazmaları başarısız olur,
    Gateway server yöntemleri istek çalışma zamanı anlık görüntüsünü kullanmalıdır, çalışma zamanı kanal
    gönderme/action/client yardımcıları yapılandırmayı kendi sınırlarından almalıdır ve uzun ömürlü çalışma zamanı modüllerinde
    izin verilen ortam `loadConfig()` çağrısı sıfırdır.

    Yeni Plugin kodu ayrıca geniş
    `openclaw/plugin-sdk/config-runtime` uyumluluk barrel'ını içe aktarmaktan kaçınmalıdır. İşe uyan dar
    SDK alt yolunu kullanın:

    | İhtiyaç | İçe aktarma |
    | --- | --- |
    | `OpenClawConfig` gibi yapılandırma türleri | `openclaw/plugin-sdk/config-contracts` |
    | Zaten yüklenmiş yapılandırma doğrulamaları ve Plugin-entry yapılandırma araması | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Geçerli çalışma zamanı anlık görüntüsü okumaları | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Yapılandırma yazmaları | `openclaw/plugin-sdk/config-mutation` |
    | Oturum deposu yardımcıları | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown tablo yapılandırması | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Grup ilkesi çalışma zamanı yardımcıları | `openclaw/plugin-sdk/runtime-group-policy` |
    | Secret input çözümleme | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model/oturum geçersiz kılmaları | `openclaw/plugin-sdk/model-session-runtime` |

    Paketlenmiş Plugin'ler ve testleri geniş
    barrel'a karşı tarayıcı korumalıdır; böylece içe aktarımlar ve mock'lar ihtiyaç duydukları davranışa yerel kalır. Geniş
    barrel harici uyumluluk için hâlâ vardır, ancak yeni kod ona
    bağımlı olmamalıdır.

  </Step>

  <Step title="Pi araç sonucu uzantılarını middleware'e geçirin">
    Paketlenmiş Plugin'ler, yalnızca Pi'ye özgü
    `api.registerEmbeddedExtensionFactory(...)` araç sonucu işleyicilerini
    çalışma zamanından bağımsız middleware ile değiştirmelidir.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Plugin manifest'ini aynı anda güncelleyin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Harici Plugin'ler araç sonucu middleware'i kaydedemez çünkü model görmeden önce yüksek güvenilirlikli araç çıktısını
    yeniden yazabilir.

  </Step>

  <Step title="Onay yerel işleyicilerini capability facts'e geçirin">
    Onay destekli kanal Plugin'leri artık yerel onay davranışını
    `approvalCapability.nativeRuntime` ve paylaşılan çalışma zamanı bağlamı kayıt defteri üzerinden sunar.

    Temel değişiklikler:

    - `approvalCapability.handler.loadRuntime(...)` yerine
      `approvalCapability.nativeRuntime` kullanın
    - Onaya özgü kimlik doğrulama/teslimatı eski `plugin.auth` /
      `plugin.approvals` bağlantısından çıkarıp `approvalCapability` üzerine taşıyın
    - `ChannelPlugin.approvals` public channel-plugin sözleşmesinden kaldırıldı;
      delivery/native/render alanlarını `approvalCapability` üzerine taşıyın
    - `plugin.auth` yalnızca kanal login/logout akışları için kalır; buradaki onay kimlik doğrulama
      hook'ları artık core tarafından okunmaz
    - Client'lar, token'lar veya Bolt
      uygulamaları gibi kanala ait çalışma zamanı nesnelerini `openclaw/plugin-sdk/channel-runtime-context` üzerinden kaydedin
    - Yerel onay işleyicilerinden Plugin'e ait yeniden yönlendirme bildirimleri göndermeyin;
      core artık gerçek teslimat sonuçlarından gelen başka yere yönlendirildi bildirimlerinin sahibidir
    - `channelRuntime` öğesini `createChannelManager(...)` içine geçirirken gerçek bir
      `createPluginRuntime().channel` yüzeyi sağlayın. Kısmi stub'lar reddedilir.

    Geçerli onay capability düzeni için `/plugins/sdk-channel-plugins` bölümüne bakın.

  </Step>

  <Step title="Windows wrapper fallback davranışını denetleyin">
    Plugin'iniz `openclaw/plugin-sdk/windows-spawn` kullanıyorsa, çözümlenmeyen Windows
    `.cmd`/`.bat` wrapper'ları artık açıkça
    `allowShellFallback: true` geçmediğiniz sürece kapalı şekilde başarısız olur.

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

    Çağıran tarafınız bilinçli olarak shell fallback'e dayanmıyorsa,
    `allowShellFallback` ayarlamayın ve bunun yerine fırlatılan hatayı işleyin.

  </Step>

  <Step title="Kullanımdan kaldırılmış içe aktarımları bulun">
    Plugin'inizde kullanımdan kaldırılmış iki yüzeyden herhangi birinden yapılan içe aktarımları arayın:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Odaklanmış içe aktarımlarla değiştirin">
    Eski yüzeydeki her dışa aktarım belirli bir modern içe aktarma yoluna eşlenir:

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

    Host tarafı yardımcıları için doğrudan içe aktarmak yerine enjekte edilen Plugin çalışma zamanını kullanın:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Aynı desen diğer eski köprü yardımcıları için de geçerlidir:

    | Eski içe aktarma | Modern eşdeğer |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | oturum deposu yardımcıları | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Geniş infra-runtime içe aktarımlarını değiştirin">
    `openclaw/plugin-sdk/infra-runtime` harici uyumluluk için hâlâ vardır,
    ancak yeni kod gerçekten ihtiyaç duyduğu odaklanmış yardımcı yüzeyi içe aktarmalıdır:

    | İhtiyaç | İçe aktarma |
    | --- | --- |
    | Sistem olay kuyruğu yardımcıları | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat uyandırma, olay ve görünürlük yardımcıları | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Bekleyen teslimat kuyruğu boşaltma | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Kanal etkinliği telemetrisi | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Bellek içi tekilleştirme önbellekleri | `openclaw/plugin-sdk/dedupe-runtime` |
    | Güvenli yerel dosya/medya yolu yardımcıları | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher farkındalıklı fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy ve korumalı fetch yardımcıları | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF dispatcher ilkesi türleri | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Onay isteği/çözümleme türleri | `openclaw/plugin-sdk/approval-runtime` |
    | Onay yanıt payload ve komut yardımcıları | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Hata biçimlendirme yardımcıları | `openclaw/plugin-sdk/error-runtime` |
    | Transport hazır olma beklemeleri | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Güvenli token yardımcıları | `openclaw/plugin-sdk/secure-random-runtime` |
    | Sınırlı asenkron görev eşzamanlılığı | `openclaw/plugin-sdk/concurrency-runtime` |
    | Sayısal coercion | `openclaw/plugin-sdk/number-runtime` |
    | Süreç yerel asenkron kilit | `openclaw/plugin-sdk/async-lock-runtime` |
    | Dosya kilitleri | `openclaw/plugin-sdk/file-lock` |

    Paketlenmiş Plugin'ler `infra-runtime`'a karşı tarayıcı korumalıdır; böylece repo kodu
    geniş barrel'a geri dönemez.

  </Step>

  <Step title="Kanal route yardımcılarını geçirin">
    Yeni kanal route kodu `openclaw/plugin-sdk/channel-route` kullanmalıdır.
    Eski route-key ve comparable-target adları geçiş penceresi sırasında uyumluluk
    alias'ları olarak kalır, ancak yeni Plugin'ler davranışı doğrudan açıklayan route
    adlarını kullanmalıdır:

    | Eski yardımcı | Modern yardımcı |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Modern route yardımcıları, `{ channel, to, accountId, threadId }`
    değerlerini yerel onaylar, yanıt bastırma, gelen tekilleştirme,
    Cron teslimi ve oturum yönlendirme genelinde tutarlı şekilde normalleştirir.
    Plugin'iniz özel hedef gramerine sahipse, bu ayrıştırıcıyı aynı route
    hedef sözleşmesine uyarlamak için `resolveChannelRouteTargetWithParser(...)` kullanın.

  </Step>

  <Step title="Derle ve test et">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## İçe aktarma yolu başvurusu

  <Accordion title="Common import path table">
  | İçe aktarma yolu | Amaç | Temel dışa aktarımlar |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Standart Plugin giriş yardımcısı | `definePluginEntry` |
  | `plugin-sdk/core` | Kanal girişi tanımları/oluşturucuları için eski şemsiye yeniden dışa aktarım | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Kök yapılandırma şeması dışa aktarımı | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Tek sağlayıcılı giriş yardımcısı | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Odaklanmış kanal girişi tanımları ve oluşturucuları | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları | İzin listesi istemleri, kurulum durumu oluşturucuları |
  | `plugin-sdk/setup-runtime` | Kurulum zamanı çalışma zamanı yardımcıları | İçe aktarma açısından güvenli kurulum yama bağdaştırıcıları, arama notu yardımcıları, `promptResolvedAllowFrom`, `splitSetupEntries`, devredilmiş kurulum proxy'leri |
  | `plugin-sdk/setup-adapter-runtime` | Kullanımdan kaldırılmış kurulum bağdaştırıcısı takma adı | `plugin-sdk/setup-runtime` kullanın |
  | `plugin-sdk/setup-tools` | Kurulum araçları yardımcıları | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Çok hesaplı yardımcılar | Hesap listesi/yapılandırması/eylem geçidi yardımcıları |
  | `plugin-sdk/account-id` | Hesap kimliği yardımcıları | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalleştirme |
  | `plugin-sdk/account-resolution` | Hesap arama yardımcıları | Hesap arama + varsayılan yedeğe dönme yardımcıları |
  | `plugin-sdk/account-helpers` | Dar kapsamlı hesap yardımcıları | Hesap listesi/hesap eylemi yardımcıları |
  | `plugin-sdk/channel-setup` | Kurulum sihirbazı bağdaştırıcıları | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM eşleştirme temel öğeleri | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Yanıt öneki, yazıyor göstergesi ve kaynak teslimatı bağlantıları | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Yapılandırma bağdaştırıcısı fabrikaları ve DM erişim yardımcıları | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Yapılandırma şeması oluşturucuları | Yalnızca paylaşılan kanal yapılandırma şeması temel öğeleri ve genel oluşturucu |
  | `plugin-sdk/bundled-channel-config-schema` | Paketli yapılandırma şemaları | Yalnızca OpenClaw tarafından bakımı yapılan paketli Plugin'ler; yeni Plugin'ler Plugin yerel şemalar tanımlamalıdır |
  | `plugin-sdk/channel-config-schema-legacy` | Kullanımdan kaldırılmış paketli yapılandırma şemaları | Yalnızca uyumluluk takma adı; bakımı yapılan paketli Plugin'ler için `plugin-sdk/bundled-channel-config-schema` kullanın |
  | `plugin-sdk/telegram-command-config` | Telegram komut yapılandırması yardımcıları | Komut adı normalleştirme, açıklama kırpma, yinelenen/çakışan doğrulama |
  | `plugin-sdk/channel-policy` | Grup/DM ilkesi çözümleme | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Hesap durumu ve taslak akış yaşam döngüsü yardımcıları | `createAccountStatusSink`, taslak önizleme sonlandırma yardımcıları |
  | `plugin-sdk/inbound-envelope` | Gelen zarf yardımcıları | Paylaşılan rota + zarf oluşturucu yardımcıları |
  | `plugin-sdk/inbound-reply-dispatch` | Gelen yanıt yardımcıları | Paylaşılan kaydet ve gönder yardımcıları |
  | `plugin-sdk/messaging-targets` | Mesajlaşma hedefi ayrıştırma | Hedef ayrıştırma/eşleştirme yardımcıları |
  | `plugin-sdk/outbound-media` | Giden medya yardımcıları | Paylaşılan giden medya yükleme |
  | `plugin-sdk/outbound-send-deps` | Giden gönderme bağımlılığı yardımcıları | Tam giden çalışma zamanını içe aktarmadan hafif `resolveOutboundSendDep` araması |
  | `plugin-sdk/outbound-runtime` | Giden çalışma zamanı yardımcıları | Giden teslimat, kimlik/gönderme temsilcisi, oturum, biçimlendirme ve yük planlama yardımcıları |
  | `plugin-sdk/thread-bindings-runtime` | Konu bağlama yardımcıları | Konu bağlama yaşam döngüsü ve bağdaştırıcı yardımcıları |
  | `plugin-sdk/agent-media-payload` | Eski medya yükü yardımcıları | Eski alan düzenleri için aracı medya yükü oluşturucusu |
  | `plugin-sdk/channel-runtime` | Kullanımdan kaldırılmış uyumluluk şimi | Yalnızca eski kanal çalışma zamanı yardımcı programları |
  | `plugin-sdk/channel-send-result` | Gönderme sonucu türleri | Yanıt sonucu türleri |
  | `plugin-sdk/runtime-store` | Kalıcı Plugin depolama | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Geniş kapsamlı çalışma zamanı yardımcıları | Çalışma zamanı/günlükleme/yedekleme/Plugin kurulum yardımcıları |
  | `plugin-sdk/runtime-env` | Dar kapsamlı çalışma zamanı ortam yardımcıları | Günlükleyici/çalışma zamanı ortamı, zaman aşımı, yeniden deneme ve geri çekilme yardımcıları |
  | `plugin-sdk/plugin-runtime` | Paylaşılan Plugin çalışma zamanı yardımcıları | Plugin komutları/kancaları/http/etkileşimli yardımcıları |
  | `plugin-sdk/hook-runtime` | Kanca işlem hattı yardımcıları | Paylaşılan Webhook/dahili kanca işlem hattı yardımcıları |
  | `plugin-sdk/lazy-runtime` | Tembel çalışma zamanı yardımcıları | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Süreç yardımcıları | Paylaşılan exec yardımcıları |
  | `plugin-sdk/cli-runtime` | CLI çalışma zamanı yardımcıları | Komut biçimlendirme, beklemeler, sürüm yardımcıları |
  | `plugin-sdk/gateway-runtime` | Gateway yardımcıları | Gateway istemcisi, olay döngüsüne hazır başlatma yardımcısı ve kanal durumu yama yardımcıları |
  | `plugin-sdk/config-runtime` | Kullanımdan kaldırılmış yapılandırma uyumluluğu şimi | `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` ve `config-mutation` tercih edin |
  | `plugin-sdk/telegram-command-config` | Telegram komut yardımcıları | Paketli Telegram sözleşme yüzeyi kullanılamadığında yedeğe geçişte kararlı Telegram komut doğrulama yardımcıları |
  | `plugin-sdk/approval-runtime` | Onay istemi yardımcıları | Exec/Plugin onay yükü, onay yeteneği/profil yardımcıları, yerel onay yönlendirme/çalışma zamanı yardımcıları ve yapılandırılmış onay görüntüleme yolu biçimlendirme |
  | `plugin-sdk/approval-auth-runtime` | Onay kimlik doğrulama yardımcıları | Onaylayan çözümleme, aynı sohbet eylemi kimlik doğrulaması |
  | `plugin-sdk/approval-client-runtime` | Onay istemcisi yardımcıları | Yerel exec onay profili/filtre yardımcıları |
  | `plugin-sdk/approval-delivery-runtime` | Onay teslimatı yardımcıları | Yerel onay yeteneği/teslimat bağdaştırıcıları |
  | `plugin-sdk/approval-gateway-runtime` | Onay Gateway yardımcıları | Paylaşılan onay Gateway çözümleme yardımcısı |
  | `plugin-sdk/approval-handler-adapter-runtime` | Onay bağdaştırıcısı yardımcıları | Sıcak kanal giriş noktaları için hafif yerel onay bağdaştırıcısı yükleme yardımcıları |
  | `plugin-sdk/approval-handler-runtime` | Onay işleyicisi yardımcıları | Daha geniş onay işleyicisi çalışma zamanı yardımcıları; yeterli olduklarında daha dar bağdaştırıcı/Gateway yüzeylerini tercih edin |
  | `plugin-sdk/approval-native-runtime` | Onay hedefi yardımcıları | Yerel onay hedefi/hesap bağlama yardımcıları |
  | `plugin-sdk/approval-reply-runtime` | Onay yanıtı yardımcıları | Exec/Plugin onay yanıtı yükü yardımcıları |
  | `plugin-sdk/channel-runtime-context` | Kanal çalışma zamanı bağlamı yardımcıları | Genel kanal çalışma zamanı bağlamı kaydet/getir/izle yardımcıları |
  | `plugin-sdk/security-runtime` | Güvenlik yardımcıları | Paylaşılan güven, DM geçitleme, kök sınırlı dosya/yol yardımcıları, dış içerik ve gizli bilgi toplama yardımcıları |
  | `plugin-sdk/ssrf-policy` | SSRF ilkesi yardımcıları | Ana makine izin listesi ve özel ağ ilkesi yardımcıları |
  | `plugin-sdk/ssrf-runtime` | SSRF çalışma zamanı yardımcıları | Sabitlenmiş gönderici, korumalı fetch, SSRF ilkesi yardımcıları |
  | `plugin-sdk/system-event-runtime` | Sistem olayı yardımcıları | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat yardımcıları | Heartbeat uyandırma, olay ve görünürlük yardımcıları |
  | `plugin-sdk/delivery-queue-runtime` | Teslimat kuyruğu yardımcıları | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Kanal etkinliği yardımcıları | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Tekilleştirme yardımcıları | Bellek içi tekilleştirme önbellekleri |
  | `plugin-sdk/file-access-runtime` | Dosya erişimi yardımcıları | Güvenli yerel dosya/medya yolu yardımcıları |
  | `plugin-sdk/transport-ready-runtime` | Aktarım hazır olma yardımcıları | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Sınırlı önbellek yardımcıları | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Tanılama geçitleme yardımcıları | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hata biçimlendirme yardımcıları | `formatUncaughtError`, `isApprovalNotFoundError`, hata grafiği yardımcıları |
  | `plugin-sdk/fetch-runtime` | Sarılmış fetch/proxy yardımcıları | `resolveFetch`, proxy yardımcıları, EnvHttpProxyAgent seçenek yardımcıları |
  | `plugin-sdk/host-runtime` | Ana makine normalleştirme yardımcıları | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Yeniden deneme yardımcıları | `RetryConfig`, `retryAsync`, ilke çalıştırıcıları |
  | `plugin-sdk/allow-from` | İzin listesi biçimlendirme | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | İzin listesi girdisi eşleme | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Komut geçitleme ve komut yüzeyi yardımcıları | `resolveControlCommandGate`, gönderen yetkilendirme yardımcıları, dinamik bağımsız değişken menüsü biçimlendirme dahil komut kayıt yardımcıları |
  | `plugin-sdk/command-status` | Komut durumu/yardım işleyicileri | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Gizli bilgi girdisi ayrıştırma | Gizli bilgi girdisi yardımcıları |
  | `plugin-sdk/webhook-ingress` | Webhook isteği yardımcıları | Webhook hedef yardımcı programları |
  | `plugin-sdk/webhook-request-guards` | Webhook gövde koruması yardımcıları | İstek gövdesi okuma/sınır yardımcıları |
  | `plugin-sdk/reply-runtime` | Paylaşılan yanıt çalışma zamanı | Gelen gönderim, Heartbeat, yanıt planlayıcı, parçalama |
  | `plugin-sdk/reply-dispatch-runtime` | Dar kapsamlı yanıt gönderim yardımcıları | Sonlandırma, sağlayıcı gönderimi ve konuşma etiketi yardımcıları |
  | `plugin-sdk/reply-history` | Yanıt geçmişi yardımcıları | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Yanıt başvurusu planlama | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Yanıt parçası yardımcıları | Metin/markdown parçalama yardımcıları |
  | `plugin-sdk/session-store-runtime` | Oturum deposu yardımcıları | Depo yolu + güncellenme zamanı yardımcıları |
  | `plugin-sdk/state-paths` | Durum yolu yardımcıları | Durum ve OAuth dizini yardımcıları |
  | `plugin-sdk/routing` | Yönlendirme/oturum anahtarı yardımcıları | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, oturum anahtarı normalleştirme yardımcıları |
  | `plugin-sdk/status-helpers` | Kanal durumu yardımcıları | Kanal/hesap durumu özeti oluşturucuları, çalışma zamanı durumu varsayılanları, sorun meta verisi yardımcıları |
  | `plugin-sdk/target-resolver-runtime` | Hedef çözümleyici yardımcıları | Paylaşılan hedef çözümleyici yardımcıları |
  | `plugin-sdk/string-normalization-runtime` | Dize normalleştirme yardımcıları | Slug/dize normalleştirme yardımcıları |
  | `plugin-sdk/request-url` | İstek URL'si yardımcıları | İstek benzeri girdilerden dize URL'leri çıkarın |
  | `plugin-sdk/run-command` | Zamanlanmış komut yardımcıları | Normalleştirilmiş stdout/stderr ile zamanlanmış komut çalıştırıcı |
  | `plugin-sdk/param-readers` | Parametre okuyucuları | Ortak araç/CLI parametre okuyucuları |
  | `plugin-sdk/tool-payload` | Araç yükü çıkarma | Araç sonuç nesnelerinden normalleştirilmiş yükleri çıkarır |
  | `plugin-sdk/tool-send` | Araç gönderim çıkarma | Araç argümanlarından kurallı gönderim hedefi alanlarını çıkarır |
  | `plugin-sdk/temp-path` | Geçici yol yardımcıları | Paylaşılan geçici indirme yolu yardımcıları |
  | `plugin-sdk/logging-core` | Günlükleme yardımcıları | Alt sistem günlükleyici ve gizleme yardımcıları |
  | `plugin-sdk/markdown-table-runtime` | Markdown tablo yardımcıları | Markdown tablo modu yardımcıları |
  | `plugin-sdk/reply-payload` | Mesaj yanıt türleri | Yanıt yükü türleri |
  | `plugin-sdk/provider-setup` | Seçilmiş yerel/kendi kendine barındırılan sağlayıcı kurulum yardımcıları | Kendi kendine barındırılan sağlayıcı keşif/yapılandırma yardımcıları |
  | `plugin-sdk/self-hosted-provider-setup` | Odaklanmış OpenAI uyumlu kendi kendine barındırılan sağlayıcı kurulum yardımcıları | Aynı kendi kendine barındırılan sağlayıcı keşif/yapılandırma yardımcıları |
  | `plugin-sdk/provider-auth-runtime` | Sağlayıcı çalışma zamanı kimlik doğrulama yardımcıları | Çalışma zamanı API anahtarı çözümleme yardımcıları |
  | `plugin-sdk/provider-auth-api-key` | Sağlayıcı API anahtarı kurulum yardımcıları | API anahtarı ilk kullanım/profil yazma yardımcıları |
  | `plugin-sdk/provider-auth-result` | Sağlayıcı kimlik doğrulama sonucu yardımcıları | Standart OAuth kimlik doğrulama sonucu oluşturucu |
  | `plugin-sdk/provider-selection-runtime` | Sağlayıcı seçimi yardımcıları | Yapılandırılmış veya otomatik sağlayıcı seçimi ve ham sağlayıcı yapılandırması birleştirme |
  | `plugin-sdk/provider-env-vars` | Sağlayıcı ortam değişkeni yardımcıları | Sağlayıcı kimlik doğrulama ortam değişkeni arama yardımcıları |
  | `plugin-sdk/provider-model-shared` | Paylaşılan sağlayıcı model/yeniden oynatma yardımcıları | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan yeniden oynatma politikası oluşturucuları, sağlayıcı uç noktası yardımcıları ve model kimliği normalleştirme yardımcıları |
  | `plugin-sdk/provider-catalog-shared` | Paylaşılan sağlayıcı katalog yardımcıları | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Sağlayıcı ilk kullanım yamaları | İlk kullanım yapılandırma yardımcıları |
  | `plugin-sdk/provider-http` | Sağlayıcı HTTP yardımcıları | Ses yazıya dökme çok parçalı form yardımcıları dahil genel sağlayıcı HTTP/uç nokta yetenek yardımcıları |
  | `plugin-sdk/provider-web-fetch` | Sağlayıcı web-fetch yardımcıları | Web-fetch sağlayıcı kayıt/önbellek yardımcıları |
  | `plugin-sdk/provider-web-search-config-contract` | Sağlayıcı web-search yapılandırma yardımcıları | Plugin etkinleştirme bağlantısına ihtiyaç duymayan sağlayıcılar için dar kapsamlı web-search yapılandırma/kimlik bilgisi yardımcıları |
  | `plugin-sdk/provider-web-search-contract` | Sağlayıcı web-search sözleşme yardımcıları | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcıları/alıcıları gibi dar kapsamlı web-search yapılandırma/kimlik bilgisi sözleşme yardımcıları |
  | `plugin-sdk/provider-web-search` | Sağlayıcı web-search yardımcıları | Web-search sağlayıcı kayıt/önbellek/çalışma zamanı yardımcıları |
  | `plugin-sdk/provider-tools` | Sağlayıcı araç/şema uyumluluk yardımcıları | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` ve Gemini şema temizleme + tanılama |
  | `plugin-sdk/provider-usage` | Sağlayıcı kullanım yardımcıları | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` ve diğer sağlayıcı kullanım yardımcıları |
  | `plugin-sdk/provider-stream` | Sağlayıcı akış sarmalayıcı yardımcıları | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
  | `plugin-sdk/provider-transport-runtime` | Sağlayıcı taşıma yardımcıları | Korumalı fetch, taşıma mesajı dönüşümleri ve yazılabilir taşıma olay akışları gibi yerel sağlayıcı taşıma yardımcıları |
  | `plugin-sdk/keyed-async-queue` | Sıralı zaman uyumsuz kuyruk | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Paylaşılan medya yardımcıları | Medya getirme/dönüştürme/depolama yardımcıları, ffprobe destekli video boyutu yoklama ve medya yükü oluşturucuları |
  | `plugin-sdk/media-generation-runtime` | Paylaşılan medya üretimi yardımcıları | Görsel/video/müzik üretimi için paylaşılan yük devretme yardımcıları, aday seçimi ve eksik model mesajlaşması |
  | `plugin-sdk/media-understanding` | Medya anlama yardımcıları | Medya anlama sağlayıcı türleri ve sağlayıcıya yönelik görsel/ses yardımcı dışa aktarımları |
  | `plugin-sdk/text-runtime` | Kullanımdan kaldırılmış geniş metin uyumluluğu dışa aktarımı | `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` ve `logging-core` kullanın |
  | `plugin-sdk/text-chunking` | Metin parçalama yardımcıları | Giden metin parçalama yardımcısı |
  | `plugin-sdk/speech` | Konuşma yardımcıları | Konuşma sağlayıcı türleri ve sağlayıcıya yönelik yönerge, kayıt defteri, doğrulama yardımcıları ve OpenAI uyumlu TTS oluşturucu |
  | `plugin-sdk/speech-core` | Paylaşılan konuşma çekirdeği | Konuşma sağlayıcı türleri, kayıt defteri, yönergeler, normalleştirme |
  | `plugin-sdk/realtime-transcription` | Gerçek zamanlı yazıya dökme yardımcıları | Sağlayıcı türleri, kayıt defteri yardımcıları ve paylaşılan WebSocket oturum yardımcısı |
  | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses yardımcıları | Sağlayıcı türleri, kayıt defteri/çözümleme yardımcıları, köprü oturum yardımcıları, paylaşılan ajan geri konuşma kuyrukları, transkript/olay sağlığı, yankı bastırma ve hızlı bağlam danışma yardımcıları |
  | `plugin-sdk/image-generation` | Görsel üretimi yardımcıları | Görsel üretimi sağlayıcı türleri ve görsel varlık/veri URL yardımcıları ile OpenAI uyumlu görsel sağlayıcı oluşturucu |
  | `plugin-sdk/image-generation-core` | Paylaşılan görsel üretimi çekirdeği | Görsel üretimi türleri, yük devretme, kimlik doğrulama ve kayıt defteri yardımcıları |
  | `plugin-sdk/music-generation` | Müzik üretimi yardımcıları | Müzik üretimi sağlayıcı/istek/sonuç türleri |
  | `plugin-sdk/music-generation-core` | Paylaşılan müzik üretimi çekirdeği | Müzik üretimi türleri, yük devretme yardımcıları, sağlayıcı arama ve model referansı ayrıştırma |
  | `plugin-sdk/video-generation` | Video üretimi yardımcıları | Video üretimi sağlayıcı/istek/sonuç türleri |
  | `plugin-sdk/video-generation-core` | Paylaşılan video üretimi çekirdeği | Video üretimi türleri, yük devretme yardımcıları, sağlayıcı arama ve model referansı ayrıştırma |
  | `plugin-sdk/interactive-runtime` | Etkileşimli yanıt yardımcıları | Etkileşimli yanıt yükü normalleştirme/indirgeme |
  | `plugin-sdk/channel-config-primitives` | Kanal yapılandırma temel öğeleri | Dar kapsamlı kanal yapılandırma şeması temel öğeleri |
  | `plugin-sdk/channel-config-writes` | Kanal yapılandırma yazma yardımcıları | Kanal yapılandırma yazma yetkilendirme yardımcıları |
  | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal başlangıcı | Paylaşılan kanal plugin başlangıç dışa aktarımları |
  | `plugin-sdk/channel-status` | Kanal durumu yardımcıları | Paylaşılan kanal durumu anlık görüntü/özet yardımcıları |
  | `plugin-sdk/allowlist-config-edit` | İzin listesi yapılandırma yardımcıları | İzin listesi yapılandırma düzenleme/okuma yardımcıları |
  | `plugin-sdk/group-access` | Grup erişimi yardımcıları | Paylaşılan grup erişimi karar yardımcıları |
  | `plugin-sdk/direct-dm` | Doğrudan DM yardımcıları | Paylaşılan doğrudan DM kimlik doğrulama/koruma yardımcıları |
  | `plugin-sdk/extension-shared` | Paylaşılan eklenti yardımcıları | Pasif kanal/durum ve ortam proxy yardımcı temel öğeleri |
  | `plugin-sdk/webhook-targets` | Webhook hedef yardımcıları | Webhook hedef kayıt defteri ve rota kurulum yardımcıları |
  | `plugin-sdk/webhook-path` | Kullanımdan kaldırılmış webhook yolu takma adı | `plugin-sdk/webhook-ingress` kullanın |
  | `plugin-sdk/web-media` | Paylaşılan web medya yardımcıları | Uzak/yerel medya yükleme yardımcıları |
  | `plugin-sdk/zod` | Kullanımdan kaldırılmış Zod uyumluluğu yeniden dışa aktarımı | `zod` öğesini doğrudan `zod` paketinden içe aktarın |
  | `plugin-sdk/memory-core` | Paketlenmiş memory-core yardımcıları | Bellek yöneticisi/yapılandırma/dosya/CLI yardımcı yüzeyi |
  | `plugin-sdk/memory-core-engine-runtime` | Bellek motoru çalışma zamanı cephesi | Bellek dizin/arama çalışma zamanı cephesi |
  | `plugin-sdk/memory-core-host-engine-foundation` | Bellek ana makine temel motoru | Bellek ana makine temel motoru dışa aktarımları |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek ana makine embedding motoru | Bellek embedding sözleşmeleri, kayıt defteri erişimi, yerel sağlayıcı ve genel toplu/uzak yardımcılar; somut uzak sağlayıcılar kendi sahibi olan pluginlerde bulunur |
  | `plugin-sdk/memory-core-host-engine-qmd` | Bellek ana makine QMD motoru | Bellek ana makine QMD motoru dışa aktarımları |
  | `plugin-sdk/memory-core-host-engine-storage` | Bellek ana makine depolama motoru | Bellek ana makine depolama motoru dışa aktarımları |
  | `plugin-sdk/memory-core-host-multimodal` | Bellek ana makine çok modlu yardımcıları | Bellek ana makine çok modlu yardımcıları |
  | `plugin-sdk/memory-core-host-query` | Bellek ana makine sorgu yardımcıları | Bellek ana makine sorgu yardımcıları |
  | `plugin-sdk/memory-core-host-secret` | Bellek ana makine gizli bilgi yardımcıları | Bellek ana makine gizli bilgi yardımcıları |
  | `plugin-sdk/memory-core-host-events` | Kullanımdan kaldırılmış bellek olay takma adı | `plugin-sdk/memory-host-events` kullanın |
  | `plugin-sdk/memory-core-host-status` | Bellek ana makine durum yardımcıları | Bellek ana makine durum yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-cli` | Bellek ana makine CLI çalışma zamanı | Bellek ana makine CLI çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-core` | Bellek ana makine çekirdek çalışma zamanı | Bellek ana makine çekirdek çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-files` | Bellek ana makine dosya/çalışma zamanı yardımcıları | Bellek ana makine dosya/çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-host-core` | Bellek ana makine çekirdek çalışma zamanı takma adı | Bellek ana makine çekirdek çalışma zamanı yardımcıları için satıcıdan bağımsız takma ad |
  | `plugin-sdk/memory-host-events` | Bellek ana makine olay günlüğü takma adı | Bellek ana makine olay günlüğü yardımcıları için satıcıdan bağımsız takma ad |
  | `plugin-sdk/memory-host-files` | Kullanımdan kaldırılmış bellek dosya/çalışma zamanı takma adı | `plugin-sdk/memory-core-host-runtime-files` kullanın |
  | `plugin-sdk/memory-host-markdown` | Yönetilen markdown yardımcıları | Belleğe komşu pluginler için paylaşılan yönetilen markdown yardımcıları |
  | `plugin-sdk/memory-host-search` | Active memory arama cephesi | Tembel active-memory arama yöneticisi çalışma zamanı cephesi |
  | `plugin-sdk/memory-host-status` | Kullanımdan kaldırılmış bellek ana makine durum takma adı | `plugin-sdk/memory-core-host-status` kullanın |
  | `plugin-sdk/testing` | Test yardımcı programları | Repo yerelinde kullanımdan kaldırılmış uyumluluk barrel’ı; `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` ve `plugin-sdk/test-fixtures` gibi odaklanmış repo yerel test alt yollarını kullanın |
</Accordion>

Bu tablo kasıtlı olarak tam SDK yüzeyi değil, ortak geçiş alt kümesidir. Derleyici giriş noktası envanteri
`scripts/lib/plugin-sdk-entrypoints.json` içinde bulunur; paket dışa aktarımları herkese açık alt kümeden oluşturulur.

Açıkça belgelenmiş uyumluluk cepheleri, örneğin yayımlanmış `@openclaw/discord@2026.3.13` paketi için korunan kullanım dışı `plugin-sdk/discord` shim’i dışında, ayrılmış yerleşik Plugin yardımcı birleşim noktaları herkese açık SDK dışa aktarım haritasından emekliye ayrıldı. Sahibe özgü yardımcılar, sahibi olan Plugin paketinin içinde yaşar; paylaşılan host davranışı `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` ve `plugin-sdk/plugin-config-runtime` gibi genel SDK sözleşmeleri üzerinden ilerlemelidir.

İşe uyan en dar import’u kullanın. Bir dışa aktarım bulamıyorsanız `src/plugin-sdk/` içindeki kaynağı kontrol edin veya sürdürücülere hangi genel sözleşmenin buna sahip olması gerektiğini sorun.

## Aktif kullanım dışı bırakmalar

Plugin SDK, sağlayıcı sözleşmesi, runtime yüzeyi ve manifest genelinde geçerli olan daha dar kullanım dışı bırakmalar. Her biri bugün hâlâ çalışır, ancak gelecekteki bir major sürümde kaldırılacaktır. Her öğenin altındaki giriş, eski API’yi kanonik yerine eşler.

<AccordionGroup>
  <Accordion title="command-auth yardım oluşturucuları → command-status">
    **Eski (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Yeni (`openclaw/plugin-sdk/command-status`)**: aynı imzalar, aynı
    dışa aktarımlar - yalnızca daha dar alt yoldan import edilir. `command-auth`
    bunları uyumluluk stub’ları olarak yeniden dışa aktarır.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Bahsetme geçitleme yardımcıları → resolveInboundMentionDecision">
    **Eski**: `openclaw/plugin-sdk/channel-inbound` veya
    `openclaw/plugin-sdk/channel-mention-gating` içinden
    `resolveInboundMentionRequirement({ facts, policy })` ve
    `shouldDropInboundForMention(...)`.

    **Yeni**: `resolveInboundMentionDecision({ facts, policy })` - iki ayrı çağrı
    yerine tek bir karar nesnesi döndürür.

    Aşağı yöndeki kanal Plugin’leri (Slack, Discord, Matrix, MS Teams) zaten
    geçiş yaptı.

  </Accordion>

  <Accordion title="Kanal runtime shim’i ve kanal eylemleri yardımcıları">
    `openclaw/plugin-sdk/channel-runtime`, eski kanal Plugin’leri için bir
    uyumluluk shim’idir. Yeni koddan import etmeyin; runtime nesnelerini
    kaydetmek için `openclaw/plugin-sdk/channel-runtime-context` kullanın.

    `openclaw/plugin-sdk/channel-actions` içindeki `channelActions*`
    yardımcıları, ham "actions" kanal dışa aktarımlarıyla birlikte kullanım
    dışıdır. Yetenekleri bunun yerine anlamsal `presentation` yüzeyi üzerinden
    açığa çıkarın - kanal Plugin’leri kabul ettikleri ham eylem adları yerine
    ne render ettiklerini (kartlar, düğmeler, seçimler) bildirir.

  </Accordion>

  <Accordion title="Web arama sağlayıcısı tool() yardımcısı → Plugin üzerinde createTool()">
    **Eski**: `openclaw/plugin-sdk/provider-web-search` içinden `tool()` fabrikası.

    **Yeni**: `createTool(...)` öğesini doğrudan sağlayıcı Plugin üzerinde uygulayın.
    OpenClaw artık araç sarmalayıcısını kaydetmek için SDK yardımcısına ihtiyaç duymaz.

  </Accordion>

  <Accordion title="Düz metin kanal zarfları → BodyForAgent">
    **Eski**: gelen kanal mesajlarından düz bir düz metin prompt zarfı oluşturmak
    için `formatInboundEnvelope(...)` (ve
    `ChannelMessageForAgent.channelEnvelope`).

    **Yeni**: `BodyForAgent` artı yapılandırılmış kullanıcı bağlamı blokları.
    Kanal Plugin’leri yönlendirme metadatasını (thread, konu, reply-to,
    reactions) bir prompt string’ine birleştirmek yerine typed alanlar olarak
    ekler. `formatAgentEnvelope(...)` yardımcısı, sentezlenmiş asistana yönelik
    zarflar için hâlâ desteklenir, ancak gelen düz metin zarfları kaldırılma
    yolundadır.

    Etkilenen alanlar: `inbound_claim`, `message_received` ve `channelEnvelope`
    metnini sonradan işleyen tüm özel kanal Plugin’leri.

  </Accordion>

  <Accordion title="Sağlayıcı keşif türleri → sağlayıcı katalog türleri">
    Dört keşif türü alias’ı artık katalog dönemi türleri üzerinde ince
    sarmalayıcılardır:

    | Eski alias                | Yeni tür                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Ayrıca eski `ProviderCapabilities` statik torbası - sağlayıcı Plugin’leri
    statik bir nesne yerine `buildReplayPolicy`, `normalizeToolSchemas` ve
    `wrapStreamFn` gibi açık sağlayıcı hook’larını kullanmalıdır.

  </Accordion>

  <Accordion title="Düşünme politikası hook’ları → resolveThinkingProfile">
    **Eski** (`ProviderThinkingPolicy` üzerinde üç ayrı hook):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` ve
    `resolveDefaultThinkingLevel(ctx)`.

    **Yeni**: kanonik `id`, isteğe bağlı `label` ve sıralanmış seviye listesiyle
    bir `ProviderThinkingProfile` döndüren tek bir `resolveThinkingProfile(ctx)`.
    OpenClaw, eskimiş saklanan değerleri profil sırasına göre otomatik olarak
    düşürür.

    Üç yerine bir hook uygulayın. Eski hook’lar kullanım dışı bırakma penceresi
    boyunca çalışmaya devam eder, ancak profil sonucuyla birleştirilmez.

  </Accordion>

  <Accordion title="Harici OAuth sağlayıcı fallback’i → contracts.externalAuthProviders">
    **Eski**: sağlayıcıyı Plugin manifest’inde bildirmeden
    `resolveExternalOAuthProfiles(...)` uygulamak.

    **Yeni**: Plugin manifest’inde `contracts.externalAuthProviders` bildirin
    **ve** `resolveExternalAuthProfiles(...)` uygulayın. Eski "auth fallback"
    yolu runtime’da bir uyarı yayar ve kaldırılacaktır.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Sağlayıcı env-var araması → setup.providers[].envVars">
    **Eski** manifest alanı: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Yeni**: aynı env-var aramasını manifest üzerindeki `setup.providers[].envVars`
    içine yansıtın. Bu, setup/status env metadatasını tek bir yerde birleştirir
    ve env-var aramalarını yanıtlamak için Plugin runtime’ını başlatma ihtiyacını
    ortadan kaldırır.

    `providerAuthEnvVars`, kullanım dışı bırakma penceresi kapanana kadar bir
    uyumluluk adaptörü üzerinden desteklenmeye devam eder.

  </Accordion>

  <Accordion title="Bellek Plugin kaydı → registerMemoryCapability">
    **Eski**: üç ayrı çağrı -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Yeni**: memory-state API üzerinde tek çağrı -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Aynı slot’lar, tek kayıt çağrısı. Eklemeli bellek yardımcıları
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) etkilenmez.

  </Accordion>

  <Accordion title="Subagent session messages türleri yeniden adlandırıldı">
    `src/plugins/runtime/types.ts` içinden hâlâ dışa aktarılan iki eski tür alias’ı:

    | Eski                          | Yeni                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Runtime yöntemi `readSession`, `getSessionMessages` lehine kullanım dışıdır.
    Aynı imza; eski yöntem yeni yönteme çağrı geçirir.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Eski**: `runtime.tasks.flow` (tekil), canlı bir görev akışı erişimcisi döndürürdü.

    **Yeni**: `runtime.tasks.managedFlows`, bir akıştan alt görevler oluşturan,
    güncelleyen, iptal eden veya çalıştıran Plugin’ler için yönetilen TaskFlow
    mutasyon runtime’ını tutar. Plugin yalnızca DTO tabanlı okumalar
    gerektiriyorsa `runtime.tasks.flows` kullanın.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Gömülü extension fabrikaları → agent araç sonucu middleware’i">
    Yukarıdaki "Nasıl geçilir → Pi araç sonucu extension’larını middleware’e
    geçirme" bölümünde ele alındı. Tamlık için burada da yer alır: kaldırılan
    yalnızca Pi’ye özgü `api.registerEmbeddedExtensionFactory(...)` yolu,
    `contracts.agentToolResultMiddleware` içinde açık bir runtime listesiyle
    `api.registerAgentToolResultMiddleware(...)` tarafından değiştirilir.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias’ı → OpenClawConfig">
    `openclaw/plugin-sdk` içinden yeniden dışa aktarılan `OpenClawSchemaType`
    artık `OpenClawConfig` için tek satırlık bir alias’tır. Kanonik adı tercih edin.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Extension düzeyindeki kullanım dışı bırakmalar (`extensions/` altındaki
yerleşik kanal/sağlayıcı Plugin’lerinin içinde), kendi `api.ts` ve
`runtime-api.ts` barrel’ları içinde izlenir. Üçüncü taraf Plugin sözleşmelerini
etkilemez ve burada listelenmez. Bir yerleşik Plugin’in yerel barrel’ını
doğrudan tüketiyorsanız yükseltmeden önce o barrel’daki kullanım dışı bırakma
yorumlarını okuyun.
</Note>

## Kaldırma zaman çizelgesi

| Ne zaman              | Ne olur                                                                 |
| --------------------- | ----------------------------------------------------------------------- |
| **Şimdi**             | Kullanım dışı yüzeyler runtime uyarıları yayar                          |
| **Sonraki major sürüm** | Kullanım dışı yüzeyler kaldırılacak; hâlâ bunları kullanan Plugin’ler başarısız olacak |

Tüm core Plugin’ler zaten geçirildi. Harici Plugin’ler sonraki major sürümden
önce geçiş yapmalıdır.

## Uyarıları geçici olarak bastırma

Geçiş üzerinde çalışırken bu ortam değişkenlerini ayarlayın:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Bu geçici bir kaçış kapağıdır, kalıcı bir çözüm değildir.

## İlgili

- [Başlarken](/tr/plugins/building-plugins) - ilk Plugin’inizi oluşturun
- [SDK Genel Bakış](/tr/plugins/sdk-overview) - tam alt yol import başvurusu
- [Kanal Plugin’leri](/tr/plugins/sdk-channel-plugins) - kanal Plugin’leri oluşturma
- [Sağlayıcı Plugin’leri](/tr/plugins/sdk-provider-plugins) - sağlayıcı Plugin’leri oluşturma
- [Plugin İç Yapısı](/tr/plugins/architecture) - mimariye derinlemesine bakış
- [Plugin Manifest’i](/tr/plugins/manifest) - manifest şeması başvurusu
