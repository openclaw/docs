---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED uyarısını görüyorsunuz
    - OPENCLAW_EXTENSION_API_DEPRECATED uyarısını görüyorsunuz
    - 2026.4.25 sürümünden önce OpenClaw içinde api.registerEmbeddedExtensionFactory kullandınız
    - Bir Plugin'i modern Plugin mimarisine güncelliyorsunuz
    - Harici bir OpenClaw Plugin bakımını yapıyorsunuz
sidebarTitle: Migrate to SDK
summary: Eski geriye dönük uyumluluk katmanından modern plugin SDK'ye geçiş yap
title: Plugin SDK geçişi
x-i18n:
    generated_at: "2026-07-01T08:24:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f05bd42cc0a6fc53f6670377b4330bb452b2a06f4d0542a494875970ee81e08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw, geniş bir geriye dönük uyumluluk katmanından odaklı, belgelenmiş içe aktarmalara sahip modern bir Plugin
mimarisine geçti. Plugin'iniz yeni mimariden önce oluşturulduysa
bu kılavuz geçiş yapmanıza yardımcı olur.

## Neler değişiyor

Eski Plugin sistemi, Plugin'lerin ihtiyaç duydukları her şeyi tek bir giriş noktasından
içe aktarmasına izin veren iki geniş açık yüzey sağlıyordu:

- **`openclaw/plugin-sdk/compat`** - düzinelerce yardımcıyı yeniden dışa aktaran
  tek bir içe aktarma. Yeni Plugin mimarisi oluşturulurken eski hook tabanlı
  Plugin'lerin çalışmaya devam etmesi için eklenmişti.
- **`openclaw/plugin-sdk/infra-runtime`** - sistem olaylarını, Heartbeat durumunu, teslim kuyruklarını, fetch/proxy yardımcılarını,
  dosya yardımcılarını, onay türlerini ve ilgisiz yardımcı programları karıştıran
  geniş bir çalışma zamanı yardımcı barrel'i.
- **`openclaw/plugin-sdk/config-runtime`** - geçiş
  penceresi sırasında kullanımdan kaldırılmış doğrudan yükleme/yazma yardımcılarını hâlâ taşıyan geniş bir yapılandırma uyumluluk barrel'i.
- **`openclaw/extension-api`** - Plugin'lere gömülü ajan çalıştırıcısı gibi
  ana taraf yardımcılarına doğrudan erişim veren bir köprü.
- **`api.registerEmbeddedExtensionFactory(...)`** - `tool_result` gibi
  embedded-runner olaylarını gözlemleyebilen, kaldırılmış, yalnızca embedded-runner'a özel paketli
  extension hook'u.

Geniş içe aktarma yüzeyleri artık **kullanımdan kaldırıldı**. Çalışma zamanında hâlâ
çalışırlar, ancak yeni Plugin'ler bunları kullanmamalıdır ve mevcut Plugin'ler
bir sonraki büyük sürüm bunları kaldırmadan önce geçiş yapmalıdır. Yalnızca embedded-runner'a özel extension factory
kayıt API'si kaldırıldı; bunun yerine tool-result ara katmanını kullanın.

OpenClaw, belgelenmiş Plugin davranışını bir yerine geçme getiren aynı
değişiklikte kaldırmaz veya yeniden yorumlamaz. Sözleşmeyi bozan değişiklikler önce
bir uyumluluk adaptöründen, tanılamalardan, belgelerden ve bir kullanım dışı bırakma penceresinden
geçmelidir. Bu, SDK içe aktarmaları, manifest alanları, kurulum API'leri, hook'lar ve çalışma zamanı
kayıt davranışı için geçerlidir.

<Warning>
  Geriye dönük uyumluluk katmanı gelecekteki bir büyük sürümde kaldırılacaktır.
  Bu yüzeylerden hâlâ içe aktarma yapan Plugin'ler o gerçekleştiğinde bozulacaktır.
  Eski gömülü extension factory kayıtları zaten artık yüklenmiyor.
</Warning>

## Bu neden değişti

Eski yaklaşım sorunlara neden oluyordu:

- **Yavaş başlangıç** - tek bir yardımcıyı içe aktarmak düzinelerce ilgisiz modülü yüklüyordu
- **Döngüsel bağımlılıklar** - geniş yeniden dışa aktarmalar içe aktarma döngüleri oluşturmayı kolaylaştırıyordu
- **Belirsiz API yüzeyi** - hangi dışa aktarmaların kararlı, hangilerinin dahili olduğunu anlamanın yolu yoktu

Modern Plugin SDK bunu düzeltir: her içe aktarma yolu (`openclaw/plugin-sdk/\<subpath\>`)
net bir amacı ve belgelenmiş sözleşmesi olan küçük, kendi kendine yeten bir modüldür.

Paketli kanallar için eski sağlayıcı kolaylık noktaları da kaldırıldı.
Kanal markalı yardımcı noktalar kararlı Plugin sözleşmeleri değil, özel mono-repo kısayollarıydı.
Bunun yerine dar genel SDK alt yollarını kullanın. Paketli Plugin çalışma alanı içinde,
sağlayıcıya ait yardımcıları o Plugin'in kendi `api.ts` veya
`runtime-api.ts` dosyasında tutun.

Geçerli paketli sağlayıcı örnekleri:

- Anthropic, Claude'a özgü stream yardımcılarını kendi `api.ts` /
  `contract-api.ts` noktasında tutar
- OpenAI, sağlayıcı oluşturucuları, varsayılan model yardımcılarını ve realtime sağlayıcı
  oluşturucularını kendi `api.ts` dosyasında tutar
- OpenRouter, sağlayıcı oluşturucuyu ve onboarding/yapılandırma yardımcılarını kendi
  `api.ts` dosyasında tutar

## Talk ve gerçek zamanlı ses geçiş planı

Gerçek zamanlı ses, telefon, toplantı ve tarayıcı Talk kodu,
yüzeye yerel turn defter tutmadan `openclaw/plugin-sdk/realtime-voice` tarafından dışa aktarılan
paylaşılan bir Talk oturum denetleyicisine taşınıyor. Yeni denetleyici ortak Talk
olay zarfını, etkin turn durumunu, yakalama durumunu, çıkış sesi durumunu, yakın
olay geçmişini ve bayat turn reddini sahiplenir. Sağlayıcı Plugin'leri
satıcıya özgü realtime oturumlara sahip olmaya devam etmelidir; yüzey Plugin'leri ise yakalama,
oynatma, telefon ve toplantı tuhaflıklarına sahip olmaya devam etmelidir.

Bu Talk geçişi bilinçli olarak temiz biçimde kırıcıdır:

1. Paylaşılan denetleyici/çalışma zamanı ilkellerini
   `plugin-sdk/realtime-voice` içinde tutun.
2. Paketli yüzeyleri paylaşılan denetleyiciye taşıyın: tarayıcı relay,
   yönetilen oda handoff'u, sesli arama realtime, sesli arama streaming STT, Google
   Meet realtime ve yerel push-to-talk.
3. Eski Talk RPC ailelerini nihai `talk.session.*` ve
   `talk.client.*` API'siyle değiştirin.
4. Gateway `hello-ok.features.events` içinde tek bir canlı Talk olay kanalını duyurun:
   `talk.event`.
5. Eski realtime HTTP endpoint'ini ve tüm istek zamanı talimat
   override yollarını silin.

Yeni kod, düşük seviyeli bir adaptör veya test fixture'ı uygulamıyorsa
`createTalkEventSequencer(...)` öğesini doğrudan çağırmamalıdır. Paylaşılan denetleyiciyi tercih edin;
böylece turn kapsamlı olaylar bir turn id olmadan yayılamaz, bayat `turnEnd` /
`turnCancel` çağrıları daha yeni bir etkin turn'ü temizleyemez ve çıkış sesi yaşam döngüsü
olayları telefon, toplantılar, tarayıcı relay, yönetilen oda
handoff'u ve yerel Talk istemcileri arasında tutarlı kalır.

Hedef genel API biçimi şöyledir:

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

Tarayıcıya ait WebRTC/sağlayıcı-websocket oturumları `talk.client.create` kullanır,
çünkü tarayıcı sağlayıcı anlaşmasını ve medya taşımasını sahiplenirken
Gateway kimlik bilgilerini, talimatları ve araç politikasını sahiplenir. `talk.session.*`,
gateway-relay realtime, gateway-relay
transcription ve yönetilen oda yerel STT/TTS oturumları için ortak Gateway tarafından yönetilen yüzeydir.

Realtime seçicileri `talk.provider` /
`talk.providers` yanına yerleştiren eski yapılandırmalar `openclaw doctor --fix` ile onarılmalıdır; çalışma zamanı Talk,
konuşma/TTS sağlayıcı yapılandırmasını realtime sağlayıcı yapılandırması olarak yeniden yorumlamaz.

Desteklenen `talk.session.create` kombinasyonları bilinçli olarak küçüktür:

| Mod             | Taşıma          | Beyin           | Sahip              | Notlar                                                                                                             |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Gateway üzerinden köprülenen tam çift yönlü sağlayıcı sesi; araç çağrıları agent-consult aracı üzerinden yönlendirilir. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Yalnızca streaming STT; çağıranlar giriş sesi gönderir ve transkript olayları alır.                                |
| `stt-tts`       | `managed-room`  | `agent-consult` | Yerel/istemci odası | İstemcinin yakalama/oynatmayı, Gateway'in turn durumunu sahiplendiği push-to-talk ve telsiz tarzı odalar.          |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Yerel/istemci odası | Gateway araç eylemlerini doğrudan yürüten güvenilir birinci taraf yüzeyler için yalnızca yönetici oda modu.        |

Kaldırılan yöntem eşlemesi:

| Eski                             | Yeni                                                     |
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

Birleşik denetim söz varlığı da bilinçli olarak dardır:

  | Yöntem                          | Şunlara uygulanır                                       | Sözleşme                                                                                                                                                                                |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Aynı Gateway bağlantısının sahip olduğu sağlayıcı oturumuna base64 PCM ses parçası ekler.                                                                                               |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Bir managed-room kullanıcı turu başlatır.                                                                                                                                                |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Eski tur doğrulamasından sonra etkin turu sonlandırır.                                                                                                                                   |
  | `talk.session.cancelTurn`       | Gateway'in sahip olduğu tüm oturumlar                   | Bir tur için etkin yakalama/sağlayıcı/ajan/TTS işini iptal eder.                                                                                                                        |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Kullanıcı turunu mutlaka sonlandırmadan asistan ses çıktısını durdurur.                                                                                                                  |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Relay tarafından yayılan bir sağlayıcı araç çağrısını tamamlar; ara çıktı için `options.willContinue` veya çağrıyı başka bir asistan yanıtı olmadan karşılamak için `options.suppressResponse` iletin. |
  | `talk.session.steer`            | ajan destekli Talk oturumları                           | Talk oturumundan çözümlenen etkin gömülü çalıştırmaya sözlü `status`, `steer`, `cancel` veya `followup` denetimi gönderir.                                                              |
  | `talk.session.close`            | tüm birleşik oturumlar                                  | Relay oturumlarını durdurur veya managed-room durumunu iptal eder, ardından birleşik oturum kimliğini unutur.                                                                            |

  Bunun çalışması için çekirdeğe sağlayıcıya veya platforma özel durumlar eklemeyin.
  Talk oturumu semantiğinin sahibi çekirdektir. Sağlayıcı Plugin'leri, satıcı oturumu kurulumunun sahibidir.
  Sesli arama ve Google Meet, telefon/meeting bağdaştırıcılarının sahibidir. Tarayıcı ve yerel
  uygulamalar, cihaz yakalama/oynatma UX'inin sahibidir.

  ## Uyumluluk politikası

  Harici Plugin'ler için uyumluluk çalışması şu sırayı izler:

  1. yeni sözleşmeyi ekleyin
  2. eski davranışı bir uyumluluk bağdaştırıcısı üzerinden bağlı tutun
  3. eski yolu ve yerine geçeni adlandıran bir tanılama veya uyarı yayımlayın
  4. testlerde her iki yolu da kapsayın
  5. kullanımdan kaldırmayı ve geçiş yolunu belgeleyin
  6. yalnızca duyurulan geçiş penceresinden sonra, genellikle büyük bir sürümde kaldırın

  Bakımcılar geçerli geçiş kuyruğunu
  `pnpm plugins:boundary-report` ile denetleyebilir. Kompakt sayımlar için
  `pnpm plugins:boundary-report:summary`, tek bir Plugin veya uyumluluk sahibi için
  `--owner <id>` ve bir CI kapısının vadesi gelen uyumluluk kayıtları, sahipler arası ayrılmış SDK import'ları veya kullanılmayan ayrılmış SDK alt yolları nedeniyle başarısız olması gerektiğinde
  `pnpm plugins:boundary-report:ci` kullanın. Rapor, kullanımdan kaldırılmış
  uyumluluk kayıtlarını kaldırma tarihine göre gruplar, yerel kod/belge referanslarını sayar,
  sahipler arası ayrılmış SDK import'larını ortaya çıkarır ve özel
  memory-host SDK köprüsünü özetler; böylece uyumluluk temizliği rastgele aramalara
  dayanmak yerine açık kalır. Ayrılmış SDK alt yollarının izlenen sahip kullanımı olmalıdır;
  kullanılmayan ayrılmış yardımcı export'ları genel SDK'dan kaldırılmalıdır.

  Bir manifest alanı hâlâ kabul ediliyorsa, Plugin yazarları belgeler ve tanılamalar aksini söyleyene kadar
  onu kullanmayı sürdürebilir. Yeni kod belgelenmiş
  yerine geçeni tercih etmelidir, ancak mevcut Plugin'ler olağan minor
  sürümler sırasında bozulmamalıdır.

  ## Geçiş yapma

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    Bundled Plugin'ler
    `api.runtime.config.loadConfig()` ve
    `api.runtime.config.writeConfigFile(...)` çağrılarını doğrudan yapmayı bırakmalıdır. Etkin çağrı yoluna
    zaten geçirilmiş yapılandırmayı tercih edin. Geçerli işlem anlık görüntüsüne ihtiyaç duyan
    uzun ömürlü işleyiciler `api.runtime.config.current()` kullanabilir. Uzun ömürlü
    ajan araçları, bir yapılandırma yazımından önce oluşturulmuş bir aracın yenilenmiş
    çalışma zamanı yapılandırmasını yine de görmesi için
    `execute` içinde araç bağlamının `ctx.getRuntimeConfig()` metodunu kullanmalıdır.

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

    Çağıran taraf değişikliğin temiz bir gateway yeniden başlatması gerektirdiğini biliyorsa
    `afterWrite: { mode: "restart", reason: "..." }`, yalnızca çağıran taraf devam işleminin
    sahibi olduğunda ve yeniden yükleme planlayıcısını kasıtlı olarak bastırmak istediğinde
    `afterWrite: { mode: "none", reason: "..." }` kullanın.
    Mutasyon sonuçları testler ve günlükleme için türlendirilmiş bir `followUp` özeti içerir;
    gateway, yeniden başlatmayı uygulamaktan veya zamanlamaktan sorumlu kalır.
    `loadConfig` ve `writeConfigFile`, geçiş penceresi sırasında harici Plugin'ler için
    kullanımdan kaldırılmış uyumluluk yardımcıları olarak kalır ve
    `runtime-config-load-write` uyumluluk koduyla bir kez uyarır. Bundled Plugin'ler ve repo
    çalışma zamanı kodu,
    `pnpm check:deprecated-api-usage` ve
    `pnpm check:no-runtime-action-load-config` içindeki tarayıcı korumalarıyla korunur:
    yeni üretim Plugin kullanımı doğrudan başarısız olur, doğrudan yapılandırma yazımları başarısız olur,
    gateway sunucu metodları istek çalışma zamanı anlık görüntüsünü kullanmalıdır, çalışma zamanı kanal gönderme/eylem/istemci yardımcıları
    yapılandırmayı kendi sınırlarından almalıdır ve uzun ömürlü çalışma zamanı modüllerinde
    izin verilen ortam `loadConfig()` çağrısı sıfırdır.

    Yeni Plugin kodu ayrıca geniş
    `openclaw/plugin-sdk/config-runtime` uyumluluk barrel'ını import etmekten kaçınmalıdır. İşe uyan dar
    SDK alt yolunu kullanın:

    | İhtiyaç | Import |
    | --- | --- |
    | `OpenClawConfig` gibi yapılandırma türleri | `openclaw/plugin-sdk/config-contracts` |
    | Zaten yüklenmiş yapılandırma doğrulamaları ve Plugin giriş yapılandırması araması | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Geçerli çalışma zamanı anlık görüntüsü okumaları | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Yapılandırma yazımları | `openclaw/plugin-sdk/config-mutation` |
    | Oturum deposu yardımcıları | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown tablo yapılandırması | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Grup politikası çalışma zamanı yardımcıları | `openclaw/plugin-sdk/runtime-group-policy` |
    | Gizli girdi çözümleme | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model/oturum geçersiz kılmaları | `openclaw/plugin-sdk/model-session-runtime` |

    Bundled Plugin'ler ve testleri, import'ların ve mock'ların ihtiyaç duydukları davranışa yerel kalması için geniş
    barrel'a karşı tarayıcı koruması altındadır. Geniş
    barrel harici uyumluluk için hâlâ vardır, ancak yeni kod ona
    bağlı olmamalıdır.

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    Bundled Plugin'ler, yalnızca embedded-runner'a özgü
    `api.registerEmbeddedExtensionFactory(...)` araç sonucu işleyicilerini
    çalışma zamanından bağımsız middleware ile değiştirmelidir.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Plugin manifest'ini aynı anda güncelleyin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Kurulu Plugin'ler, açıkça etkinleştirildiklerinde ve hedeflenen her çalışma zamanını
    `contracts.agentToolResultMiddleware` içinde beyan ettiklerinde araç sonucu middleware'i de kaydedebilir.
    Beyan edilmemiş kurulu middleware
    kayıtları reddedilir.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Onay özellikli kanal Plugin'leri artık yerel onay davranışını
    `approvalCapability.nativeRuntime` ve paylaşılan çalışma zamanı bağlamı registry'si üzerinden sunar.

    Temel değişiklikler:

    - `approvalCapability.handler.loadRuntime(...)` yerine
      `approvalCapability.nativeRuntime` kullanın
    - Onaya özgü auth/teslimatı eski `plugin.auth` /
      `plugin.approvals` kablolamasından çıkarıp `approvalCapability` üzerine taşıyın
    - `ChannelPlugin.approvals` genel kanal Plugin'i
      sözleşmesinden kaldırıldı; teslimat/yerel/render alanlarını `approvalCapability` üzerine taşıyın
    - `plugin.auth` yalnızca kanal login/logout akışları için kalır; buradaki onay auth
      hook'ları artık çekirdek tarafından okunmaz
    - İstemciler, token'lar veya Bolt
      uygulamaları gibi kanal sahibi çalışma zamanı nesnelerini `openclaw/plugin-sdk/channel-runtime-context` üzerinden kaydedin
    - Yerel onay işleyicilerinden Plugin sahibi yeniden yönlendirme bildirimleri göndermeyin;
      çekirdek artık gerçek teslimat sonuçlarından başka yere yönlendirilmiş bildirimlerin sahibidir
    - `createChannelManager(...)` içine `channelRuntime` geçirirken gerçek bir
      `createPluginRuntime().channel` yüzeyi sağlayın. Kısmi stub'lar reddedilir.

    Geçerli onay capability düzeni için `/plugins/sdk-channel-plugins` bölümüne bakın.

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    Plugin'iniz `openclaw/plugin-sdk/windows-spawn` kullanıyorsa, çözümlenemeyen Windows
    `.cmd`/`.bat` wrapper'ları siz açıkça
    `allowShellFallback: true` geçmediğiniz sürece artık kapalı şekilde başarısız olur.

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

    Çağıranınız shell fallback'e kasıtlı olarak dayanmıyorsa
    `allowShellFallback` ayarlamayın ve bunun yerine fırlatılan hatayı ele alın.

  </Step>

  <Step title="Find deprecated imports">
    Plugin'inizde kullanımdan kaldırılmış yüzeylerden herhangi birinden yapılan import'ları arayın:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    Eski yüzeyden gelen her export, belirli bir modern import yoluna eşlenir:

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

    Host tarafı yardımcıları için doğrudan import etmek yerine enjekte edilen Plugin çalışma zamanını kullanın:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Aynı kalıp diğer eski köprü yardımcıları için de geçerlidir:

    | Eski içe aktarma | Modern karşılığı |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | oturum deposu yardımcıları | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Geniş infra-runtime içe aktarmalarını değiştirin">
    `openclaw/plugin-sdk/infra-runtime` dış uyumluluk için hâlâ vardır,
    ancak yeni kod gerçekten ihtiyaç duyduğu odaklanmış yardımcı yüzeyi içe
    aktarmalıdır:

    | İhtiyaç | İçe aktarma |
    | --- | --- |
    | Sistem olay kuyruğu yardımcıları | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat uyandırma, olay ve görünürlük yardımcıları | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Bekleyen teslimat kuyruğu boşaltma | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Kanal etkinliği telemetrisi | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Bellek içi yineleme önleme önbellekleri | `openclaw/plugin-sdk/dedupe-runtime` |
    | Güvenli yerel dosya/medya yolu yardımcıları | `openclaw/plugin-sdk/file-access-runtime` |
    | Dağıtıcı farkındalıklı fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy ve korumalı fetch yardımcıları | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF dağıtıcı ilke türleri | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Onay isteği/çözüm türleri | `openclaw/plugin-sdk/approval-runtime` |
    | Onay yanıt yükü ve komut yardımcıları | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Hata biçimlendirme yardımcıları | `openclaw/plugin-sdk/error-runtime` |
    | Taşıma hazır olma beklemeleri | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Güvenli token yardımcıları | `openclaw/plugin-sdk/secure-random-runtime` |
    | Sınırlı eşzamansız görev eşzamanlılığı | `openclaw/plugin-sdk/concurrency-runtime` |
    | Sayısal zorlama | `openclaw/plugin-sdk/number-runtime` |
    | Süreç yerel eşzamansız kilit | `openclaw/plugin-sdk/async-lock-runtime` |
    | Dosya kilitleri | `openclaw/plugin-sdk/file-lock` |

    Paketlenmiş Plugin’ler `infra-runtime` kullanımına karşı tarayıcıyla
    korunur, bu nedenle repo kodu geniş barrel modülüne geri dönemez.

  </Step>

  <Step title="Kanal rota yardımcılarını taşıyın">
    Yeni kanal rota kodu `openclaw/plugin-sdk/channel-route` kullanmalıdır.
    Eski rota anahtarı ve karşılaştırılabilir hedef adları taşıma penceresi
    boyunca uyumluluk takma adları olarak kalır, ancak yeni Plugin’ler
    davranışı doğrudan tanımlayan rota adlarını kullanmalıdır:

    | Eski yardımcı | Modern yardımcı |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Modern rota yardımcıları `{ channel, to, accountId, threadId }` değerlerini
    yerel onaylar, yanıt bastırma, gelen yineleme önleme, Cron teslimi ve oturum
    yönlendirmesi genelinde tutarlı biçimde normalleştirir.

    `ChannelMessagingAdapter.parseExplicitTarget` veya ayrıştırıcı destekli
    yüklü rota yardımcılarının (`parseExplicitTargetForLoadedChannel` ya da
    `resolveRouteTargetForLoadedChannel`) ya da
    `plugin-sdk/channel-route` içinden
    `resolveChannelRouteTargetWithParser(...)` kullanımını yeni olarak
    eklemeyin. Bu kancalar kullanımdan kaldırılmıştır ve taşıma penceresi
    boyunca yalnızca eski Plugin’ler için kalır. Yeni kanal Plugin’leri hedef
    kimliği normalleştirmesi ve dizin kaçırma geri dönüşü için
    `messaging.targetResolver.resolveTarget(...)`, çekirdeğin erken bir eş
    türüne ihtiyaç duyduğu durumlarda `messaging.inferTargetChatType(...)` ve
    sağlayıcıya özgü oturum ile iş parçacığı kimliği için
    `messaging.resolveOutboundSessionRoute(...)` kullanmalıdır.

  </Step>

  <Step title="Derleyin ve test edin">
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
  | `plugin-sdk/plugin-entry` | Kurallı plugin giriş yardımcısı | `definePluginEntry` |
  | `plugin-sdk/core` | Kanal giriş tanımları/oluşturucuları için eski şemsiye yeniden dışa aktarımı | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Kök yapılandırma şeması dışa aktarımı | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Tek sağlayıcılı giriş yardımcısı | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Odaklı kanal giriş tanımları ve oluşturucuları | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları | Kurulum çevirmeni, izin listesi istemleri, kurulum durumu oluşturucuları |
  | `plugin-sdk/setup-runtime` | Kurulum zamanı çalışma zamanı yardımcıları | `createSetupTranslator`, içe aktarmaya güvenli kurulum yaması adaptörleri, arama-notu yardımcıları, `promptResolvedAllowFrom`, `splitSetupEntries`, devredilmiş kurulum vekilleri |
  | `plugin-sdk/setup-adapter-runtime` | Kullanımdan kaldırılmış kurulum adaptörü takma adı | `plugin-sdk/setup-runtime` kullanın |
  | `plugin-sdk/setup-tools` | Kurulum araçları yardımcıları | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Çoklu hesap yardımcıları | Hesap listesi/yapılandırma/eylem kapısı yardımcıları |
  | `plugin-sdk/account-id` | Hesap kimliği yardımcıları | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalleştirme |
  | `plugin-sdk/account-resolution` | Hesap arama yardımcıları | Hesap arama + varsayılan geri dönüş yardımcıları |
  | `plugin-sdk/account-helpers` | Dar kapsamlı hesap yardımcıları | Hesap listesi/hesap eylemi yardımcıları |
  | `plugin-sdk/channel-setup` | Kurulum sihirbazı adaptörleri | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM eşleştirme ilkel bileşenleri | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Yanıt öneki, yazıyor durumu ve kaynak-teslim kablolaması | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Yapılandırma adaptörü fabrikaları ve DM erişim yardımcıları | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Yapılandırma şeması oluşturucuları | Yalnızca paylaşılan kanal yapılandırma şeması ilkel bileşenleri ve genel oluşturucu |
  | `plugin-sdk/bundled-channel-config-schema` | Paketli yapılandırma şemaları | Yalnızca OpenClaw tarafından sürdürülen paketli pluginler; yeni pluginler plugin-yerel şemalar tanımlamalıdır |
  | `plugin-sdk/channel-config-schema-legacy` | Kullanımdan kaldırılmış paketli yapılandırma şemaları | Yalnızca uyumluluk takma adı; sürdürülen paketli pluginler için `plugin-sdk/bundled-channel-config-schema` kullanın |
  | `plugin-sdk/telegram-command-config` | Telegram komut yapılandırma yardımcıları | Komut adı normalleştirme, açıklama kırpma, yinelenen/çakışan doğrulama |
  | `plugin-sdk/channel-policy` | Grup/DM ilkesi çözümleme | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Kullanımdan kaldırılmış uyumluluk cephesi | `plugin-sdk/channel-outbound` kullanın |
  | `plugin-sdk/inbound-envelope` | Gelen zarf yardımcıları | Paylaşılan rota + zarf oluşturucu yardımcıları |
  | `plugin-sdk/channel-inbound` | Gelen alma yardımcıları | Bağlam oluşturma, biçimlendirme, kökler, çalıştırıcılar, hazırlanmış yanıt gönderimi ve gönderim koşulları |
  | `plugin-sdk/messaging-targets` | Kullanımdan kaldırılmış hedef ayrıştırma içe aktarma yolu | Genel hedef ayrıştırma yardımcıları için `plugin-sdk/channel-targets`, rota karşılaştırması için `plugin-sdk/channel-route` ve sağlayıcıya özel hedef çözümleme için plugin sahibi `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` kullanın |
  | `plugin-sdk/outbound-media` | Giden medya yardımcıları | Paylaşılan giden medya yükleme |
  | `plugin-sdk/outbound-send-deps` | Kullanımdan kaldırılmış uyumluluk cephesi | `plugin-sdk/channel-outbound` kullanın |
  | `plugin-sdk/channel-outbound` | Giden ileti yaşam döngüsü yardımcıları | İleti adaptörleri, alındılar, dayanıklı gönderme yardımcıları, canlı önizleme/akış yardımcıları, yanıt seçenekleri, yaşam döngüsü yardımcıları, giden kimlik ve yük planlama |
  | `plugin-sdk/channel-streaming` | Kullanımdan kaldırılmış uyumluluk cephesi | `plugin-sdk/channel-outbound` kullanın |
  | `plugin-sdk/outbound-runtime` | Kullanımdan kaldırılmış uyumluluk cephesi | `plugin-sdk/channel-outbound` kullanın |
  | `plugin-sdk/thread-bindings-runtime` | Konu bağlama yardımcıları | Konu bağlama yaşam döngüsü ve adaptör yardımcıları |
  | `plugin-sdk/agent-media-payload` | Eski medya yükü yardımcıları | Eski alan düzenleri için agent medya yükü oluşturucu |
  | `plugin-sdk/channel-runtime` | Kullanımdan kaldırılmış uyumluluk shim'i | Yalnızca eski kanal çalışma zamanı yardımcı programları |
  | `plugin-sdk/channel-send-result` | Gönderme sonucu türleri | Yanıt sonucu türleri |
  | `plugin-sdk/runtime-store` | Kalıcı plugin depolama | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Geniş çalışma zamanı yardımcıları | Çalışma zamanı/günlükleme/yedekleme/plugin-kurulum yardımcıları |
  | `plugin-sdk/runtime-env` | Dar kapsamlı çalışma zamanı env yardımcıları | Günlükleyici/çalışma zamanı env, zaman aşımı, yeniden deneme ve backoff yardımcıları |
  | `plugin-sdk/plugin-runtime` | Paylaşılan plugin çalışma zamanı yardımcıları | Plugin komutları/kancaları/http/etkileşimli yardımcılar |
  | `plugin-sdk/hook-runtime` | Kanca hattı yardımcıları | Paylaşılan webhook/dahili kanca hattı yardımcıları |
  | `plugin-sdk/lazy-runtime` | Lazy çalışma zamanı yardımcıları | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Süreç yardımcıları | Paylaşılan exec yardımcıları |
  | `plugin-sdk/cli-runtime` | CLI çalışma zamanı yardımcıları | Komut biçimlendirme, beklemeler, sürüm yardımcıları |
  | `plugin-sdk/gateway-runtime` | Gateway yardımcıları | Gateway istemcisi, event-loop-ready başlatma yardımcısı ve kanal-durumu yaması yardımcıları |
  | `plugin-sdk/config-runtime` | Kullanımdan kaldırılmış yapılandırma uyumluluk shim'i | `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` ve `config-mutation` tercih edin |
  | `plugin-sdk/telegram-command-config` | Telegram komut yardımcıları | Paketli Telegram sözleşme yüzeyi kullanılamadığında geri dönüşe kararlı Telegram komut doğrulama yardımcıları |
  | `plugin-sdk/approval-runtime` | Onay istemi yardımcıları | Exec/plugin onay yükü, onay yeteneği/profil yardımcıları, yerel onay yönlendirme/çalışma zamanı yardımcıları ve yapılandırılmış onay görüntüleme yolu biçimlendirme |
  | `plugin-sdk/approval-auth-runtime` | Onay kimlik doğrulama yardımcıları | Onaylayıcı çözümleme, aynı sohbet eylem kimlik doğrulaması |
  | `plugin-sdk/approval-client-runtime` | Onay istemcisi yardımcıları | Yerel exec onay profili/filtre yardımcıları |
  | `plugin-sdk/approval-delivery-runtime` | Onay teslim yardımcıları | Yerel onay yeteneği/teslim adaptörleri |
  | `plugin-sdk/approval-gateway-runtime` | Onay Gateway yardımcıları | Paylaşılan onay Gateway çözümleme yardımcısı |
  | `plugin-sdk/approval-handler-adapter-runtime` | Onay adaptörü yardımcıları | Sıcak kanal giriş noktaları için hafif yerel onay adaptörü yükleme yardımcıları |
  | `plugin-sdk/approval-handler-runtime` | Onay işleyici yardımcıları | Daha geniş onay işleyici çalışma zamanı yardımcıları; yeterli olduklarında daha dar adaptör/Gateway birleşim noktalarını tercih edin |
  | `plugin-sdk/approval-native-runtime` | Onay hedef yardımcıları | Yerel onay hedefi/hesap bağlama yardımcıları |
  | `plugin-sdk/approval-reply-runtime` | Onay yanıt yardımcıları | Exec/plugin onay yanıt yükü yardımcıları |
  | `plugin-sdk/channel-runtime-context` | Kanal çalışma zamanı bağlamı yardımcıları | Genel kanal çalışma zamanı bağlamı kaydet/al/izle yardımcıları |
  | `plugin-sdk/security-runtime` | Güvenlik yardımcıları | Paylaşılan güven, DM kapılama, kök-sınırlı dosya/yol yardımcıları, dış içerik ve gizli bilgi toplama yardımcıları |
  | `plugin-sdk/ssrf-policy` | SSRF ilkesi yardımcıları | Ana makine izin listesi ve özel ağ ilkesi yardımcıları |
  | `plugin-sdk/ssrf-runtime` | SSRF çalışma zamanı yardımcıları | Sabitlenmiş gönderici, korumalı fetch, SSRF ilkesi yardımcıları |
  | `plugin-sdk/system-event-runtime` | Sistem olayı yardımcıları | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat yardımcıları | Heartbeat uyandırma, olay ve görünürlük yardımcıları |
  | `plugin-sdk/delivery-queue-runtime` | Teslim kuyruğu yardımcıları | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Kanal etkinliği yardımcıları | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Tekilleştirme yardımcıları | Bellek içi tekilleştirme önbellekleri |
  | `plugin-sdk/file-access-runtime` | Dosya erişim yardımcıları | Güvenli yerel dosya/medya yolu yardımcıları |
  | `plugin-sdk/transport-ready-runtime` | Aktarım hazır olma yardımcıları | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Exec onay ilkesi yardımcıları | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Sınırlı önbellek yardımcıları | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Tanılama kapılama yardımcıları | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hata biçimlendirme yardımcıları | `formatUncaughtError`, `isApprovalNotFoundError`, hata grafiği yardımcıları |
  | `plugin-sdk/fetch-runtime` | Sarılmış fetch/proxy yardımcıları | `resolveFetch`, proxy yardımcıları, EnvHttpProxyAgent seçenek yardımcıları |
  | `plugin-sdk/host-runtime` | Ana makine normalleştirme yardımcıları | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Yeniden deneme yardımcıları | `RetryConfig`, `retryAsync`, ilke çalıştırıcıları |
  | `plugin-sdk/allow-from` | İzin listesi biçimlendirme ve girdi eşleme | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Komut kapılama ve komut yüzeyi yardımcıları | `resolveControlCommandGate`, gönderen-yetkilendirme yardımcıları, dinamik argüman menüsü biçimlendirmesi dahil komut kayıt defteri yardımcıları |
  | `plugin-sdk/command-status` | Komut durumu/yardım işleyicileri | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Gizli bilgi girdisi ayrıştırma | Gizli bilgi girdisi yardımcıları |
  | `plugin-sdk/webhook-ingress` | Webhook istek yardımcıları | Webhook hedef yardımcı programları |
  | `plugin-sdk/webhook-request-guards` | Webhook gövde koruması yardımcıları | İstek gövdesi okuma/sınır yardımcıları |
  | `plugin-sdk/reply-runtime` | Paylaşılan yanıt çalışma zamanı | Gelen gönderimi, heartbeat, yanıt planlayıcı, parçalama |
  | `plugin-sdk/reply-dispatch-runtime` | Dar kapsamlı yanıt gönderim yardımcıları | Sonlandırma, sağlayıcı gönderimi ve konuşma etiketi yardımcıları |
  | `plugin-sdk/reply-history` | Yanıt geçmişi yardımcıları | `createChannelHistoryWindow`; `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` ve `clearHistoryEntriesIfEnabled` gibi kullanımdan kaldırılmış map-helper uyumluluk dışa aktarımları |
  | `plugin-sdk/reply-reference` | Yanıt referansı planlama | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Yanıt parçası yardımcıları | Metin/markdown parçalama yardımcıları |
  | `plugin-sdk/session-store-runtime` | Oturum deposu yardımcıları | Depo yolu + updated-at yardımcıları |
  | `plugin-sdk/state-paths` | Durum yolu yardımcıları | Durum ve OAuth dizini yardımcıları |
  | `plugin-sdk/routing` | Yönlendirme/oturum anahtarı yardımcıları | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, oturum anahtarı normalleştirme yardımcıları |
  | `plugin-sdk/status-helpers` | Kanal durumu yardımcıları | Kanal/hesap durumu özeti oluşturucuları, çalışma zamanı durumu varsayılanları, sorun meta verisi yardımcıları |
  | `plugin-sdk/target-resolver-runtime` | Hedef çözümleyici yardımcıları | Paylaşılan hedef çözümleyici yardımcıları |
  | `plugin-sdk/string-normalization-runtime` | Dize normalleştirme yardımcıları | Slug/dize normalleştirme yardımcıları |
  | `plugin-sdk/request-url` | İstek URL'si yardımcıları | İstek benzeri girdilerden dize URL'leri ayıklar |
  | `plugin-sdk/run-command` | Süre sınırı olan komut yardımcıları | Normalleştirilmiş stdout/stderr ile süre sınırı olan komut çalıştırıcı |
  | `plugin-sdk/param-readers` | Parametre okuyucuları | Ortak araç/CLI parametre okuyucuları |
  | `plugin-sdk/tool-payload` | Araç yükü ayıklama | Araç sonuç nesnelerinden normalleştirilmiş yükleri ayıklar |
  | `plugin-sdk/tool-send` | Araç gönderim ayıklama | Araç argümanlarından kanonik gönderim hedefi alanlarını ayıklar |
  | `plugin-sdk/temp-path` | Geçici yol yardımcıları | Paylaşılan geçici indirme yolu yardımcıları |
  | `plugin-sdk/logging-core` | Günlükleme yardımcıları | Alt sistem günlükleyici ve redaksiyon yardımcıları |
  | `plugin-sdk/markdown-table-runtime` | Markdown tablosu yardımcıları | Markdown tablo modu yardımcıları |
  | `plugin-sdk/reply-payload` | Mesaj yanıt türleri | Yanıt yükü türleri |
  | `plugin-sdk/provider-setup` | Derlenmiş yerel/kendi barındırdığı sağlayıcı kurulum yardımcıları | Kendi barındırdığı sağlayıcı keşif/yapılandırma yardımcıları |
  | `plugin-sdk/self-hosted-provider-setup` | Odaklı OpenAI uyumlu kendi barındırdığı sağlayıcı kurulum yardımcıları | Aynı kendi barındırdığı sağlayıcı keşif/yapılandırma yardımcıları |
  | `plugin-sdk/provider-auth-runtime` | Sağlayıcı çalışma zamanı kimlik doğrulama yardımcıları | Çalışma zamanı API anahtarı çözümleme yardımcıları |
  | `plugin-sdk/provider-auth-api-key` | Sağlayıcı API anahtarı kurulum yardımcıları | API anahtarı başlangıç/profil yazma yardımcıları |
  | `plugin-sdk/provider-auth-result` | Sağlayıcı kimlik doğrulama sonucu yardımcıları | Standart OAuth kimlik doğrulama sonucu oluşturucu |
  | `plugin-sdk/provider-selection-runtime` | Sağlayıcı seçimi yardımcıları | Yapılandırılmış veya otomatik sağlayıcı seçimi ve ham sağlayıcı yapılandırması birleştirme |
  | `plugin-sdk/provider-env-vars` | Sağlayıcı env-var yardımcıları | Sağlayıcı kimlik doğrulama env-var arama yardımcıları |
  | `plugin-sdk/provider-model-shared` | Paylaşılan sağlayıcı model/yeniden oynatma yardımcıları | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan yeniden oynatma ilkesi oluşturucuları, sağlayıcı uç noktası yardımcıları ve model kimliği normalleştirme yardımcıları |
  | `plugin-sdk/provider-catalog-shared` | Paylaşılan sağlayıcı katalog yardımcıları | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Sağlayıcı başlangıç yamaları | Başlangıç yapılandırması yardımcıları |
  | `plugin-sdk/provider-http` | Sağlayıcı HTTP yardımcıları | Ses transkripsiyonu multipart form yardımcıları dahil genel sağlayıcı HTTP/uç nokta yetenek yardımcıları |
  | `plugin-sdk/provider-web-fetch` | Sağlayıcı web-fetch yardımcıları | Web-fetch sağlayıcı kayıt/önbellek yardımcıları |
  | `plugin-sdk/provider-web-search-config-contract` | Sağlayıcı web-search yapılandırma yardımcıları | Plugin etkinleştirme bağlantısı gerektirmeyen sağlayıcılar için dar web-search yapılandırma/kimlik bilgisi yardımcıları |
  | `plugin-sdk/provider-web-search-contract` | Sağlayıcı web-search sözleşme yardımcıları | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcıları/alıcıları gibi dar web-search yapılandırma/kimlik bilgisi sözleşme yardımcıları |
  | `plugin-sdk/provider-web-search` | Sağlayıcı web-search yardımcıları | Web-search sağlayıcı kayıt/önbellek/çalışma zamanı yardımcıları |
  | `plugin-sdk/provider-tools` | Sağlayıcı araç/şema uyumluluk yardımcıları | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` ve DeepSeek/Gemini/OpenAI şema temizliği + tanılama |
  | `plugin-sdk/provider-usage` | Sağlayıcı kullanım yardımcıları | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` ve diğer sağlayıcı kullanım yardımcıları |
  | `plugin-sdk/provider-stream` | Sağlayıcı akış sarmalayıcı yardımcıları | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
  | `plugin-sdk/provider-transport-runtime` | Sağlayıcı taşıma yardımcıları | Korunan fetch, araç sonucu metin ayıklama, taşıma mesajı dönüşümleri ve yazılabilir taşıma olay akışları gibi yerel sağlayıcı taşıma yardımcıları |
  | `plugin-sdk/keyed-async-queue` | Sıralı zaman uyumsuz kuyruk | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Paylaşılan medya yardımcıları | Medya getirme/dönüştürme/depolama yardımcıları, ffprobe destekli video boyutu yoklama ve medya yükü oluşturucuları |
  | `plugin-sdk/media-generation-runtime` | Paylaşılan medya oluşturma yardımcıları | Görüntü/video/müzik oluşturma için paylaşılan devretme yardımcıları, aday seçimi ve eksik model mesajlaşması |
  | `plugin-sdk/media-understanding` | Medya anlama yardımcıları | Medya anlama sağlayıcı türleri ve sağlayıcıya dönük görüntü/ses yardımcı dışa aktarımları |
  | `plugin-sdk/text-runtime` | Kullanımdan kaldırılmış geniş metin uyumluluğu dışa aktarımı | `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` ve `logging-core` kullanın |
  | `plugin-sdk/text-chunking` | Metin parçalama yardımcıları | Giden metin parçalama yardımcısı |
  | `plugin-sdk/speech` | Konuşma yardımcıları | Konuşma sağlayıcı türleri ve sağlayıcıya dönük yönerge, kayıt defteri, doğrulama yardımcıları ve OpenAI uyumlu TTS oluşturucu |
  | `plugin-sdk/speech-core` | Paylaşılan konuşma çekirdeği | Konuşma sağlayıcı türleri, kayıt defteri, yönergeler, normalleştirme |
  | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon yardımcıları | Sağlayıcı türleri, kayıt defteri yardımcıları ve paylaşılan WebSocket oturum yardımcısı |
  | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses yardımcıları | Sağlayıcı türleri, kayıt defteri/çözümleme yardımcıları, köprü oturumu yardımcıları, paylaşılan ajan geri konuşma kuyrukları, etkin çalıştırma ses kontrolü, transkript/olay sağlığı, yankı bastırma, danışma sorusu eşleştirme, zorunlu danışma koordinasyonu, tur bağlamı takibi, çıktı etkinliği takibi ve hızlı bağlam danışma yardımcıları |
  | `plugin-sdk/image-generation` | Görüntü oluşturma yardımcıları | Görüntü oluşturma sağlayıcı türleri ve görüntü varlığı/veri URL'si yardımcıları ile OpenAI uyumlu görüntü sağlayıcı oluşturucu |
  | `plugin-sdk/image-generation-core` | Paylaşılan görüntü oluşturma çekirdeği | Görüntü oluşturma türleri, devretme, kimlik doğrulama ve kayıt defteri yardımcıları |
  | `plugin-sdk/music-generation` | Müzik oluşturma yardımcıları | Müzik oluşturma sağlayıcı/istek/sonuç türleri |
  | `plugin-sdk/music-generation-core` | Paylaşılan müzik oluşturma çekirdeği | Müzik oluşturma türleri, devretme yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
  | `plugin-sdk/video-generation` | Video oluşturma yardımcıları | Video oluşturma sağlayıcı/istek/sonuç türleri |
  | `plugin-sdk/video-generation-core` | Paylaşılan video oluşturma çekirdeği | Video oluşturma türleri, devretme yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
  | `plugin-sdk/interactive-runtime` | Etkileşimli yanıt yardımcıları | Etkileşimli yanıt yükü normalleştirme/indirgeme |
  | `plugin-sdk/channel-config-primitives` | Kanal yapılandırma temel öğeleri | Dar kanal yapılandırma şeması temel öğeleri |
  | `plugin-sdk/channel-config-writes` | Kanal yapılandırma yazma yardımcıları | Kanal yapılandırma yazma yetkilendirme yardımcıları |
  | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal başlangıcı | Paylaşılan kanal Plugin başlangıç dışa aktarımları |
  | `plugin-sdk/channel-status` | Kanal durumu yardımcıları | Paylaşılan kanal durumu anlık görüntü/özet yardımcıları |
  | `plugin-sdk/allowlist-config-edit` | İzin listesi yapılandırma yardımcıları | İzin listesi yapılandırma düzenleme/okuma yardımcıları |
  | `plugin-sdk/group-access` | Grup erişimi yardımcıları | Paylaşılan grup erişimi karar yardımcıları |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Kullanımdan kaldırılmış uyumluluk cepheleri | `plugin-sdk/channel-inbound` kullanın |
  | `plugin-sdk/direct-dm-guard-policy` | Doğrudan DM koruma yardımcıları | Dar kripto öncesi koruma ilkesi yardımcıları |
  | `plugin-sdk/extension-shared` | Paylaşılan uzantı yardımcıları | Pasif kanal/durum ve ortam proxy yardımcısı temel öğeleri |
  | `plugin-sdk/webhook-targets` | Webhook hedef yardımcıları | Webhook hedef kayıt defteri ve rota kurulum yardımcıları |
  | `plugin-sdk/webhook-path` | Kullanımdan kaldırılmış webhook yolu takma adı | `plugin-sdk/webhook-ingress` kullanın |
  | `plugin-sdk/web-media` | Paylaşılan web medya yardımcıları | Uzak/yerel medya yükleme yardımcıları |
  | `plugin-sdk/zod` | Kullanımdan kaldırılmış Zod uyumluluk yeniden dışa aktarımı | `zod` öğesini doğrudan `zod` içinden içe aktarın |
  | `plugin-sdk/memory-core` | Paketlenmiş memory-core yardımcıları | Bellek yöneticisi/yapılandırma/dosya/CLI yardımcı yüzeyi |
  | `plugin-sdk/memory-core-engine-runtime` | Bellek motoru çalışma zamanı cephesi | Bellek indeksleme/arama çalışma zamanı cephesi |
  | `plugin-sdk/memory-core-host-embedding-registry` | Bellek embedding kayıt defteri | Hafif bellek embedding sağlayıcısı kayıt defteri yardımcıları |
  | `plugin-sdk/memory-core-host-engine-foundation` | Bellek ana makine temel motoru | Bellek ana makine temel motoru dışa aktarımları |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek ana makine embedding motoru | Bellek embedding sözleşmeleri, kayıt defteri erişimi, yerel sağlayıcı ve genel toplu/uzak yardımcılar; somut uzak sağlayıcılar kendi sahip Pluginlerinde yaşar |
  | `plugin-sdk/memory-core-host-engine-qmd` | Bellek ana makine QMD motoru | Bellek ana makine QMD motoru dışa aktarımları |
  | `plugin-sdk/memory-core-host-engine-storage` | Bellek ana makine depolama motoru | Bellek ana makine depolama motoru dışa aktarımları |
  | `plugin-sdk/memory-core-host-multimodal` | Bellek ana makine çok modlu yardımcıları | Bellek ana makine çok modlu yardımcıları |
  | `plugin-sdk/memory-core-host-query` | Bellek ana makine sorgu yardımcıları | Bellek ana makine sorgu yardımcıları |
  | `plugin-sdk/memory-core-host-secret` | Bellek ana makine gizli bilgi yardımcıları | Bellek ana makine gizli bilgi yardımcıları |
  | `plugin-sdk/memory-core-host-events` | Kullanımdan kaldırılmış bellek olay takma adı | `plugin-sdk/memory-host-events` kullanın |
  | `plugin-sdk/memory-core-host-status` | Bellek ana makine durumu yardımcıları | Bellek ana makine durumu yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-cli` | Bellek ana makine CLI çalışma zamanı | Bellek ana makine CLI çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-core` | Bellek ana makine çekirdek çalışma zamanı | Bellek ana makine çekirdek çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-files` | Bellek ana makine dosya/çalışma zamanı yardımcıları | Bellek ana makine dosya/çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-host-core` | Bellek ana makine çekirdek çalışma zamanı takma adı | Bellek ana makine çekirdek çalışma zamanı yardımcıları için sağlayıcıdan bağımsız takma ad |
  | `plugin-sdk/memory-host-events` | Bellek ana makine olay günlüğü takma adı | Bellek ana makine olay günlüğü yardımcıları için sağlayıcıdan bağımsız takma ad |
  | `plugin-sdk/memory-host-files` | Kullanımdan kaldırılmış bellek dosya/çalışma zamanı takma adı | `plugin-sdk/memory-core-host-runtime-files` kullanın |
  | `plugin-sdk/memory-host-markdown` | Yönetilen markdown yardımcıları | Bellek bitişiğindeki Pluginler için paylaşılan yönetilen markdown yardımcıları |
  | `plugin-sdk/memory-host-search` | Etkin bellek arama cephesi | Geç yüklenen etkin bellek arama yöneticisi çalışma zamanı cephesi |
  | `plugin-sdk/memory-host-status` | Kullanımdan kaldırılmış bellek ana makine durumu takma adı | `plugin-sdk/memory-core-host-status` kullanın |
  | `plugin-sdk/testing` | Test yardımcı programları | Repo yerelinde kullanımdan kaldırılmış uyumluluk barrel'ı; `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` ve `plugin-sdk/test-fixtures` gibi odaklı repo yerel test alt yollarını kullanın |
</Accordion>

Bu tablo, tam SDK yüzeyi değil, bilerek ortak geçiş alt kümesidir. Derleyici giriş noktası envanteri `scripts/lib/plugin-sdk-entrypoints.json` içinde bulunur; paket dışa aktarımları herkese açık alt kümeden oluşturulur.

Rezerve ayrılmış paketli Plugin yardımcı bağlantı yüzeyleri, yayımlanmış `@openclaw/discord@2026.3.13` paketi için tutulan, kullanımdan kaldırılmış `plugin-sdk/discord` shim’i gibi açıkça belgelenmiş uyumluluk cepheleri dışında herkese açık SDK dışa aktarma haritasından kaldırılmıştır. Sahibe özgü yardımcılar, sahip Plugin paketinin içinde bulunur; paylaşılan ana makine davranışı `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` ve `plugin-sdk/plugin-config-runtime` gibi genel SDK sözleşmeleri üzerinden ilerlemelidir.

İşe uyan en dar içe aktarımı kullanın. Bir dışa aktarım bulamıyorsanız, `src/plugin-sdk/` konumundaki kaynağı kontrol edin veya hangi genel sözleşmenin bunu sahiplenmesi gerektiğini bakımcılara sorun.

## Etkin kullanımdan kaldırmalar

Plugin SDK, sağlayıcı sözleşmesi, çalışma zamanı yüzeyi ve manifest genelinde geçerli olan daha dar kullanımdan kaldırmalar. Her biri bugün hâlâ çalışır, ancak gelecekteki bir majör sürümde kaldırılacaktır. Her öğenin altındaki giriş, eski API’yi kanonik karşılığıyla eşler.

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **Eski (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Yeni (`openclaw/plugin-sdk/command-status`)**: aynı imzalar, aynı
    dışa aktarımlar - yalnızca daha dar alt yoldan içe aktarılır. `command-auth`
    bunları uyumluluk stub’ları olarak yeniden dışa aktarır.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention gating helpers → resolveInboundMentionDecision">
    **Eski**: `openclaw/plugin-sdk/channel-inbound` veya
    `openclaw/plugin-sdk/channel-mention-gating` içinden
    `resolveInboundMentionRequirement({ facts, policy })` ve
    `shouldDropInboundForMention(...)`.

    **Yeni**: `resolveInboundMentionDecision({ facts, policy })` - iki ayrı
    çağrı yerine tek bir karar nesnesi döndürür.

    Aşağı akış kanal Plugin’leri (Slack, Discord, Matrix, MS Teams) zaten
    geçiş yaptı.

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime`, eski kanal Plugin’leri için bir
    uyumluluk shim’idir. Yeni koddan bunu içe aktarmayın; çalışma zamanı
    nesnelerini kaydetmek için `openclaw/plugin-sdk/channel-runtime-context`
    kullanın.

    `openclaw/plugin-sdk/channel-actions` içindeki `channelActions*`
    yardımcıları, ham "actions" kanal dışa aktarımlarıyla birlikte kullanımdan
    kaldırılmıştır. Bunun yerine yetenekleri anlamsal `presentation` yüzeyi
    üzerinden açığa çıkarın - kanal Plugin’leri hangi ham eylem adlarını kabul
    ettiklerini değil, ne işlediklerini (kartlar, düğmeler, seçimler) bildirir.

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **Eski**: `openclaw/plugin-sdk/provider-web-search` içinden `tool()` fabrikası.

    **Yeni**: sağlayıcı Plugin üzerinde doğrudan `createTool(...)` uygulayın.
    OpenClaw artık araç sarmalayıcısını kaydetmek için SDK yardımcısına ihtiyaç
    duymaz.

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **Eski**: gelen kanal mesajlarından düz metin bir istem zarfı oluşturmak
    için `formatInboundEnvelope(...)` (ve
    `ChannelMessageForAgent.channelEnvelope`).

    **Yeni**: `BodyForAgent` ve yapılandırılmış kullanıcı bağlamı blokları.
    Kanal Plugin’leri yönlendirme meta verilerini (iş parçacığı, konu,
    yanıtlanan öğe, tepkiler) istem dizesine birleştirmek yerine türlenmiş
    alanlar olarak ekler. `formatAgentEnvelope(...)` yardımcısı, sentezlenen
    asistana dönük zarflar için hâlâ desteklenir, ancak gelen düz metin zarflar
    kaldırılma yolundadır.

    Etkilenen alanlar: `inbound_claim`, `message_received` ve
    `channelEnvelope` metnini sonradan işleyen tüm özel kanal Plugin’leri.

  </Accordion>

  <Accordion title="deactivate hook → gateway_stop">
    **Eski**: `api.on("deactivate", handler)`.

    **Yeni**: `api.on("gateway_stop", handler)`. Olay ve bağlam aynı kapatma
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

    `deactivate`, 2026-08-16 sonrasına kadar kullanımdan kaldırılmış bir
    uyumluluk takma adı olarak bağlı kalır.

  </Accordion>

  <Accordion title="subagent_spawning hook → core thread binding">
    **Eski**: `threadBindingReady` veya `deliveryOrigin` döndüren
    `api.on("subagent_spawning", handler)`.

    **Yeni**: çekirdeğin kanal oturum bağlama adaptörü üzerinden
    `thread: true` alt ajan bağlamalarını hazırlamasına izin verin. Yalnızca
    başlatma sonrası gözlem için `api.on("subagent_spawned", handler)` kullanın.

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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)`, dış Plugin’ler
    geçiş yaparken yalnızca kullanımdan kaldırılmış uyumluluk yüzeyleri olarak
    kalır.

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    Dört keşif türü takma adı artık katalog dönemi türlerinin ince
    sarmalayıcılarıdır:

    | Eski takma ad             | Yeni tür                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Ayrıca eski `ProviderCapabilities` statik torbası - sağlayıcı Plugin’leri
    statik bir nesne yerine `buildReplayPolicy`, `normalizeToolSchemas` ve
    `wrapStreamFn` gibi açık sağlayıcı kancalarını kullanmalıdır.

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **Eski** (`ProviderThinkingPolicy` üzerinde üç ayrı kanca):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` ve
    `resolveDefaultThinkingLevel(ctx)`.

    **Yeni**: kanonik `id`, isteğe bağlı `label` ve sıralı düzey listesini
    içeren bir `ProviderThinkingProfile` döndüren tek bir
    `resolveThinkingProfile(ctx)`. OpenClaw, eski saklanan değerleri profil
    sırasına göre otomatik olarak düşürür.

    Bağlam `provider`, `modelId`, isteğe bağlı birleştirilmiş `reasoning` ve
    isteğe bağlı birleştirilmiş model `compat` olgularını içerir. Sağlayıcı
    Plugin’leri, bu katalog olgularını kullanarak yalnızca yapılandırılmış
    istek sözleşmesi desteklediğinde modele özgü bir profili açığa çıkarabilir.

    Üç yerine tek bir kanca uygulayın. Eski kancalar kullanımdan kaldırma
    penceresi boyunca çalışmaya devam eder, ancak profil sonucuyla
    birleştirilmez.

  </Accordion>

  <Accordion title="External auth providers → contracts.externalAuthProviders">
    **Eski**: sağlayıcıyı Plugin manifestinde bildirmeden harici kimlik
    doğrulama kancaları uygulamak.

    **Yeni**: Plugin manifestinde `contracts.externalAuthProviders` bildirin
    **ve** `resolveExternalAuthProfiles(...)` uygulayın.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    **Eski** manifest alanı: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Yeni**: aynı ortam değişkeni aramasını manifest üzerinde
    `setup.providers[].envVars` içine yansıtın. Bu, kurulum/durum ortam meta
    verilerini tek yerde birleştirir ve yalnızca ortam değişkeni aramalarını
    yanıtlamak için Plugin çalışma zamanını başlatmayı önler.

    `providerAuthEnvVars`, kullanımdan kaldırma penceresi kapanana kadar bir
    uyumluluk adaptörü üzerinden desteklenmeye devam eder.

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **Eski**: üç ayrı çağrı -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Yeni**: bellek durumu API’sinde tek çağrı -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Aynı yuvalar, tek kayıt çağrısı. Eklemeli istem ve korpus yardımcıları
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`)
    etkilenmez.

  </Accordion>

  <Accordion title="Memory embedding provider API">
    **Eski**: `api.registerMemoryEmbeddingProvider(...)` ve
    `contracts.memoryEmbeddingProviders`.

    **Yeni**: `api.registerEmbeddingProvider(...)` ve
    `contracts.embeddingProviders`.

    Genel gömme sağlayıcısı sözleşmesi bellek dışında da yeniden
    kullanılabilir ve yeni sağlayıcılar için desteklenen yoldur. Belleğe özgü
    kayıt API’si, mevcut sağlayıcılar geçiş yaparken kullanımdan kaldırılmış
    uyumluluk olarak bağlı kalır. Plugin incelemesi, paketlenmemiş kullanımı
    uyumluluk borcu olarak raporlar.

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    `src/plugins/runtime/types.ts` içinden hâlâ dışa aktarılan iki eski tür
    takma adı:

    | Eski                          | Yeni                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    `readSession` çalışma zamanı yöntemi, `getSessionMessages` lehine
    kullanımdan kaldırılmıştır. Aynı imza; eski yöntem yeni yönteme çağrı
    aktarır.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Eski**: `runtime.tasks.flow` (tekil), canlı bir task-flow erişimcisi
    döndürürdü.

    **Yeni**: `runtime.tasks.managedFlows`, bir akıştan alt görevler oluşturan,
    güncelleyen, iptal eden veya çalıştıran Plugin’ler için yönetilen TaskFlow
    mutasyon çalışma zamanını tutar. Plugin yalnızca DTO tabanlı okumalara
    ihtiyaç duyuyorsa `runtime.tasks.flows` kullanın.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    Yukarıdaki "Nasıl geçilir → Gömülü araç sonucu uzantılarını middleware’e
    geçirin" bölümünde ele alınmıştır. Bütünlük için burada da yer alır:
    kaldırılan, yalnızca gömülü çalıştırıcıya özgü
    `api.registerEmbeddedExtensionFactory(...)` yolu,
    `contracts.agentToolResultMiddleware` içinde açık bir çalışma zamanı
    listesiyle `api.registerAgentToolResultMiddleware(...)` tarafından
    değiştirilmiştir.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    `openclaw/plugin-sdk` içinden yeniden dışa aktarılan `OpenClawSchemaType`
    artık `OpenClawConfig` için tek satırlık bir takma addır. Kanonik adı
    tercih edin.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
`extensions/` altındaki paketli kanal/sağlayıcı Plugin’leri içinde yer alan
uzantı düzeyi kullanımdan kaldırmalar, kendi `api.ts` ve `runtime-api.ts`
barrel’ları içinde izlenir. Bunlar üçüncü taraf Plugin sözleşmelerini etkilemez
ve burada listelenmez. Paketli bir Plugin’in yerel barrel’ını doğrudan
tüketiyorsanız, yükseltmeden önce o barrel’daki kullanımdan kaldırma yorumlarını
okuyun.
</Note>

## Kaldırma zaman çizelgesi

| Ne zaman               | Ne olur                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| **Şimdi**              | Kullanımdan kaldırılmış yüzeyler çalışma zamanı uyarıları yayınlar      |
| **Sonraki ana sürüm**  | Kullanımdan kaldırılmış yüzeyler kaldırılacak; bunları kullanmaya devam eden Plugin'ler başarısız olacak |

Tüm çekirdek Plugin'ler zaten taşındı. Harici Plugin'ler sonraki ana sürümden
önce geçiş yapmalıdır.

## Uyarıları geçici olarak bastırma

Geçiş üzerinde çalışırken bu ortam değişkenlerini ayarlayın:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Bu, kalıcı bir çözüm değil, geçici bir kaçış yoludur.

## İlgili

- [Başlarken](/tr/plugins/building-plugins) - ilk Plugin'inizi oluşturun
- [SDK Genel Bakış](/tr/plugins/sdk-overview) - tam alt yol içe aktarma başvurusu
- [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) - kanal Plugin'leri oluşturma
- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) - sağlayıcı Plugin'leri oluşturma
- [Plugin İç Yapısı](/tr/plugins/architecture) - mimariye derinlemesine bakış
- [Plugin Manifesti](/tr/plugins/manifest) - manifest şeması başvurusu
