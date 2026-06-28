---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED uyarısını görüyorsunuz
    - OPENCLAW_EXTENSION_API_DEPRECATED uyarısını görüyorsunuz
    - OpenClaw 2026.4.25 öncesinde api.registerEmbeddedExtensionFactory kullandınız
    - Bir Plugin'i modern Plugin mimarisine güncelliyorsunuz
    - Harici bir OpenClaw Plugin'inin bakımını yapıyorsunuz
sidebarTitle: Migrate to SDK
summary: Eski geriye dönük uyumluluk katmanından modern Plugin SDK'ya geçiş yapın
title: Plugin SDK geçişi
x-i18n:
    generated_at: "2026-06-28T01:04:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9061b31567cbd24196458ecb9af1cb1b0351f789a136ea26951c8fb7e576cf08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw, geniş bir geriye dönük uyumluluk katmanından odaklı, belgelenmiş import'lara sahip modern bir Plugin
mimarisine geçti. Plugin'iniz yeni mimariden önce oluşturulduysa, bu kılavuz geçiş yapmanıza yardımcı olur.

## Neler değişiyor

Eski Plugin sistemi, Plugin'lerin ihtiyaç duydukları her şeyi tek bir giriş noktasından import etmesine izin veren
iki geniş açık yüzey sağlıyordu:

- **`openclaw/plugin-sdk/compat`** - düzinelerce yardımcıyı yeniden export eden tek bir import.
  Yeni Plugin mimarisi oluşturulurken eski hook tabanlı Plugin'lerin çalışmaya devam etmesini sağlamak için
  tanıtıldı.
- **`openclaw/plugin-sdk/infra-runtime`** - sistem olaylarını, Heartbeat durumunu, teslim kuyruklarını,
  fetch/proxy yardımcılarını, dosya yardımcılarını, onay türlerini ve ilgisiz yardımcıları karıştıran geniş
  bir runtime yardımcı barrel'i.
- **`openclaw/plugin-sdk/config-runtime`** - geçiş penceresi sırasında kullanımdan kaldırılmış doğrudan
  yükleme/yazma yardımcılarını hâlâ taşıyan geniş bir config uyumluluk barrel'i.
- **`openclaw/extension-api`** - Plugin'lere gömülü agent runner gibi host tarafı yardımcılara doğrudan erişim veren
  bir köprü.
- **`api.registerEmbeddedExtensionFactory(...)`** - `tool_result` gibi gömülü runner olaylarını gözlemleyebilen,
  kaldırılmış ve yalnızca gömülü runner'a özgü paketlenmiş extension hook'u.

Geniş import yüzeyleri artık **kullanımdan kaldırıldı**. Runtime'da hâlâ çalışırlar,
ancak yeni Plugin'ler bunları kullanmamalıdır ve mevcut Plugin'ler, bir sonraki majör sürüm bunları kaldırmadan önce
geçiş yapmalıdır. Yalnızca gömülü runner'a özgü extension factory kayıt API'si kaldırıldı; bunun yerine tool-result middleware kullanın.

OpenClaw, bir yedeği tanıtan aynı değişiklikte belgelenmiş Plugin davranışını kaldırmaz veya yeniden yorumlamaz.
Sözleşmeyi bozan değişiklikler önce bir uyumluluk adaptöründen, tanılardan, dokümanlardan ve bir kullanımdan kaldırma penceresinden
geçmelidir. Bu; SDK import'ları, manifest alanları, setup API'leri, hook'lar ve runtime
kayıt davranışı için geçerlidir.

<Warning>
  Geriye dönük uyumluluk katmanı gelecekteki bir majör sürümde kaldırılacak.
  Bu yüzeylerden hâlâ import yapan Plugin'ler, bu gerçekleştiğinde bozulacak.
  Eski gömülü extension factory kayıtları zaten artık yüklenmiyor.
</Warning>

## Bu neden değişti

Eski yaklaşım sorunlara neden oldu:

- **Yavaş başlangıç** - tek bir yardımcıyı import etmek düzinelerce ilgisiz modülü yüklüyordu
- **Döngüsel bağımlılıklar** - geniş yeniden export'lar import döngüleri oluşturmayı kolaylaştırıyordu
- **Belirsiz API yüzeyi** - hangi export'ların kararlı, hangilerinin internal olduğunu anlamanın yolu yoktu

Modern Plugin SDK bunu düzeltir: her import yolu (`openclaw/plugin-sdk/\<subpath\>`)
net bir amacı ve belgelenmiş sözleşmesi olan küçük, kendi kendine yeterli bir modüldür.

Paketlenmiş kanallar için eski sağlayıcı kolaylık seam'leri de kaldırıldı.
Kanal markalı yardımcı seam'ler kararlı Plugin sözleşmeleri değil, özel mono-repo kısayollarıydı.
Bunun yerine dar generic SDK alt yollarını kullanın. Paketlenmiş Plugin çalışma alanı içinde,
sağlayıcıya ait yardımcıları o Plugin'in kendi `api.ts` veya `runtime-api.ts` içinde tutun.

Mevcut paketlenmiş sağlayıcı örnekleri:

- Anthropic, Claude'a özgü stream yardımcılarını kendi `api.ts` /
  `contract-api.ts` seam'inde tutar
- OpenAI, sağlayıcı builder'larını, varsayılan model yardımcılarını ve realtime sağlayıcı
  builder'larını kendi `api.ts` içinde tutar
- OpenRouter, sağlayıcı builder'ını ve onboarding/config yardımcılarını kendi
  `api.ts` içinde tutar

## Talk ve gerçek zamanlı ses geçiş planı

Gerçek zamanlı ses, telefon, toplantı ve tarayıcı Talk kodu,
yüzey yerel turn defter tutma mantığından `openclaw/plugin-sdk/realtime-voice` tarafından export edilen
paylaşılan bir Talk oturum denetleyicisine taşınıyor. Yeni denetleyici ortak Talk
olay zarfını, etkin turn durumunu, yakalama durumunu, çıktı sesi durumunu, yakın
olay geçmişini ve eski turn reddini sahiplenir. Sağlayıcı Plugin'leri
vendor'a özgü gerçek zamanlı oturumları sahiplenmeye devam etmelidir; yüzey Plugin'leri yakalama,
oynatma, telefon ve toplantı özel durumlarını sahiplenmeye devam etmelidir.

Bu Talk geçişi bilinçli olarak temiz ve kırıcıdır:

1. Paylaşılan denetleyici/runtime ilkel yapılarını
   `plugin-sdk/realtime-voice` içinde tutun.
2. Paketlenmiş yüzeyleri paylaşılan denetleyiciye taşıyın: tarayıcı relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime ve yerel push-to-talk.
3. Eski Talk RPC ailelerini nihai `talk.session.*` ve
   `talk.client.*` API ile değiştirin.
4. Gateway `hello-ok.features.events` içinde tek bir canlı Talk olay kanalı
   duyurun: `talk.event`.
5. Eski realtime HTTP endpoint'ini ve request-time instruction override yolunu
   silin.

Yeni kod, düşük seviyeli bir adapter veya test fixture'ı uygulamıyorsa
`createTalkEventSequencer(...)` öğesini doğrudan çağırmamalıdır. Paylaşılan denetleyiciyi tercih edin;
böylece turn kapsamlı olaylar turn id olmadan yayımlanamaz, eski `turnEnd` /
`turnCancel` çağrıları daha yeni etkin turn'ü temizleyemez ve çıktı sesi lifecycle
olayları telefon, toplantılar, tarayıcı relay, managed-room
handoff ve yerel Talk istemcileri arasında tutarlı kalır.

Hedef public API şekli şöyledir:

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

Tarayıcıya ait WebRTC/provider-websocket oturumları `talk.client.create` kullanır,
çünkü tarayıcı sağlayıcı müzakeresini ve medya transport'unu sahiplenirken
Gateway kimlik bilgilerini, talimatları ve tool politikasını sahiplenir. `talk.session.*`,
gateway-relay realtime, gateway-relay transkripsiyon ve managed-room yerel STT/TTS oturumları için
ortak Gateway tarafından yönetilen yüzeydir.

Realtime seçicileri `talk.provider` /
`talk.providers` yanına yerleştiren eski config'ler `openclaw doctor --fix` ile onarılmalıdır; runtime Talk,
konuşma/TTS sağlayıcı config'ini realtime sağlayıcı config'i olarak yeniden yorumlamaz.

Desteklenen `talk.session.create` kombinasyonları bilinçli olarak küçüktür:

| Mod            | Transport       | Brain           | Sahip              | Notlar                                                                                                             |
| -------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Gateway üzerinden köprülenen tam çift yönlü sağlayıcı sesi; tool çağrıları agent-consult tool'u üzerinden yönlendirilir. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Yalnızca streaming STT; çağıranlar giriş sesi gönderir ve transcript olayları alır.                                |
| `stt-tts`       | `managed-room`  | `agent-consult` | Yerel/client oda   | Client'ın yakalama/oynatmayı, Gateway'in ise turn durumunu sahiplediği push-to-talk ve walkie-talkie tarzı odalar. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Yerel/client oda   | Gateway tool actions'ı doğrudan çalıştıran güvenilir birinci taraf yüzeyler için yalnızca admin oda modu.          |

Kaldırılan yöntem haritası:

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

Birleşik kontrol sözlüğü de bilinçli olarak dardır:

  | Yöntem                          | Geçerli olduğu yer                                      | Sözleşme                                                                                                                                                                                                            |
  | ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Aynı Gateway bağlantısının sahibi olduğu sağlayıcı oturumuna base64 PCM ses parçası ekleyin.                                                                                                                       |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Yönetilen oda kullanıcı turunu başlatın.                                                                                                                                                                           |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Eski tur doğrulamasından sonra etkin turu sonlandırın.                                                                                                                                                             |
  | `talk.session.cancelTurn`       | tüm Gateway sahipli oturumlar                           | Bir tur için etkin yakalama/sağlayıcı/ajan/TTS çalışmasını iptal edin.                                                                                                                                             |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Kullanıcı turunu mutlaka sonlandırmadan asistan ses çıkışını durdurun.                                                                                                                                             |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Relay tarafından yayılan sağlayıcı araç çağrısını tamamlayın; ara çıktı için `options.willContinue` veya çağrıyı başka bir asistan yanıtı olmadan karşılamak için `options.suppressResponse` geçirin. |
  | `talk.session.steer`            | ajan destekli Talk oturumları                           | Talk oturumundan çözümlenen etkin gömülü çalışmaya sözlü `status`, `steer`, `cancel` veya `followup` denetimi gönderin.                                                                                           |
  | `talk.session.close`            | tüm birleşik oturumlar                                  | Relay oturumlarını durdurun veya yönetilen oda durumunu geri alın, ardından birleşik oturum kimliğini unutun.                                                                                                      |

  Bunun çalışması için çekirdeğe sağlayıcıya veya platforma özel durumlar eklemeyin.
  Talk oturum semantiğinin sahibi çekirdektir. Sağlayıcı Plugin’leri satıcı oturumu kurulumunun sahibidir.
  Sesli arama ve Google Meet telefon/ toplantı bağdaştırıcılarının sahibidir. Tarayıcı ve yerel
  uygulamalar cihaz yakalama/oynatma kullanıcı deneyiminin sahibidir.

  ## Uyumluluk politikası

  Harici Plugin’ler için uyumluluk çalışması şu sırayı izler:

  1. yeni sözleşmeyi ekleyin
  2. eski davranışı bir uyumluluk bağdaştırıcısı üzerinden bağlı tutun
  3. eski yolu ve yerine geçen yolu adlandıran bir tanılama veya uyarı yayımlayın
  4. testlerde iki yolu da kapsayın
  5. kullanımdan kaldırmayı ve geçiş yolunu belgeleyin
  6. yalnızca duyurulan geçiş penceresinden sonra, genellikle büyük bir sürümde kaldırın

  Bakımcılar mevcut geçiş kuyruğunu
  `pnpm plugins:boundary-report` ile denetleyebilir. Kompakt sayımlar için
  `pnpm plugins:boundary-report:summary`, tek bir Plugin veya uyumluluk sahibi için
  `--owner <id>` ve CI kapısının süresi gelen uyumluluk kayıtları, sahipler arası ayrılmış SDK içe aktarımları veya kullanılmayan ayrılmış SDK alt yolları nedeniyle başarısız olması gerektiğinde
  `pnpm plugins:boundary-report:ci` kullanın. Rapor, kullanımdan kaldırılmış
  uyumluluk kayıtlarını kaldırma tarihine göre gruplar, yerel kod/belge başvurularını sayar,
  sahipler arası ayrılmış SDK içe aktarımlarını ortaya çıkarır ve özel
  memory-host SDK köprüsünü özetler; böylece uyumluluk temizliği geçici aramalara
  dayanmak yerine açık kalır. Ayrılmış SDK alt yollarının izlenen sahip kullanımı olmalıdır;
  kullanılmayan ayrılmış yardımcı dışa aktarımları genel SDK’dan kaldırılmalıdır.

  Bir manifest alanı hâlâ kabul ediliyorsa, Plugin yazarları belgeler ve tanılamalar aksini söyleyene kadar
  onu kullanmaya devam edebilir. Yeni kod belgelenmiş yerine geçen yolu tercih etmelidir,
  ancak mevcut Plugin’ler olağan küçük
  sürümler sırasında bozulmamalıdır.

  ## Nasıl geçiş yapılır

  <Steps>
  <Step title="Çalışma zamanı yapılandırması yükleme/yazma yardımcılarını geçirin">
    Paketli Plugin’ler
    `api.runtime.config.loadConfig()` ve
    `api.runtime.config.writeConfigFile(...)` çağrılarını doğrudan yapmayı bırakmalıdır. Etkin çağrı yoluna
    zaten geçirilmiş yapılandırmayı tercih edin. Geçerli süreç anlık görüntüsüne ihtiyaç duyan
    uzun ömürlü işleyiciler `api.runtime.config.current()` kullanabilir. Uzun ömürlü
    ajan araçları, yapılandırma yazımından önce oluşturulan bir araç hâlâ yenilenmiş
    çalışma zamanı yapılandırmasını görebilsin diye `execute` içinde araç bağlamının
    `ctx.getRuntimeConfig()` yöntemini kullanmalıdır.

    Yapılandırma yazımları işlemsel yardımcılar üzerinden geçmeli ve bir
    yazım sonrası politikası seçmelidir:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Çağıran, değişikliğin temiz bir gateway yeniden başlatması gerektirdiğini bildiğinde
    `afterWrite: { mode: "restart", reason: "..." }` kullanın ve
    `afterWrite: { mode: "none", reason: "..." }` yalnızca çağıran devam işinin sahibi olduğunda
    ve yeniden yükleme planlayıcısını bilinçli olarak bastırmak istediğinde kullanın.
    Mutasyon sonuçları testler ve günlükleme için tipli bir `followUp` özeti içerir;
    yeniden başlatmayı uygulamaktan veya zamanlamaktan gateway sorumlu kalır.
    `loadConfig` ve `writeConfigFile`, geçiş penceresi sırasında harici Plugin’ler için kullanımdan kaldırılmış uyumluluk
    yardımcıları olarak kalır ve `runtime-config-load-write` uyumluluk koduyla
    bir kez uyarır. Paketli Plugin’ler ve repo
    çalışma zamanı kodu,
    `pnpm check:deprecated-api-usage` ve
    `pnpm check:no-runtime-action-load-config` içindeki tarayıcı korumalarıyla korunur: yeni üretim Plugin kullanımı
    doğrudan başarısız olur, doğrudan yapılandırma yazımları başarısız olur, gateway sunucu yöntemleri
    istek çalışma zamanı anlık görüntüsünü kullanmalıdır, çalışma zamanı kanal gönderme/eylem/istemci yardımcıları
    yapılandırmayı kendi sınırlarından almalıdır ve uzun ömürlü çalışma zamanı modüllerinin
    izin verilen ortam `loadConfig()` çağrısı sıfırdır.

    Yeni Plugin kodu ayrıca geniş
    `openclaw/plugin-sdk/config-runtime` uyumluluk barrel’ını içe aktarmaktan kaçınmalıdır. İşe uyan dar
    SDK alt yolunu kullanın:

    | İhtiyaç | İçe aktarma |
    | --- | --- |
    | `OpenClawConfig` gibi yapılandırma tipleri | `openclaw/plugin-sdk/config-contracts` |
    | Zaten yüklenmiş yapılandırma doğrulamaları ve Plugin giriş yapılandırması araması | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Geçerli çalışma zamanı anlık görüntüsü okumaları | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Yapılandırma yazımları | `openclaw/plugin-sdk/config-mutation` |
    | Oturum deposu yardımcıları | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown tablo yapılandırması | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Grup ilkesi çalışma zamanı yardımcıları | `openclaw/plugin-sdk/runtime-group-policy` |
    | Gizli girdi çözümleme | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model/oturum geçersiz kılmaları | `openclaw/plugin-sdk/model-session-runtime` |

    Paketli Plugin’ler ve testleri, içe aktarımlar ve mock’lar ihtiyaç duydukları davranışa yerel kalsın diye geniş
    barrel’a karşı tarayıcı koruması altındadır. Geniş
    barrel harici uyumluluk için hâlâ vardır, ancak yeni kod ona
    bağımlı olmamalıdır.

  </Step>

  <Step title="Gömülü araç sonucu uzantılarını ara yazılıma geçirin">
    Paketli Plugin’ler, yalnızca gömülü çalıştırıcıya özgü
    `api.registerEmbeddedExtensionFactory(...)` araç sonucu işleyicilerini
    çalışma zamanından bağımsız ara yazılımla değiştirmelidir.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Plugin manifestini aynı anda güncelleyin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Yüklü Plugin’ler, açıkça etkinleştirildiklerinde ve hedeflenen her çalışma zamanını
    `contracts.agentToolResultMiddleware` içinde beyan ettiklerinde araç sonucu ara yazılımı da kaydedebilir.
    Beyan edilmemiş yüklü ara yazılım
    kayıtları reddedilir.

  </Step>

  <Step title="Onaya özgü işleyicileri yetenek olgularına geçirin">
    Onay destekli kanal Plugin’leri artık yerel onay davranışını
    `approvalCapability.nativeRuntime` ve paylaşılan çalışma zamanı bağlamı kayıt defteri üzerinden ortaya koyar.

    Temel değişiklikler:

    - `approvalCapability.handler.loadRuntime(...)` yerine
      `approvalCapability.nativeRuntime` kullanın
    - Onaya özgü kimlik doğrulama/teslimatı eski `plugin.auth` /
      `plugin.approvals` bağlantısından çıkarıp `approvalCapability` üzerine taşıyın
    - `ChannelPlugin.approvals` genel kanal Plugin
      sözleşmesinden kaldırıldı; teslimat/yerel/render alanlarını `approvalCapability` üzerine taşıyın
    - `plugin.auth` yalnızca kanal oturum açma/oturum kapatma akışları için kalır; buradaki onay kimlik doğrulama
      hook’ları artık çekirdek tarafından okunmaz
    - İstemciler, token’lar veya Bolt
      uygulamaları gibi kanal sahipli çalışma zamanı nesnelerini `openclaw/plugin-sdk/channel-runtime-context` üzerinden kaydedin
    - Yerel onay işleyicilerinden Plugin sahipli yeniden yönlendirme bildirimleri göndermeyin;
      çekirdek artık gerçek teslimat sonuçlarından yönlendirildiği yer bildirimlerinin sahibidir
    - `channelRuntime` değerini `createChannelManager(...)` içine geçirirken,
      gerçek bir `createPluginRuntime().channel` yüzeyi sağlayın. Kısmi stub’lar reddedilir.

    Geçerli onay yeteneği
    düzeni için `/plugins/sdk-channel-plugins` sayfasına bakın.

  </Step>

  <Step title="Windows wrapper fallback davranışını denetleyin">
    Plugin’iniz `openclaw/plugin-sdk/windows-spawn` kullanıyorsa, çözülmemiş Windows
    `.cmd`/`.bat` wrapper’ları artık açıkça
    `allowShellFallback: true` geçirmediğiniz sürece kapalı başarısız olur.

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

    Çağıranınız bilinçli olarak shell fallback’e dayanmıyorsa,
    `allowShellFallback` ayarlamayın ve bunun yerine fırlatılan hatayı işleyin.

  </Step>

  <Step title="Kullanımdan kaldırılmış içe aktarımları bulun">
    Plugin’inizde kullanımdan kaldırılmış iki yüzeyden birinden yapılan içe aktarımları arayın:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Odaklı içe aktarımlarla değiştirin">
    Eski yüzeyden her dışa aktarım belirli bir modern içe aktarma yoluna eşlenir:

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

    Ana makine tarafı yardımcılar için doğrudan içe aktarmak yerine enjekte edilen Plugin çalışma zamanını kullanın:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Aynı kalıp diğer eski bridge yardımcıları için de geçerlidir:

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

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` dış uyumluluk için hâlâ mevcuttur,
    ancak yeni kod gerçekten ihtiyaç duyduğu odaklanmış yardımcı yüzeyi içe
    aktarmalıdır:

    | İhtiyaç | İçe aktarma |
    | --- | --- |
    | Sistem olay kuyruğu yardımcıları | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat uyandırma, olay ve görünürlük yardımcıları | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Bekleyen teslim kuyruğunu boşaltma | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Kanal etkinliği telemetrisi | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Bellek içi tekilleştirme önbellekleri | `openclaw/plugin-sdk/dedupe-runtime` |
    | Güvenli yerel dosya/medya yolu yardımcıları | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher farkındalıklı fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy ve korumalı fetch yardımcıları | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF dispatcher ilke türleri | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Onay isteği/çözüm türleri | `openclaw/plugin-sdk/approval-runtime` |
    | Onay yanıtı payload ve komut yardımcıları | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Hata biçimlendirme yardımcıları | `openclaw/plugin-sdk/error-runtime` |
    | Taşıma hazır olma beklemeleri | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Güvenli token yardımcıları | `openclaw/plugin-sdk/secure-random-runtime` |
    | Sınırlı eşzamansız görev eşzamanlılığı | `openclaw/plugin-sdk/concurrency-runtime` |
    | Sayısal zorlama | `openclaw/plugin-sdk/number-runtime` |
    | Sürece yerel eşzamansız kilit | `openclaw/plugin-sdk/async-lock-runtime` |
    | Dosya kilitleri | `openclaw/plugin-sdk/file-lock` |

    Paketle gelen plugin'ler `infra-runtime` kullanımına karşı tarayıcıyla
    korunur; bu nedenle repo kodu geniş barrel'a geri dönemez.

  </Step>

  <Step title="Migrate channel route helpers">
    Yeni kanal route kodu `openclaw/plugin-sdk/channel-route` kullanmalıdır.
    Eski route-key ve comparable-target adları geçiş aralığında uyumluluk
    alias'ları olarak kalır, ancak yeni plugin'ler davranışı doğrudan
    tanımlayan route adlarını kullanmalıdır:

    | Eski yardımcı | Modern yardımcı |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Modern route yardımcıları `{ channel, to, accountId, threadId }` değerlerini
    yerel onaylar, yanıt bastırma, gelen tekilleştirme, Cron teslimi ve oturum
    yönlendirmesi genelinde tutarlı biçimde normalleştirir.

    `ChannelMessagingAdapter.parseExplicitTarget` için yeni kullanım veya
    parser destekli yüklü-route yardımcıları (`parseExplicitTargetForLoadedChannel`
    ya da `resolveRouteTargetForLoadedChannel`) ya da
    `plugin-sdk/channel-route` içinden `resolveChannelRouteTargetWithParser(...)`
    eklemeyin. Bu hook'lar kullanımdan kaldırılmıştır ve yalnızca geçiş
    aralığında eski plugin'ler için kalır. Yeni kanal plugin'leri hedef kimliği
    normalleştirmesi ve dizin-bulunamadı fallback'i için
    `messaging.targetResolver.resolveTarget(...)`, core erken bir eş türüne
    ihtiyaç duyduğunda `messaging.inferTargetChatType(...)` ve sağlayıcıya
    özgü oturum ve thread kimliği için `messaging.resolveOutboundSessionRoute(...)`
    kullanmalıdır.

  </Step>

  <Step title="Build and test">
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
  | `plugin-sdk/plugin-entry` | Kanonik plugin giriş yardımcısı | `definePluginEntry` |
  | `plugin-sdk/core` | Kanal giriş tanımları/oluşturucuları için eski şemsiye yeniden dışa aktarımı | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Kök yapılandırma şeması dışa aktarımı | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Tek sağlayıcılı giriş yardımcısı | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Odaklanmış kanal giriş tanımları ve oluşturucuları | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları | Kurulum çeviricisi, izin listesi istemleri, kurulum durumu oluşturucuları |
  | `plugin-sdk/setup-runtime` | Kurulum zamanı çalışma zamanı yardımcıları | `createSetupTranslator`, içe aktarma açısından güvenli kurulum yama bağdaştırıcıları, arama notu yardımcıları, `promptResolvedAllowFrom`, `splitSetupEntries`, yetkilendirilmiş kurulum proxy'leri |
  | `plugin-sdk/setup-adapter-runtime` | Kullanımdan kaldırılmış kurulum bağdaştırıcısı takma adı | `plugin-sdk/setup-runtime` kullanın |
  | `plugin-sdk/setup-tools` | Kurulum araçları yardımcıları | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Çoklu hesap yardımcıları | Hesap listesi/yapılandırma/eylem kapısı yardımcıları |
  | `plugin-sdk/account-id` | Hesap kimliği yardımcıları | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalleştirmesi |
  | `plugin-sdk/account-resolution` | Hesap arama yardımcıları | Hesap arama + varsayılana geri dönüş yardımcıları |
  | `plugin-sdk/account-helpers` | Dar kapsamlı hesap yardımcıları | Hesap listesi/hesap eylemi yardımcıları |
  | `plugin-sdk/channel-setup` | Kurulum sihirbazı bağdaştırıcıları | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM eşleştirme ilkelleri | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Yanıt öneki, yazıyor durumu ve kaynak teslimatı bağlantıları | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Yapılandırma bağdaştırıcısı fabrikaları ve DM erişim yardımcıları | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Yapılandırma şeması oluşturucuları | Yalnızca paylaşılan kanal yapılandırma şeması ilkelleri ve genel oluşturucu |
  | `plugin-sdk/bundled-channel-config-schema` | Paketlenmiş yapılandırma şemaları | Yalnızca OpenClaw tarafından bakımı yapılan paketlenmiş plugin'ler; yeni plugin'ler plugin'e yerel şemalar tanımlamalıdır |
  | `plugin-sdk/channel-config-schema-legacy` | Kullanımdan kaldırılmış paketlenmiş yapılandırma şemaları | Yalnızca uyumluluk takma adı; bakımı yapılan paketlenmiş plugin'ler için `plugin-sdk/bundled-channel-config-schema` kullanın |
  | `plugin-sdk/telegram-command-config` | Telegram komut yapılandırması yardımcıları | Komut adı normalleştirmesi, açıklama kırpma, yineleme/çakışma doğrulaması |
  | `plugin-sdk/channel-policy` | Grup/DM ilkesi çözümlemesi | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Kullanımdan kaldırılmış uyumluluk cephesi | `plugin-sdk/channel-outbound` kullanın |
  | `plugin-sdk/inbound-envelope` | Gelen zarf yardımcıları | Paylaşılan rota + zarf oluşturucu yardımcıları |
  | `plugin-sdk/channel-inbound` | Gelen alma yardımcıları | Bağlam oluşturma, biçimlendirme, kökler, çalıştırıcılar, hazırlanmış yanıt gönderimi ve gönderim koşulları |
  | `plugin-sdk/messaging-targets` | Kullanımdan kaldırılmış hedef ayrıştırma içe aktarma yolu | Genel hedef ayrıştırma yardımcıları için `plugin-sdk/channel-targets`, rota karşılaştırması için `plugin-sdk/channel-route` ve sağlayıcıya özgü hedef çözümlemesi için plugin'e ait `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` kullanın |
  | `plugin-sdk/outbound-media` | Giden medya yardımcıları | Paylaşılan giden medya yükleme |
  | `plugin-sdk/outbound-send-deps` | Kullanımdan kaldırılmış uyumluluk cephesi | `plugin-sdk/channel-outbound` kullanın |
  | `plugin-sdk/channel-outbound` | Giden ileti yaşam döngüsü yardımcıları | İleti bağdaştırıcıları, alındılar, kalıcı gönderim yardımcıları, canlı önizleme/akış yardımcıları, yanıt seçenekleri, yaşam döngüsü yardımcıları, giden kimlik ve yük planlama |
  | `plugin-sdk/channel-streaming` | Kullanımdan kaldırılmış uyumluluk cephesi | `plugin-sdk/channel-outbound` kullanın |
  | `plugin-sdk/outbound-runtime` | Kullanımdan kaldırılmış uyumluluk cephesi | `plugin-sdk/channel-outbound` kullanın |
  | `plugin-sdk/thread-bindings-runtime` | İş parçacığı bağlama yardımcıları | İş parçacığı bağlama yaşam döngüsü ve bağdaştırıcı yardımcıları |
  | `plugin-sdk/agent-media-payload` | Eski medya yükü yardımcıları | Eski alan düzenleri için ajan medya yükü oluşturucu |
  | `plugin-sdk/channel-runtime` | Kullanımdan kaldırılmış uyumluluk shim'i | Yalnızca eski kanal çalışma zamanı yardımcı programları |
  | `plugin-sdk/channel-send-result` | Gönderim sonucu türleri | Yanıt sonucu türleri |
  | `plugin-sdk/runtime-store` | Kalıcı plugin depolaması | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Geniş kapsamlı çalışma zamanı yardımcıları | Çalışma zamanı/günlükleme/yedekleme/plugin kurulumu yardımcıları |
  | `plugin-sdk/runtime-env` | Dar kapsamlı çalışma zamanı ortamı yardımcıları | Günlükleyici/çalışma zamanı ortamı, zaman aşımı, yeniden deneme ve geri çekilme yardımcıları |
  | `plugin-sdk/plugin-runtime` | Paylaşılan plugin çalışma zamanı yardımcıları | Plugin komutları/kancaları/http/etkileşimli yardımcıları |
  | `plugin-sdk/hook-runtime` | Kanca işlem hattı yardımcıları | Paylaşılan Webhook/dahili kanca işlem hattı yardımcıları |
  | `plugin-sdk/lazy-runtime` | Tembel çalışma zamanı yardımcıları | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Süreç yardımcıları | Paylaşılan yürütme yardımcıları |
  | `plugin-sdk/cli-runtime` | CLI çalışma zamanı yardımcıları | Komut biçimlendirme, beklemeler, sürüm yardımcıları |
  | `plugin-sdk/gateway-runtime` | Gateway yardımcıları | Gateway istemcisi, olay döngüsüne hazır başlatma yardımcısı ve kanal durumu yama yardımcıları |
  | `plugin-sdk/config-runtime` | Kullanımdan kaldırılmış yapılandırma uyumluluğu shim'i | `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` ve `config-mutation` tercih edin |
  | `plugin-sdk/telegram-command-config` | Telegram komut yardımcıları | Paketlenmiş Telegram sözleşme yüzeyi kullanılamadığında geri dönüş açısından kararlı Telegram komut doğrulama yardımcıları |
  | `plugin-sdk/approval-runtime` | Onay istemi yardımcıları | Yürütme/plugin onay yükü, onay yeteneği/profil yardımcıları, yerel onay yönlendirme/çalışma zamanı yardımcıları ve yapılandırılmış onay görüntüleme yolu biçimlendirmesi |
  | `plugin-sdk/approval-auth-runtime` | Onay kimlik doğrulama yardımcıları | Onaylayan çözümlemesi, aynı sohbet eylem kimlik doğrulaması |
  | `plugin-sdk/approval-client-runtime` | Onay istemcisi yardımcıları | Yerel yürütme onay profili/filtre yardımcıları |
  | `plugin-sdk/approval-delivery-runtime` | Onay teslimatı yardımcıları | Yerel onay yeteneği/teslimat bağdaştırıcıları |
  | `plugin-sdk/approval-gateway-runtime` | Onay Gateway yardımcıları | Paylaşılan onay Gateway çözümleme yardımcısı |
  | `plugin-sdk/approval-handler-adapter-runtime` | Onay bağdaştırıcısı yardımcıları | Sıcak kanal giriş noktaları için hafif yerel onay bağdaştırıcısı yükleme yardımcıları |
  | `plugin-sdk/approval-handler-runtime` | Onay işleyici yardımcıları | Daha geniş onay işleyici çalışma zamanı yardımcıları; yeterli olduklarında daha dar bağdaştırıcı/Gateway yüzeylerini tercih edin |
  | `plugin-sdk/approval-native-runtime` | Onay hedefi yardımcıları | Yerel onay hedefi/hesap bağlama yardımcıları |
  | `plugin-sdk/approval-reply-runtime` | Onay yanıtı yardımcıları | Yürütme/plugin onay yanıtı yükü yardımcıları |
  | `plugin-sdk/channel-runtime-context` | Kanal çalışma zamanı bağlamı yardımcıları | Genel kanal çalışma zamanı bağlamı kaydet/al/izle yardımcıları |
  | `plugin-sdk/security-runtime` | Güvenlik yardımcıları | Paylaşılan güven, DM kapılama, kökle sınırlı dosya/yol yardımcıları, harici içerik ve gizli bilgi toplama yardımcıları |
  | `plugin-sdk/ssrf-policy` | SSRF ilkesi yardımcıları | Ana makine izin listesi ve özel ağ ilkesi yardımcıları |
  | `plugin-sdk/ssrf-runtime` | SSRF çalışma zamanı yardımcıları | Sabitlenmiş gönderici, korumalı fetch, SSRF ilkesi yardımcıları |
  | `plugin-sdk/system-event-runtime` | Sistem olayı yardımcıları | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat yardımcıları | Heartbeat uyandırma, olay ve görünürlük yardımcıları |
  | `plugin-sdk/delivery-queue-runtime` | Teslimat kuyruğu yardımcıları | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Kanal etkinliği yardımcıları | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Tekilleştirme yardımcıları | Bellek içi tekilleştirme önbellekleri |
  | `plugin-sdk/file-access-runtime` | Dosya erişimi yardımcıları | Güvenli yerel dosya/medya yolu yardımcıları |
  | `plugin-sdk/transport-ready-runtime` | Aktarım hazır olma yardımcıları | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Yürütme onay ilkesi yardımcıları | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Sınırlı önbellek yardımcıları | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Tanılama kapılama yardımcıları | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hata biçimlendirme yardımcıları | `formatUncaughtError`, `isApprovalNotFoundError`, hata grafiği yardımcıları |
  | `plugin-sdk/fetch-runtime` | Sarılmış fetch/proxy yardımcıları | `resolveFetch`, proxy yardımcıları, EnvHttpProxyAgent seçenek yardımcıları |
  | `plugin-sdk/host-runtime` | Ana makine normalleştirme yardımcıları | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Yeniden deneme yardımcıları | `RetryConfig`, `retryAsync`, ilke çalıştırıcıları |
  | `plugin-sdk/allow-from` | İzin listesi biçimlendirmesi ve giriş eşleme | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Komut kapılama ve komut yüzeyi yardımcıları | `resolveControlCommandGate`, gönderen yetkilendirme yardımcıları, dinamik argüman menüsü biçimlendirmesi dahil komut kayıt defteri yardımcıları |
  | `plugin-sdk/command-status` | Komut durumu/yardım işleyicileri | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Gizli bilgi girişi ayrıştırma | Gizli bilgi girişi yardımcıları |
  | `plugin-sdk/webhook-ingress` | Webhook isteği yardımcıları | Webhook hedef yardımcı programları |
  | `plugin-sdk/webhook-request-guards` | Webhook gövdesi koruma yardımcıları | İstek gövdesi okuma/sınır yardımcıları |
  | `plugin-sdk/reply-runtime` | Paylaşılan yanıt çalışma zamanı | Gelen gönderim, heartbeat, yanıt planlayıcı, parçalama |
  | `plugin-sdk/reply-dispatch-runtime` | Dar kapsamlı yanıt gönderim yardımcıları | Sonlandırma, sağlayıcı gönderimi ve konuşma etiketi yardımcıları |
  | `plugin-sdk/reply-history` | Yanıt geçmişi yardımcıları | `createChannelHistoryWindow`; `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` ve `clearHistoryEntriesIfEnabled` gibi kullanımdan kaldırılmış harita yardımcısı uyumluluk dışa aktarımları |
  | `plugin-sdk/reply-reference` | Yanıt referansı planlama | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Yanıt parçası yardımcıları | Metin/markdown parçalama yardımcıları |
  | `plugin-sdk/session-store-runtime` | Oturum deposu yardımcıları | Depo yolu + güncellenme zamanı yardımcıları |
  | `plugin-sdk/state-paths` | Durum yolu yardımcıları | Durum ve OAuth dizini yardımcıları |
  | `plugin-sdk/routing` | Yönlendirme/oturum anahtarı yardımcıları | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, oturum anahtarı normalleştirme yardımcıları |
  | `plugin-sdk/status-helpers` | Kanal durumu yardımcıları | Kanal/hesap durumu özeti oluşturucuları, çalışma zamanı durumu varsayılanları, sorun meta verisi yardımcıları |
  | `plugin-sdk/target-resolver-runtime` | Hedef çözümleyici yardımcıları | Paylaşılan hedef çözümleyici yardımcıları |
  | `plugin-sdk/string-normalization-runtime` | Dize normalleştirme yardımcıları | Slug/dize normalleştirme yardımcıları |
  | `plugin-sdk/request-url` | İstek URL'si yardımcıları | İstek benzeri girdilerden dize URL'leri çıkarır |
  | `plugin-sdk/run-command` | Zaman sınırılı komut yardımcıları | Normalleştirilmiş stdout/stderr ile zaman sınırılı komut çalıştırıcı |
  | `plugin-sdk/param-readers` | Param okuyucuları | Ortak araç/CLI param okuyucuları |
  | `plugin-sdk/tool-payload` | Araç yükü çıkarma | Araç sonuç nesnelerinden normalleştirilmiş yükleri çıkarır |
  | `plugin-sdk/tool-send` | Araç gönderimi çıkarma | Araç argümanlarından kanonik gönderim hedefi alanlarını çıkarır |
  | `plugin-sdk/temp-path` | Geçici yol yardımcıları | Paylaşılan geçici indirme yolu yardımcıları |
  | `plugin-sdk/logging-core` | Günlükleme yardımcıları | Alt sistem günlükleyicisi ve redaksiyon yardımcıları |
  | `plugin-sdk/markdown-table-runtime` | Markdown tablosu yardımcıları | Markdown tablo modu yardımcıları |
  | `plugin-sdk/reply-payload` | Mesaj yanıtı türleri | Yanıt yükü türleri |
  | `plugin-sdk/provider-setup` | Seçilmiş yerel/kendi barındırılan sağlayıcı kurulum yardımcıları | Kendi barındırılan sağlayıcı keşif/yapılandırma yardımcıları |
  | `plugin-sdk/self-hosted-provider-setup` | Odaklı OpenAI uyumlu kendi barındırılan sağlayıcı kurulum yardımcıları | Aynı kendi barındırılan sağlayıcı keşif/yapılandırma yardımcıları |
  | `plugin-sdk/provider-auth-runtime` | Sağlayıcı çalışma zamanı kimlik doğrulama yardımcıları | Çalışma zamanı API anahtarı çözümleme yardımcıları |
  | `plugin-sdk/provider-auth-api-key` | Sağlayıcı API anahtarı kurulum yardımcıları | API anahtarı ilk kurulum/profil yazma yardımcıları |
  | `plugin-sdk/provider-auth-result` | Sağlayıcı kimlik doğrulama sonucu yardımcıları | Standart OAuth kimlik doğrulama sonucu oluşturucu |
  | `plugin-sdk/provider-selection-runtime` | Sağlayıcı seçimi yardımcıları | Yapılandırılmış veya otomatik sağlayıcı seçimi ve ham sağlayıcı yapılandırması birleştirme |
  | `plugin-sdk/provider-env-vars` | Sağlayıcı env-var yardımcıları | Sağlayıcı kimlik doğrulama env-var arama yardımcıları |
  | `plugin-sdk/provider-model-shared` | Paylaşılan sağlayıcı model/yeniden oynatma yardımcıları | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan yeniden oynatma politikası oluşturucuları, sağlayıcı uç nokta yardımcıları ve model kimliği normalleştirme yardımcıları |
  | `plugin-sdk/provider-catalog-shared` | Paylaşılan sağlayıcı katalog yardımcıları | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Sağlayıcı ilk kurulum yamaları | İlk kurulum yapılandırma yardımcıları |
  | `plugin-sdk/provider-http` | Sağlayıcı HTTP yardımcıları | Ses transkripsiyonu multipart form yardımcıları dahil genel sağlayıcı HTTP/uç nokta yetenek yardımcıları |
  | `plugin-sdk/provider-web-fetch` | Sağlayıcı web-fetch yardımcıları | Web-fetch sağlayıcı kaydı/önbellek yardımcıları |
  | `plugin-sdk/provider-web-search-config-contract` | Sağlayıcı web arama yapılandırma yardımcıları | Plugin etkinleştirme kablolamasına ihtiyaç duymayan sağlayıcılar için dar web arama yapılandırma/kimlik bilgisi yardımcıları |
  | `plugin-sdk/provider-web-search-contract` | Sağlayıcı web arama sözleşmesi yardımcıları | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` gibi dar web arama yapılandırma/kimlik bilgisi sözleşme yardımcıları ve kapsamlı kimlik bilgisi ayarlayıcıları/alıcıları |
  | `plugin-sdk/provider-web-search` | Sağlayıcı web arama yardımcıları | Web arama sağlayıcı kaydı/önbellek/çalışma zamanı yardımcıları |
  | `plugin-sdk/provider-tools` | Sağlayıcı araç/şema uyumluluk yardımcıları | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` ve DeepSeek/Gemini/OpenAI şema temizleme + tanılama |
  | `plugin-sdk/provider-usage` | Sağlayıcı kullanım yardımcıları | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` ve diğer sağlayıcı kullanım yardımcıları |
  | `plugin-sdk/provider-stream` | Sağlayıcı akış sarmalayıcı yardımcıları | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
  | `plugin-sdk/provider-transport-runtime` | Sağlayıcı taşıma yardımcıları | Korumalı fetch, taşıma mesajı dönüşümleri ve yazılabilir taşıma olay akışları gibi yerel sağlayıcı taşıma yardımcıları |
  | `plugin-sdk/keyed-async-queue` | Sıralı asenkron kuyruk | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Paylaşılan medya yardımcıları | Medya getirme/dönüştürme/depolama yardımcıları, ffprobe destekli video boyutu yoklama ve medya yükü oluşturucuları |
  | `plugin-sdk/media-generation-runtime` | Paylaşılan medya üretimi yardımcıları | Görüntü/video/müzik üretimi için paylaşılan failover yardımcıları, aday seçimi ve eksik model mesajlaşması |
  | `plugin-sdk/media-understanding` | Medya anlama yardımcıları | Medya anlama sağlayıcı türleri ve sağlayıcıya yönelik görüntü/ses yardımcı dışa aktarımları |
  | `plugin-sdk/text-runtime` | Kullanımdan kaldırılmış geniş metin uyumluluğu dışa aktarımı | `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` ve `logging-core` kullanın |
  | `plugin-sdk/text-chunking` | Metin parçalama yardımcıları | Giden metin parçalama yardımcısı |
  | `plugin-sdk/speech` | Konuşma yardımcıları | Konuşma sağlayıcı türleri ve sağlayıcıya yönelik direktif, kayıt, doğrulama yardımcıları ve OpenAI uyumlu TTS oluşturucu |
  | `plugin-sdk/speech-core` | Paylaşılan konuşma çekirdeği | Konuşma sağlayıcı türleri, kayıt, direktifler, normalleştirme |
  | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon yardımcıları | Sağlayıcı türleri, kayıt yardımcıları ve paylaşılan WebSocket oturumu yardımcısı |
  | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses yardımcıları | Sağlayıcı türleri, kayıt/çözümleme yardımcıları, köprü oturumu yardımcıları, paylaşılan aracı geri konuşma kuyrukları, aktif çalışma ses denetimi, transkript/olay sağlığı, yankı bastırma, danışma sorusu eşleştirme, zorunlu danışma koordinasyonu, dönüş bağlamı takibi, çıktı etkinliği takibi ve hızlı bağlam danışma yardımcıları |
  | `plugin-sdk/image-generation` | Görüntü üretimi yardımcıları | Görüntü üretimi sağlayıcı türleri ve görüntü varlığı/veri URL'si yardımcıları ile OpenAI uyumlu görüntü sağlayıcısı oluşturucu |
  | `plugin-sdk/image-generation-core` | Paylaşılan görüntü üretimi çekirdeği | Görüntü üretimi türleri, failover, kimlik doğrulama ve kayıt yardımcıları |
  | `plugin-sdk/music-generation` | Müzik üretimi yardımcıları | Müzik üretimi sağlayıcı/istek/sonuç türleri |
  | `plugin-sdk/music-generation-core` | Paylaşılan müzik üretimi çekirdeği | Müzik üretimi türleri, failover yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
  | `plugin-sdk/video-generation` | Video üretimi yardımcıları | Video üretimi sağlayıcı/istek/sonuç türleri |
  | `plugin-sdk/video-generation-core` | Paylaşılan video üretimi çekirdeği | Video üretimi türleri, failover yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
  | `plugin-sdk/interactive-runtime` | Etkileşimli yanıt yardımcıları | Etkileşimli yanıt yükü normalleştirme/azaltma |
  | `plugin-sdk/channel-config-primitives` | Kanal yapılandırması ilkelleri | Dar kanal yapılandırma şeması ilkelleri |
  | `plugin-sdk/channel-config-writes` | Kanal yapılandırma yazma yardımcıları | Kanal yapılandırma yazma yetkilendirme yardımcıları |
  | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal başlangıcı | Paylaşılan kanal Plugin başlangıç dışa aktarımları |
  | `plugin-sdk/channel-status` | Kanal durumu yardımcıları | Paylaşılan kanal durumu anlık görüntü/özet yardımcıları |
  | `plugin-sdk/allowlist-config-edit` | İzin listesi yapılandırma yardımcıları | İzin listesi yapılandırması düzenleme/okuma yardımcıları |
  | `plugin-sdk/group-access` | Grup erişimi yardımcıları | Paylaşılan grup erişimi karar yardımcıları |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Kullanımdan kaldırılmış uyumluluk cepheleri | `plugin-sdk/channel-inbound` kullanın |
  | `plugin-sdk/direct-dm-guard-policy` | Doğrudan DM koruma yardımcıları | Dar kripto öncesi koruma politikası yardımcıları |
  | `plugin-sdk/extension-shared` | Paylaşılan uzantı yardımcıları | Pasif kanal/durum ve ortam proxy yardımcı ilkelleri |
  | `plugin-sdk/webhook-targets` | Webhook hedef yardımcıları | Webhook hedef kaydı ve rota kurulum yardımcıları |
  | `plugin-sdk/webhook-path` | Kullanımdan kaldırılmış Webhook yol takma adı | `plugin-sdk/webhook-ingress` kullanın |
  | `plugin-sdk/web-media` | Paylaşılan web medyası yardımcıları | Uzak/yerel medya yükleme yardımcıları |
  | `plugin-sdk/zod` | Kullanımdan kaldırılmış Zod uyumluluk yeniden dışa aktarımı | `zod` paketinden doğrudan `zod` içe aktarın |
  | `plugin-sdk/memory-core` | Paketli memory-core yardımcıları | Bellek yöneticisi/yapılandırma/dosya/CLI yardımcı yüzeyi |
  | `plugin-sdk/memory-core-engine-runtime` | Bellek motoru çalışma zamanı cephesi | Bellek dizin/arama çalışma zamanı cephesi |
  | `plugin-sdk/memory-core-host-embedding-registry` | Bellek embedding kaydı | Hafif bellek embedding sağlayıcı kaydı yardımcıları |
  | `plugin-sdk/memory-core-host-engine-foundation` | Bellek host foundation motoru | Bellek host foundation motoru dışa aktarımları |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek host embedding motoru | Bellek embedding sözleşmeleri, kayıt erişimi, yerel sağlayıcı ve genel toplu/uzak yardımcılar; somut uzak sağlayıcılar kendi sahibi Plugin'lerde yaşar |
  | `plugin-sdk/memory-core-host-engine-qmd` | Bellek host QMD motoru | Bellek host QMD motoru dışa aktarımları |
  | `plugin-sdk/memory-core-host-engine-storage` | Bellek host depolama motoru | Bellek host depolama motoru dışa aktarımları |
  | `plugin-sdk/memory-core-host-multimodal` | Bellek host çok modlu yardımcıları | Bellek host çok modlu yardımcıları |
  | `plugin-sdk/memory-core-host-query` | Bellek host sorgu yardımcıları | Bellek host sorgu yardımcıları |
  | `plugin-sdk/memory-core-host-secret` | Bellek host secret yardımcıları | Bellek host secret yardımcıları |
  | `plugin-sdk/memory-core-host-events` | Kullanımdan kaldırılmış bellek olay takma adı | `plugin-sdk/memory-host-events` kullanın |
  | `plugin-sdk/memory-core-host-status` | Bellek host durumu yardımcıları | Bellek host durumu yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-cli` | Bellek host CLI çalışma zamanı | Bellek host CLI çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-core` | Bellek host çekirdek çalışma zamanı | Bellek host çekirdek çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-files` | Bellek host dosya/çalışma zamanı yardımcıları | Bellek host dosya/çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-host-core` | Bellek host çekirdek çalışma zamanı takma adı | Bellek host çekirdek çalışma zamanı yardımcıları için satıcıdan bağımsız takma ad |
  | `plugin-sdk/memory-host-events` | Bellek host olay günlüğü takma adı | Bellek host olay günlüğü yardımcıları için satıcıdan bağımsız takma ad |
  | `plugin-sdk/memory-host-files` | Kullanımdan kaldırılmış bellek dosya/çalışma zamanı takma adı | `plugin-sdk/memory-core-host-runtime-files` kullanın |
  | `plugin-sdk/memory-host-markdown` | Yönetilen markdown yardımcıları | Belleğe komşu Plugin'ler için paylaşılan yönetilen markdown yardımcıları |
  | `plugin-sdk/memory-host-search` | Aktif bellek arama cephesi | Geç yüklenen aktif bellek arama yöneticisi çalışma zamanı cephesi |
  | `plugin-sdk/memory-host-status` | Kullanımdan kaldırılmış bellek host durumu takma adı | `plugin-sdk/memory-core-host-status` kullanın |
  | `plugin-sdk/testing` | Test yardımcıları | Repo yerelinde kullanımdan kaldırılmış uyumluluk varili; `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` ve `plugin-sdk/test-fixtures` gibi odaklı repo yerel test alt yollarını kullanın |
</Accordion>

Bu tablo kasıtlı olarak tam SDK yüzeyi değil, ortak geçiş alt kümesidir.
Derleyici giriş noktası envanteri `scripts/lib/plugin-sdk-entrypoints.json` içinde
bulunur; paket dışa aktarımları herkese açık alt kümeden oluşturulur.

Açıkça belgelenmiş uyumluluk cepheleri dışında, ayrılmış paketli Plugin yardımcı
dikişleri herkese açık SDK export map içinden kaldırılmıştır; buna yayımlanmış
`@openclaw/discord@2026.3.13` paketi için tutulan kullanımdan kaldırılmış
`plugin-sdk/discord` shim dahildir. Sahipliğe özgü yardımcılar, sahip olan
Plugin paketinin içinde yaşar; paylaşılan host davranışı
`plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` ve
`plugin-sdk/plugin-config-runtime` gibi genel SDK sözleşmeleri üzerinden
ilerlemelidir.

İşe uyan en dar import'u kullanın. Bir export bulamıyorsanız
`src/plugin-sdk/` altındaki kaynağı kontrol edin veya hangi genel sözleşmenin
ona sahip olması gerektiğini bakımcılara sorun.

## Etkin kullanımdan kaldırmalar

Plugin SDK, sağlayıcı sözleşmesi, çalışma zamanı yüzeyi ve manifest genelinde
geçerli olan daha dar kullanımdan kaldırmalar. Her biri bugün hâlâ çalışır
ancak gelecekteki bir major sürümde kaldırılacaktır. Her öğenin altındaki kayıt,
eski API'yi kanonik yerine eşler.

<AccordionGroup>
  <Accordion title="command-auth yardım oluşturucuları → command-status">
    **Eski (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Yeni (`openclaw/plugin-sdk/command-status`)**: aynı imzalar, aynı
    export'lar - yalnızca daha dar alt yoldan import edilir. `command-auth`
    bunları uyumluluk stub'ları olarak yeniden export eder.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Bahsetme kapılama yardımcıları → resolveInboundMentionDecision">
    **Eski**: `openclaw/plugin-sdk/channel-inbound` veya
    `openclaw/plugin-sdk/channel-mention-gating` içinden
    `resolveInboundMentionRequirement({ facts, policy })` ve
    `shouldDropInboundForMention(...)`.

    **Yeni**: `resolveInboundMentionDecision({ facts, policy })` - iki ayrı
    çağrı yerine tek bir karar nesnesi döndürür.

    Aşağı akış kanal Plugin'leri (Slack, Discord, Matrix, MS Teams) zaten
    geçiş yaptı.

  </Accordion>

  <Accordion title="Kanal çalışma zamanı shim'i ve kanal eylemleri yardımcıları">
    `openclaw/plugin-sdk/channel-runtime`, eski kanal Plugin'leri için bir
    uyumluluk shim'idir. Yeni koddan bunu import etmeyin; çalışma zamanı
    nesnelerini kaydetmek için `openclaw/plugin-sdk/channel-runtime-context`
    kullanın.

    `openclaw/plugin-sdk/channel-actions` içindeki `channelActions*`
    yardımcıları, ham "actions" kanal export'larıyla birlikte kullanımdan
    kaldırılmıştır. Bunun yerine yetenekleri anlamsal `presentation` yüzeyi
    üzerinden sunun - kanal Plugin'leri hangi ham eylem adlarını kabul
    ettiklerinden çok ne render ettiklerini (kartlar, düğmeler, seçimler)
    bildirir.

  </Accordion>

  <Accordion title="Web arama sağlayıcısı tool() yardımcısı → Plugin üzerinde createTool()">
    **Eski**: `openclaw/plugin-sdk/provider-web-search` içinden `tool()`
    factory'si.

    **Yeni**: sağlayıcı Plugin üzerinde doğrudan `createTool(...)` uygulayın.
    OpenClaw artık araç sarmalayıcısını kaydetmek için SDK yardımcısına ihtiyaç
    duymaz.

  </Accordion>

  <Accordion title="Düz metin kanal zarfları → BodyForAgent">
    **Eski**: gelen kanal mesajlarından düz, düz metin bir prompt zarfı
    oluşturmak için `formatInboundEnvelope(...)` (ve
    `ChannelMessageForAgent.channelEnvelope`).

    **Yeni**: `BodyForAgent` ve yapılandırılmış kullanıcı bağlamı blokları.
    Kanal Plugin'leri yönlendirme metadata'sını (thread, konu, yanıt-hedefi,
    tepkiler) bir prompt dizesine birleştirmek yerine türlenmiş alanlar olarak
    ekler. `formatAgentEnvelope(...)` yardımcısı, sentezlenmiş asistan-yönelimli
    zarflar için hâlâ desteklenir ancak gelen düz metin zarflar kaldırılma
    yolundadır.

    Etkilenen alanlar: `inbound_claim`, `message_received` ve
    `channelEnvelope` metnini sonradan işleyen tüm özel kanal Plugin'leri.

  </Accordion>

  <Accordion title="deactivate kancası → gateway_stop">
    **Eski**: `api.on("deactivate", handler)`.

    **Yeni**: `api.on("gateway_stop", handler)`. Olay ve bağlam aynı kapanış
    temizliği sözleşmesidir; yalnızca kanca adı değişir.

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

    `deactivate`, 2026-08-16 sonrasına kadar kullanımdan kaldırılmış uyumluluk
    alias'ı olarak bağlı kalır.

  </Accordion>

  <Accordion title="subagent_spawning kancası → çekirdek thread bağlama">
    **Eski**: `threadBindingReady` veya `deliveryOrigin` döndüren
    `api.on("subagent_spawning", handler)`.

    **Yeni**: çekirdeğin kanal oturum-bağlama adaptörü üzerinden `thread: true`
    alt ajan bağlamalarını hazırlamasına izin verin. `api.on("subagent_spawned", handler)`
    yalnızca başlatma sonrası gözlem için kullanın.

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
    `PluginHookSubagentSpawningResult` ve
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)`, harici Plugin'ler
    geçiş yaparken yalnızca kullanımdan kaldırılmış uyumluluk yüzeyleri olarak
    kalır.

  </Accordion>

  <Accordion title="Sağlayıcı keşif türleri → sağlayıcı katalog türleri">
    Dört keşif türü alias'ı artık katalog dönemi türleri üzerinde ince
    sarmalayıcılardır:

    | Eski alias                | Yeni tür                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Ayrıca eski `ProviderCapabilities` statik torbası - sağlayıcı Plugin'leri
    statik bir nesne yerine `buildReplayPolicy`, `normalizeToolSchemas` ve
    `wrapStreamFn` gibi açık sağlayıcı kancaları kullanmalıdır.

  </Accordion>

  <Accordion title="Thinking ilkesi kancaları → resolveThinkingProfile">
    **Eski** (`ProviderThinkingPolicy` üzerinde üç ayrı kanca):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` ve
    `resolveDefaultThinkingLevel(ctx)`.

    **Yeni**: kanonik `id`, isteğe bağlı `label` ve sıralanmış seviye listesini
    içeren bir `ProviderThinkingProfile` döndüren tek bir
    `resolveThinkingProfile(ctx)`. OpenClaw, eskimiş saklanan değerleri profil
    sırasına göre otomatik olarak düşürür.

    Bağlam; `provider`, `modelId`, isteğe bağlı birleştirilmiş `reasoning` ve
    isteğe bağlı birleştirilmiş model `compat` olgularını içerir. Sağlayıcı
    Plugin'leri, yapılandırılmış istek sözleşmesi desteklediğinde modele özgü
    bir profili yalnızca o zaman sunmak için bu katalog olgularını kullanabilir.

    Üç yerine tek kanca uygulayın. Eski kancalar kullanımdan kaldırma penceresi
    boyunca çalışmaya devam eder ancak profil sonucuyla birleştirilmez.

  </Accordion>

  <Accordion title="Harici kimlik doğrulama sağlayıcıları → contracts.externalAuthProviders">
    **Eski**: sağlayıcıyı Plugin manifest'inde bildirmeden harici kimlik
    doğrulama kancaları uygulamak.

    **Yeni**: Plugin manifest'inde `contracts.externalAuthProviders` bildirin
    **ve** `resolveExternalAuthProfiles(...)` uygulayın.

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

    **Yeni**: aynı env-var aramasını manifest üzerinde `setup.providers[].envVars`
    içine yansıtın. Bu, kurulum/durum env metadata'sını tek yerde birleştirir ve
    yalnızca env-var aramalarını yanıtlamak için Plugin çalışma zamanını
    başlatmayı önler.

    `providerAuthEnvVars`, kullanımdan kaldırma penceresi kapanana kadar bir
    uyumluluk adaptörü üzerinden desteklenmeye devam eder.

  </Accordion>

  <Accordion title="Memory Plugin kaydı → registerMemoryCapability">
    **Eski**: üç ayrı çağrı -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Yeni**: memory-state API üzerinde tek çağrı -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Aynı yuvalar, tek kayıt çağrısı. Eklemeli prompt ve corpus yardımcıları
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`)
    etkilenmez.

  </Accordion>

  <Accordion title="Memory embedding sağlayıcı API'si">
    **Eski**: `api.registerMemoryEmbeddingProvider(...)` ve
    `contracts.memoryEmbeddingProviders`.

    **Yeni**: `api.registerEmbeddingProvider(...)` ve
    `contracts.embeddingProviders`.

    Genel embedding sağlayıcı sözleşmesi memory dışında yeniden kullanılabilir
    ve yeni sağlayıcılar için desteklenen yoldur. Memory'ye özgü kayıt API'si,
    mevcut sağlayıcılar geçiş yaparken kullanımdan kaldırılmış uyumluluk olarak
    bağlı kalır. Plugin denetimi, paketli olmayan kullanımı uyumluluk borcu
    olarak raporlar.

  </Accordion>

  <Accordion title="Alt ajan oturum mesajları türleri yeniden adlandırıldı">
    `src/plugins/runtime/types.ts` içinden hâlâ export edilen iki eski tür
    alias'ı:

    | Eski                          | Yeni                              |
    | ----------------------------- | --------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Çalışma zamanı yöntemi `readSession`, `getSessionMessages` lehine
    kullanımdan kaldırılmıştır. Aynı imza; eski yöntem yeni yönteme iletir.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Eski**: `runtime.tasks.flow` (tekil), canlı bir görev-akışı erişimcisi
    döndürürdü.

    **Yeni**: `runtime.tasks.managedFlows`, bir akıştan alt görevler oluşturan,
    güncelleyen, iptal eden veya çalıştıran Plugin'ler için yönetilen TaskFlow
    mutasyon çalışma zamanını tutar. Plugin yalnızca DTO tabanlı okumaya
    ihtiyaç duyduğunda `runtime.tasks.flows` kullanın.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Gömülü uzantı factory'leri → ajan araç-sonucu middleware'i">
    Yukarıdaki "Nasıl geçiş yapılır → Gömülü araç-sonucu uzantılarını
    middleware'e geçir" bölümünde ele alınmıştır. Eksiksizlik için burada da
    yer alır: kaldırılan yalnızca gömülü-runner'a özgü
    `api.registerEmbeddedExtensionFactory(...)` yolu, `contracts.agentToolResultMiddleware`
    içinde açık bir çalışma zamanı listesiyle
    `api.registerAgentToolResultMiddleware(...)` tarafından değiştirilmiştir.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias'ı → OpenClawConfig">
    `openclaw/plugin-sdk` içinden yeniden export edilen `OpenClawSchemaType`
    artık `OpenClawConfig` için tek satırlık bir alias'tır. Kanonik adı tercih
    edin.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
`extensions/` altındaki paketli kanal/sağlayıcı Plugin'leri içinde bulunan
uzantı düzeyi kullanımdan kaldırmalar kendi `api.ts` ve `runtime-api.ts`
barrel'ları içinde izlenir. Bunlar üçüncü taraf Plugin sözleşmelerini etkilemez
ve burada listelenmez. Paketli bir Plugin'in yerel barrel'ını doğrudan
kullanıyorsanız yükseltmeden önce o barrel'daki kullanımdan kaldırma
yorumlarını okuyun.
</Note>

## Kaldırma zaman çizelgesi

| Ne zaman               | Ne olur                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| **Şimdi**              | Kullanımdan kaldırılan yüzeyler çalışma zamanında uyarılar üretir       |
| **Sonraki major release** | Kullanımdan kaldırılan yüzeyler kaldırılacak; bunları hâlâ kullanan Plugin'ler başarısız olacak |

Tüm çekirdek Plugin'ler zaten taşındı. Harici Plugin'ler sonraki major release'den
önce geçiş yapmalıdır.

## Uyarıları geçici olarak bastırma

Geçiş üzerinde çalışırken bu ortam değişkenlerini ayarlayın:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Bu geçici bir kaçış yoludur, kalıcı bir çözüm değildir.

## İlgili

- [Başlarken](/tr/plugins/building-plugins) - ilk Plugin'inizi oluşturun
- [SDK Genel Bakışı](/tr/plugins/sdk-overview) - tam alt yol içe aktarma referansı
- [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) - kanal Plugin'leri oluşturma
- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) - sağlayıcı Plugin'leri oluşturma
- [Plugin İç Yapısı](/tr/plugins/architecture) - mimariye derinlemesine bakış
- [Plugin Bildirimi](/tr/plugins/manifest) - bildirim şeması referansı
