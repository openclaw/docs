---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED uyarısını görüyorsunuz
    - OPENCLAW_EXTENSION_API_DEPRECATED uyarısını görüyorsunuz
    - OpenClaw 2026.4.25 öncesinde api.registerEmbeddedExtensionFactory kullandınız
    - Bir Plugin'i modern Plugin mimarisine güncelliyorsunuz
    - Harici bir OpenClaw Plugin'inin bakımını yapıyorsunuz
sidebarTitle: Migrate to SDK
summary: Eski geriye dönük uyumluluk katmanından modern Plugin SDK'sına geçiş yapın
title: Plugin SDK geçişi
x-i18n:
    generated_at: "2026-05-06T09:25:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: f629f6e3f9a0c122f3065d9b0b6b418e1c1ba29d42aff9ed025d61189be3e42a
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw, geniş bir geriye dönük uyumluluk katmanından odaklı, belgelenmiş import'lara sahip modern bir Plugin mimarisine geçti. Plugin'iniz yeni mimariden önce oluşturulduysa, bu kılavuz geçiş yapmanıza yardımcı olur.

## Değişenler

Eski Plugin sistemi, Plugin'lerin tek bir giriş noktasından ihtiyaç duydukları her şeyi import etmesine olanak tanıyan iki çok geniş yüzey sağlıyordu:

- **`openclaw/plugin-sdk/compat`** - onlarca yardımcıyı yeniden dışa aktaran tek bir import. Yeni Plugin mimarisi inşa edilirken eski hook tabanlı Plugin'lerin çalışmaya devam etmesi için sunulmuştu.
- **`openclaw/plugin-sdk/infra-runtime`** - sistem olaylarını, heartbeat durumunu, teslim kuyruklarını, fetch/proxy yardımcılarını, dosya yardımcılarını, onay türlerini ve ilgisiz yardımcı programları karıştıran geniş bir runtime yardımcı barrel'i.
- **`openclaw/plugin-sdk/config-runtime`** - geçiş aralığı sırasında artık kullanımdan kaldırılmış doğrudan yükleme/yazma yardımcılarını hâlâ taşıyan geniş bir config uyumluluk barrel'i.
- **`openclaw/extension-api`** - Plugin'lere gömülü agent çalıştırıcısı gibi host tarafı yardımcılara doğrudan erişim veren bir köprü.
- **`api.registerEmbeddedExtensionFactory(...)`** - `tool_result` gibi gömülü çalıştırıcı olaylarını gözlemleyebilen, kaldırılmış, yalnızca Pi'ye özgü paketli extension hook'u.

Geniş import yüzeyleri artık **kullanımdan kaldırılmıştır**. Runtime sırasında hâlâ çalışırlar, ancak yeni Plugin'ler bunları kullanmamalıdır ve mevcut Plugin'ler, bir sonraki major release bunları kaldırmadan önce geçiş yapmalıdır. Yalnızca Pi'ye özgü gömülü extension factory kayıt API'si kaldırılmıştır; bunun yerine araç sonucu middleware'i kullanın.

OpenClaw, yerine geçecek bir seçenek sunan değişiklikle aynı anda belgelenmiş Plugin davranışını kaldırmaz veya yeniden yorumlamaz. Kırıcı contract değişiklikleri önce bir uyumluluk adapter'ından, tanılardan, dokümanlardan ve bir kullanımdan kaldırma aralığından geçmelidir. Bu, SDK import'ları, manifest alanları, kurulum API'leri, hook'lar ve runtime kayıt davranışı için geçerlidir.

<Warning>
  Geriye dönük uyumluluk katmanı gelecekteki bir major release'te kaldırılacaktır.
  Bu yüzeylerden import etmeye devam eden Plugin'ler o gerçekleştiğinde bozulacaktır.
  Yalnızca Pi'ye özgü gömülü extension factory kayıtları artık zaten yüklenmiyor.
</Warning>

## Bu neden değişti

Eski yaklaşım sorunlara neden oldu:

- **Yavaş başlangıç** - tek bir yardımcıyı import etmek onlarca ilgisiz modülü yüklüyordu
- **Döngüsel bağımlılıklar** - geniş yeniden dışa aktarımlar import döngüleri oluşturmayı kolaylaştırıyordu
- **Belirsiz API yüzeyi** - hangi export'ların kararlı, hangilerinin internal olduğunu anlamanın yolu yoktu

Modern Plugin SDK bunu düzeltir: her import yolu (`openclaw/plugin-sdk/\<subpath\>`), net bir amacı ve belgelenmiş contract'ı olan küçük, kendi içinde bağımsız bir modüldür.

Paketli kanallar için eski provider kolaylık seam'leri de kaldırıldı.
Kanal markalı yardımcı seam'ler kararlı Plugin contract'ları değil, özel mono-repo kısayollarıydı. Bunun yerine dar ve genel SDK subpath'leri kullanın. Paketli Plugin çalışma alanında, provider'a ait yardımcıları o Plugin'in kendi `api.ts` veya `runtime-api.ts` dosyasında tutun.

Mevcut paketli provider örnekleri:

- Anthropic, Claude'a özgü stream yardımcılarını kendi `api.ts` /
  `contract-api.ts` seam'inde tutar
- OpenAI, provider builder'ları, varsayılan model yardımcılarını ve realtime provider
  builder'larını kendi `api.ts` dosyasında tutar
- OpenRouter, provider builder'ını ve onboarding/config yardımcılarını kendi
  `api.ts` dosyasında tutar

## Talk ve realtime ses geçiş planı

Realtime ses, telefon, toplantı ve tarayıcı Talk kodu, yüzeye yerel turn kayıt tutmadan `openclaw/plugin-sdk/realtime-voice` tarafından dışa aktarılan paylaşılan bir Talk oturum controller'ına taşınıyor. Yeni controller ortak Talk olay envelope'unu, aktif turn durumunu, capture durumunu, output-audio durumunu, yakın olay geçmişini ve eski turn reddini yönetir. Provider Plugin'leri tedarikçiye özgü realtime oturumları yönetmeye devam etmelidir; yüzey Plugin'leri capture, playback, telefon ve toplantı ayrıntılarını yönetmeye devam etmelidir.

Bu Talk geçişi bilinçli olarak temiz bir kırılma olacak şekilde tasarlanmıştır:

1. Paylaşılan controller/runtime primitives'lerini
   `plugin-sdk/realtime-voice` içinde tutun.
2. Paketli yüzeyleri paylaşılan controller'a taşıyın: tarayıcı relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime ve native push-to-talk.
3. Eski Talk RPC ailelerini nihai `talk.session.*` ve
   `talk.client.*` API'siyle değiştirin.
4. Gateway `hello-ok.features.events` içinde tek bir canlı Talk olay kanalını duyurun: `talk.event`.
5. Eski realtime HTTP endpoint'ini ve request-time instruction override yolunu silin.

Yeni kod, düşük seviyeli bir adapter veya test fixture uygulamadığı sürece `createTalkEventSequencer(...)` öğesini doğrudan çağırmamalıdır. Turn kapsamlı olayların turn id olmadan yayımlanamaması, eski `turnEnd` /
`turnCancel` çağrılarının daha yeni bir aktif turn'ü temizleyememesi ve output-audio lifecycle olaylarının telefon, toplantılar, tarayıcı relay'i, managed-room handoff ve native Talk istemcileri genelinde tutarlı kalması için paylaşılan controller'ı tercih edin.

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

Tarayıcıya ait WebRTC/provider-websocket oturumları `talk.client.create` kullanır, çünkü tarayıcı provider negotiation'ı ve media transport'u yönetirken Gateway kimlik bilgilerini, talimatları ve araç policy'sini yönetir. `talk.session.*`, gateway-relay realtime, gateway-relay transcription ve managed-room native STT/TTS oturumları için ortak Gateway yönetimli yüzeydir.

Realtime selector'ları `talk.provider` /
`talk.providers` yanına yerleştiren eski config'ler `openclaw doctor --fix` ile onarılmalıdır; runtime Talk, speech/TTS provider config'ini realtime provider config'i olarak yeniden yorumlamaz.

Desteklenen `talk.session.create` kombinasyonları bilinçli olarak küçüktür:

| Mod            | Transport       | Brain           | Sahip              | Notlar                                                                                                             |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Gateway üzerinden köprülenen full-duplex provider sesi; tool call'lar agent-consult aracı üzerinden yönlendirilir. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Yalnızca streaming STT; çağıranlar giriş sesi gönderir ve transcript olayları alır.                                |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | İstemcinin capture/playback'i, Gateway'in turn durumunu yönettiği push-to-talk ve walkie-talkie tarzı odalar.       |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | Gateway araç eylemlerini doğrudan yürüten güvenilir birinci taraf yüzeyler için yalnızca admin oda modu.           |

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

Birleşik kontrol sözlüğü de bilinçli olarak dardır:

| Method                          | Geçerli olduğu yer                                      | Contract                                                                                      |
| ------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Aynı Gateway bağlantısının sahip olduğu provider oturumuna base64 PCM ses parçası ekler.      |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Managed-room kullanıcı turn'ünü başlatır.                                                     |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Eski turn doğrulamasından sonra aktif turn'ü bitirir.                                         |
| `talk.session.cancelTurn`       | tüm Gateway-owned oturumlar                             | Bir turn için aktif capture/provider/agent/TTS işini iptal eder.                              |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Kullanıcı turn'ünü mutlaka bitirmeden asistan ses çıktısını durdurur.                         |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Relay tarafından yayımlanan provider tool call'u tamamlar.                                    |
| `talk.session.close`            | tüm birleşik oturumlar                                  | Relay oturumlarını durdurur veya managed-room durumunu revoke eder, ardından birleşik session id'yi unutur. |

Bunu çalıştırmak için core içinde provider veya platform özel durumları sunmayın.
Core, Talk session semantiğine sahiptir. Provider Plugin'leri vendor session kurulumuna sahiptir.
Voice-call ve Google Meet telefon/toplantı adapter'larına sahiptir. Tarayıcı ve native
uygulamalar cihaz capture/playback UX'ine sahiptir.

## Uyumluluk policy'si

Harici Plugin'ler için uyumluluk çalışması şu sırayı izler:

1. yeni contract'ı ekleyin
2. eski davranışı bir uyumluluk adapter'ı üzerinden bağlı tutun
3. eski yolu ve yerine geçeni adlandıran bir tanı veya uyarı yayımlayın
4. testlerde iki yolu da kapsayın
5. kullanımdan kaldırmayı ve geçiş yolunu belgeleyin
6. yalnızca duyurulan geçiş aralığından sonra, genellikle bir major release'te kaldırın

  Bakımcılar mevcut geçiş kuyruğunu
  `pnpm plugins:boundary-report` ile denetleyebilir. Kısa sayımlar için
  `pnpm plugins:boundary-report:summary`, tek bir plugin veya uyumluluk sahibi için
  `--owner <id>` ve bir CI kapısının süresi gelmiş uyumluluk kayıtlarında,
  sahipler arası ayrılmış SDK içe aktarmalarında veya kullanılmayan ayrılmış SDK
  alt yollarında başarısız olması gerektiğinde `pnpm plugins:boundary-report:ci`
  kullanın. Rapor, kullanımdan kaldırılmış uyumluluk kayıtlarını kaldırma tarihine
  göre gruplar, yerel kod/belge referanslarını sayar, sahipler arası ayrılmış SDK
  içe aktarmalarını görünür kılar ve özel bellek sunucusu SDK köprüsünü özetler;
  böylece uyumluluk temizliği geçici aramalara dayanmak yerine açık kalır.
  Ayrılmış SDK alt yollarının izlenen sahip kullanımı olmalıdır; kullanılmayan
  ayrılmış yardımcı dışa aktarımları genel SDK'dan kaldırılmalıdır.

  Bir manifest alanı hâlâ kabul ediliyorsa, plugin yazarları belgeler ve tanılar
  aksini söyleyene kadar onu kullanmaya devam edebilir. Yeni kod belgelenmiş
  değişimi tercih etmelidir, ancak mevcut pluginler olağan minor sürümler sırasında
  bozulmamalıdır.

  ## Nasıl geçiş yapılır

  <Steps>
  <Step title="Çalışma zamanı yapılandırma yükleme/yazma yardımcılarını geçirin">
    Paketli pluginler
    `api.runtime.config.loadConfig()` ve
    `api.runtime.config.writeConfigFile(...)` çağrılarını doğrudan yapmayı
    bırakmalıdır. Etkin çağrı yoluna zaten geçirilmiş yapılandırmayı tercih edin.
    Geçerli süreç anlık görüntüsüne ihtiyaç duyan uzun ömürlü işleyiciler
    `api.runtime.config.current()` kullanabilir. Uzun ömürlü aracı araçları,
    bir yapılandırma yazımından önce oluşturulmuş bir aracın yine de yenilenmiş
    çalışma zamanı yapılandırmasını görmesi için `execute` içinde araç bağlamının
    `ctx.getRuntimeConfig()` yöntemini kullanmalıdır.

    Yapılandırma yazımları işlemsel yardımcılar üzerinden gitmeli ve bir
    yazım sonrası ilkesi seçmelidir:

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
    çağıran taraf takip işinin sahibiyse ve yeniden yükleme planlayıcısını bilinçli
    olarak bastırmak istiyorsa `afterWrite: { mode: "none", reason: "..." }`
    kullanın. Mutasyon sonuçları testler ve günlükleme için tipli bir `followUp`
    özeti içerir; yeniden başlatmayı uygulama veya zamanlama sorumluluğu gateway'de
    kalır. `loadConfig` ve `writeConfigFile`, geçiş penceresi sırasında harici
    pluginler için kullanımdan kaldırılmış uyumluluk yardımcıları olarak kalır ve
    `runtime-config-load-write` uyumluluk koduyla bir kez uyarı verir. Paketli
    pluginler ve repo çalışma zamanı kodu, `pnpm check:deprecated-internal-config-api`
    ve `pnpm check:no-runtime-action-load-config` içindeki tarayıcı korumalarıyla
    korunur: yeni üretim plugin kullanımı doğrudan başarısız olur, doğrudan
    yapılandırma yazımları başarısız olur, gateway sunucu yöntemleri istek çalışma
    zamanı anlık görüntüsünü kullanmalıdır, çalışma zamanı kanal gönderme/eylem/
    istemci yardımcıları yapılandırmayı kendi sınırlarından almalıdır ve uzun
    ömürlü çalışma zamanı modüllerinin izin verilen ortam `loadConfig()` çağrısı
    sıfırdır.

    Yeni plugin kodu ayrıca geniş
    `openclaw/plugin-sdk/config-runtime` uyumluluk barrel'ını içe aktarmaktan
    kaçınmalıdır. İşe uyan dar SDK alt yolunu kullanın:

    | Gereksinim | İçe aktarma |
    | --- | --- |
    | `OpenClawConfig` gibi yapılandırma tipleri | `openclaw/plugin-sdk/config-types` |
    | Zaten yüklenmiş yapılandırma doğrulamaları ve plugin giriş yapılandırma araması | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Geçerli çalışma zamanı anlık görüntüsü okumaları | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Yapılandırma yazımları | `openclaw/plugin-sdk/config-mutation` |
    | Oturum deposu yardımcıları | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown tablo yapılandırması | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Grup ilkesi çalışma zamanı yardımcıları | `openclaw/plugin-sdk/runtime-group-policy` |
    | Gizli girdi çözümleme | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model/oturum geçersiz kılmaları | `openclaw/plugin-sdk/model-session-runtime` |

    Paketli pluginler ve testleri geniş barrel'a karşı tarayıcıyla korunur;
    böylece içe aktarmalar ve mock'lar yalnızca ihtiyaç duydukları davranışa yerel
    kalır. Geniş barrel harici uyumluluk için hâlâ vardır, ancak yeni kod ona
    bağlı olmamalıdır.

  </Step>

  <Step title="Pi araç sonucu uzantılarını middleware'e geçirin">
    Paketli pluginler, yalnızca Pi'ye özgü
    `api.registerEmbeddedExtensionFactory(...)` araç sonucu işleyicilerini
    çalışma zamanı bağımsız middleware ile değiştirmelidir.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Plugin manifestini aynı zamanda güncelleyin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Harici pluginler araç sonucu middleware'i kaydedemez, çünkü model görmeden
    önce yüksek güvenilirlikli araç çıktısını yeniden yazabilir.

  </Step>

  <Step title="Onay-yerel işleyicileri yetenek olgularına geçirin">
    Onay özellikli kanal pluginleri artık yerel onay davranışını
    `approvalCapability.nativeRuntime` ve paylaşılan çalışma zamanı bağlamı
    kayıt defteri üzerinden sunar.

    Temel değişiklikler:

    - `approvalCapability.handler.loadRuntime(...)` yerine
      `approvalCapability.nativeRuntime` kullanın
    - Onaya özel kimlik doğrulama/teslimatı eski `plugin.auth` /
      `plugin.approvals` bağlantısından `approvalCapability` üzerine taşıyın
    - `ChannelPlugin.approvals` genel kanal-plugin sözleşmesinden kaldırıldı;
      teslimat/yerel/işleme alanlarını `approvalCapability` üzerine taşıyın
    - `plugin.auth` yalnızca kanal giriş/çıkış akışları için kalır; buradaki onay
      kimlik doğrulama hook'ları artık core tarafından okunmaz
    - İstemciler, token'lar veya Bolt uygulamaları gibi kanalın sahip olduğu
      çalışma zamanı nesnelerini `openclaw/plugin-sdk/channel-runtime-context`
      üzerinden kaydedin
    - Yerel onay işleyicilerinden pluginin sahip olduğu yeniden yönlendirme
      bildirimleri göndermeyin; core artık gerçek teslimat sonuçlarından gelen
      başka yere yönlendirildi bildirimlerinin sahibidir
    - `createChannelManager(...)` içine `channelRuntime` geçirirken gerçek bir
      `createPluginRuntime().channel` yüzeyi sağlayın. Kısmi stub'lar reddedilir.

    Geçerli onay yeteneği düzeni için `/plugins/sdk-channel-plugins` bölümüne bakın.

  </Step>

  <Step title="Windows sarmalayıcı geri dönüş davranışını denetleyin">
    Plugininiz `openclaw/plugin-sdk/windows-spawn` kullanıyorsa, çözümlenemeyen
    Windows `.cmd`/`.bat` sarmalayıcıları artık `allowShellFallback: true`
    değerini açıkça geçmediğiniz sürece kapalı şekilde başarısız olur.

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

    Çağıran tarafınız shell geri dönüşüne bilinçli olarak dayanmıyorsa
    `allowShellFallback` ayarlamayın ve bunun yerine fırlatılan hatayı ele alın.

  </Step>

  <Step title="Kullanımdan kaldırılmış içe aktarmaları bulun">
    Plugininizde kullanımdan kaldırılmış yüzeylerden birinden yapılan içe aktarmaları arayın:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Odaklı içe aktarmalarla değiştirin">
    Eski yüzeyden yapılan her dışa aktarım belirli bir modern içe aktarma yoluna eşlenir:

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

    Sunucu tarafı yardımcıları için doğrudan içe aktarmak yerine enjekte edilen
    plugin çalışma zamanını kullanın:

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

  <Step title="Geniş infra-runtime içe aktarmalarını değiştirin">
    `openclaw/plugin-sdk/infra-runtime` harici uyumluluk için hâlâ vardır, ancak
    yeni kod gerçekten ihtiyaç duyduğu odaklı yardımcı yüzeyi içe aktarmalıdır:

    | Gereksinim | İçe aktarma |
    | --- | --- |
    | Sistem olay kuyruğu yardımcıları | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat olayı ve görünürlük yardımcıları | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Bekleyen teslimat kuyruğu boşaltma | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Kanal etkinliği telemetrisi | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Bellek içi tekilleştirme önbellekleri | `openclaw/plugin-sdk/dedupe-runtime` |
    | Güvenli yerel dosya/medya yolu yardımcıları | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher uyumlu fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy ve korumalı fetch yardımcıları | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF dispatcher ilkesi tipleri | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Onay isteği/çözümleme tipleri | `openclaw/plugin-sdk/approval-runtime` |
    | Onay yanıtı payload'u ve komut yardımcıları | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Hata biçimlendirme yardımcıları | `openclaw/plugin-sdk/error-runtime` |
    | Taşıma hazır olma beklemeleri | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Güvenli token yardımcıları | `openclaw/plugin-sdk/secure-random-runtime` |
    | Sınırlı eşzamansız görev eşzamanlılığı | `openclaw/plugin-sdk/concurrency-runtime` |
    | Sayısal zorlama | `openclaw/plugin-sdk/number-runtime` |
    | Süreç-yerel eşzamansız kilit | `openclaw/plugin-sdk/async-lock-runtime` |
    | Dosya kilitleri | `openclaw/plugin-sdk/file-lock` |

    Paketli pluginler `infra-runtime` kullanımına karşı tarayıcıyla korunur;
    bu nedenle repo kodu geniş barrel'a geri dönemez.

  </Step>

  <Step title="Kanal rota yardımcılarını geçirin">
    Yeni kanal rota kodu `openclaw/plugin-sdk/channel-route` kullanmalıdır.
    Eski route-key ve comparable-target adları geçiş penceresi sırasında
    uyumluluk alias'ları olarak kalır, ancak yeni pluginler davranışı doğrudan
    tanımlayan rota adlarını kullanmalıdır:

    | Eski yardımcı | Modern yardımcı |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Modern rota yardımcıları `{ channel, to, accountId, threadId }` değerlerini
    yerel onaylar, yanıt bastırma, gelen yinelenenleri ayıklama,
    Cron teslimi ve oturum yönlendirmesi genelinde tutarlı şekilde normalleştirir. Plugin'iniz özel hedef
    gramerine sahipse, bu ayrıştırıcıyı aynı rota hedefi sözleşmesine uyarlamak için
    `resolveChannelRouteTargetWithParser(...)` kullanın.

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
  | İçe aktarma yolu | Amaç | Ana dışa aktarımlar |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanonik Plugin giriş yardımcısı | `definePluginEntry` |
  | `plugin-sdk/core` | Kanal giriş tanımları/oluşturucuları için eski çatı yeniden dışa aktarımı | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Kök yapılandırma şeması dışa aktarımı | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Tek sağlayıcılı giriş yardımcısı | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Odaklanmış kanal giriş tanımları ve oluşturucuları | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları | İzin listesi istemleri, kurulum durumu oluşturucuları |
  | `plugin-sdk/setup-runtime` | Kurulum zamanı çalışma zamanı yardımcıları | İçe aktarma açısından güvenli kurulum yama bağdaştırıcıları, arama notu yardımcıları, `promptResolvedAllowFrom`, `splitSetupEntries`, yetkilendirilmiş kurulum proxy'leri |
  | `plugin-sdk/setup-adapter-runtime` | Kurulum bağdaştırıcısı yardımcıları | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Kurulum araçları yardımcıları | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Çok hesaplı yardımcılar | Hesap listesi/yapılandırma/eylem kapısı yardımcıları |
  | `plugin-sdk/account-id` | Hesap kimliği yardımcıları | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalleştirmesi |
  | `plugin-sdk/account-resolution` | Hesap arama yardımcıları | Hesap arama + varsayılana geri dönüş yardımcıları |
  | `plugin-sdk/account-helpers` | Dar kapsamlı hesap yardımcıları | Hesap listesi/hesap eylemi yardımcıları |
  | `plugin-sdk/channel-setup` | Kurulum sihirbazı bağdaştırıcıları | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM eşleştirme ilkelleri | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Yanıt öneki, yazıyor durumu ve kaynak teslimi bağlantıları | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Yapılandırma bağdaştırıcısı fabrikaları ve DM erişim yardımcıları | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Yapılandırma şeması oluşturucuları | Yalnızca paylaşılan kanal yapılandırma şeması ilkelleri ve genel oluşturucu |
  | `plugin-sdk/bundled-channel-config-schema` | Paketli yapılandırma şemaları | Yalnızca OpenClaw tarafından bakımı yapılan paketli plugins; yeni plugins Plugin yerel şemalar tanımlamalıdır |
  | `plugin-sdk/channel-config-schema-legacy` | Kullanımdan kaldırılmış paketli yapılandırma şemaları | Yalnızca uyumluluk takma adı; bakımı yapılan paketli plugins için `plugin-sdk/bundled-channel-config-schema` kullanın |
  | `plugin-sdk/telegram-command-config` | Telegram komut yapılandırması yardımcıları | Komut adı normalleştirmesi, açıklama kırpma, yinelenen/çakışan doğrulaması |
  | `plugin-sdk/channel-policy` | Grup/DM ilkesi çözümleme | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Hesap durumu ve taslak akış yaşam döngüsü yardımcıları | `createAccountStatusSink`, taslak önizleme sonlandırma yardımcıları |
  | `plugin-sdk/inbound-envelope` | Gelen zarf yardımcıları | Paylaşılan rota + zarf oluşturucu yardımcıları |
  | `plugin-sdk/inbound-reply-dispatch` | Gelen yanıt yardımcıları | Paylaşılan kaydet ve dağıt yardımcıları |
  | `plugin-sdk/messaging-targets` | Mesajlaşma hedefi ayrıştırma | Hedef ayrıştırma/eşleştirme yardımcıları |
  | `plugin-sdk/outbound-media` | Giden medya yardımcıları | Paylaşılan giden medya yükleme |
  | `plugin-sdk/outbound-send-deps` | Giden gönderim bağımlılığı yardımcıları | Tam giden çalışma zamanını içe aktarmadan hafif `resolveOutboundSendDep` araması |
  | `plugin-sdk/outbound-runtime` | Giden çalışma zamanı yardımcıları | Giden teslim, kimlik/gönderim yetkilendirmesi, oturum, biçimlendirme ve yük planlama yardımcıları |
  | `plugin-sdk/thread-bindings-runtime` | İş parçacığı bağlama yardımcıları | İş parçacığı bağlama yaşam döngüsü ve bağdaştırıcı yardımcıları |
  | `plugin-sdk/agent-media-payload` | Eski medya yükü yardımcıları | Eski alan düzenleri için ajan medya yükü oluşturucu |
  | `plugin-sdk/channel-runtime` | Kullanımdan kaldırılmış uyumluluk ara katmanı | Yalnızca eski kanal çalışma zamanı yardımcı programları |
  | `plugin-sdk/channel-send-result` | Gönderim sonucu türleri | Yanıt sonucu türleri |
  | `plugin-sdk/runtime-store` | Kalıcı Plugin depolama | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Geniş çalışma zamanı yardımcıları | Çalışma zamanı/günlükleme/yedekleme/Plugin kurulumu yardımcıları |
  | `plugin-sdk/runtime-env` | Dar kapsamlı çalışma zamanı ortamı yardımcıları | Günlükleyici/çalışma zamanı ortamı, zaman aşımı, yeniden deneme ve geri çekilme yardımcıları |
  | `plugin-sdk/plugin-runtime` | Paylaşılan Plugin çalışma zamanı yardımcıları | Plugin komutları/hook'ları/http/etkileşimli yardımcıları |
  | `plugin-sdk/hook-runtime` | Hook işlem hattı yardımcıları | Paylaşılan Webhook/dahili hook işlem hattı yardımcıları |
  | `plugin-sdk/lazy-runtime` | Tembel çalışma zamanı yardımcıları | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Süreç yardımcıları | Paylaşılan yürütme yardımcıları |
  | `plugin-sdk/cli-runtime` | CLI çalışma zamanı yardımcıları | Komut biçimlendirme, beklemeler, sürüm yardımcıları |
  | `plugin-sdk/gateway-runtime` | Gateway yardımcıları | Gateway istemcisi, olay döngüsü hazır başlatma yardımcısı ve kanal durumu yama yardımcıları |
  | `plugin-sdk/config-runtime` | Kullanımdan kaldırılmış yapılandırma uyumluluğu ara katmanı | `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` ve `config-mutation` tercih edin |
  | `plugin-sdk/telegram-command-config` | Telegram komut yardımcıları | Paketli Telegram sözleşme yüzeyi kullanılamadığında geri dönüş açısından kararlı Telegram komut doğrulama yardımcıları |
  | `plugin-sdk/approval-runtime` | Onay istemi yardımcıları | Yürütme/Plugin onay yükü, onay yeteneği/profil yardımcıları, yerel onay yönlendirme/çalışma zamanı yardımcıları ve yapılandırılmış onay görüntüleme yolu biçimlendirmesi |
  | `plugin-sdk/approval-auth-runtime` | Onay kimlik doğrulama yardımcıları | Onaylayıcı çözümleme, aynı sohbet eylem kimlik doğrulaması |
  | `plugin-sdk/approval-client-runtime` | Onay istemcisi yardımcıları | Yerel yürütme onay profili/filtre yardımcıları |
  | `plugin-sdk/approval-delivery-runtime` | Onay teslimi yardımcıları | Yerel onay yeteneği/teslim bağdaştırıcıları |
  | `plugin-sdk/approval-gateway-runtime` | Onay Gateway yardımcıları | Paylaşılan onay Gateway çözümleme yardımcısı |
  | `plugin-sdk/approval-handler-adapter-runtime` | Onay bağdaştırıcısı yardımcıları | Sıcak kanal giriş noktaları için hafif yerel onay bağdaştırıcısı yükleme yardımcıları |
  | `plugin-sdk/approval-handler-runtime` | Onay işleyici yardımcıları | Daha geniş onay işleyici çalışma zamanı yardımcıları; yeterli olduklarında daha dar bağdaştırıcı/Gateway arayüzlerini tercih edin |
  | `plugin-sdk/approval-native-runtime` | Onay hedefi yardımcıları | Yerel onay hedefi/hesap bağlama yardımcıları |
  | `plugin-sdk/approval-reply-runtime` | Onay yanıtı yardımcıları | Yürütme/Plugin onay yanıtı yükü yardımcıları |
  | `plugin-sdk/channel-runtime-context` | Kanal çalışma zamanı bağlamı yardımcıları | Genel kanal çalışma zamanı bağlamı kaydet/al/izle yardımcıları |
  | `plugin-sdk/security-runtime` | Güvenlik yardımcıları | Paylaşılan güven, DM kapılama, kökle sınırlı dosya/yol yardımcıları, dış içerik ve gizli bilgi toplama yardımcıları |
  | `plugin-sdk/ssrf-policy` | SSRF ilkesi yardımcıları | Ana makine izin listesi ve özel ağ ilkesi yardımcıları |
  | `plugin-sdk/ssrf-runtime` | SSRF çalışma zamanı yardımcıları | Sabitlenmiş dağıtıcı, korumalı fetch, SSRF ilkesi yardımcıları |
  | `plugin-sdk/system-event-runtime` | Sistem olayı yardımcıları | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat yardımcıları | Heartbeat olayı ve görünürlük yardımcıları |
  | `plugin-sdk/delivery-queue-runtime` | Teslim kuyruğu yardımcıları | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Kanal etkinliği yardımcıları | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Yinelenenleri ayıklama yardımcıları | Bellek içi yinelenenleri ayıklama önbellekleri |
  | `plugin-sdk/file-access-runtime` | Dosya erişimi yardımcıları | Güvenli yerel dosya/medya yolu yardımcıları |
  | `plugin-sdk/transport-ready-runtime` | Taşıma hazır olma yardımcıları | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Sınırlı önbellek yardımcıları | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Tanılama kapılama yardımcıları | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hata biçimlendirme yardımcıları | `formatUncaughtError`, `isApprovalNotFoundError`, hata grafiği yardımcıları |
  | `plugin-sdk/fetch-runtime` | Sarmalanmış fetch/proxy yardımcıları | `resolveFetch`, proxy yardımcıları, EnvHttpProxyAgent seçenek yardımcıları |
  | `plugin-sdk/host-runtime` | Ana makine normalleştirme yardımcıları | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Yeniden deneme yardımcıları | `RetryConfig`, `retryAsync`, ilke çalıştırıcıları |
  | `plugin-sdk/allow-from` | İzin listesi biçimlendirme | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | İzin listesi girdisi eşleme | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Komut kapılama ve komut yüzeyi yardımcıları | `resolveControlCommandGate`, gönderen yetkilendirme yardımcıları, dinamik argüman menüsü biçimlendirmesi dahil komut kayıt defteri yardımcıları |
  | `plugin-sdk/command-status` | Komut durumu/yardım işleyicileri | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Gizli bilgi girdisi ayrıştırma | Gizli bilgi girdisi yardımcıları |
  | `plugin-sdk/webhook-ingress` | Webhook isteği yardımcıları | Webhook hedef yardımcı programları |
  | `plugin-sdk/webhook-request-guards` | Webhook gövdesi koruma yardımcıları | İstek gövdesi okuma/sınır yardımcıları |
  | `plugin-sdk/reply-runtime` | Paylaşılan yanıt çalışma zamanı | Gelen dağıtım, Heartbeat, yanıt planlayıcı, parçalara ayırma |
  | `plugin-sdk/reply-dispatch-runtime` | Dar kapsamlı yanıt dağıtım yardımcıları | Sonlandırma, sağlayıcı dağıtımı ve konuşma etiketi yardımcıları |
  | `plugin-sdk/reply-history` | Yanıt geçmişi yardımcıları | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Yanıt başvurusu planlama | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Yanıt parçası yardımcıları | Metin/markdown parçalara ayırma yardımcıları |
  | `plugin-sdk/session-store-runtime` | Oturum deposu yardımcıları | Depo yolu + güncellenme zamanı yardımcıları |
  | `plugin-sdk/state-paths` | Durum yolu yardımcıları | Durum ve OAuth dizini yardımcıları |
  | `plugin-sdk/routing` | Yönlendirme/oturum anahtarı yardımcıları | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, oturum anahtarı normalleştirme yardımcıları |
  | `plugin-sdk/status-helpers` | Kanal durumu yardımcıları | Kanal/hesap durumu özeti oluşturucuları, çalışma zamanı durumu varsayılanları, sorun meta verisi yardımcıları |
  | `plugin-sdk/target-resolver-runtime` | Hedef çözümleyici yardımcıları | Paylaşılan hedef çözümleyici yardımcıları |
  | `plugin-sdk/string-normalization-runtime` | Dize normalleştirme yardımcıları | Slug/dize normalleştirme yardımcıları |
  | `plugin-sdk/request-url` | İstek URL yardımcıları | İstek benzeri girdilerden dize URL'leri çıkarma |
  | `plugin-sdk/run-command` | Zamanlanmış komut yardımcıları | Normalleştirilmiş stdout/stderr ile zamanlanmış komut çalıştırıcı |
  | `plugin-sdk/param-readers` | Parametre okuyucuları | Ortak araç/CLI parametre okuyucuları |
  | `plugin-sdk/tool-payload` | Araç yükü çıkarma | Araç sonuç nesnelerinden normalleştirilmiş yükleri çıkarır |
  | `plugin-sdk/tool-send` | Araç gönderimi çıkarma | Araç argümanlarından kanonik gönderim hedefi alanlarını çıkarır |
  | `plugin-sdk/temp-path` | Geçici yol yardımcıları | Paylaşılan geçici indirme yolu yardımcıları |
  | `plugin-sdk/logging-core` | Günlükleme yardımcıları | Alt sistem günlükleyicisi ve redaksiyon yardımcıları |
  | `plugin-sdk/markdown-table-runtime` | Markdown tablo yardımcıları | Markdown tablo modu yardımcıları |
  | `plugin-sdk/reply-payload` | İleti yanıt türleri | Yanıt yükü türleri |
  | `plugin-sdk/provider-setup` | Küratörlü yerel/kendi barındırılan sağlayıcı kurulum yardımcıları | Kendi barındırılan sağlayıcı keşif/yapılandırma yardımcıları |
  | `plugin-sdk/self-hosted-provider-setup` | Odaklı OpenAI uyumlu kendi barındırılan sağlayıcı kurulum yardımcıları | Aynı kendi barındırılan sağlayıcı keşif/yapılandırma yardımcıları |
  | `plugin-sdk/provider-auth-runtime` | Sağlayıcı çalışma zamanı kimlik doğrulama yardımcıları | Çalışma zamanı API anahtarı çözümleme yardımcıları |
  | `plugin-sdk/provider-auth-api-key` | Sağlayıcı API anahtarı kurulum yardımcıları | API anahtarı ilk kurulum/profil yazma yardımcıları |
  | `plugin-sdk/provider-auth-result` | Sağlayıcı kimlik doğrulama sonucu yardımcıları | Standart OAuth kimlik doğrulama sonucu oluşturucu |
  | `plugin-sdk/provider-auth-login` | Sağlayıcı etkileşimli oturum açma yardımcıları | Paylaşılan etkileşimli oturum açma yardımcıları |
  | `plugin-sdk/provider-selection-runtime` | Sağlayıcı seçimi yardımcıları | Yapılandırılmış veya otomatik sağlayıcı seçimi ve ham sağlayıcı yapılandırması birleştirme |
  | `plugin-sdk/provider-env-vars` | Sağlayıcı ortam değişkeni yardımcıları | Sağlayıcı kimlik doğrulama ortam değişkeni arama yardımcıları |
  | `plugin-sdk/provider-model-shared` | Paylaşılan sağlayıcı model/yeniden oynatma yardımcıları | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan yeniden oynatma ilkesi oluşturucuları, sağlayıcı uç noktası yardımcıları ve model kimliği normalleştirme yardımcıları |
  | `plugin-sdk/provider-catalog-shared` | Paylaşılan sağlayıcı katalog yardımcıları | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Sağlayıcı ilk kurulum yamaları | İlk kurulum yapılandırma yardımcıları |
  | `plugin-sdk/provider-http` | Sağlayıcı HTTP yardımcıları | Ses transkripsiyonu multipart form yardımcıları dahil genel sağlayıcı HTTP/uç nokta yetenek yardımcıları |
  | `plugin-sdk/provider-web-fetch` | Sağlayıcı web-fetch yardımcıları | Web-fetch sağlayıcı kayıt/önbellek yardımcıları |
  | `plugin-sdk/provider-web-search-config-contract` | Sağlayıcı web arama yapılandırma yardımcıları | Plugin etkinleştirme bağlantısına ihtiyaç duymayan sağlayıcılar için dar kapsamlı web arama yapılandırma/kimlik bilgisi yardımcıları |
  | `plugin-sdk/provider-web-search-contract` | Sağlayıcı web arama sözleşmesi yardımcıları | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcıları/alıcıları gibi dar kapsamlı web arama yapılandırma/kimlik bilgisi sözleşmesi yardımcıları |
  | `plugin-sdk/provider-web-search` | Sağlayıcı web arama yardımcıları | Web arama sağlayıcı kayıt/önbellek/çalışma zamanı yardımcıları |
  | `plugin-sdk/provider-tools` | Sağlayıcı araç/şema uyumluluk yardımcıları | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini şema temizliği + tanılama ve `resolveXaiModelCompatPatch` / `applyXaiModelCompat` gibi xAI uyumluluk yardımcıları |
  | `plugin-sdk/provider-usage` | Sağlayıcı kullanım yardımcıları | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` ve diğer sağlayıcı kullanım yardımcıları |
  | `plugin-sdk/provider-stream` | Sağlayıcı akış sarmalayıcı yardımcıları | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
  | `plugin-sdk/provider-transport-runtime` | Sağlayıcı aktarım yardımcıları | Korumalı fetch, aktarım iletisi dönüşümleri ve yazılabilir aktarım olay akışları gibi yerel sağlayıcı aktarım yardımcıları |
  | `plugin-sdk/keyed-async-queue` | Sıralı zaman uyumsuz kuyruk | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Paylaşılan medya yardımcıları | Medya getirme/dönüştürme/depolama yardımcıları, ffprobe destekli video boyutu yoklama ve medya yükü oluşturucuları |
  | `plugin-sdk/media-generation-runtime` | Paylaşılan medya üretimi yardımcıları | Görüntü/video/müzik üretimi için paylaşılan yük devretme yardımcıları, aday seçimi ve eksik model iletileri |
  | `plugin-sdk/media-understanding` | Medya anlama yardımcıları | Medya anlama sağlayıcı türleri ve sağlayıcıya yönelik görüntü/ses yardımcı dışa aktarımları |
  | `plugin-sdk/text-runtime` | Paylaşılan metin yardımcıları | Asistan tarafından görülebilir metin ayıklama, markdown işleme/parçalama/tablo yardımcıları, redaksiyon yardımcıları, yönerge etiketi yardımcıları, güvenli metin yardımcı programları ve ilgili metin/günlükleme yardımcıları |
  | `plugin-sdk/text-chunking` | Metin parçalama yardımcıları | Giden metin parçalama yardımcısı |
  | `plugin-sdk/speech` | Konuşma yardımcıları | Konuşma sağlayıcı türleri ve sağlayıcıya yönelik yönerge, kayıt defteri, doğrulama yardımcıları ve OpenAI uyumlu TTS oluşturucu |
  | `plugin-sdk/speech-core` | Paylaşılan konuşma çekirdeği | Konuşma sağlayıcı türleri, kayıt defteri, yönergeler, normalleştirme |
  | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon yardımcıları | Sağlayıcı türleri, kayıt defteri yardımcıları ve paylaşılan WebSocket oturumu yardımcısı |
  | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses yardımcıları | Sağlayıcı türleri, kayıt defteri/çözümleme yardımcıları, köprü oturumu yardımcıları, paylaşılan ajan geri konuşma kuyrukları, transkript/olay sağlığı, yankı bastırma ve hızlı bağlam danışma yardımcıları |
  | `plugin-sdk/image-generation` | Görüntü üretimi yardımcıları | Görüntü üretimi sağlayıcı türleri, görüntü varlığı/veri URL'si yardımcıları ve OpenAI uyumlu görüntü sağlayıcı oluşturucu |
  | `plugin-sdk/image-generation-core` | Paylaşılan görüntü üretimi çekirdeği | Görüntü üretimi türleri, yük devretme, kimlik doğrulama ve kayıt defteri yardımcıları |
  | `plugin-sdk/music-generation` | Müzik üretimi yardımcıları | Müzik üretimi sağlayıcı/istek/sonuç türleri |
  | `plugin-sdk/music-generation-core` | Paylaşılan müzik üretimi çekirdeği | Müzik üretimi türleri, yük devretme yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
  | `plugin-sdk/video-generation` | Video üretimi yardımcıları | Video üretimi sağlayıcı/istek/sonuç türleri |
  | `plugin-sdk/video-generation-core` | Paylaşılan video üretimi çekirdeği | Video üretimi türleri, yük devretme yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
  | `plugin-sdk/interactive-runtime` | Etkileşimli yanıt yardımcıları | Etkileşimli yanıt yükü normalleştirme/azaltma |
  | `plugin-sdk/channel-config-primitives` | Kanal yapılandırması ilkel öğeleri | Dar kapsamlı kanal yapılandırma şeması ilkel öğeleri |
  | `plugin-sdk/channel-config-writes` | Kanal yapılandırması yazma yardımcıları | Kanal yapılandırması yazma yetkilendirme yardımcıları |
  | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal başlangıcı | Paylaşılan kanal Plugin başlangıcı dışa aktarımları |
  | `plugin-sdk/channel-status` | Kanal durumu yardımcıları | Paylaşılan kanal durumu anlık görüntü/özet yardımcıları |
  | `plugin-sdk/allowlist-config-edit` | İzin listesi yapılandırma yardımcıları | İzin listesi yapılandırma düzenleme/okuma yardımcıları |
  | `plugin-sdk/group-access` | Grup erişimi yardımcıları | Paylaşılan grup erişimi karar yardımcıları |
  | `plugin-sdk/direct-dm` | Doğrudan DM yardımcıları | Paylaşılan doğrudan DM kimlik doğrulama/koruma yardımcıları |
  | `plugin-sdk/extension-shared` | Paylaşılan uzantı yardımcıları | Pasif kanal/durum ve ortam proxy yardımcısı ilkel öğeleri |
  | `plugin-sdk/webhook-targets` | Webhook hedef yardımcıları | Webhook hedef kayıt defteri ve rota kurulum yardımcıları |
  | `plugin-sdk/webhook-path` | Webhook yolu yardımcıları | Webhook yolu normalleştirme yardımcıları |
  | `plugin-sdk/web-media` | Paylaşılan web medya yardımcıları | Uzak/yerel medya yükleme yardımcıları |
  | `plugin-sdk/zod` | Zod yeniden dışa aktarımı | Plugin SDK tüketicileri için yeniden dışa aktarılan `zod` |
  | `plugin-sdk/memory-core` | Paketlenmiş memory-core yardımcıları | Bellek yöneticisi/yapılandırma/dosya/CLI yardımcı yüzeyi |
  | `plugin-sdk/memory-core-engine-runtime` | Bellek motoru çalışma zamanı cephesi | Bellek dizin/arama çalışma zamanı cephesi |
  | `plugin-sdk/memory-core-host-engine-foundation` | Bellek host temel motoru | Bellek host temel motoru dışa aktarımları |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek host embedding motoru | Bellek embedding sözleşmeleri, kayıt defteri erişimi, yerel sağlayıcı ve genel toplu/uzak yardımcılar; somut uzak sağlayıcılar kendi sahip Plugin'lerinde bulunur |
  | `plugin-sdk/memory-core-host-engine-qmd` | Bellek host QMD motoru | Bellek host QMD motoru dışa aktarımları |
  | `plugin-sdk/memory-core-host-engine-storage` | Bellek host depolama motoru | Bellek host depolama motoru dışa aktarımları |
  | `plugin-sdk/memory-core-host-multimodal` | Bellek host çok modlu yardımcıları | Bellek host çok modlu yardımcıları |
  | `plugin-sdk/memory-core-host-query` | Bellek host sorgu yardımcıları | Bellek host sorgu yardımcıları |
  | `plugin-sdk/memory-core-host-secret` | Bellek host gizli bilgi yardımcıları | Bellek host gizli bilgi yardımcıları |
  | `plugin-sdk/memory-core-host-events` | Bellek host olay günlüğü yardımcıları | Bellek host olay günlüğü yardımcıları |
  | `plugin-sdk/memory-core-host-status` | Bellek host durumu yardımcıları | Bellek host durumu yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-cli` | Bellek host CLI çalışma zamanı | Bellek host CLI çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-core` | Bellek host çekirdek çalışma zamanı | Bellek host çekirdek çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-files` | Bellek host dosya/çalışma zamanı yardımcıları | Bellek host dosya/çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-host-core` | Bellek host çekirdek çalışma zamanı takma adı | Bellek host çekirdek çalışma zamanı yardımcıları için tedarikçiden bağımsız takma ad |
  | `plugin-sdk/memory-host-events` | Bellek host olay günlüğü takma adı | Bellek host olay günlüğü yardımcıları için tedarikçiden bağımsız takma ad |
  | `plugin-sdk/memory-host-files` | Bellek host dosya/çalışma zamanı takma adı | Bellek host dosya/çalışma zamanı yardımcıları için tedarikçiden bağımsız takma ad |
  | `plugin-sdk/memory-host-markdown` | Yönetilen markdown yardımcıları | Belleğe komşu Plugin'ler için paylaşılan yönetilen markdown yardımcıları |
  | `plugin-sdk/memory-host-search` | Active Memory arama cephesi | Tembel Active Memory arama yöneticisi çalışma zamanı cephesi |
  | `plugin-sdk/memory-host-status` | Bellek host durumu takma adı | Bellek host durumu yardımcıları için tedarikçiden bağımsız takma ad |
  | `plugin-sdk/testing` | Test yardımcı programları | Eski geniş uyumluluk barrel'i; `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` ve `plugin-sdk/test-fixtures` gibi odaklı test alt yollarını tercih edin |
</Accordion>

Bu tablo, tam SDK yüzeyi değil, bilerek ortak geçiş alt kümesidir. 200+ giriş noktasının tam listesi `scripts/lib/plugin-sdk-entrypoints.json` içinde bulunur.

Açıkça belgelenmiş uyumluluk cepheleri, örneğin yayımlanmış `@openclaw/discord@2026.3.13` paketi için korunan kullanım dışı `plugin-sdk/discord` shim’i dışında, ayrılmış paketli Plugin yardımcı seams’leri genel SDK export map’inden kaldırılmıştır. Sahibe özgü yardımcılar, sahip olan Plugin paketinin içinde yaşar; paylaşılan host davranışı `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` ve `plugin-sdk/plugin-config-runtime` gibi genel SDK sözleşmeleri üzerinden ilerlemelidir.

İşe uyan en dar import’u kullanın. Bir export bulamıyorsanız, `src/plugin-sdk/` içindeki kaynağı kontrol edin veya bunun hangi genel sözleşmeye ait olması gerektiğini bakımcılara sorun.

## Etkin kullanımdan kaldırmalar

Plugin SDK, provider sözleşmesi, runtime yüzeyi ve manifest genelinde geçerli daha dar kullanımdan kaldırmalar. Her biri bugün hâlâ çalışır, ancak gelecekteki bir major sürümde kaldırılacaktır. Her öğenin altındaki giriş, eski API’yi kanonik yedeğiyle eşler.

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **Eski (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Yeni (`openclaw/plugin-sdk/command-status`)**: aynı imzalar, aynı
    export’lar - yalnızca daha dar alt yoldan import edilir. `command-auth`
    bunları uyumluluk stub’ları olarak yeniden export eder.

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

    **Yeni**: `resolveInboundMentionDecision({ facts, policy })` - iki ayrı çağrı yerine
    tek bir karar nesnesi döndürür.

    Aşağı akış channel Plugin’leri (Slack, Discord, Matrix, MS Teams) zaten
    geçiş yaptı.

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime`, eski channel Plugin’leri için bir uyumluluk shim’idir.
    Yeni koddan import etmeyin; runtime nesnelerini kaydetmek için
    `openclaw/plugin-sdk/channel-runtime-context` kullanın.

    `openclaw/plugin-sdk/channel-actions` içindeki `channelActions*` yardımcıları,
    ham "actions" channel export’larıyla birlikte kullanımdan kaldırılmıştır. Yetenekleri
    bunun yerine semantik `presentation` yüzeyi üzerinden sunun - channel Plugin’leri
    hangi ham action adlarını kabul ettiklerini değil, ne render ettiklerini
    (kartlar, düğmeler, seçimler) bildirir.

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **Eski**: `openclaw/plugin-sdk/provider-web-search` içinden `tool()` factory’si.

    **Yeni**: `createTool(...)` öğesini doğrudan provider Plugin üzerinde uygulayın.
    OpenClaw artık araç sarmalayıcısını kaydetmek için SDK yardımcısına ihtiyaç duymaz.

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **Eski**: inbound channel mesajlarından düz plaintext prompt envelope oluşturmak için
    `formatInboundEnvelope(...)` (ve
    `ChannelMessageForAgent.channelEnvelope`).

    **Yeni**: `BodyForAgent` artı yapılandırılmış kullanıcı bağlamı blokları. Channel
    Plugin’leri yönlendirme metadata’sını (iş parçacığı, konu, yanıtlanan öğe, tepkiler)
    bir prompt string’ine birleştirmek yerine türlenmiş alanlar olarak ekler. 
    `formatAgentEnvelope(...)` yardımcısı, sentezlenmiş assistant-facing envelope’lar için
    hâlâ desteklenir, ancak inbound plaintext envelope’lar kullanımdan kaldırılma yolundadır.

    Etkilenen alanlar: `inbound_claim`, `message_received` ve `channelEnvelope` metnini
    sonradan işleyen herhangi bir özel channel Plugin’i.

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    Dört discovery type alias artık catalog dönemi türlerinin ince sarmalayıcılarıdır:

    | Eski alias                | Yeni tür                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Ayrıca eski `ProviderCapabilities` statik torbası - provider Plugin’leri
    statik bir nesne yerine `buildReplayPolicy`, `normalizeToolSchemas` ve
    `wrapStreamFn` gibi açık provider hook’larını kullanmalıdır.

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **Eski** (`ProviderThinkingPolicy` üzerinde üç ayrı hook):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` ve
    `resolveDefaultThinkingLevel(ctx)`.

    **Yeni**: kanonik `id`, isteğe bağlı `label` ve sıralı seviye listesini içeren
    bir `ProviderThinkingProfile` döndüren tek bir `resolveThinkingProfile(ctx)`.
    OpenClaw, bayat saklanmış değerleri profil sıralamasına göre otomatik olarak düşürür.

    Üç yerine tek bir hook uygulayın. Eski hook’lar kullanımdan kaldırma penceresi
    boyunca çalışmaya devam eder, ancak profil sonucuyla birleştirilmez.

  </Accordion>

  <Accordion title="External OAuth provider fallback → contracts.externalAuthProviders">
    **Eski**: provider’ı Plugin manifest’inde bildirmeden
    `resolveExternalOAuthProfiles(...)` uygulamak.

    **Yeni**: Plugin manifest’inde `contracts.externalAuthProviders` bildirin
    **ve** `resolveExternalAuthProfiles(...)` uygulayın. Eski "auth
    fallback" yolu runtime’da bir uyarı yayar ve kaldırılacaktır.

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

    **Yeni**: aynı env-var lookup’ını manifest üzerindeki `setup.providers[].envVars`
    içine yansıtın. Bu, setup/status env metadata’sını tek bir yerde birleştirir ve
    env-var lookup’larına yanıt vermek için Plugin runtime’ını başlatma gereğini ortadan kaldırır.

    `providerAuthEnvVars`, kullanımdan kaldırma penceresi kapanana kadar bir uyumluluk
    adapter’ı üzerinden desteklenmeye devam eder.

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **Eski**: üç ayrı çağrı -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Yeni**: memory-state API üzerinde tek çağrı -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Aynı slot’lar, tek kayıt çağrısı. Eklemeli memory yardımcıları
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) etkilenmez.

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    `src/plugins/runtime/types.ts` içinden hâlâ export edilen iki eski type alias:

    | Eski                          | Yeni                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    `readSession` runtime metodu, `getSessionMessages` lehine kullanımdan kaldırılmıştır.
    Aynı imza; eski metot yenisine çağrı geçirir.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Eski**: `runtime.tasks.flow` (tekil) canlı bir task-flow erişimcisi döndürürdü.

    **Yeni**: `runtime.tasks.managedFlows`, bir flow’dan alt görevler oluşturan,
    güncelleyen, iptal eden veya çalıştıran Plugin’ler için yönetilen TaskFlow mutasyon
    runtime’ını korur. Plugin yalnızca DTO tabanlı okumalara ihtiyaç duyuyorsa
    `runtime.tasks.flows` kullanın.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    Yukarıdaki "Nasıl geçiş yapılır → Pi tool-result extension’larını middleware’e taşıma"
    bölümünde ele alındı. Eksiksizlik için burada da dahil edilmiştir: kaldırılan yalnızca
    Pi’ye özgü `api.registerEmbeddedExtensionFactory(...)` yolu, `contracts.agentToolResultMiddleware`
    içinde açık bir runtime listesiyle `api.registerAgentToolResultMiddleware(...)` ile değiştirilir.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    `openclaw/plugin-sdk` içinden yeniden export edilen `OpenClawSchemaType` artık
    `OpenClawConfig` için tek satırlık bir alias’tır. Kanonik adı tercih edin.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
`extensions/` altındaki paketli channel/provider Plugin’leri içindeki extension-level
kullanımdan kaldırmalar, kendi `api.ts` ve `runtime-api.ts` barrel’ları içinde takip edilir.
Bunlar üçüncü taraf Plugin sözleşmelerini etkilemez ve burada listelenmez. Paketli bir
Plugin’in yerel barrel’ını doğrudan tüketiyorsanız, yükseltmeden önce o barrel’daki
kullanımdan kaldırma yorumlarını okuyun.
</Note>

## Kaldırma zaman çizelgesi

| Ne zaman               | Ne olur                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| **Şimdi**              | Kullanımdan kaldırılmış yüzeyler runtime uyarıları yayar                |
| **Sonraki major sürüm** | Kullanımdan kaldırılmış yüzeyler kaldırılır; hâlâ bunları kullanan Plugin’ler başarısız olur |

Tüm core Plugin’ler zaten taşındı. Harici Plugin’ler bir sonraki major sürümden önce
geçiş yapmalıdır.

## Uyarıları geçici olarak susturma

Geçiş üzerinde çalışırken şu ortam değişkenlerini ayarlayın:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Bu geçici bir kaçış kapağıdır, kalıcı bir çözüm değildir.

## İlgili

- [Başlarken](/tr/plugins/building-plugins) - ilk Plugin’inizi oluşturun
- [SDK Genel Bakış](/tr/plugins/sdk-overview) - tam alt yol import referansı
- [Channel Plugin’leri](/tr/plugins/sdk-channel-plugins) - channel Plugin’leri oluşturma
- [Provider Plugin’leri](/tr/plugins/sdk-provider-plugins) - provider Plugin’leri oluşturma
- [Plugin İç Yapıları](/tr/plugins/architecture) - mimariye derinlemesine bakış
- [Plugin Manifest’i](/tr/plugins/manifest) - manifest şeması referansı
