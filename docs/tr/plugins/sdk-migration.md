---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED uyarısını görüyorsunuz
    - OPENCLAW_EXTENSION_API_DEPRECATED uyarısını görüyorsunuz
    - OpenClaw 2026.4.25'ten önce api.registerEmbeddedExtensionFactory kullandınız
    - Bir Plugin'i modern Plugin mimarisine güncelliyorsunuz
    - Harici bir OpenClaw Plugin yönetiyorsunuz
sidebarTitle: Migrate to SDK
summary: Eski geriye dönük uyumluluk katmanından modern plugin SDK'ya geçiş yap
title: Plugin SDK geçişi
x-i18n:
    generated_at: "2026-07-01T13:18:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9f6f9b4334ca3bdbcc6602cfe2bb1499d5758de95a9163e0ef75619a712a1c3
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw, geniş bir geriye dönük uyumluluk katmanından odaklı ve belgelenmiş içe aktarmalara sahip modern bir Plugin mimarisine geçti. Plugin'iniz yeni mimariden önce oluşturulduysa, bu kılavuz geçiş yapmanıza yardımcı olur.

## Neler değişiyor

Eski Plugin sistemi, Plugin'lerin ihtiyaç duydukları her şeyi tek bir giriş noktasından içe aktarmasına izin veren iki geniş açık yüzey sağlıyordu:

- **`openclaw/plugin-sdk/compat`** - onlarca yardımcıyı yeniden dışa aktaran tek bir içe aktarma. Yeni Plugin mimarisi oluşturulurken eski hook tabanlı Plugin'lerin çalışmasını sürdürmek için tanıtıldı.
- **`openclaw/plugin-sdk/infra-runtime`** - sistem olaylarını, Heartbeat durumunu, teslim kuyruklarını, fetch/proxy yardımcılarını, dosya yardımcılarını, onay türlerini ve ilgisiz yardımcı programları karıştıran geniş bir çalışma zamanı yardımcı varili.
- **`openclaw/plugin-sdk/config-runtime`** - geçiş penceresi sırasında kullanımdan kaldırılmış doğrudan yükleme/yazma yardımcılarını hâlâ taşıyan geniş bir yapılandırma uyumluluk varili.
- **`openclaw/extension-api`** - Plugin'lere gömülü ajan çalıştırıcı gibi ana makine tarafı yardımcılara doğrudan erişim veren bir köprü.
- **`api.registerEmbeddedExtensionFactory(...)`** - `tool_result` gibi gömülü çalıştırıcı olaylarını gözlemleyebilen, kaldırılmış ve yalnızca gömülü çalıştırıcıya özgü paketli extension hook'u.

Geniş içe aktarma yüzeyleri artık **kullanımdan kaldırıldı**. Çalışma zamanında hâlâ çalışırlar, ancak yeni Plugin'ler bunları kullanmamalıdır ve mevcut Plugin'ler, bir sonraki major sürüm bunları kaldırmadan önce geçiş yapmalıdır. Yalnızca gömülü çalıştırıcıya özgü extension factory kayıt API'si kaldırıldı; bunun yerine tool-result middleware kullanın.

OpenClaw, bir replacement tanıtan aynı değişiklikte belgelenmiş Plugin davranışını kaldırmaz veya yeniden yorumlamaz. Sözleşmeyi bozan değişiklikler önce bir uyumluluk adapter'ından, tanılamalardan, belgelerden ve bir kullanımdan kaldırma penceresinden geçmelidir. Bu; SDK içe aktarmaları, manifest alanları, kurulum API'leri, hook'lar ve çalışma zamanı kayıt davranışı için geçerlidir.

<Warning>
  Geriye dönük uyumluluk katmanı gelecekteki bir major sürümde kaldırılacaktır.
  Bu yüzeylerden hâlâ içe aktarma yapan Plugin'ler bu gerçekleştiğinde bozulacaktır.
  Eski gömülü extension factory kayıtları artık zaten yüklenmiyor.
</Warning>

## Bu neden değişti

Eski yaklaşım sorunlara neden oldu:

- **Yavaş başlatma** - tek bir yardımcıyı içe aktarmak onlarca ilgisiz modülü yüklüyordu
- **Döngüsel bağımlılıklar** - geniş yeniden dışa aktarmalar içe aktarma döngüleri oluşturmayı kolaylaştırdı
- **Belirsiz API yüzeyi** - hangi dışa aktarmaların kararlı, hangilerinin dahili olduğunu ayırt etmenin yolu yoktu

Modern Plugin SDK bunu düzeltir: her içe aktarma yolu (`openclaw/plugin-sdk/\<subpath\>`) net bir amacı ve belgelenmiş sözleşmesi olan küçük, kendi içinde bağımsız bir modüldür.

Paketli kanallar için eski sağlayıcı kolaylık yüzeyleri de kaldırıldı.
Kanal markalı yardımcı yüzeyler kararlı Plugin sözleşmeleri değil, özel mono-repo kısayollarıydı. Bunun yerine dar genel SDK alt yollarını kullanın. Paketli Plugin çalışma alanında, sağlayıcıya ait yardımcıları ilgili Plugin'in kendi `api.ts` veya `runtime-api.ts` dosyasında tutun.

Güncel paketli sağlayıcı örnekleri:

- Anthropic, Claude'a özgü stream yardımcılarını kendi `api.ts` / `contract-api.ts` yüzeyinde tutar
- OpenAI, sağlayıcı oluşturucuları, varsayılan model yardımcılarını ve realtime sağlayıcı oluşturucularını kendi `api.ts` dosyasında tutar
- OpenRouter, sağlayıcı oluşturucuyu ve onboarding/yapılandırma yardımcılarını kendi `api.ts` dosyasında tutar

## Talk ve realtime ses geçiş planı

Realtime ses, telefon, toplantı ve tarayıcı Talk kodu, yüzeye yerel turn defteri tutmaktan `openclaw/plugin-sdk/realtime-voice` tarafından dışa aktarılan paylaşılan bir Talk oturum denetleyicisine taşınıyor. Yeni denetleyici ortak Talk olay zarfını, aktif turn durumunu, yakalama durumunu, çıkış sesi durumunu, yakın olay geçmişini ve bayat turn reddini sahiplenir. Sağlayıcı Plugin'ler satıcıya özgü realtime oturumların sahibi olmaya devam etmelidir; yüzey Plugin'leri yakalama, oynatma, telefon ve toplantı özel durumlarının sahibi olmaya devam etmelidir.

Bu Talk geçişi bilinçli olarak temiz kırılacak şekilde tasarlanmıştır:

1. Paylaşılan denetleyici/çalışma zamanı primitiflerini `plugin-sdk/realtime-voice` içinde tutun.
2. Paketli yüzeyleri paylaşılan denetleyiciye taşıyın: tarayıcı relay, managed-room handoff, voice-call realtime, voice-call streaming STT, Google Meet realtime ve native push-to-talk.
3. Eski Talk RPC ailelerini nihai `talk.session.*` ve `talk.client.*` API'siyle değiştirin.
4. Gateway `hello-ok.features.events` içinde tek bir canlı Talk olay kanalı duyurun: `talk.event`.
5. Eski realtime HTTP endpoint'ini ve request-time instruction override yolunu silin.

Yeni kod, düşük seviyeli bir adapter veya test fixture uygulamıyorsa `createTalkEventSequencer(...)` öğesini doğrudan çağırmamalıdır. Bunun yerine paylaşılan denetleyiciyi tercih edin; böylece turn kapsamlı olaylar turn id olmadan yayımlanamaz, bayat `turnEnd` / `turnCancel` çağrıları daha yeni bir aktif turn'ü temizleyemez ve çıkış sesi yaşam döngüsü olayları telefon, toplantılar, tarayıcı relay, managed-room handoff ve native Talk istemcileri genelinde tutarlı kalır.

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

Tarayıcıya ait WebRTC/sağlayıcı-websocket oturumları `talk.client.create` kullanır; çünkü tarayıcı sağlayıcı müzakeresini ve medya taşımasını sahiplenirken Gateway kimlik bilgilerini, talimatları ve araç politikasını sahiplenir. `talk.session.*`, gateway-relay realtime, gateway-relay transcription ve managed-room native STT/TTS oturumları için ortak Gateway tarafından yönetilen yüzeydir.

Realtime seçicileri `talk.provider` / `talk.providers` yanına yerleştiren eski yapılandırmalar `openclaw doctor --fix` ile onarılmalıdır; çalışma zamanı Talk, konuşma/TTS sağlayıcı yapılandırmasını realtime sağlayıcı yapılandırması olarak yeniden yorumlamaz.

Desteklenen `talk.session.create` kombinasyonları bilinçli olarak küçüktür:

| Mod             | Taşıma         | Beyin           | Sahip              | Notlar                                                                                                             |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Gateway üzerinden köprülenen tam çift yönlü sağlayıcı sesi; araç çağrıları agent-consult aracı üzerinden yönlendirilir. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Yalnızca streaming STT; çağıranlar giriş sesi gönderir ve transcript olayları alır.                                |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | İstemcinin yakalama/oynatmayı, Gateway'in turn durumunu sahiplendiği push-to-talk ve telsiz tarzı odalar.          |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | Gateway araç eylemlerini doğrudan yürüten güvenilir birinci taraf yüzeyler için yalnızca yöneticiye açık oda modu. |

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

Birleşik denetim sözlüğü de kasıtlı olarak dardır:

  | Yöntem                         | Uygulandığı yer                                        | Sözleşme                                                                                                                                                                                    |
  | ------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Aynı Gateway bağlantısının sahip olduğu sağlayıcı oturumuna base64 PCM ses parçası ekleyin.                                                                                                 |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Yönetilen oda kullanıcı turu başlatın.                                                                                                                                                      |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Eski tur doğrulamasından sonra etkin turu sonlandırın.                                                                                                                                       |
  | `talk.session.cancelTurn`       | tüm Gateway sahipli oturumlar                           | Bir tur için etkin yakalama/sağlayıcı/ajan/TTS işini iptal edin.                                                                                                                             |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Kullanıcı turunu mutlaka sonlandırmadan asistan ses çıktısını durdurun.                                                                                                                      |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Relay tarafından yayılan bir sağlayıcı araç çağrısını tamamlayın; ara çıktı için `options.willContinue` veya çağrıyı başka bir asistan yanıtı olmadan karşılamak için `options.suppressResponse` iletin. |
  | `talk.session.steer`            | ajan destekli Talk oturumları                           | Talk oturumundan çözümlenen etkin gömülü çalıştırmaya sözlü `status`, `steer`, `cancel` veya `followup` denetimi gönderin.                                                                  |
  | `talk.session.close`            | tüm birleşik oturumlar                                  | Relay oturumlarını durdurun veya yönetilen oda durumunu geri alın, ardından birleşik oturum kimliğini unutun.                                                                                |

  Bunun çalışması için çekirdeğe sağlayıcıya veya platforma özel durumlar eklemeyin.
  Talk oturum semantiğinin sahibi çekirdektir. Sağlayıcı Plugin'leri tedarikçi oturum kurulumunun sahibidir.
  Sesli arama ve Google Meet telefon/meeting adaptörlerinin sahibidir. Tarayıcı ve yerel
  uygulamalar cihaz yakalama/çalma kullanıcı deneyiminin sahibidir.

  ## Uyumluluk politikası

  Harici Plugin'ler için uyumluluk çalışması şu sırayı izler:

  1. yeni sözleşmeyi ekleyin
  2. eski davranışı bir uyumluluk adaptörü üzerinden bağlı tutun
  3. eski yolu ve yerine geçeni adlandıran bir tanılama veya uyarı yayımlayın
  4. iki yolu da testlerde kapsayın
  5. kullanımdan kaldırma ve geçiş yolunu belgeleyin
  6. yalnızca duyurulan geçiş penceresinden sonra, genellikle büyük bir sürümde kaldırın

  Bakımcılar mevcut geçiş kuyruğunu
  `pnpm plugins:boundary-report` ile denetleyebilir. Kompakt sayımlar için
  `pnpm plugins:boundary-report:summary`, tek bir Plugin veya uyumluluk sahibi için
  `--owner <id>` ve bir CI kapısının vadesi gelmiş uyumluluk kayıtlarında,
  sahipler arası ayrılmış SDK içe aktarımlarında veya kullanılmayan ayrılmış SDK
  alt yollarında başarısız olması gerektiğinde `pnpm plugins:boundary-report:ci`
  kullanın. Rapor, kullanımdan kaldırılmış uyumluluk kayıtlarını kaldırma tarihine
  göre gruplar, yerel kod/belge başvurularını sayar, sahipler arası ayrılmış SDK
  içe aktarımlarını yüzeye çıkarır ve özel bellek barındırıcısı SDK köprüsünü
  özetler; böylece uyumluluk temizliği geçici aramalara dayanmak yerine açık kalır.
  Ayrılmış SDK alt yollarının izlenen sahip kullanımına sahip olması gerekir;
  kullanılmayan ayrılmış yardımcı dışa aktarımları herkese açık SDK'den kaldırılmalıdır.

  Bir manifest alanı hâlâ kabul ediliyorsa, Plugin yazarları belgeler ve
  tanılamalar aksini söyleyene kadar onu kullanmaya devam edebilir. Yeni kod
  belgelenmiş yerine geçeni tercih etmelidir, ancak mevcut Plugin'ler olağan küçük
  sürümler sırasında bozulmamalıdır.

  ## Nasıl geçilir

  <Steps>
  <Step title="Çalışma zamanı yapılandırması yükleme/yazma yardımcılarını geçirin">
    Paketli Plugin'ler doğrudan
    `api.runtime.config.loadConfig()` ve
    `api.runtime.config.writeConfigFile(...)` çağırmayı bırakmalıdır. Etkin çağrı
    yoluna zaten iletilmiş yapılandırmayı tercih edin. Mevcut süreç anlık
    görüntüsüne ihtiyaç duyan uzun ömürlü işleyiciler `api.runtime.config.current()`
    kullanabilir. Uzun ömürlü ajan araçları, bir yapılandırma yazımından önce
    oluşturulmuş bir araç hâlâ yenilenmiş çalışma zamanı yapılandırmasını görebilsin
    diye `execute` içinde araç bağlamının `ctx.getRuntimeConfig()` yöntemini
    kullanmalıdır.

    Yapılandırma yazımları işlemsel yardımcılar üzerinden geçmeli ve bir
    yazma sonrası politikası seçmelidir:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Çağıran taraf değişikliğin temiz bir Gateway yeniden başlatması gerektirdiğini
    bildiğinde `afterWrite: { mode: "restart", reason: "..." }`, yalnızca çağıran
    taraf takip işinin sahibi olduğunda ve yeniden yükleme planlayıcısını bilinçli
    olarak bastırmak istediğinde `afterWrite: { mode: "none", reason: "..." }`
    kullanın. Mutasyon sonuçları testler ve günlükleme için tipli bir `followUp`
    özeti içerir; yeniden başlatmayı uygulama veya zamanlama sorumluluğu Gateway'de
    kalır. `loadConfig` ve `writeConfigFile`, geçiş penceresi sırasında harici
    Plugin'ler için kullanımdan kaldırılmış uyumluluk yardımcıları olarak kalır ve
    `runtime-config-load-write` uyumluluk koduyla bir kez uyarır. Paketli Plugin'ler
    ve repo çalışma zamanı kodu,
    `pnpm check:deprecated-api-usage` ve
    `pnpm check:no-runtime-action-load-config` içindeki tarayıcı korumalarıyla
    korunur: yeni üretim Plugin kullanımı doğrudan başarısız olur, doğrudan
    yapılandırma yazımları başarısız olur, Gateway sunucu yöntemleri istek çalışma
    zamanı anlık görüntüsünü kullanmalıdır, çalışma zamanı kanal gönderme/eylem/
    istemci yardımcıları yapılandırmayı kendi sınırlarından almalıdır ve uzun
    ömürlü çalışma zamanı modüllerinin izin verilen ortam `loadConfig()` çağrısı
    sıfırdır.

    Yeni Plugin kodu ayrıca geniş
    `openclaw/plugin-sdk/config-runtime` uyumluluk barrel'ını içe aktarmaktan
    kaçınmalıdır. İşe uyan dar SDK alt yolunu kullanın:

    | İhtiyaç | İçe aktarma |
    | --- | --- |
    | `OpenClawConfig` gibi yapılandırma tipleri | `openclaw/plugin-sdk/config-contracts` |
    | Zaten yüklenmiş yapılandırma doğrulamaları ve Plugin giriş yapılandırması araması | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Mevcut çalışma zamanı anlık görüntüsü okumaları | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Yapılandırma yazımları | `openclaw/plugin-sdk/config-mutation` |
    | Oturum deposu yardımcıları | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown tablo yapılandırması | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Grup politikası çalışma zamanı yardımcıları | `openclaw/plugin-sdk/runtime-group-policy` |
    | Gizli girdi çözümleme | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model/oturum geçersiz kılmaları | `openclaw/plugin-sdk/model-session-runtime` |

    Paketli Plugin'ler ve testleri, geniş barrel'a karşı tarayıcıyla korunur;
    böylece içe aktarımlar ve mock'lar ihtiyaç duydukları davranışa yerel kalır.
    Geniş barrel harici uyumluluk için hâlâ vardır, ancak yeni kod ona
    dayanmamalıdır.

  </Step>

  <Step title="Gömülü araç sonucu uzantılarını ara katmana geçirin">
    Paketli Plugin'ler, yalnızca gömülü çalıştırıcıya özel
    `api.registerEmbeddedExtensionFactory(...)` araç sonucu işleyicilerini
    çalışma zamanından bağımsız ara katmanla değiştirmelidir.

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

    Kurulu Plugin'ler de açıkça etkinleştirildiklerinde ve hedeflenen her çalışma
    zamanını `contracts.agentToolResultMiddleware` içinde beyan ettiklerinde araç
    sonucu ara katmanı kaydedebilir. Beyan edilmemiş kurulu ara katman kayıtları
    reddedilir.

  </Step>

  <Step title="Onay-yerel işleyicileri yetenek olgularına geçirin">
    Onay destekli kanal Plugin'leri artık yerel onay davranışını
    `approvalCapability.nativeRuntime` ve paylaşılan çalışma zamanı bağlamı kaydı
    üzerinden açığa çıkarır.

    Temel değişiklikler:

    - `approvalCapability.handler.loadRuntime(...)` yerine
      `approvalCapability.nativeRuntime` kullanın
    - Onaya özel kimlik doğrulama/teslimatı eski `plugin.auth` /
      `plugin.approvals` bağlantılarından `approvalCapability` üzerine taşıyın
    - `ChannelPlugin.approvals` herkese açık kanal Plugin'i sözleşmesinden
      kaldırıldı; teslimat/yerel/render alanlarını `approvalCapability` üzerine taşıyın
    - `plugin.auth` yalnızca kanal oturum açma/kapama akışları için kalır; buradaki
      onay kimlik doğrulama kancaları artık çekirdek tarafından okunmaz
    - İstemciler, token'lar veya Bolt uygulamaları gibi kanal sahipli çalışma zamanı
      nesnelerini `openclaw/plugin-sdk/channel-runtime-context` üzerinden kaydedin
    - Yerel onay işleyicilerinden Plugin sahipli yeniden yönlendirme bildirimleri
      göndermeyin; çekirdek artık gerçek teslimat sonuçlarından gelen başka yere
      yönlendirildi bildirimlerinin sahibidir
    - `channelRuntime` öğesini `createChannelManager(...)` içine geçirirken gerçek
      bir `createPluginRuntime().channel` yüzeyi sağlayın. Kısmi stub'lar reddedilir.

    Geçerli onay yeteneği düzeni için `/plugins/sdk-channel-plugins` bölümüne bakın.

  </Step>

  <Step title="Windows sarmalayıcı fallback davranışını denetleyin">
    Plugin'iniz `openclaw/plugin-sdk/windows-spawn` kullanıyorsa, çözümlenemeyen
    Windows `.cmd`/`.bat` sarmalayıcıları artık açıkça
    `allowShellFallback: true` geçmediğiniz sürece kapalı başarısız olur.

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

    Çağıran tarafınız kasıtlı olarak kabuk fallback'ine dayanmıyorsa,
    `allowShellFallback` ayarlamayın ve bunun yerine fırlatılan hatayı işleyin.

  </Step>

  <Step title="Kullanımdan kaldırılmış içe aktarımları bulun">
    Plugin'inizde kullanımdan kaldırılmış yüzeylerden herhangi birinden gelen içe
    aktarımları arayın:

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

    Ana makine tarafı yardımcılar için doğrudan içe aktarmak yerine enjekte edilen
    Plugin çalışma zamanını kullanın:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Aynı örüntü diğer eski köprü yardımcıları için de geçerlidir:

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

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` harici uyumluluk için hâlâ vardır,
    ancak yeni kod gerçekten ihtiyaç duyduğu odaklı yardımcı yüzeyi içe
    aktarmalıdır:

    | İhtiyaç | İçe aktarma |
    | --- | --- |
    | Sistem olay kuyruğu yardımcıları | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat uyandırma, olay ve görünürlük yardımcıları | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Bekleyen teslimat kuyruğunu boşaltma | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Kanal etkinliği telemetrisi | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Bellek içi tekilleştirme önbellekleri | `openclaw/plugin-sdk/dedupe-runtime` |
    | Güvenli yerel dosya/medya yolu yardımcıları | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher farkındalıklı fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy ve korumalı fetch yardımcıları | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF dispatcher ilkesi türleri | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Onay isteği/çözümleme türleri | `openclaw/plugin-sdk/approval-runtime` |
    | Onay yanıtı payload ve komut yardımcıları | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Hata biçimlendirme yardımcıları | `openclaw/plugin-sdk/error-runtime` |
    | Taşıma hazır olma beklemeleri | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Güvenli token yardımcıları | `openclaw/plugin-sdk/secure-random-runtime` |
    | Sınırlı eşzamansız görev eşzamanlılığı | `openclaw/plugin-sdk/concurrency-runtime` |
    | Sayısal zorlama | `openclaw/plugin-sdk/number-runtime` |
    | Süreç yerelinde eşzamansız kilit | `openclaw/plugin-sdk/async-lock-runtime` |
    | Dosya kilitleri | `openclaw/plugin-sdk/file-lock` |

    Paketle gelen plugin’ler `infra-runtime` kullanımına karşı tarayıcıyla
    korunur; bu nedenle depo kodu geniş barrel’a geri dönemez.

  </Step>

  <Step title="Migrate channel route helpers">
    Yeni kanal rota kodu `openclaw/plugin-sdk/channel-route` kullanmalıdır.
    Eski rota anahtarı ve karşılaştırılabilir hedef adları geçiş penceresi
    boyunca uyumluluk alias’ları olarak kalır, ancak yeni plugin’ler davranışı
    doğrudan tanımlayan rota adlarını kullanmalıdır:

    | Eski yardımcı | Modern yardımcı |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Modern rota yardımcıları `{ channel, to, accountId, threadId }` değerini
    yerel onaylar, yanıt bastırma, gelen tekilleştirme, cron teslimatı ve oturum
    yönlendirmesi genelinde tutarlı biçimde normalleştirir.

    `ChannelMessagingAdapter.parseExplicitTarget` için yeni kullanım eklemeyin;
    ayrıştırıcı destekli yüklenmiş rota yardımcılarını
    (`parseExplicitTargetForLoadedChannel` veya
    `resolveRouteTargetForLoadedChannel`) ya da
    `plugin-sdk/channel-route` içinden `resolveChannelRouteTargetWithParser(...)`
    kullanımını da eklemeyin. Bu kancalar kullanımdan kaldırılmıştır ve geçiş
    penceresi boyunca yalnızca eski plugin’ler için kalır. Yeni kanal plugin’leri
    hedef id normalleştirmesi ve dizin kaçırma fallback’i için
    `messaging.targetResolver.resolveTarget(...)`, çekirdeğin erken bir eş türüne
    ihtiyaç duyduğu durumlarda `messaging.inferTargetChatType(...)` ve sağlayıcıya
    yerel oturum ile thread kimliği için `messaging.resolveOutboundSessionRoute(...)`
    kullanmalıdır.

  </Step>

  <Step title="Build and test">
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
  | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları | Kurulum çevirmeni, izin verilenler listesi istemleri, kurulum durumu oluşturucuları |
  | `plugin-sdk/setup-runtime` | Kurulum zamanı çalışma zamanı yardımcıları | `createSetupTranslator`, içe aktarma açısından güvenli kurulum yama adaptörleri, arama notu yardımcıları, `promptResolvedAllowFrom`, `splitSetupEntries`, devredilmiş kurulum proxy'leri |
  | `plugin-sdk/setup-adapter-runtime` | Kullanımdan kaldırılmış kurulum adaptörü takma adı | `plugin-sdk/setup-runtime` kullanın |
  | `plugin-sdk/setup-tools` | Kurulum araçları yardımcıları | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Çoklu hesap yardımcıları | Hesap listesi/yapılandırma/eylem kapısı yardımcıları |
  | `plugin-sdk/account-id` | Hesap kimliği yardımcıları | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalleştirme |
  | `plugin-sdk/account-resolution` | Hesap arama yardımcıları | Hesap arama + varsayılan geri dönüş yardımcıları |
  | `plugin-sdk/account-helpers` | Dar kapsamlı hesap yardımcıları | Hesap listesi/hesap eylemi yardımcıları |
  | `plugin-sdk/channel-setup` | Kurulum sihirbazı adaptörleri | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM eşleştirme temel öğeleri | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Yanıt öneki, yazıyor durumu ve kaynak teslimi bağlantıları | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Yapılandırma adaptörü fabrikaları ve DM erişim yardımcıları | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Yapılandırma şeması oluşturucuları | Yalnızca paylaşılan kanal yapılandırma şeması temel öğeleri ve genel oluşturucu |
  | `plugin-sdk/bundled-channel-config-schema` | Paketle gelen yapılandırma şemaları | Yalnızca OpenClaw tarafından sürdürülen paketle gelen Plugin'ler; yeni Plugin'ler Plugin'e yerel şemalar tanımlamalıdır |
  | `plugin-sdk/channel-config-schema-legacy` | Kullanımdan kaldırılmış paketle gelen yapılandırma şemaları | Yalnızca uyumluluk takma adı; sürdürülen paketle gelen Plugin'ler için `plugin-sdk/bundled-channel-config-schema` kullanın |
  | `plugin-sdk/telegram-command-config` | Telegram komut yapılandırma yardımcıları | Komut adı normalleştirme, açıklama kırpma, yinelenen/çakışan doğrulama |
  | `plugin-sdk/channel-policy` | Grup/DM politikası çözümleme | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Kullanımdan kaldırılmış uyumluluk cephesi | `plugin-sdk/channel-outbound` kullanın |
  | `plugin-sdk/inbound-envelope` | Gelen zarf yardımcıları | Paylaşılan rota + zarf oluşturucu yardımcıları |
  | `plugin-sdk/channel-inbound` | Gelen alma yardımcıları | Bağlam oluşturma, biçimlendirme, kökler, çalıştırıcılar, hazırlanmış yanıt gönderimi ve gönderim koşulları |
  | `plugin-sdk/messaging-targets` | Kullanımdan kaldırılmış hedef ayrıştırma içe aktarma yolu | Genel hedef ayrıştırma yardımcıları için `plugin-sdk/channel-targets`, rota karşılaştırması için `plugin-sdk/channel-route` ve sağlayıcıya özgü hedef çözümleme için Plugin'in sahip olduğu `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` kullanın |
  | `plugin-sdk/outbound-media` | Giden medya yardımcıları | Paylaşılan giden medya yükleme |
  | `plugin-sdk/outbound-send-deps` | Kullanımdan kaldırılmış uyumluluk cephesi | `plugin-sdk/channel-outbound` kullanın |
  | `plugin-sdk/channel-outbound` | Giden ileti yaşam döngüsü yardımcıları | İleti adaptörleri, alındılar, dayanıklı gönderme yardımcıları, canlı önizleme/akış yardımcıları, yanıt seçenekleri, yaşam döngüsü yardımcıları, giden kimliği ve yük planlama |
  | `plugin-sdk/channel-streaming` | Kullanımdan kaldırılmış uyumluluk cephesi | `plugin-sdk/channel-outbound` kullanın |
  | `plugin-sdk/outbound-runtime` | Kullanımdan kaldırılmış uyumluluk cephesi | `plugin-sdk/channel-outbound` kullanın |
  | `plugin-sdk/thread-bindings-runtime` | İş parçacığı bağlama yardımcıları | İş parçacığı bağlama yaşam döngüsü ve adaptör yardımcıları |
  | `plugin-sdk/agent-media-payload` | Eski medya yükü yardımcıları | Eski alan düzenleri için aracı medya yükü oluşturucu |
  | `plugin-sdk/channel-runtime` | Kullanımdan kaldırılmış uyumluluk ara katmanı | Yalnızca eski kanal çalışma zamanı yardımcı programları |
  | `plugin-sdk/channel-send-result` | Gönderme sonucu türleri | Yanıt sonucu türleri |
  | `plugin-sdk/runtime-store` | Kalıcı Plugin depolaması | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Geniş çalışma zamanı yardımcıları | Çalışma zamanı/günlükleme/yedekleme/Plugin yükleme yardımcıları |
  | `plugin-sdk/runtime-env` | Dar kapsamlı çalışma zamanı ortam yardımcıları | Günlükleyici/çalışma zamanı ortamı, zaman aşımı, yeniden deneme ve geri çekilme yardımcıları |
  | `plugin-sdk/plugin-runtime` | Paylaşılan Plugin çalışma zamanı yardımcıları | Plugin komutları/hook'ları/http/etkileşimli yardımcıları |
  | `plugin-sdk/hook-runtime` | Hook işlem hattı yardımcıları | Paylaşılan Webhook/dahili hook işlem hattı yardımcıları |
  | `plugin-sdk/lazy-runtime` | Tembel çalışma zamanı yardımcıları | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Süreç yardımcıları | Paylaşılan exec yardımcıları |
  | `plugin-sdk/cli-runtime` | CLI çalışma zamanı yardımcıları | Komut biçimlendirme, beklemeler, sürüm yardımcıları |
  | `plugin-sdk/gateway-runtime` | Gateway yardımcıları | Gateway istemcisi, olay döngüsüne hazır başlatma yardımcısı, duyurulan LAN ana makinesi çözümleme ve kanal durumu yama yardımcıları |
  | `plugin-sdk/config-runtime` | Kullanımdan kaldırılmış yapılandırma uyumluluk ara katmanı | `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` ve `config-mutation` tercih edin |
  | `plugin-sdk/telegram-command-config` | Telegram komut yardımcıları | Paketle gelen Telegram sözleşme yüzeyi kullanılamadığında geri dönüş açısından kararlı Telegram komut doğrulama yardımcıları |
  | `plugin-sdk/approval-runtime` | Onay istemi yardımcıları | Exec/Plugin onay yükü, onay yeteneği/profil yardımcıları, yerel onay yönlendirme/çalışma zamanı yardımcıları ve yapılandırılmış onay gösterimi yol biçimlendirmesi |
  | `plugin-sdk/approval-auth-runtime` | Onay kimlik doğrulama yardımcıları | Onaylayan çözümleme, aynı sohbet eylemi yetkilendirmesi |
  | `plugin-sdk/approval-client-runtime` | Onay istemcisi yardımcıları | Yerel exec onay profili/filtre yardımcıları |
  | `plugin-sdk/approval-delivery-runtime` | Onay teslim yardımcıları | Yerel onay yeteneği/teslim adaptörleri |
  | `plugin-sdk/approval-gateway-runtime` | Onay Gateway yardımcıları | Paylaşılan onay Gateway çözümleme yardımcısı |
  | `plugin-sdk/approval-handler-adapter-runtime` | Onay adaptörü yardımcıları | Sıcak kanal giriş noktaları için hafif yerel onay adaptörü yükleme yardımcıları |
  | `plugin-sdk/approval-handler-runtime` | Onay işleyici yardımcıları | Daha geniş onay işleyici çalışma zamanı yardımcıları; yeterli olduklarında daha dar adaptör/Gateway yüzeylerini tercih edin |
  | `plugin-sdk/approval-native-runtime` | Onay hedef yardımcıları | Yerel onay hedefi/hesap bağlama yardımcıları |
  | `plugin-sdk/approval-reply-runtime` | Onay yanıtı yardımcıları | Exec/Plugin onay yanıtı yükü yardımcıları |
  | `plugin-sdk/channel-runtime-context` | Kanal çalışma zamanı bağlamı yardımcıları | Genel kanal çalışma zamanı bağlamı kaydetme/getirme/izleme yardımcıları |
  | `plugin-sdk/security-runtime` | Güvenlik yardımcıları | Paylaşılan güven, DM kapılama, kökle sınırlı dosya/yol yardımcıları, harici içerik ve gizli bilgi toplama yardımcıları |
  | `plugin-sdk/ssrf-policy` | SSRF politika yardımcıları | Ana makine izin verilenler listesi ve özel ağ politikası yardımcıları |
  | `plugin-sdk/ssrf-runtime` | SSRF çalışma zamanı yardımcıları | Sabitlenmiş gönderici, korumalı fetch, SSRF politika yardımcıları |
  | `plugin-sdk/system-event-runtime` | Sistem olayı yardımcıları | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat yardımcıları | Heartbeat uyandırma, olay ve görünürlük yardımcıları |
  | `plugin-sdk/delivery-queue-runtime` | Teslim kuyruğu yardımcıları | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Kanal etkinliği yardımcıları | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Yinelenenleri ayıklama yardımcıları | Bellek içi yinelenenleri ayıklama önbellekleri |
  | `plugin-sdk/file-access-runtime` | Dosya erişim yardımcıları | Güvenli yerel dosya/medya yolu yardımcıları |
  | `plugin-sdk/transport-ready-runtime` | Taşıma hazır olma yardımcıları | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Exec onay politikası yardımcıları | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Sınırlı önbellek yardımcıları | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Tanılama kapılama yardımcıları | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hata biçimlendirme yardımcıları | `formatUncaughtError`, `isApprovalNotFoundError`, hata grafiği yardımcıları |
  | `plugin-sdk/fetch-runtime` | Sarmalanmış fetch/proxy yardımcıları | `resolveFetch`, proxy yardımcıları, EnvHttpProxyAgent seçenek yardımcıları |
  | `plugin-sdk/host-runtime` | Ana makine normalleştirme yardımcıları | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Yeniden deneme yardımcıları | `RetryConfig`, `retryAsync`, politika çalıştırıcıları |
  | `plugin-sdk/allow-from` | İzin verilenler listesi biçimlendirme ve girdi eşleme | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Komut kapılama ve komut yüzeyi yardımcıları | `resolveControlCommandGate`, gönderen yetkilendirme yardımcıları, dinamik argüman menüsü biçimlendirmesi dahil komut kayıt defteri yardımcıları |
  | `plugin-sdk/command-status` | Komut durumu/yardım oluşturucuları | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Gizli bilgi girdisi ayrıştırma | Gizli bilgi girdisi yardımcıları |
  | `plugin-sdk/webhook-ingress` | Webhook istek yardımcıları | Webhook hedef yardımcı programları |
  | `plugin-sdk/webhook-request-guards` | Webhook gövde koruması yardımcıları | İstek gövdesi okuma/sınır yardımcıları |
  | `plugin-sdk/reply-runtime` | Paylaşılan yanıt çalışma zamanı | Gelen gönderim, Heartbeat, yanıt planlayıcı, parçalara ayırma |
  | `plugin-sdk/reply-dispatch-runtime` | Dar kapsamlı yanıt gönderim yardımcıları | Sonlandırma, sağlayıcı gönderimi ve konuşma etiketi yardımcıları |
  | `plugin-sdk/reply-history` | Yanıt geçmişi yardımcıları | `createChannelHistoryWindow`; `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` ve `clearHistoryEntriesIfEnabled` gibi kullanımdan kaldırılmış harita yardımcısı uyumluluk dışa aktarımları |
  | `plugin-sdk/reply-reference` | Yanıt referansı planlama | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Yanıt parçası yardımcıları | Metin/markdown parçalara ayırma yardımcıları |
  | `plugin-sdk/session-store-runtime` | Oturum deposu yardımcıları | Depo yolu + updated-at yardımcıları |
  | `plugin-sdk/state-paths` | Durum yolu yardımcıları | Durum ve OAuth dizini yardımcıları |
  | `plugin-sdk/routing` | Yönlendirme/oturum anahtarı yardımcıları | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, oturum anahtarı normalleştirme yardımcıları |
  | `plugin-sdk/status-helpers` | Kanal durumu yardımcıları | Kanal/hesap durumu özeti oluşturucuları, çalışma zamanı durumu varsayılanları, sorun meta verisi yardımcıları |
  | `plugin-sdk/target-resolver-runtime` | Hedef çözümleyici yardımcıları | Paylaşılan hedef çözümleyici yardımcıları |
  | `plugin-sdk/string-normalization-runtime` | Dize normalleştirme yardımcıları | Slug/dize normalleştirme yardımcıları |
  | `plugin-sdk/request-url` | İstek URL'si yardımcıları | İstek benzeri girdilerden dize URL'leri çıkarır |
  | `plugin-sdk/run-command` | Zaman sınırlı komut yardımcıları | Normalleştirilmiş stdout/stderr ile zaman sınırlı komut çalıştırıcı |
  | `plugin-sdk/param-readers` | Parametre okuyucuları | Ortak araç/CLI parametre okuyucuları |
  | `plugin-sdk/tool-payload` | Araç yükü çıkarma | Araç sonuç nesnelerinden normalleştirilmiş yükleri çıkarır |
  | `plugin-sdk/tool-send` | Araç gönderim çıkarma | Araç argümanlarından kanonik gönderim hedefi alanlarını çıkarır |
  | `plugin-sdk/temp-path` | Geçici yol yardımcıları | Paylaşılan geçici indirme yolu yardımcıları |
  | `plugin-sdk/logging-core` | Günlükleme yardımcıları | Alt sistem günlükleyicisi ve redaksiyon yardımcıları |
  | `plugin-sdk/markdown-table-runtime` | Markdown tablosu yardımcıları | Markdown tablo modu yardımcıları |
  | `plugin-sdk/reply-payload` | Mesaj yanıt türleri | Yanıt yükü türleri |
  | `plugin-sdk/provider-setup` | Düzenlenmiş yerel/kendi barındırılan sağlayıcı kurulum yardımcıları | Kendi barındırılan sağlayıcı keşif/yapılandırma yardımcıları |
  | `plugin-sdk/self-hosted-provider-setup` | Odaklanmış OpenAI uyumlu kendi barındırılan sağlayıcı kurulum yardımcıları | Aynı kendi barındırılan sağlayıcı keşif/yapılandırma yardımcıları |
  | `plugin-sdk/provider-auth-runtime` | Sağlayıcı çalışma zamanı kimlik doğrulama yardımcıları | Çalışma zamanı API anahtarı çözümleme yardımcıları |
  | `plugin-sdk/provider-auth-api-key` | Sağlayıcı API anahtarı kurulum yardımcıları | API anahtarı başlatma/profil yazma yardımcıları |
  | `plugin-sdk/provider-auth-result` | Sağlayıcı kimlik doğrulama sonucu yardımcıları | Standart OAuth kimlik doğrulama sonucu oluşturucu |
  | `plugin-sdk/provider-selection-runtime` | Sağlayıcı seçimi yardımcıları | Yapılandırılmış veya otomatik sağlayıcı seçimi ve ham sağlayıcı yapılandırması birleştirme |
  | `plugin-sdk/provider-env-vars` | Sağlayıcı ortam değişkeni yardımcıları | Sağlayıcı kimlik doğrulama ortam değişkeni arama yardımcıları |
  | `plugin-sdk/provider-model-shared` | Paylaşılan sağlayıcı modeli/yeniden oynatma yardımcıları | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan yeniden oynatma ilkesi oluşturucuları, sağlayıcı uç noktası yardımcıları ve model kimliği normalleştirme yardımcıları |
  | `plugin-sdk/provider-catalog-shared` | Paylaşılan sağlayıcı katalog yardımcıları | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Sağlayıcı başlatma yamaları | Başlatma yapılandırması yardımcıları |
  | `plugin-sdk/provider-http` | Sağlayıcı HTTP yardımcıları | Ses transkripsiyonu multipart form yardımcıları dahil genel sağlayıcı HTTP/uç nokta yetenek yardımcıları |
  | `plugin-sdk/provider-web-fetch` | Sağlayıcı web-fetch yardımcıları | Web-fetch sağlayıcı kayıt/önbellek yardımcıları |
  | `plugin-sdk/provider-web-search-config-contract` | Sağlayıcı web arama yapılandırması yardımcıları | Plugin etkinleştirme bağlantısına ihtiyaç duymayan sağlayıcılar için dar kapsamlı web arama yapılandırma/kimlik bilgisi yardımcıları |
  | `plugin-sdk/provider-web-search-contract` | Sağlayıcı web arama sözleşmesi yardımcıları | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcıları/alıcıları gibi dar kapsamlı web arama yapılandırma/kimlik bilgisi sözleşmesi yardımcıları |
  | `plugin-sdk/provider-web-search` | Sağlayıcı web arama yardımcıları | Web arama sağlayıcı kayıt/önbellek/çalışma zamanı yardımcıları |
  | `plugin-sdk/provider-tools` | Sağlayıcı araç/şema uyumluluk yardımcıları | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` ve DeepSeek/Gemini/OpenAI şema temizliği + tanılama |
  | `plugin-sdk/provider-usage` | Sağlayıcı kullanım yardımcıları | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` ve diğer sağlayıcı kullanım yardımcıları |
  | `plugin-sdk/provider-stream` | Sağlayıcı akış sarmalayıcı yardımcıları | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
  | `plugin-sdk/provider-transport-runtime` | Sağlayıcı aktarım yardımcıları | Korumalı fetch, araç sonucu metin çıkarma, aktarım mesajı dönüşümleri ve yazılabilir aktarım olay akışları gibi yerel sağlayıcı aktarım yardımcıları |
  | `plugin-sdk/keyed-async-queue` | Sıralı asenkron kuyruk | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Paylaşılan medya yardımcıları | Medya getirme/dönüştürme/depolama yardımcıları, ffprobe destekli video boyutu yoklama ve medya yükü oluşturucuları |
  | `plugin-sdk/media-generation-runtime` | Paylaşılan medya üretimi yardımcıları | Görüntü/video/müzik üretimi için paylaşılan devralma yardımcıları, aday seçimi ve eksik model mesajlaşması |
  | `plugin-sdk/media-understanding` | Medya anlama yardımcıları | Medya anlama sağlayıcı türleri ve sağlayıcıya yönelik görüntü/ses yardımcı dışa aktarımları |
  | `plugin-sdk/text-runtime` | Kullanımdan kaldırılmış geniş metin uyumluluk dışa aktarımı | `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` ve `logging-core` kullanın |
  | `plugin-sdk/text-chunking` | Metin parçalama yardımcıları | Giden metin parçalama yardımcısı |
  | `plugin-sdk/speech` | Konuşma yardımcıları | Konuşma sağlayıcı türleri ve sağlayıcıya yönelik yönerge, kayıt defteri, doğrulama yardımcıları ve OpenAI uyumlu TTS oluşturucu |
  | `plugin-sdk/speech-core` | Paylaşılan konuşma çekirdeği | Konuşma sağlayıcı türleri, kayıt defteri, yönergeler, normalleştirme |
  | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon yardımcıları | Sağlayıcı türleri, kayıt defteri yardımcıları ve paylaşılan WebSocket oturum yardımcısı |
  | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses yardımcıları | Sağlayıcı türleri, kayıt defteri/çözümleme yardımcıları, köprü oturumu yardımcıları, paylaşılan ajan geri konuşma kuyrukları, etkin çalışma ses denetimi, transkript/olay sağlığı, yankı bastırma, danışma sorusu eşleştirme, zorunlu danışma koordinasyonu, dönüş bağlamı izleme, çıktı etkinliği izleme ve hızlı bağlam danışma yardımcıları |
  | `plugin-sdk/image-generation` | Görüntü üretimi yardımcıları | Görüntü üretimi sağlayıcı türleri, görüntü varlığı/veri URL'si yardımcıları ve OpenAI uyumlu görüntü sağlayıcı oluşturucu |
  | `plugin-sdk/image-generation-core` | Paylaşılan görüntü üretimi çekirdeği | Görüntü üretimi türleri, devralma, kimlik doğrulama ve kayıt defteri yardımcıları |
  | `plugin-sdk/music-generation` | Müzik üretimi yardımcıları | Müzik üretimi sağlayıcı/istek/sonuç türleri |
  | `plugin-sdk/music-generation-core` | Paylaşılan müzik üretimi çekirdeği | Müzik üretimi türleri, devralma yardımcıları, sağlayıcı arama ve model referansı ayrıştırma |
  | `plugin-sdk/video-generation` | Video üretimi yardımcıları | Video üretimi sağlayıcı/istek/sonuç türleri |
  | `plugin-sdk/video-generation-core` | Paylaşılan video üretimi çekirdeği | Video üretimi türleri, devralma yardımcıları, sağlayıcı arama ve model referansı ayrıştırma |
  | `plugin-sdk/interactive-runtime` | Etkileşimli yanıt yardımcıları | Etkileşimli yanıt yükü normalleştirme/azaltma |
  | `plugin-sdk/channel-config-primitives` | Kanal yapılandırma temel öğeleri | Dar kapsamlı kanal yapılandırma şeması temel öğeleri |
  | `plugin-sdk/channel-config-writes` | Kanal yapılandırma yazma yardımcıları | Kanal yapılandırma yazma yetkilendirme yardımcıları |
  | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal başlangıcı | Paylaşılan kanal Plugin başlangıç dışa aktarımları |
  | `plugin-sdk/channel-status` | Kanal durumu yardımcıları | Paylaşılan kanal durumu anlık görüntü/özet yardımcıları |
  | `plugin-sdk/allowlist-config-edit` | İzin listesi yapılandırma yardımcıları | İzin listesi yapılandırma düzenleme/okuma yardımcıları |
  | `plugin-sdk/group-access` | Grup erişimi yardımcıları | Paylaşılan grup erişimi karar yardımcıları |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Kullanımdan kaldırılmış uyumluluk cepheleri | `plugin-sdk/channel-inbound` kullanın |
  | `plugin-sdk/direct-dm-guard-policy` | Doğrudan DM koruma yardımcıları | Dar kapsamlı kripto öncesi koruma ilkesi yardımcıları |
  | `plugin-sdk/extension-shared` | Paylaşılan uzantı yardımcıları | Pasif kanal/durum ve ortam proxy yardımcı temel öğeleri |
  | `plugin-sdk/webhook-targets` | Webhook hedef yardımcıları | Webhook hedef kayıt defteri ve rota yükleme yardımcıları |
  | `plugin-sdk/webhook-path` | Kullanımdan kaldırılmış webhook yol takma adı | `plugin-sdk/webhook-ingress` kullanın |
  | `plugin-sdk/web-media` | Paylaşılan web medya yardımcıları | Uzak/yerel medya yükleme yardımcıları |
  | `plugin-sdk/zod` | Kullanımdan kaldırılmış Zod uyumluluk yeniden dışa aktarımı | `zod` öğesini doğrudan `zod` içinden içe aktarın |
  | `plugin-sdk/memory-core` | Paketlenmiş bellek çekirdeği yardımcıları | Bellek yöneticisi/yapılandırma/dosya/CLI yardımcı yüzeyi |
  | `plugin-sdk/memory-core-engine-runtime` | Bellek motoru çalışma zamanı cephesi | Bellek dizin/arama çalışma zamanı cephesi |
  | `plugin-sdk/memory-core-host-embedding-registry` | Bellek gömme kayıt defteri | Hafif bellek gömme sağlayıcısı kayıt defteri yardımcıları |
  | `plugin-sdk/memory-core-host-engine-foundation` | Bellek ana makine temel motoru | Bellek ana makine temel motoru dışa aktarımları |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek ana makine gömme motoru | Bellek gömme sözleşmeleri, kayıt defteri erişimi, yerel sağlayıcı ve genel toplu/uzak yardımcılar; somut uzak sağlayıcılar kendi sahip Plugin'lerinde bulunur |
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
  | `plugin-sdk/memory-host-core` | Bellek ana makine çekirdek çalışma zamanı takma adı | Bellek ana makine çekirdek çalışma zamanı yardımcıları için tedarikçiden bağımsız takma ad |
  | `plugin-sdk/memory-host-events` | Bellek ana makine olay günlüğü takma adı | Bellek ana makine olay günlüğü yardımcıları için tedarikçiden bağımsız takma ad |
  | `plugin-sdk/memory-host-files` | Kullanımdan kaldırılmış bellek dosya/çalışma zamanı takma adı | `plugin-sdk/memory-core-host-runtime-files` kullanın |
  | `plugin-sdk/memory-host-markdown` | Yönetilen markdown yardımcıları | Belleğe bitişik Plugin'ler için paylaşılan yönetilen markdown yardımcıları |
  | `plugin-sdk/memory-host-search` | Active memory arama cephesi | Geç yüklenen active-memory arama yöneticisi çalışma zamanı cephesi |
  | `plugin-sdk/memory-host-status` | Kullanımdan kaldırılmış bellek ana makine durumu takma adı | `plugin-sdk/memory-core-host-status` kullanın |
  | `plugin-sdk/testing` | Test yardımcı programları | Repo yerelinde kullanımdan kaldırılmış uyumluluk varili; `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` ve `plugin-sdk/test-fixtures` gibi odaklanmış repo yerel test alt yollarını kullanın |
</Accordion>

Bu tablo, tam SDK yüzeyi değil, kasıtlı olarak ortak geçiş alt kümesidir.
Derleyici giriş noktası envanteri `scripts/lib/plugin-sdk-entrypoints.json`
içinde yer alır; paket dışa aktarımları genel alt kümeden üretilir.

Açıkça belgelenmiş uyumluluk cepheleri, örneğin yayımlanmış
`@openclaw/discord@2026.3.13` paketi için tutulan, kullanımdan kaldırılmış
`plugin-sdk/discord` ara katmanı dışında, ayrılmış paketlenmiş-Plugin yardımcı
arayüzleri genel SDK dışa aktarım haritasından kaldırılmıştır. Sahibe özel
yardımcılar, sahip olan Plugin paketinin içinde yaşar; paylaşılan ana makine
davranışı `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` ve
`plugin-sdk/plugin-config-runtime` gibi genel SDK sözleşmeleri üzerinden
taşınmalıdır.

İşe uyan en dar içe aktarımı kullanın. Bir dışa aktarım bulamıyorsanız,
`src/plugin-sdk/` konumundaki kaynağı kontrol edin veya bakımcılara bunu hangi
genel sözleşmenin sahiplenmesi gerektiğini sorun.

## Etkin kullanım dışı bırakmalar

Plugin SDK, sağlayıcı sözleşmesi, çalışma zamanı yüzeyi ve manifest genelinde
geçerli daha dar kullanım dışı bırakmalar. Her biri bugün hâlâ çalışır, ancak
gelecekteki bir majör sürümde kaldırılacaktır. Her öğenin altındaki giriş, eski
API'yi kanonik yerine eşler.

<AccordionGroup>
  <Accordion title="command-auth yardım oluşturucuları → command-status">
    **Eski (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Yeni (`openclaw/plugin-sdk/command-status`)**: aynı imzalar, aynı dışa
    aktarımlar - yalnızca daha dar alt yoldan içe aktarılır. `command-auth`
    bunları uyumluluk gövdeleri olarak yeniden dışa aktarır.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Bahsetme geçit yardımcıları → resolveInboundMentionDecision">
    **Eski**: `openclaw/plugin-sdk/channel-inbound` veya
    `openclaw/plugin-sdk/channel-mention-gating` içinden
    `resolveInboundMentionRequirement({ facts, policy })` ve
    `shouldDropInboundForMention(...)`.

    **Yeni**: `resolveInboundMentionDecision({ facts, policy })` - iki ayrık
    çağrı yerine tek bir karar nesnesi döndürür.

    Aşağı akış kanal Plugin'leri (Slack, Discord, Matrix, MS Teams) zaten
    geçiş yaptı.

  </Accordion>

  <Accordion title="Kanal çalışma zamanı ara katmanı ve kanal eylemleri yardımcıları">
    `openclaw/plugin-sdk/channel-runtime`, eski kanal Plugin'leri için bir
    uyumluluk ara katmanıdır. Yeni koddan içe aktarmayın; çalışma zamanı
    nesnelerini kaydetmek için `openclaw/plugin-sdk/channel-runtime-context`
    kullanın.

    `openclaw/plugin-sdk/channel-actions` içindeki `channelActions*`
    yardımcıları, ham "actions" kanal dışa aktarımlarıyla birlikte kullanımdan
    kaldırılmıştır. Bunun yerine yetenekleri anlamsal `presentation` yüzeyi
    üzerinden gösterin - kanal Plugin'leri hangi ham eylem adlarını kabul
    ettiklerini değil, ne işlediklerini (kartlar, düğmeler, seçimler) bildirir.

  </Accordion>

  <Accordion title="Web arama sağlayıcısı tool() yardımcısı → Plugin üzerinde createTool()">
    **Eski**: `openclaw/plugin-sdk/provider-web-search` içinden `tool()`
    fabrikası.

    **Yeni**: `createTool(...)` işlevini doğrudan sağlayıcı Plugin üzerinde
    uygulayın. OpenClaw artık araç sarmalayıcısını kaydetmek için SDK
    yardımcısına ihtiyaç duymaz.

  </Accordion>

  <Accordion title="Düz metin kanal zarfları → BodyForAgent">
    **Eski**: gelen kanal mesajlarından düz, düz metin bir istem zarfı
    oluşturmak için `formatInboundEnvelope(...)` (ve
    `ChannelMessageForAgent.channelEnvelope`).

    **Yeni**: `BodyForAgent` ve yapılandırılmış kullanıcı bağlamı blokları.
    Kanal Plugin'leri yönlendirme metaverisini (iş parçacığı, konu, yanıtlanan,
    tepkiler) bir istem dizesine birleştirmek yerine tiplenmiş alanlar olarak
    ekler. `formatAgentEnvelope(...)` yardımcısı sentezlenmiş asistan odaklı
    zarflar için hâlâ desteklenir, ancak gelen düz metin zarfları kaldırılma
    yolundadır.

    Etkilenen alanlar: `inbound_claim`, `message_received` ve
    `channelEnvelope` metnini sonradan işleyen özel kanal Plugin'leri.

  </Accordion>

  <Accordion title="deactivate kancası → gateway_stop">
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

  <Accordion title="subagent_spawning kancası → çekirdek iş parçacığı bağlama">
    **Eski**: `threadBindingReady` veya `deliveryOrigin` döndüren
    `api.on("subagent_spawning", handler)`.

    **Yeni**: çekirdeğin kanal oturum-bağlama adaptörü üzerinden `thread: true`
    alt aracı bağlamalarını hazırlamasına izin verin.
    `api.on("subagent_spawned", handler)` yalnızca başlatma sonrası gözlem için
    kullanın.

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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)`, dış Plugin'ler geçiş
    yaparken yalnızca kullanımdan kaldırılmış uyumluluk yüzeyleri olarak kalır.

  </Accordion>

  <Accordion title="Sağlayıcı keşif türleri → sağlayıcı katalog türleri">
    Dört keşif türü takma adı artık katalog dönemi türleri üzerinde ince
    sarmalayıcılardır:

    | Eski takma ad             | Yeni tür                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Ayrıca eski `ProviderCapabilities` statik torbası - sağlayıcı Plugin'leri
    statik bir nesne yerine `buildReplayPolicy`, `normalizeToolSchemas` ve
    `wrapStreamFn` gibi açık sağlayıcı kancaları kullanmalıdır.

  </Accordion>

  <Accordion title="Düşünme politikası kancaları → resolveThinkingProfile">
    **Eski** (`ProviderThinkingPolicy` üzerinde üç ayrı kanca):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` ve
    `resolveDefaultThinkingLevel(ctx)`.

    **Yeni**: kanonik `id`, isteğe bağlı `label` ve sıralı seviye listesini
    içeren bir `ProviderThinkingProfile` döndüren tek bir
    `resolveThinkingProfile(ctx)`. OpenClaw, bayat saklanan değerleri profil
    sırasına göre otomatik olarak aşağı çeker.

    Bağlam `provider`, `modelId`, isteğe bağlı birleştirilmiş `reasoning` ve
    isteğe bağlı birleştirilmiş model `compat` olgularını içerir. Sağlayıcı
    Plugin'leri bu katalog olgularını kullanarak, yalnızca yapılandırılmış
    istek sözleşmesi desteklediğinde modele özel bir profil gösterebilir.

    Üç yerine bir kanca uygulayın. Eski kancalar kullanım dışı bırakma penceresi
    boyunca çalışmaya devam eder, ancak profil sonucuyla birleştirilmez.

  </Accordion>

  <Accordion title="Harici kimlik doğrulama sağlayıcıları → contracts.externalAuthProviders">
    **Eski**: sağlayıcıyı Plugin manifestinde bildirmeden harici kimlik
    doğrulama kancalarını uygulamak.

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

  <Accordion title="Sağlayıcı env-var araması → setup.providers[].envVars">
    **Eski** manifest alanı: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Yeni**: aynı env-var aramasını manifest üzerinde
    `setup.providers[].envVars` içine yansıtın. Bu, kurulum/durum env
    metaverisini tek yerde birleştirir ve yalnızca env-var aramalarını
    yanıtlamak için Plugin çalışma zamanını başlatmayı önler.

    `providerAuthEnvVars`, kullanım dışı bırakma penceresi kapanana kadar bir
    uyumluluk adaptörü üzerinden desteklenmeye devam eder.

  </Accordion>

  <Accordion title="Memory Plugin kaydı → registerMemoryCapability">
    **Eski**: üç ayrı çağrı -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Yeni**: bellek-durumu API'sinde tek çağrı -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Aynı yuvalar, tek kayıt çağrısı. Eklemeli istem ve korpus yardımcıları
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`)
    etkilenmez.

  </Accordion>

  <Accordion title="Memory embedding sağlayıcısı API'si">
    **Eski**: `api.registerMemoryEmbeddingProvider(...)` artı
    `contracts.memoryEmbeddingProviders`.

    **Yeni**: `api.registerEmbeddingProvider(...)` artı
    `contracts.embeddingProviders`.

    Genel embedding sağlayıcısı sözleşmesi bellek dışında yeniden
    kullanılabilir ve yeni sağlayıcılar için desteklenen yoldur. Belleğe özel
    kayıt API'si, mevcut sağlayıcılar geçiş yaparken kullanımdan kaldırılmış
    uyumluluk olarak bağlı kalır. Plugin incelemesi, paketlenmemiş kullanımı
    uyumluluk borcu olarak raporlar.

  </Accordion>

  <Accordion title="Alt aracı oturum mesajları türleri yeniden adlandırıldı">
    `src/plugins/runtime/types.ts` içinden hâlâ dışa aktarılan iki eski tür
    takma adı:

    | Eski                          | Yeni                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    `readSession` çalışma zamanı yöntemi, `getSessionMessages` lehine
    kullanımdan kaldırılmıştır. Aynı imza; eski yöntem yeni yönteme çağrı
    geçirir.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Eski**: `runtime.tasks.flow` (tekil), canlı bir task-flow erişimcisi
    döndürüyordu.

    **Yeni**: `runtime.tasks.managedFlows`, bir akıştan alt görevler oluşturan,
    güncelleyen, iptal eden veya çalıştıran Plugin'ler için yönetilen TaskFlow
    mutasyon çalışma zamanını korur. Plugin yalnızca DTO tabanlı okumalara
    ihtiyaç duyduğunda `runtime.tasks.flows` kullanın.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Gömülü uzantı fabrikaları → aracı araç-sonucu ara yazılımı">
    Yukarıdaki "Nasıl geçiş yapılır → Gömülü araç-sonucu uzantılarını ara
    yazılıma taşıyın" bölümünde ele alınmıştır. Tamlık için buraya da eklendi:
    kaldırılan, yalnızca gömülü-çalıştırıcıya özel
    `api.registerEmbeddedExtensionFactory(...)` yolu, `contracts.agentToolResultMiddleware`
    içinde açık bir çalışma zamanı listesiyle
    `api.registerAgentToolResultMiddleware(...)` tarafından değiştirilir.
  </Accordion>

  <Accordion title="OpenClawSchemaType takma adı → OpenClawConfig">
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
`extensions/` altındaki paketlenmiş kanal/sağlayıcı Plugin'lerinin içindeki
uzantı düzeyi kullanım dışı bırakmalar, kendi `api.ts` ve `runtime-api.ts`
barrelleri içinde izlenir. Bunlar üçüncü taraf Plugin sözleşmelerini etkilemez
ve burada listelenmez. Paketlenmiş bir Plugin'in yerel barrel'ını doğrudan
kullanıyorsanız, yükseltmeden önce o barrel içindeki kullanım dışı bırakma
yorumlarını okuyun.
</Note>

## Kaldırma zaman çizelgesi

| Ne zaman               | Ne olur                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| **Şimdi**              | Kullanımdan kaldırılmış yüzeyler çalışma zamanı uyarıları yayınlar       |
| **Sonraki ana sürüm**  | Kullanımdan kaldırılmış yüzeyler kaldırılacak; bunları hâlâ kullanan Plugin'ler başarısız olacak |

Tüm çekirdek Plugin'ler zaten geçirilmiştir. Harici Plugin'ler sonraki ana sürümden
önce geçiş yapmalıdır.

## Uyarıları geçici olarak bastırma

Geçiş üzerinde çalışırken bu ortam değişkenlerini ayarlayın:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Bu geçici bir kaçış yoludur, kalıcı bir çözüm değildir.

## İlgili

- [Başlarken](/tr/plugins/building-plugins) - ilk plugin'inizi oluşturun
- [SDK Genel Bakış](/tr/plugins/sdk-overview) - tam alt yol içe aktarma referansı
- [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) - kanal Plugin'leri oluşturma
- [Sağlayıcı Plugin'ler](/tr/plugins/sdk-provider-plugins) - sağlayıcı Plugin'ler oluşturma
- [Plugin İç Yapısı](/tr/plugins/architecture) - mimariye derinlemesine bakış
- [Plugin Manifesti](/tr/plugins/manifest) - manifest şeması referansı
