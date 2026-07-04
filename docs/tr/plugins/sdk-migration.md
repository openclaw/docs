---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED uyarısını görüyorsunuz
    - OPENCLAW_EXTENSION_API_DEPRECATED uyarısını görüyorsunuz
    - OpenClaw 2026.4.25 öncesinde api.registerEmbeddedExtensionFactory kullandınız
    - Bir Plugin'i modern Plugin mimarisine güncelliyorsunuz
    - Harici bir OpenClaw Plugin'inin bakımını yapıyorsunuz
sidebarTitle: Migrate to SDK
summary: Eski geriye dönük uyumluluk katmanından modern plugin SDK'ya geçiş yap
title: Plugin SDK geçişi
x-i18n:
    generated_at: "2026-07-04T10:57:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7873de40aea56f456781ecf8ac9a4705c958030f7c68f8a112ad3f0fce62f078
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw, geniş bir geriye dönük uyumluluk katmanından odaklı, belgelenmiş içe aktarmalara sahip modern bir Plugin
mimarisine geçti. Plugin’iniz yeni mimariden önce oluşturulduysa
bu kılavuz geçiş yapmanıza yardımcı olur.

## Neler değişiyor

Eski Plugin sistemi, Plugin’lerin ihtiyaç duydukları her şeyi tek bir giriş noktasından içe aktarmasına izin veren
iki geniş açık yüzey sağlıyordu:

- **`openclaw/plugin-sdk/compat`** - onlarca yardımcıyı yeniden dışa aktaran tek bir içe aktarma. Yeni Plugin mimarisi oluşturulurken eski hook tabanlı Plugin’lerin çalışmasını sürdürmek için kullanıma sunuldu.
- **`openclaw/plugin-sdk/infra-runtime`** - sistem olaylarını, Heartbeat durumunu, teslim kuyruklarını, fetch/proxy yardımcılarını,
  dosya yardımcılarını, onay türlerini ve ilgisiz yardımcıları karıştıran geniş bir çalışma zamanı yardımcı barrel’ı.
- **`openclaw/plugin-sdk/config-runtime`** - geçiş
  penceresi sırasında hâlâ kullanımdan kaldırılmış doğrudan yükleme/yazma yardımcılarını taşıyan geniş bir yapılandırma uyumluluk barrel’ı.
- **`openclaw/extension-api`** - Plugin’lere gömülü ajan çalıştırıcısı gibi host tarafı yardımcılara doğrudan erişim veren bir köprü.
- **`api.registerEmbeddedExtensionFactory(...)`** - `tool_result` gibi gömülü çalıştırıcı olaylarını gözlemleyebilen, kaldırılmış, yalnızca gömülü çalıştırıcıya yönelik paketli
  uzantı hook’u.

Geniş içe aktarma yüzeyleri artık **kullanımdan kaldırıldı**. Çalışma zamanında hâlâ çalışırlar,
ancak yeni Plugin’ler bunları kullanmamalıdır ve mevcut Plugin’ler bir sonraki ana sürüm bunları kaldırmadan önce
geçiş yapmalıdır. Yalnızca gömülü çalıştırıcıya yönelik uzantı fabrikası
kayıt API’si kaldırıldı; bunun yerine araç sonucu ara katmanını kullanın.

OpenClaw, belgelenmiş Plugin davranışını bir ikame getiren aynı
değişiklikte kaldırmaz veya yeniden yorumlamaz. Sözleşmeyi bozan değişiklikler önce
bir uyumluluk adaptöründen, tanılamalardan, belgelerden ve bir kullanımdan kaldırma penceresinden
geçmelidir. Bu; SDK içe aktarmaları, manifest alanları, kurulum API’leri, hook’lar ve çalışma zamanı
kayıt davranışı için geçerlidir.

<Warning>
  Geriye dönük uyumluluk katmanı gelecekteki bir ana sürümde kaldırılacaktır.
  Hâlâ bu yüzeylerden içe aktarma yapan Plugin’ler, bu gerçekleştiğinde bozulacaktır.
  Eski gömülü uzantı fabrikası kayıtları artık zaten yüklenmiyor.
</Warning>

## Bu neden değişti

Eski yaklaşım sorunlara neden oldu:

- **Yavaş başlatma** - bir yardımcıyı içe aktarmak onlarca ilgisiz modülü yüklüyordu
- **Döngüsel bağımlılıklar** - geniş yeniden dışa aktarmalar içe aktarma döngüleri oluşturmayı kolaylaştırıyordu
- **Belirsiz API yüzeyi** - hangi dışa aktarmaların kararlı, hangilerinin dahili olduğunu anlamanın yolu yoktu

Modern Plugin SDK bunu düzeltir: her içe aktarma yolu (`openclaw/plugin-sdk/\<subpath\>`)
net bir amacı ve belgelenmiş sözleşmesi olan küçük, kendi kendine yeterli bir modüldür.

Paketli kanallar için eski sağlayıcı kolaylık dikişleri de kaldırıldı.
Kanal markalı yardımcı dikişleri kararlı
Plugin sözleşmeleri değil, özel mono-repo kısayollarıydı. Bunun yerine dar genel SDK alt yollarını kullanın. Paketli
Plugin çalışma alanı içinde, sağlayıcıya ait yardımcıları o Plugin’in kendi `api.ts` veya
`runtime-api.ts` dosyasında tutun.

Geçerli paketli sağlayıcı örnekleri:

- Anthropic, Claude’a özgü akış yardımcılarını kendi `api.ts` /
  `contract-api.ts` dikişinde tutar
- OpenAI, sağlayıcı oluşturucuları, varsayılan model yardımcılarını ve gerçek zamanlı sağlayıcı
  oluşturucuları kendi `api.ts` dosyasında tutar
- OpenRouter, sağlayıcı oluşturucuyu ve onboarding/yapılandırma yardımcılarını kendi
  `api.ts` dosyasında tutar

## Talk ve gerçek zamanlı ses geçiş planı

Gerçek zamanlı ses, telefon, toplantı ve tarayıcı Talk kodu,
yüzey yerel tur defter tutmasından `openclaw/plugin-sdk/realtime-voice` tarafından dışa aktarılan paylaşılan bir Talk oturum denetleyicisine taşınıyor. Yeni denetleyici ortak Talk
olay zarfını, etkin tur durumunu, yakalama durumunu, çıkış sesi durumunu, yakın
olay geçmişini ve eski tur reddini sahiplenir. Sağlayıcı Plugin’leri
tedarikçiye özgü gerçek zamanlı oturumları sahiplenmeye devam etmelidir; yüzey Plugin’leri ise yakalama,
oynatma, telefon ve toplantı özel durumlarını sahiplenmeye devam etmelidir.

Bu Talk geçişi bilinçli olarak temiz kırılacak şekilde tasarlanmıştır:

1. Paylaşılan denetleyici/çalışma zamanı primitiflerini
   `plugin-sdk/realtime-voice` içinde tutun.
2. Paketli yüzeyleri paylaşılan denetleyiciye taşıyın: tarayıcı aktarma,
   yönetilen oda devri, sesli arama gerçek zamanlı, sesli arama akış STT, Google
   Meet gerçek zamanlı ve yerel bas-konuş.
3. Eski Talk RPC ailelerini nihai `talk.session.*` ve
   `talk.client.*` API’siyle değiştirin.
4. Gateway
   `hello-ok.features.events` içinde tek bir canlı Talk olay kanalını duyurun: `talk.event`.
5. Eski gerçek zamanlı HTTP uç noktasını ve istek zamanında talimat
   geçersiz kılma yollarını silin.

Yeni kod, düşük seviyeli bir adaptör veya test fikstürü uygulamadığı sürece `createTalkEventSequencer(...)` öğesini doğrudan çağırmamalıdır. Paylaşılan denetleyiciyi tercih edin;
böylece tur kapsamlı olaylar tur kimliği olmadan yayılamaz, eski `turnEnd` /
`turnCancel` çağrıları daha yeni bir etkin turu temizleyemez ve çıkış sesi yaşam döngüsü
olayları telefon, toplantılar, tarayıcı aktarma, yönetilen oda
devri ve yerel Talk istemcileri genelinde tutarlı kalır.

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
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

Tarayıcıya ait WebRTC/sağlayıcı websocket oturumları `talk.client.create` kullanır,
çünkü tarayıcı sağlayıcı uzlaşmasını ve medya taşımasını sahiplenirken
Gateway kimlik bilgilerini, talimatları ve araç politikasını sahiplenir. `talk.session.*`,
gateway-relay gerçek zamanlı, gateway-relay
transkripsiyon ve yönetilen oda yerel STT/TTS oturumları için ortak Gateway tarafından yönetilen yüzeydir.

Gerçek zamanlı seçicileri `talk.provider` /
`talk.providers` yanına yerleştiren eski yapılandırmalar `openclaw doctor --fix` ile onarılmalıdır; çalışma zamanı Talk,
konuşma/TTS sağlayıcı yapılandırmasını gerçek zamanlı sağlayıcı yapılandırması olarak yeniden yorumlamaz.

Desteklenen `talk.session.create` kombinasyonları bilinçli olarak küçüktür:

| Mod            | Taşıma          | Beyin           | Sahip              | Notlar                                                                                                             |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Gateway üzerinden köprülenen tam çift yönlü sağlayıcı sesi; araç çağrıları agent-consult aracı üzerinden yönlendirilir. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Yalnızca akış STT; çağıranlar giriş sesi gönderir ve transkript olayları alır.                                      |
| `stt-tts`       | `managed-room`  | `agent-consult` | Yerel/istemci odası | İstemcinin yakalama/oynatmayı, Gateway’in tur durumunu sahip olduğu bas-konuş ve telsiz tarzı odalar. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Yerel/istemci odası | Gateway araç eylemlerini doğrudan yürüten güvenilir birinci taraf yüzeyler için yalnızca yönetici oda modu.        |

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

Birleşik denetim söz varlığı da bilinçli olarak dardır:

  | Yöntem                         | Uygulandığı yer                                         | Sözleşme                                                                                                                                                                                 |
  | ------------------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Aynı Gateway bağlantısının sahip olduğu sağlayıcı oturumuna base64 PCM ses parçası ekler.                                                                                                |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Yönetilen oda kullanıcı sırasını başlatır.                                                                                                                                               |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Eski sıra doğrulamasından sonra etkin sırayı sonlandırır.                                                                                                                                |
  | `talk.session.cancelTurn`       | tüm Gateway sahipli oturumlar                           | Bir sıra için etkin yakalama/sağlayıcı/ajan/TTS işini iptal eder.                                                                                                                        |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Kullanıcı sırasını mutlaka sonlandırmadan asistan ses çıktısını durdurur.                                                                                                                |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Relay tarafından yayılan bir sağlayıcı araç çağrısını tamamlar; ara çıktı için `options.willContinue` veya çağrıyı başka bir asistan yanıtı olmadan karşılamak için `options.suppressResponse` iletin. |
  | `talk.session.steer`            | ajan destekli Talk oturumları                           | Talk oturumundan çözümlenen etkin gömülü çalıştırmaya sözlü `status`, `steer`, `cancel` veya `followup` kontrolü gönderir.                                                              |
  | `talk.session.close`            | tüm birleşik oturumlar                                  | Relay oturumlarını durdurur veya yönetilen oda durumunu iptal eder, ardından birleşik oturum kimliğini unutur.                                                                          |

  Bunu çalıştırmak için core içine sağlayıcı veya platform özel durumları eklemeyin.
  Talk oturum semantiği core’a aittir. Sağlayıcı Plugin’leri satıcı oturumu kurulumuna sahiptir.
  Sesli arama ve Google Meet telefon/meeting adaptörlerine sahiptir. Tarayıcı ve native
  uygulamalar cihaz yakalama/oynatma UX’ine sahiptir.

  ## Uyumluluk ilkesi

  Harici Plugin’ler için uyumluluk işi şu sırayı izler:

  1. yeni sözleşmeyi ekleyin
  2. eski davranışı bir uyumluluk adaptörü üzerinden bağlı tutun
  3. eski yolu ve yerine geçeni adlandıran bir tanılama veya uyarı yayımlayın
  4. testlerde iki yolu da kapsayın
  5. kullanımdan kaldırmayı ve geçiş yolunu belgeleyin
  6. yalnızca duyurulan geçiş penceresinden sonra, genellikle büyük bir sürümde kaldırın

  Bakımcılar mevcut geçiş kuyruğunu
  `pnpm plugins:boundary-report` ile denetleyebilir. Kompakt sayımlar için
  `pnpm plugins:boundary-report:summary`, tek bir Plugin veya uyumluluk sahibi için
  `--owner <id>` ve bir CI kapısının süresi gelen uyumluluk kayıtları,
  sahipler arası ayrılmış SDK import’ları veya kullanılmayan ayrılmış SDK
  alt yolları nedeniyle başarısız olması gerektiğinde
  `pnpm plugins:boundary-report:ci` kullanın. Rapor, kullanımdan kaldırılmış
  uyumluluk kayıtlarını kaldırma tarihine göre gruplar, yerel kod/docs referanslarını
  sayar, sahipler arası ayrılmış SDK import’larını ortaya çıkarır ve özel
  memory-host SDK köprüsünü özetler; böylece uyumluluk temizliği ad hoc aramalara
  dayanmak yerine açık kalır. Ayrılmış SDK alt yollarında izlenen sahip kullanımı
  olmalıdır; kullanılmayan ayrılmış yardımcı export’ları genel SDK’dan kaldırılmalıdır.

  Bir manifest alanı hâlâ kabul ediliyorsa, Plugin yazarları docs ve tanılamalar
  aksini söyleyene kadar bunu kullanmaya devam edebilir. Yeni kod belgelenmiş
  yerine geçeni tercih etmelidir, ancak mevcut Plugin’ler olağan küçük
  sürümlerde bozulmamalıdır.

  ## Nasıl geçiş yapılır

  <Steps>
  <Step title="Runtime config yükleme/yazma yardımcılarını geçirin">
    Paketli Plugin’ler doğrudan
    `api.runtime.config.loadConfig()` ve
    `api.runtime.config.writeConfigFile(...)` çağırmayı bırakmalıdır. Etkin çağrı
    yoluna zaten iletilmiş config’i tercih edin. Geçerli işlem anlık görüntüsüne
    ihtiyaç duyan uzun ömürlü handler’lar `api.runtime.config.current()` kullanabilir.
    Uzun ömürlü ajan araçları, bir config yazımından önce oluşturulan aracın hâlâ
    yenilenmiş runtime config’i görmesi için `execute` içinde araç context’inin
    `ctx.getRuntimeConfig()` değerini kullanmalıdır.

    Config yazımları transaction yardımcılarından geçmeli ve bir yazma sonrası
    ilkesi seçmelidir:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Çağıran taraf değişikliğin temiz bir gateway yeniden başlatması gerektirdiğini
    bildiğinde `afterWrite: { mode: "restart", reason: "..." }` kullanın; yalnızca
    çağıran taraf takip işine sahip olduğunda ve reload planner’ı bilinçli olarak
    bastırmak istediğinde `afterWrite: { mode: "none", reason: "..." }` kullanın.
    Mutasyon sonuçları testler ve loglama için typed bir `followUp` özeti içerir;
    yeniden başlatmayı uygulamak veya zamanlamak Gateway’in sorumluluğunda kalır.
    `loadConfig` ve `writeConfigFile`, geçiş penceresi sırasında harici Plugin’ler
    için kullanımdan kaldırılmış uyumluluk yardımcıları olarak kalır ve
    `runtime-config-load-write` uyumluluk koduyla bir kez uyarır. Paketli Plugin’ler
    ve repo runtime kodu
    `pnpm check:deprecated-api-usage` ve
    `pnpm check:no-runtime-action-load-config` içindeki tarayıcı korumalarıyla korunur:
    yeni üretim Plugin kullanımı doğrudan başarısız olur, doğrudan config yazımları
    başarısız olur, Gateway sunucu yöntemleri istek runtime anlık görüntüsünü
    kullanmalıdır, runtime kanal send/action/client yardımcıları config’i kendi
    sınırlarından almalıdır ve uzun ömürlü runtime modüllerinde izin verilen ortam
    `loadConfig()` çağrısı sıfırdır.

    Yeni Plugin kodu ayrıca geniş
    `openclaw/plugin-sdk/config-runtime` uyumluluk barrel’ını import etmekten
    kaçınmalıdır. İşe uyan dar SDK alt yolunu kullanın:

    | İhtiyaç | Import |
    | --- | --- |
    | `OpenClawConfig` gibi config türleri | `openclaw/plugin-sdk/config-contracts` |
    | Zaten yüklenmiş config doğrulamaları ve plugin-entry config araması | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Geçerli runtime anlık görüntüsü okumaları | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Config yazımları | `openclaw/plugin-sdk/config-mutation` |
    | Oturum deposu yardımcıları | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown tablo config’i | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Grup ilkesi runtime yardımcıları | `openclaw/plugin-sdk/runtime-group-policy` |
    | Secret input çözümleme | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model/oturum override’ları | `openclaw/plugin-sdk/model-session-runtime` |

    Paketli Plugin’ler ve testleri geniş barrel’a karşı tarayıcı korumalıdır;
    böylece import’lar ve mock’lar ihtiyaç duydukları davranışa yerel kalır.
    Geniş barrel harici uyumluluk için hâlâ vardır, ancak yeni kod buna
    bağımlı olmamalıdır.

  </Step>

  <Step title="Gömülü araç sonucu uzantılarını middleware’e geçirin">
    Paketli Plugin’ler yalnızca embedded-runner’a özgü
    `api.registerEmbeddedExtensionFactory(...)` araç sonucu handler’larını
    runtime’dan bağımsız middleware ile değiştirmelidir.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Aynı anda Plugin manifest’ini güncelleyin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Yüklü Plugin’ler, açıkça etkinleştirildiklerinde ve hedeflenen her runtime’ı
    `contracts.agentToolResultMiddleware` içinde bildirdiklerinde araç sonucu
    middleware’i de kaydedebilir. Bildirilmemiş yüklü middleware kayıtları
    reddedilir.

  </Step>

  <Step title="Approval-native handler’ları capability fact’lerine geçirin">
    Approval yetenekli kanal Plugin’leri artık native approval davranışını
    `approvalCapability.nativeRuntime` ve paylaşılan runtime-context registry
    üzerinden açığa çıkarır.

    Temel değişiklikler:

    - `approvalCapability.handler.loadRuntime(...)` yerine
      `approvalCapability.nativeRuntime` kullanın
    - Approval’a özgü auth/delivery işlemlerini legacy `plugin.auth` /
      `plugin.approvals` bağlantısından `approvalCapability` üzerine taşıyın
    - `ChannelPlugin.approvals` genel channel-plugin sözleşmesinden kaldırıldı;
      delivery/native/render alanlarını `approvalCapability` üzerine taşıyın
    - `plugin.auth` yalnızca kanal login/logout akışları için kalır; oradaki
      approval auth hook’ları artık core tarafından okunmaz
    - Client’lar, token’lar veya Bolt uygulamaları gibi kanal sahipli runtime
      nesnelerini `openclaw/plugin-sdk/channel-runtime-context` üzerinden kaydedin
    - Native approval handler’larından Plugin sahipli yeniden yönlendirme
      bildirimleri göndermeyin; core artık gerçek teslim sonuçlarından
      routed-elsewhere bildirimlerine sahiptir
    - `createChannelManager(...)` içine `channelRuntime` iletirken gerçek bir
      `createPluginRuntime().channel` yüzeyi sağlayın. Kısmi stub’lar reddedilir.

    Geçerli approval capability düzeni için `/plugins/sdk-channel-plugins` bölümüne bakın.

  </Step>

  <Step title="Windows wrapper fallback davranışını denetleyin">
    Plugin’iniz `openclaw/plugin-sdk/windows-spawn` kullanıyorsa, çözümlenmemiş
    Windows `.cmd`/`.bat` wrapper’ları artık siz açıkça
    `allowShellFallback: true` iletmedikçe kapalı başarısız olur.

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

    Çağıran tarafınız shell fallback’e bilinçli olarak dayanmıyorsa
    `allowShellFallback` ayarlamayın ve bunun yerine fırlatılan hatayı işleyin.

  </Step>

  <Step title="Kullanımdan kaldırılmış import’ları bulun">
    Plugin’inizde kullanımdan kaldırılmış iki yüzeyden herhangi birinden import
    arayın:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Odaklı import’larla değiştirin">
    Eski yüzeydeki her export belirli bir modern import yoluna eşlenir:

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

    Host tarafı yardımcıları için doğrudan import etmek yerine enjekte edilen
    Plugin runtime’ını kullanın:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Aynı desen, diğer eski köprü yardımcıları için de geçerlidir:

    | Eski içe aktarma | Modern eşdeğeri |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | oturum deposu yardımcıları | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Geniş infra-runtime içe aktarmalarını değiştir">
    `openclaw/plugin-sdk/infra-runtime`, dış uyumluluk için hâlâ vardır,
    ancak yeni kod gerçekten ihtiyaç duyduğu odaklanmış yardımcı yüzeyi içe
    aktarmalıdır:

    | İhtiyaç | İçe aktarma |
    | --- | --- |
    | Sistem olay kuyruğu yardımcıları | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat uyandırma, olay ve görünürlük yardımcıları | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Bekleyen teslimat kuyruğunu boşaltma | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Kanal etkinliği telemetrisi | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Bellek içi ve kalıcı depolama destekli tekilleştirme önbellekleri | `openclaw/plugin-sdk/dedupe-runtime` |
    | Güvenli yerel dosya/medya yolu yardımcıları | `openclaw/plugin-sdk/file-access-runtime` |
    | Dağıtıcıdan haberdar fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy ve korumalı fetch yardımcıları | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF dağıtıcı ilkesi türleri | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Onay isteği/çözümleme türleri | `openclaw/plugin-sdk/approval-runtime` |
    | Onay yanıtı yükü ve komut yardımcıları | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Hata biçimlendirme yardımcıları | `openclaw/plugin-sdk/error-runtime` |
    | Taşıma hazır olma beklemeleri | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Güvenli token yardımcıları | `openclaw/plugin-sdk/secure-random-runtime` |
    | Sınırlı eşzamansız görev eşzamanlılığı | `openclaw/plugin-sdk/concurrency-runtime` |
    | Sayısal dönüştürme | `openclaw/plugin-sdk/number-runtime` |
    | Sürece yerel eşzamansız kilit | `openclaw/plugin-sdk/async-lock-runtime` |
    | Dosya kilitleri | `openclaw/plugin-sdk/file-lock` |

    Birlikte gelen Plugin'ler `infra-runtime` kullanımına karşı tarayıcıyla
    korunur, bu nedenle repo kodu geniş barrel'a geri dönemez.

  </Step>

  <Step title="Kanal rota yardımcılarını taşı">
    Yeni kanal rota kodu `openclaw/plugin-sdk/channel-route` kullanmalıdır.
    Eski route-key ve comparable-target adları, geçiş dönemi boyunca uyumluluk
    takma adları olarak kalır; ancak yeni Plugin'ler davranışı doğrudan
    açıklayan rota adlarını kullanmalıdır:

    | Eski yardımcı | Modern yardımcı |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Modern rota yardımcıları `{ channel, to, accountId, threadId }` değerlerini
    yerel onaylar, yanıt bastırma, gelen tekilleştirme, Cron teslimi ve oturum
    yönlendirmesi genelinde tutarlı şekilde normalleştirir.

    `ChannelMessagingAdapter.parseExplicitTarget` veya ayrıştırıcı destekli
    yüklü rota yardımcıları (`parseExplicitTargetForLoadedChannel` ya da
    `resolveRouteTargetForLoadedChannel`) veya `plugin-sdk/channel-route`
    içinden `resolveChannelRouteTargetWithParser(...)` için yeni kullanım
    eklemeyin. Bu hook'lar kullanımdan kaldırılmıştır ve geçiş dönemi boyunca
    yalnızca eski Plugin'ler için kalır. Yeni kanal Plugin'leri, hedef kimliği
    normalleştirme ve dizin kaçırma geri dönüşü için
    `messaging.targetResolver.resolveTarget(...)`, çekirdeğin erken bir eş türüne
    ihtiyaç duyduğu durumlarda `messaging.inferTargetChatType(...)` ve sağlayıcıya
    özgü oturum ile iş parçacığı kimliği için
    `messaging.resolveOutboundSessionRoute(...)` kullanmalıdır.

  </Step>

  <Step title="Derle ve test et">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## İçe aktarma yolu referansı

  <Accordion title="Common import path table">
  | İçe aktarma yolu | Amaç | Temel dışa aktarımlar |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanonik Plugin giriş yardımcısı | `definePluginEntry` |
  | `plugin-sdk/core` | Kanal giriş tanımları/oluşturucuları için eski şemsiye yeniden dışa aktarımı | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Kök yapılandırma şeması dışa aktarımı | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Tek sağlayıcılı giriş yardımcısı | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Odaklanmış kanal giriş tanımları ve oluşturucuları | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları | Kurulum çevirmeni, izin listesi istemleri, kurulum durumu oluşturucuları |
  | `plugin-sdk/setup-runtime` | Kurulum zamanı çalışma zamanı yardımcıları | `createSetupTranslator`, içe aktarma açısından güvenli kurulum yaması bağdaştırıcıları, arama notu yardımcıları, `promptResolvedAllowFrom`, `splitSetupEntries`, devredilmiş kurulum proxy’leri |
  | `plugin-sdk/setup-adapter-runtime` | Kullanımdan kaldırılmış kurulum bağdaştırıcısı takma adı | `plugin-sdk/setup-runtime` kullanın |
  | `plugin-sdk/setup-tools` | Kurulum araçları yardımcıları | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Çoklu hesap yardımcıları | Hesap listesi/yapılandırma/eylem kapısı yardımcıları |
  | `plugin-sdk/account-id` | Hesap kimliği yardımcıları | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalleştirme |
  | `plugin-sdk/account-resolution` | Hesap arama yardımcıları | Hesap arama + varsayılan geri dönüş yardımcıları |
  | `plugin-sdk/account-helpers` | Dar kapsamlı hesap yardımcıları | Hesap listesi/hesap eylemi yardımcıları |
  | `plugin-sdk/channel-setup` | Kurulum sihirbazı bağdaştırıcıları | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM eşleştirme ilkel öğeleri | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Yanıt öneki, yazıyor göstergesi ve kaynak teslimatı bağlantıları | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Yapılandırma bağdaştırıcısı fabrikaları ve DM erişim yardımcıları | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Yapılandırma şeması oluşturucuları | Paylaşılan kanal yapılandırma şeması ilkel öğeleri ve yalnızca genel oluşturucu |
  | `plugin-sdk/bundled-channel-config-schema` | Paketlenmiş yapılandırma şemaları | Yalnızca OpenClaw tarafından bakımı yapılan paketlenmiş plugin’ler; yeni plugin’ler plugin’e yerel şemalar tanımlamalıdır |
  | `plugin-sdk/channel-config-schema-legacy` | Kullanımdan kaldırılmış paketlenmiş yapılandırma şemaları | Yalnızca uyumluluk takma adı; bakımı yapılan paketlenmiş plugin’ler için `plugin-sdk/bundled-channel-config-schema` kullanın |
  | `plugin-sdk/telegram-command-config` | Telegram komut yapılandırması yardımcıları | Komut adı normalleştirme, açıklama kırpma, yinelenen/çakışan doğrulama |
  | `plugin-sdk/channel-policy` | Grup/DM ilkesi çözümleme | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Kullanımdan kaldırılmış uyumluluk cephesi | `plugin-sdk/channel-outbound` kullanın |
  | `plugin-sdk/inbound-envelope` | Gelen zarf yardımcıları | Paylaşılan rota + zarf oluşturucu yardımcıları |
  | `plugin-sdk/channel-inbound` | Gelen alma yardımcıları | Bağlam oluşturma, biçimlendirme, kökler, çalıştırıcılar, hazırlanmış yanıt gönderimi ve gönderim koşulları |
  | `plugin-sdk/messaging-targets` | Kullanımdan kaldırılmış hedef ayrıştırma içe aktarma yolu | Genel hedef ayrıştırma yardımcıları için `plugin-sdk/channel-targets`, rota karşılaştırması için `plugin-sdk/channel-route` ve sağlayıcıya özgü hedef çözümleme için plugin’in sahip olduğu `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` kullanın |
  | `plugin-sdk/outbound-media` | Giden medya yardımcıları | Paylaşılan giden medya yükleme |
  | `plugin-sdk/outbound-send-deps` | Kullanımdan kaldırılmış uyumluluk cephesi | `plugin-sdk/channel-outbound` kullanın |
  | `plugin-sdk/channel-outbound` | Giden ileti yaşam döngüsü yardımcıları | İleti bağdaştırıcıları, alındılar, kalıcı gönderme yardımcıları, canlı önizleme/akış yardımcıları, yanıt seçenekleri, yaşam döngüsü yardımcıları, giden kimliği ve yük planlama |
  | `plugin-sdk/channel-streaming` | Kullanımdan kaldırılmış uyumluluk cephesi | `plugin-sdk/channel-outbound` kullanın |
  | `plugin-sdk/outbound-runtime` | Kullanımdan kaldırılmış uyumluluk cephesi | `plugin-sdk/channel-outbound` kullanın |
  | `plugin-sdk/thread-bindings-runtime` | İş parçacığı bağlama yardımcıları | İş parçacığı bağlama yaşam döngüsü ve bağdaştırıcı yardımcıları |
  | `plugin-sdk/agent-media-payload` | Eski medya yükü yardımcıları | Eski alan yerleşimleri için aracı medya yükü oluşturucu |
  | `plugin-sdk/channel-runtime` | Kullanımdan kaldırılmış uyumluluk shim’i | Yalnızca eski kanal çalışma zamanı yardımcı programları |
  | `plugin-sdk/channel-send-result` | Gönderme sonucu türleri | Yanıt sonucu türleri |
  | `plugin-sdk/runtime-store` | Kalıcı Plugin depolaması | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Geniş kapsamlı çalışma zamanı yardımcıları | Çalışma zamanı/günlükleme/yedekleme/plugin kurulum yardımcıları |
  | `plugin-sdk/runtime-env` | Dar kapsamlı çalışma zamanı ortam yardımcıları | Günlükleyici/çalışma zamanı ortamı, zaman aşımı, yeniden deneme ve geri çekilme yardımcıları |
  | `plugin-sdk/plugin-runtime` | Paylaşılan Plugin çalışma zamanı yardımcıları | Plugin komutları/hook’ları/http/etkileşimli yardımcıları |
  | `plugin-sdk/hook-runtime` | Hook işlem hattı yardımcıları | Paylaşılan Webhook/dahili hook işlem hattı yardımcıları |
  | `plugin-sdk/lazy-runtime` | Tembel çalışma zamanı yardımcıları | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Süreç yardımcıları | Paylaşılan exec yardımcıları |
  | `plugin-sdk/cli-runtime` | CLI çalışma zamanı yardımcıları | Komut biçimlendirme, beklemeler, sürüm yardımcıları |
  | `plugin-sdk/gateway-runtime` | Gateway yardımcıları | Gateway istemcisi, olay döngüsü hazır başlatma yardımcısı, duyurulan LAN ana makine çözümlemesi ve kanal durumu yaması yardımcıları |
  | `plugin-sdk/config-runtime` | Kullanımdan kaldırılmış yapılandırma uyumluluğu shim’i | `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` ve `config-mutation` tercih edin |
  | `plugin-sdk/telegram-command-config` | Telegram komut yardımcıları | Paketlenmiş Telegram sözleşme yüzeyi kullanılamadığında geri dönüşte kararlı Telegram komutu doğrulama yardımcıları |
  | `plugin-sdk/approval-runtime` | Onay istemi yardımcıları | Exec/plugin onay yükü, onay yeteneği/profil yardımcıları, yerel onay yönlendirme/çalışma zamanı yardımcıları ve yapılandırılmış onay gösterim yolu biçimlendirme |
  | `plugin-sdk/approval-auth-runtime` | Onay kimlik doğrulama yardımcıları | Onaylayan çözümleme, aynı sohbet eylem yetkilendirmesi |
  | `plugin-sdk/approval-client-runtime` | Onay istemcisi yardımcıları | Yerel exec onayı profili/filtre yardımcıları |
  | `plugin-sdk/approval-delivery-runtime` | Onay teslimatı yardımcıları | Yerel onay yeteneği/teslimat bağdaştırıcıları |
  | `plugin-sdk/approval-gateway-runtime` | Onay Gateway yardımcıları | Paylaşılan onay Gateway çözümleme yardımcısı |
  | `plugin-sdk/approval-handler-adapter-runtime` | Onay bağdaştırıcısı yardımcıları | Sıcak kanal giriş noktaları için hafif yerel onay bağdaştırıcısı yükleme yardımcıları |
  | `plugin-sdk/approval-handler-runtime` | Onay işleyici yardımcıları | Daha geniş onay işleyici çalışma zamanı yardımcıları; yeterli olduklarında daha dar bağdaştırıcı/Gateway arayüzlerini tercih edin |
  | `plugin-sdk/approval-native-runtime` | Onay hedefi yardımcıları | Yerel onay hedefi/hesap bağlama yardımcıları |
  | `plugin-sdk/approval-reply-runtime` | Onay yanıtı yardımcıları | Exec/plugin onay yanıtı yükü yardımcıları |
  | `plugin-sdk/channel-runtime-context` | Kanal çalışma zamanı bağlamı yardımcıları | Genel kanal çalışma zamanı bağlamı kaydet/al/izle yardımcıları |
  | `plugin-sdk/security-runtime` | Güvenlik yardımcıları | Paylaşılan güven, DM geçitleme, kökle sınırlı dosya/yol yardımcıları, dış içerik ve sır toplama yardımcıları |
  | `plugin-sdk/ssrf-policy` | SSRF ilkesi yardımcıları | Ana makine izin listesi ve özel ağ ilkesi yardımcıları |
  | `plugin-sdk/ssrf-runtime` | SSRF çalışma zamanı yardımcıları | Sabitlenmiş dispatcher, korumalı fetch, SSRF ilkesi yardımcıları |
  | `plugin-sdk/system-event-runtime` | Sistem olayı yardımcıları | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat yardımcıları | Heartbeat uyandırma, olay ve görünürlük yardımcıları |
  | `plugin-sdk/delivery-queue-runtime` | Teslimat kuyruğu yardımcıları | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Kanal etkinliği yardımcıları | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Yinelenenleri ayıklama yardımcıları | Bellek içi ve kalıcı destekli yinelenenleri ayıklama önbellekleri |
  | `plugin-sdk/file-access-runtime` | Dosya erişimi yardımcıları | Güvenli yerel dosya/medya yolu yardımcıları |
  | `plugin-sdk/transport-ready-runtime` | Taşıma hazır olma yardımcıları | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Exec onayı ilkesi yardımcıları | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Sınırlı önbellek yardımcıları | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Tanılama geçitleme yardımcıları | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hata biçimlendirme yardımcıları | `formatUncaughtError`, `isApprovalNotFoundError`, hata grafiği yardımcıları |
  | `plugin-sdk/fetch-runtime` | Sarmalanmış fetch/proxy yardımcıları | `resolveFetch`, proxy yardımcıları, EnvHttpProxyAgent seçenek yardımcıları |
  | `plugin-sdk/host-runtime` | Ana makine normalleştirme yardımcıları | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Yeniden deneme yardımcıları | `RetryConfig`, `retryAsync`, ilke çalıştırıcıları |
  | `plugin-sdk/allow-from` | İzin listesi biçimlendirme ve girdi eşleme | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Komut geçitleme ve komut yüzeyi yardımcıları | `resolveControlCommandGate`, gönderici yetkilendirme yardımcıları, dinamik argüman menüsü biçimlendirmeyi de içeren komut kayıt defteri yardımcıları |
  | `plugin-sdk/command-status` | Komut durumu/yardım işleyicileri | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Sır girdisi ayrıştırma | Sır girdisi yardımcıları |
  | `plugin-sdk/webhook-ingress` | Webhook isteği yardımcıları | Webhook hedef yardımcı programları |
  | `plugin-sdk/webhook-request-guards` | Webhook gövde koruması yardımcıları | İstek gövdesi okuma/sınır yardımcıları |
  | `plugin-sdk/reply-runtime` | Paylaşılan yanıt çalışma zamanı | Gelen gönderim, Heartbeat, yanıt planlayıcı, parçalama |
  | `plugin-sdk/reply-dispatch-runtime` | Dar kapsamlı yanıt gönderimi yardımcıları | Sonlandırma, sağlayıcı gönderimi ve konuşma etiketi yardımcıları |
  | `plugin-sdk/reply-history` | Yanıt geçmişi yardımcıları | `createChannelHistoryWindow`; `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` ve `clearHistoryEntriesIfEnabled` gibi kullanımdan kaldırılmış harita yardımcısı uyumluluk dışa aktarımları |
  | `plugin-sdk/reply-reference` | Yanıt referansı planlama | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Yanıt parçalama yardımcıları | Metin/markdown parçalama yardımcıları |
  | `plugin-sdk/session-store-runtime` | Oturum deposu yardımcıları | Depo yolu + güncellenme zamanı yardımcıları |
  | `plugin-sdk/state-paths` | Durum yolu yardımcıları | Durum ve OAuth dizini yardımcıları |
  | `plugin-sdk/routing` | Yönlendirme/oturum anahtarı yardımcıları | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, oturum anahtarı normalleştirme yardımcıları |
  | `plugin-sdk/status-helpers` | Kanal durumu yardımcıları | Kanal/hesap durumu özeti oluşturucuları, çalışma zamanı durumu varsayılanları, sorun meta verisi yardımcıları |
  | `plugin-sdk/target-resolver-runtime` | Hedef çözümleyici yardımcıları | Paylaşılan hedef çözümleyici yardımcıları |
  | `plugin-sdk/string-normalization-runtime` | Dize normalleştirme yardımcıları | Slug/dize normalleştirme yardımcıları |
  | `plugin-sdk/request-url` | İstek URL'si yardımcıları | İstek benzeri girdilerden dize URL'leri çıkarır |
  | `plugin-sdk/run-command` | Zaman sınırlı komut yardımcıları | Normalleştirilmiş stdout/stderr ile zaman sınırlı komut çalıştırıcı |
  | `plugin-sdk/param-readers` | Parametre okuyucuları | Ortak araç/CLI parametre okuyucuları |
  | `plugin-sdk/tool-payload` | Araç yükü çıkarımı | Araç sonuç nesnelerinden normalleştirilmiş yükleri çıkarır |
  | `plugin-sdk/tool-send` | Araç gönderim çıkarımı | Araç argümanlarından kanonik gönderim hedefi alanlarını çıkarır |
  | `plugin-sdk/temp-path` | Geçici yol yardımcıları | Paylaşılan geçici indirme yolu yardımcıları |
  | `plugin-sdk/logging-core` | Günlükleme yardımcıları | Alt sistem günlükleyicisi ve redaksiyon yardımcıları |
  | `plugin-sdk/markdown-table-runtime` | Markdown tablo yardımcıları | Markdown tablo modu yardımcıları |
  | `plugin-sdk/reply-payload` | İleti yanıt türleri | Yanıt yükü türleri |
  | `plugin-sdk/provider-setup` | Derlenmiş yerel/kendi barındırılan sağlayıcı kurulum yardımcıları | Kendi barındırılan sağlayıcı keşif/yapılandırma yardımcıları |
  | `plugin-sdk/self-hosted-provider-setup` | Odaklanmış OpenAI uyumlu kendi barındırılan sağlayıcı kurulum yardımcıları | Aynı kendi barındırılan sağlayıcı keşif/yapılandırma yardımcıları |
  | `plugin-sdk/provider-auth-runtime` | Sağlayıcı çalışma zamanı kimlik doğrulama yardımcıları | Çalışma zamanı API anahtarı çözümleme yardımcıları |
  | `plugin-sdk/provider-auth-api-key` | Sağlayıcı API anahtarı kurulum yardımcıları | API anahtarı alıştırma/profil yazma yardımcıları |
  | `plugin-sdk/provider-auth-result` | Sağlayıcı kimlik doğrulama sonucu yardımcıları | Standart OAuth kimlik doğrulama sonucu oluşturucu |
  | `plugin-sdk/provider-selection-runtime` | Sağlayıcı seçimi yardımcıları | Yapılandırılmış veya otomatik sağlayıcı seçimi ve ham sağlayıcı yapılandırması birleştirme |
  | `plugin-sdk/provider-env-vars` | Sağlayıcı ortam değişkeni yardımcıları | Sağlayıcı kimlik doğrulama ortam değişkeni arama yardımcıları |
  | `plugin-sdk/provider-model-shared` | Paylaşılan sağlayıcı model/yeniden oynatma yardımcıları | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan yeniden oynatma ilkesi oluşturucuları, sağlayıcı uç noktası yardımcıları ve model kimliği normalleştirme yardımcıları |
  | `plugin-sdk/provider-catalog-shared` | Paylaşılan sağlayıcı katalog yardımcıları | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Sağlayıcı alıştırma yamaları | Alıştırma yapılandırma yardımcıları |
  | `plugin-sdk/provider-http` | Sağlayıcı HTTP yardımcıları | Ses transkripsiyonu multipart form yardımcıları dahil genel sağlayıcı HTTP/uç nokta yetenek yardımcıları |
  | `plugin-sdk/provider-web-fetch` | Sağlayıcı web-fetch yardımcıları | Web-fetch sağlayıcı kayıt/önbellek yardımcıları |
  | `plugin-sdk/provider-web-search-config-contract` | Sağlayıcı web arama yapılandırması yardımcıları | Plugin etkinleştirme kablolamasına ihtiyaç duymayan sağlayıcılar için dar web arama yapılandırması/kimlik bilgisi yardımcıları |
  | `plugin-sdk/provider-web-search-contract` | Sağlayıcı web arama sözleşmesi yardımcıları | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcıları/alıcıları gibi dar web arama yapılandırması/kimlik bilgisi sözleşme yardımcıları |
  | `plugin-sdk/provider-web-search` | Sağlayıcı web arama yardımcıları | Web arama sağlayıcı kayıt/önbellek/çalışma zamanı yardımcıları |
  | `plugin-sdk/provider-tools` | Sağlayıcı araç/şema uyumluluk yardımcıları | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` ve DeepSeek/Gemini/OpenAI şema temizliği + tanılamalar |
  | `plugin-sdk/provider-usage` | Sağlayıcı kullanım yardımcıları | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` ve diğer sağlayıcı kullanım yardımcıları |
  | `plugin-sdk/provider-stream` | Sağlayıcı akış sarmalayıcı yardımcıları | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
  | `plugin-sdk/provider-transport-runtime` | Sağlayıcı taşıma yardımcıları | Korumalı fetch, araç sonucu metin çıkarımı, taşıma ileti dönüşümleri ve yazılabilir taşıma olay akışları gibi yerel sağlayıcı taşıma yardımcıları |
  | `plugin-sdk/keyed-async-queue` | Sıralı eşzamansız kuyruk | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Paylaşılan medya yardımcıları | Medya getirme/dönüştürme/depolama yardımcıları, ffprobe destekli video boyutu sondalama ve medya yükü oluşturucuları |
  | `plugin-sdk/media-generation-runtime` | Paylaşılan medya oluşturma yardımcıları | Görsel/video/müzik oluşturma için paylaşılan devretme yardımcıları, aday seçimi ve eksik model iletileri |
  | `plugin-sdk/media-understanding` | Medya anlama yardımcıları | Medya anlama sağlayıcı türleri ve sağlayıcıya yönelik görsel/ses yardımcı dışa aktarımları |
  | `plugin-sdk/text-runtime` | Kullanımdan kaldırılmış geniş metin uyumluluğu dışa aktarımı | `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` ve `logging-core` kullanın |
  | `plugin-sdk/text-chunking` | Metin parçalama yardımcıları | Giden metin parçalama yardımcısı |
  | `plugin-sdk/speech` | Konuşma yardımcıları | Konuşma sağlayıcı türleri ve sağlayıcıya yönelik yönerge, kayıt, doğrulama yardımcıları ve OpenAI uyumlu TTS oluşturucu |
  | `plugin-sdk/speech-core` | Paylaşılan konuşma çekirdeği | Konuşma sağlayıcı türleri, kayıt, yönergeler, normalleştirme |
  | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon yardımcıları | Sağlayıcı türleri, kayıt yardımcıları ve paylaşılan WebSocket oturum yardımcısı |
  | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses yardımcıları | Sağlayıcı türleri, kayıt/çözümleme yardımcıları, köprü oturumu yardımcıları, paylaşılan aracı geri konuşma kuyrukları, etkin çalışma ses denetimi, transkript/olay sağlığı, yankı bastırma, danışma sorusu eşleştirme, zorunlu danışma koordinasyonu, tur bağlamı takibi, çıktı etkinliği takibi ve hızlı bağlam danışma yardımcıları |
  | `plugin-sdk/image-generation` | Görsel oluşturma yardımcıları | Görsel oluşturma sağlayıcı türleri ve görsel varlık/veri URL'si yardımcıları ile OpenAI uyumlu görsel sağlayıcı oluşturucu |
  | `plugin-sdk/image-generation-core` | Paylaşılan görsel oluşturma çekirdeği | Görsel oluşturma türleri, devretme, kimlik doğrulama ve kayıt yardımcıları |
  | `plugin-sdk/music-generation` | Müzik oluşturma yardımcıları | Müzik oluşturma sağlayıcı/istek/sonuç türleri |
  | `plugin-sdk/music-generation-core` | Paylaşılan müzik oluşturma çekirdeği | Müzik oluşturma türleri, devretme yardımcıları, sağlayıcı arama ve model referansı ayrıştırma |
  | `plugin-sdk/video-generation` | Video oluşturma yardımcıları | Video oluşturma sağlayıcı/istek/sonuç türleri |
  | `plugin-sdk/video-generation-core` | Paylaşılan video oluşturma çekirdeği | Video oluşturma türleri, devretme yardımcıları, sağlayıcı arama ve model referansı ayrıştırma |
  | `plugin-sdk/interactive-runtime` | Etkileşimli yanıt yardımcıları | Etkileşimli yanıt yükü normalleştirme/indirgeme |
  | `plugin-sdk/channel-config-primitives` | Kanal yapılandırma ilkelleri | Dar kanal yapılandırma şeması ilkelleri |
  | `plugin-sdk/channel-config-writes` | Kanal yapılandırması yazma yardımcıları | Kanal yapılandırması yazma yetkilendirme yardımcıları |
  | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal başlangıcı | Paylaşılan kanal Plugin başlangıç dışa aktarımları |
  | `plugin-sdk/channel-status` | Kanal durumu yardımcıları | Paylaşılan kanal durumu anlık görüntü/özet yardımcıları |
  | `plugin-sdk/allowlist-config-edit` | İzin listesi yapılandırma yardımcıları | İzin listesi yapılandırma düzenleme/okuma yardımcıları |
  | `plugin-sdk/group-access` | Grup erişimi yardımcıları | Paylaşılan grup erişimi karar yardımcıları |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Kullanımdan kaldırılmış uyumluluk cepheleri | `plugin-sdk/channel-inbound` kullanın |
  | `plugin-sdk/direct-dm-guard-policy` | Doğrudan DM koruma yardımcıları | Dar kripto öncesi koruma ilkesi yardımcıları |
  | `plugin-sdk/extension-shared` | Paylaşılan uzantı yardımcıları | Pasif kanal/durum ve ortam proxy yardımcısı ilkelleri |
  | `plugin-sdk/webhook-targets` | Webhook hedef yardımcıları | Webhook hedef kaydı ve rota kurulum yardımcıları |
  | `plugin-sdk/webhook-path` | Kullanımdan kaldırılmış Webhook yolu takma adı | `plugin-sdk/webhook-ingress` kullanın |
  | `plugin-sdk/web-media` | Paylaşılan web medya yardımcıları | Uzak/yerel medya yükleme yardımcıları |
  | `plugin-sdk/zod` | Kullanımdan kaldırılmış Zod uyumluluk yeniden dışa aktarımı | `zod` paketinden doğrudan `zod` içe aktarın |
  | `plugin-sdk/memory-core` | Paketlenmiş bellek çekirdeği yardımcıları | Bellek yöneticisi/yapılandırma/dosya/CLI yardımcı yüzeyi |
  | `plugin-sdk/memory-core-engine-runtime` | Bellek motoru çalışma zamanı cephesi | Bellek dizin/arama çalışma zamanı cephesi |
  | `plugin-sdk/memory-core-host-embedding-registry` | Bellek gömme kaydı | Hafif bellek gömme sağlayıcısı kayıt yardımcıları |
  | `plugin-sdk/memory-core-host-engine-foundation` | Bellek ana makine temel motoru | Bellek ana makine temel motoru dışa aktarımları |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek ana makine gömme motoru | Bellek gömme sözleşmeleri, kayıt erişimi, yerel sağlayıcı ve genel toplu/uzak yardımcılar; somut uzak sağlayıcılar sahip oldukları Plugin'lerde bulunur |
  | `plugin-sdk/memory-core-host-engine-qmd` | Bellek ana makine QMD motoru | Bellek ana makine QMD motoru dışa aktarımları |
  | `plugin-sdk/memory-core-host-engine-storage` | Bellek ana makine depolama motoru | Bellek ana makine depolama motoru dışa aktarımları |
  | `plugin-sdk/memory-core-host-multimodal` | Bellek ana makine çok modlu yardımcıları | Bellek ana makine çok modlu yardımcıları |
  | `plugin-sdk/memory-core-host-query` | Bellek ana makine sorgu yardımcıları | Bellek ana makine sorgu yardımcıları |
  | `plugin-sdk/memory-core-host-secret` | Bellek ana makine gizli yardımcıları | Bellek ana makine gizli yardımcıları |
  | `plugin-sdk/memory-core-host-events` | Kullanımdan kaldırılmış bellek olay takma adı | `plugin-sdk/memory-host-events` kullanın |
  | `plugin-sdk/memory-core-host-status` | Bellek ana makine durumu yardımcıları | Bellek ana makine durumu yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-cli` | Bellek ana makine CLI çalışma zamanı | Bellek ana makine CLI çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-core` | Bellek ana makine çekirdek çalışma zamanı | Bellek ana makine çekirdek çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-files` | Bellek ana makine dosya/çalışma zamanı yardımcıları | Bellek ana makine dosya/çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-host-core` | Bellek ana makine çekirdek çalışma zamanı takma adı | Bellek ana makine çekirdek çalışma zamanı yardımcıları için satıcıdan bağımsız takma ad |
  | `plugin-sdk/memory-host-events` | Bellek ana makine olay günlüğü takma adı | Bellek ana makine olay günlüğü yardımcıları için satıcıdan bağımsız takma ad |
  | `plugin-sdk/memory-host-files` | Kullanımdan kaldırılmış bellek dosya/çalışma zamanı takma adı | `plugin-sdk/memory-core-host-runtime-files` kullanın |
  | `plugin-sdk/memory-host-markdown` | Yönetilen Markdown yardımcıları | Belleğe bitişik Plugin'ler için paylaşılan yönetilen Markdown yardımcıları |
  | `plugin-sdk/memory-host-search` | Active Memory arama cephesi | Geç yüklenen active-memory arama yöneticisi çalışma zamanı cephesi |
  | `plugin-sdk/memory-host-status` | Kullanımdan kaldırılmış bellek ana makine durumu takma adı | `plugin-sdk/memory-core-host-status` kullanın |
  | `plugin-sdk/testing` | Test yardımcı programları | Depo yerelinde kullanımdan kaldırılmış uyumluluk varili; `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` ve `plugin-sdk/test-fixtures` gibi odaklanmış depo yerel test alt yollarını kullanın |
</Accordion>

Bu tablo bilerek tam SDK yüzeyi değil, ortak geçiş alt kümesidir.
Derleyici giriş noktası envanteri
`scripts/lib/plugin-sdk-entrypoints.json` içinde yaşar; paket dışa aktarımları
herkese açık alt kümeden üretilir.

Ayrılmış yerleşik Plugin yardımcı birleşim noktaları, yayımlanmış
`@openclaw/discord@2026.3.13` paketi için tutulan, kullanımdan kaldırılmış
`plugin-sdk/discord` shim'i gibi açıkça belgelenmiş uyumluluk facadeleri
dışında herkese açık SDK dışa aktarma haritasından kaldırılmıştır. Sahibe özgü
yardımcılar, sahibi olan Plugin paketinin içinde yaşar; paylaşılan host davranışı
`plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` ve
`plugin-sdk/plugin-config-runtime` gibi genel SDK sözleşmeleri üzerinden
taşınmalıdır.

İşe uyan en dar import'u kullanın. Bir dışa aktarım bulamıyorsanız,
`src/plugin-sdk/` içindeki kaynağı kontrol edin veya bakımcılara bunun hangi
genel sözleşmeye ait olması gerektiğini sorun.

## Etkin kullanımdan kaldırmalar

Plugin SDK, sağlayıcı sözleşmesi, çalışma zamanı yüzeyi ve manifest genelinde
geçerli olan daha dar kullanımdan kaldırmalar. Her biri bugün hâlâ çalışır,
ancak gelecekteki bir major sürümde kaldırılacaktır. Her öğenin altındaki giriş,
eski API'yi kanonik karşılığına eşler.

<AccordionGroup>
  <Accordion title="command-auth yardım oluşturucuları → command-status">
    **Eski (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Yeni (`openclaw/plugin-sdk/command-status`)**: aynı imzalar, aynı
    dışa aktarımlar - yalnızca daha dar alt yoldan import edilir. `command-auth`
    bunları uyumluluk stub'ları olarak yeniden dışa aktarır.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention kapılama yardımcıları → resolveInboundMentionDecision">
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
    uyumluluk shim'idir. Yeni koddan import etmeyin; çalışma zamanı
    nesnelerini kaydetmek için `openclaw/plugin-sdk/channel-runtime-context`
    kullanın.

    `openclaw/plugin-sdk/channel-actions` içindeki `channelActions*`
    yardımcıları, ham "actions" kanal dışa aktarımlarıyla birlikte kullanımdan
    kaldırılmıştır. Yetenekleri bunun yerine anlamsal `presentation` yüzeyi
    üzerinden açığa çıkarın - kanal Plugin'leri hangi ham eylem adlarını kabul
    ettiklerini değil, ne render ettiklerini (kartlar, düğmeler, seçimler)
    bildirir.

  </Accordion>

  <Accordion title="Web arama sağlayıcısı tool() yardımcısı → Plugin üzerinde createTool()">
    **Eski**: `openclaw/plugin-sdk/provider-web-search` içinden `tool()`
    factory'si.

    **Yeni**: doğrudan sağlayıcı Plugin üzerinde `createTool(...)`
    uygulayın. OpenClaw artık araç sarmalayıcısını kaydetmek için SDK
    yardımcısına ihtiyaç duymaz.

  </Accordion>

  <Accordion title="Düz metin kanal zarfları → BodyForAgent">
    **Eski**: gelen kanal mesajlarından düz bir düz metin prompt zarfı
    oluşturmak için `formatInboundEnvelope(...)` (ve
    `ChannelMessageForAgent.channelEnvelope`).

    **Yeni**: `BodyForAgent` artı yapılandırılmış kullanıcı bağlamı blokları.
    Kanal Plugin'leri yönlendirme metadata'sını (thread, konu, yanıtlanan öğe,
    tepkiler) bir prompt string'ine birleştirmek yerine typed alanlar olarak
    ekler. `formatAgentEnvelope(...)` yardımcısı, sentezlenmiş asistan-facing
    zarflar için hâlâ desteklenir, ancak gelen düz metin zarflar kullanımdan
    kaldırılma yolundadır.

    Etkilenen alanlar: `inbound_claim`, `message_received` ve
    `channelEnvelope` metnini sonradan işleyen özel kanal Plugin'leri.

  </Accordion>

  <Accordion title="deactivate hook'u → gateway_stop">
    **Eski**: `api.on("deactivate", handler)`.

    **Yeni**: `api.on("gateway_stop", handler)`. Olay ve bağlam aynı kapanış
    temizliği sözleşmesidir; yalnızca hook adı değişir.

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

    `deactivate`, 2026-08-16 sonrasına kadar kullanımdan kaldırılmış bir
    uyumluluk alias'ı olarak bağlı kalır.

  </Accordion>

  <Accordion title="subagent_spawning hook'u → core thread binding">
    **Eski**: `threadBindingReady` veya `deliveryOrigin` döndüren
    `api.on("subagent_spawning", handler)`.

    **Yeni**: core'un kanal oturum-binding adaptörü üzerinden `thread: true`
    subagent binding'leri hazırlamasına izin verin. Yalnızca başlatma sonrası
    gözlem için `api.on("subagent_spawned", handler)` kullanın.

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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)`, external Plugin'ler
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

    Ayrıca eski `ProviderCapabilities` statik paketi - sağlayıcı Plugin'leri
    statik bir nesne yerine `buildReplayPolicy`, `normalizeToolSchemas` ve
    `wrapStreamFn` gibi açık sağlayıcı hook'ları kullanmalıdır.

  </Accordion>

  <Accordion title="Thinking politika hook'ları → resolveThinkingProfile">
    **Eski** (`ProviderThinkingPolicy` üzerinde üç ayrı hook):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` ve
    `resolveDefaultThinkingLevel(ctx)`.

    **Yeni**: kanonik `id`, isteğe bağlı `label` ve sıralanmış seviye listesi
    içeren bir `ProviderThinkingProfile` döndüren tek bir
    `resolveThinkingProfile(ctx)`. OpenClaw, eskimiş saklanan değerleri profil
    sırasına göre otomatik olarak düşürür.

    Bağlam `provider`, `modelId`, isteğe bağlı birleştirilmiş `reasoning` ve
    isteğe bağlı birleştirilmiş model `compat` olgularını içerir. Sağlayıcı
    Plugin'leri, modele özgü bir profili yalnızca yapılandırılmış istek
    sözleşmesi desteklediğinde açığa çıkarmak için bu katalog olgularını
    kullanabilir.

    Üç hook yerine bir hook uygulayın. Eski hook'lar kullanımdan kaldırma
    penceresi boyunca çalışmaya devam eder, ancak profil sonucuyla
    birleştirilmez.

  </Accordion>

  <Accordion title="External auth sağlayıcıları → contracts.externalAuthProviders">
    **Eski**: sağlayıcıyı Plugin manifest'inde bildirmeden external auth
    hook'ları uygulamak.

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

    **Yeni**: aynı env-var aramasını manifest üzerinde
    `setup.providers[].envVars` içine yansıtın. Bu, setup/status env
    metadata'sını tek yerde birleştirir ve env-var aramalarına yanıt vermek
    için Plugin çalışma zamanını başlatma ihtiyacını ortadan kaldırır.

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

    Aynı slot'lar, tek kayıt çağrısı. Eklemeli prompt ve corpus yardımcıları
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`)
    etkilenmez.

  </Accordion>

  <Accordion title="Memory embedding sağlayıcı API'si">
    **Eski**: `api.registerMemoryEmbeddingProvider(...)` artı
    `contracts.memoryEmbeddingProviders`.

    **Yeni**: `api.registerEmbeddingProvider(...)` artı
    `contracts.embeddingProviders`.

    Genel embedding sağlayıcı sözleşmesi memory dışında yeniden kullanılabilir
    ve yeni sağlayıcılar için desteklenen yoldur. Memory'ye özgü kayıt API'si,
    mevcut sağlayıcılar geçiş yaparken kullanımdan kaldırılmış uyumluluk olarak
    bağlı kalır. Plugin incelemesi, yerleşik olmayan kullanımı uyumluluk borcu
    olarak raporlar.

  </Accordion>

  <Accordion title="Subagent oturum mesajları türleri yeniden adlandırıldı">
    `src/plugins/runtime/types.ts` içinden hâlâ dışa aktarılan iki eski tür
    alias'ı:

    | Eski                          | Yeni                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Çalışma zamanı yöntemi `readSession`, `getSessionMessages` lehine
    kullanımdan kaldırılmıştır. Aynı imza; eski yöntem yeni yönteme çağrı
    iletir.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Eski**: `runtime.tasks.flow` (tekil), canlı bir task-flow erişimcisi
    döndürürdü.

    **Yeni**: `runtime.tasks.managedFlows`, bir flow'dan alt görevler oluşturan,
    güncelleyen, iptal eden veya çalıştıran Plugin'ler için yönetilen TaskFlow
    mutasyon çalışma zamanını korur. Plugin yalnızca DTO tabanlı okumalar
    gerektiriyorsa `runtime.tasks.flows` kullanın.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Gömülü extension factory'leri → agent tool-result middleware">
    Yukarıdaki "Geçiş nasıl yapılır → Gömülü tool-result extension'larını
    middleware'e taşıyın" bölümünde ele alınmıştır. Tamlık için burada da
    yer alır: kaldırılan yalnızca embedded-runner'a ait
    `api.registerEmbeddedExtensionFactory(...)` yolu,
    `contracts.agentToolResultMiddleware` içinde açık bir çalışma zamanı
    listesiyle `api.registerAgentToolResultMiddleware(...)` tarafından
    değiştirilir.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias'ı → OpenClawConfig">
    `openclaw/plugin-sdk` içinden yeniden dışa aktarılan `OpenClawSchemaType`
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
`extensions/` altındaki yerleşik kanal/sağlayıcı Plugin'ler içindeki
extension düzeyi kullanımdan kaldırmalar, kendi `api.ts` ve `runtime-api.ts`
barrel'larında izlenir. Üçüncü taraf Plugin sözleşmelerini etkilemezler ve
burada listelenmezler. Bir yerleşik Plugin'in yerel barrel'ını doğrudan
tüketiyorsanız, yükseltmeden önce o barrel'daki kullanımdan kaldırma
yorumlarını okuyun.
</Note>

## Kaldırma zaman çizelgesi

| Ne zaman               | Ne olur                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| **Şimdi**              | Kullanımdan kaldırılmış yüzeyler çalışma zamanı uyarıları yayınlar      |
| **Sonraki ana sürüm**  | Kullanımdan kaldırılmış yüzeyler kaldırılacak; bunları hâlâ kullanan Plugin'ler başarısız olacak |

Tüm çekirdek Plugin'ler zaten taşındı. Harici Plugin'ler sonraki ana sürümden
önce taşınmalıdır.

## Uyarıları geçici olarak bastırma

Taşıma üzerinde çalışırken şu ortam değişkenlerini ayarlayın:

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
- [Plugin Manifesti](/tr/plugins/manifest) - manifest şeması referansı
