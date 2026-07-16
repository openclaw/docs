---
read_when:
    - exec veya plugin onayı yaşam döngüsünü, depolamasını, protokolünü ya da yetkilendirmesini değiştirme
    - Bir kanala onay bağlantıları veya yerel onay denetimleri ekleme
    - Alt oturum onaylarını üst veya orkestratör görünümlerine yansıtma
summary: Control UI, yerel uygulamalar, kanallar ve üst oturumlar genelinde kalıcı, derin bağlantıyla erişilebilir onaylar için tasarım
title: Çoklu yüzey operatör onayları
x-i18n:
    generated_at: "2026-07-16T17:53:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9defdaada1911df1184f64429e1787c4881e735c433d6dbc30a5946e11cc7cce
    source_path: refactor/operator-approvals.md
    workflow: 16
---

# Çok yüzeyli operatör onayları

Bu tasarım [#103505](https://github.com/openclaw/openclaw/issues/103505) numaralı kaydı takip eder. Süreç yerelindeki onay yetkisinin yerine Gateway'in sahip olduğu, SQLite destekli tek bir yaşam döngüsü getirir. Gateway'in sahip olduğu her exec veya plugin/araç onayı; tek bir kararlı kimlik, kimliği doğrulanmış tek bir Control UI rotası, atomik olarak ilk yanıtın kazandığı çözümleme ve kaynak ile üst oturum akışlarına yalnızca operatöre yönelik yansıtmalar alır.

Satır içi eylemler ve derin bağlantılar birlikte bulunur. Onay modu açma/kapatma seçeneği yoktur.

## Hedefler

- Exec ve plugin/araç geçitleri için tek bir kalıcı onay nesnesi.
- Kararlı `${controlUiBasePath}/approve/{approvalId}` rotası.
- Yetkili herhangi bir Control UI, yerel uygulama veya kanal yüzeyinden çözümleme.
- Eşzamanlı yüzeylerde atomik olarak ilk yanıtın kazanması davranışı.
- Aynı yeniden denemeler idempotenttir; çakışan geç yanıtlar kazananın üzerine yazamaz.
- Zaman aşımı, hatalı biçimlendirilmiş güvenilir kararlar, eksik rotalar, iptal ve yeniden başlatma durumlarında kapalı kalma.
- İstek ve terminal olayları kaynak oturuma ve ilgili tüm üst/orkestratör sahiplerine ulaşır.
- Kanallar türü belirlenmiş onay ve gezinme eylemleri alır; aktarım geri çağırma verileri kanala özel kalır.
- Mevcut exec/plugin Gateway yöntemleri, uygulamaları tek bir hizmette birleşirken uyumlu kalır.

## Hedef dışı konular

- Engellenmiş araç yürütmesinin kendisini Gateway yeniden başlatmaları boyunca kalıcılaştırmak veya sürdürmek.
- Bir onay kimliğini veya URL'yi taşıyıcı kimlik bilgisi hâline getirmek.
- Onay istemlerini modelin görebildiği dökümlere eklemek veya üst aracıları uyandırmak.
- Onay politikasını, ürün komutlarını veya inceleyici yetkilendirmesini kanal pluginlerine taşımak.
- Onay durumunu kanal, cihaz veya üst öğe başına klonlamak.
- Terminal sonuçlarını kesinleştirmek için gereken durumlar dışında exec izin listelerini, plugin politika bileşimini veya `allow-always` kalıcılığını yeniden tasarlamak.
- Gateway'siz gömülü bir TUI'yi ilk aşamada uzaktan erişilebilir hâle getirmek. Yalnızca yerel kalır ve inceleyici bulunmadığında kapalı kalmalıdır.

## Kullanıma sunma öncesi temel durum ve kanıt haritası

Bu tablo, #103505 açıldığındaki uygulama durumunu kaydeder. Aşağıdaki kullanıma sunma bölümleri, bu temel durumun üzerine kurulan kalıcı kayıt defteri, türü belirlenmiş eylemler, derin bağlantı sayfası ve yerel istemci aşamalarını izler.

| Yüzey             | Temel giriş noktası ve sahibi                                                                                                                                   | Temel davranış ve eksiklik                                                                                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aracı exec        | `src/agents/bash-tools.exec-approval-request.ts`, `src/agents/bash-tools.exec-host-shared.ts`                                                                   | İki aşamalı `exec.approval.*` kaydı, erken bir `/approve` yarışını önler; ancak zaman aşımı, `askFallback` üzerinden yine de izne dönüşebilir.                                                        |
| Plugin araç geçidi | `src/agents/agent-tools.before-tool-call.ts`                                                                                                                    | `plugin.approval.*` ister; `timeoutBehavior: "allow"`, zaman aşımına uğramış bir geçidi onaylayabilir. Gömülü modda `src/infra/embedded-plugin-approval-broker.ts` içinde süreç yerelinde ayrı bir yetki bulunur. |
| Plugin Node geçidi | `src/gateway/node-invoke-plugin-policy.ts`                                                                                                                      | Doğrudan plugin yöneticisi üzerinden oluşturup yayınlayarak sunucu yöntemi yaşam döngüsünün bir kısmını yineler.                                                                              |
| Gateway yetkisi   | `src/gateway/server-aux-handlers.ts`, `src/gateway/exec-approval-manager.ts`, `src/gateway/server-methods/approval-shared.ts`                                   | Ayrı exec ve plugin yöneticileri süreç yerelindeki eşlemeleri kullanır. Terminal girdileri 15 saniye boyunca kalır. İlk yanıtın kazanması yalnızca tek bir süreç içinde geçerlidir.           |
| Gateway protokolü | `packages/gateway-protocol/src/schema/exec-approvals.ts`, `packages/gateway-protocol/src/schema/plugin-approvals.ts`, `src/gateway/methods/core-descriptors.ts` | Exec'te yalnızca bekleyenlere yönelik `get` vardır; plugin'de `get` yoktur; derin bağlantı için türden bağımsız terminal araması yoktur.                                                                                   |
| Teslimat          | `src/infra/exec-approval-channel-runtime.ts`, `src/infra/approval-native-runtime.ts`, `src/infra/approval-handler-runtime.ts`                                   | Kaynak yönlendirmesini, onaylayanlara doğrudan mesajları, bekleyenlerin yeniden oynatılmasını, yerel işleyicileri ve süreç içi terminal temizliğini destekler. Ayrı bir takip çalışması, kalıcı terminal uzlaştırması ekler. |
| Taşınabilir eylemler | `src/interactive/payload.ts`, `src/plugin-sdk/interactive-runtime.ts`, `src/plugin-sdk/approval-reply-runtime.ts`                                               | Onay düğmeleri, `/approve ...` içeren komut eylemleridir; URL ve Web App hedefleri türü belirlenmemiş düğme alanlarıdır.                                                                           |
| Telegram          | `extensions/telegram/src/approval-handler.runtime.ts`, `extensions/telegram/src/button-types.ts`                                                                | İşleyici, özel geri çağırma verileri üretmeden önce onay semantiğini tanımak için komut metnini ayrıştırır.                                                                                   |
| Control UI        | `ui/src/app/exec-approval.ts`, `ui/src/app/overlays.ts`, `ui/src/components/exec-approval.ts`                                                                   | Onay kullanıcı arayüzü genel bir kalıcı penceredir. `ui/src/app-route-paths.ts` ve `ui/src/app-routes.ts` tam rotaları kullanır ve bilinmeyen yolları Sohbet'e yeniden yazar.                                                    |
| Oturum sahipliği  | `src/agents/subagent-registry.types.ts`, `src/agents/subagent-registry-read.ts`, `src/config/sessions/types.ts`                                                 | Denetleyici, istekte bulunan, açık üst öğe ve eski başlatma sahipliği mevcuttur; ancak onay olayları bu oturum akışlarına yansıtılmaz.                                                        |
| Paylaşılan durum  | `src/state/openclaw-state-schema.sql`, `src/state/openclaw-state-db.ts`                                                                                         | Mevcut anlık işlemler ve Kysely koşullu güncellemeleri, `state/openclaw.sqlite` içinde kalıcı karşılaştırma-ve-ayarlamayı destekler.                                                                   |

Güncel temsili testler arasında `src/gateway/exec-approval-manager.test.ts`, `src/gateway/server-methods/approval-shared.test.ts`, `src/agents/bash-tools.exec-gateway-approval.e2e.test.ts`, `extensions/telegram/src/approval-handler.runtime.test.ts` ve `ui/src/e2e/approval-flow.e2e.test.ts` bulunur.

Plugin SDK, tek kanal/plugin sınırı olmaya devam eder. Onay çalışma zamanı ve sunum değişiklikleri, mevcut `src/plugin-sdk/approval-*.ts` ve `src/plugin-sdk/interactive-runtime.ts` alt yolları üzerinden dışa aktarılmalıdır; plugin üretim kodu Gateway iç bileşenlerini içe aktarmamalıdır.

## Önceki çalışmalar

Omnigent, kullanışlı kullanıcı deneyimi ve hata semantiği sağlar:

- [`approval.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/runtime/policies/approval.py), ASK durumunu bekletir, politika başına zaman aşımı uygular ve yalnızca tam bir kabulü onay olarak değerlendirir.
- [`sessions.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/routes/sessions.py), sunucu tarafındaki yerel düzenek geçidini ve üst öğelere istek/çözüm yansıtmasını içerir.
- [`ApprovePage.tsx`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/web/src/pages/ApprovePage.tsx), bağımsız mobil onay sayfasını sağlar.

Depolama iddiasını eleştirmeden kopyalamayın. Güncel etkin bekleyen durum [`_elicitation_registry.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/_elicitation_registry.py) içinde süreç yerelindedir ve kullanılmayan bekleyenler tablosu [`e3b1f2a4c9d7_drop_pending_tool_calls_table.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/db/migrations/versions/e3b1f2a4c9d7_drop_pending_tool_calls_table.py) tarafından kaldırılır. OpenClaw bilinçli olarak daha ileri gider: SQLite yetkili kaynaktır ve her terminal geçişi bir veritabanı karşılaştırma-ve-ayarlama işlemidir.

## Mimari ve sahiplik

Yaşam döngüsünün sahibi Gateway'dir:

1. Bir aracı, plugin kancası veya Node politikası, türe özgü bir istek ve süreç yerelinde yürütme bağlaması sağlar.
2. Gateway bunu doğrular ve inceleyici için arındırılmış bir yansıtma oluşturur.
3. Onay hizmeti bir kaynak/sahip hedef kitlesi hesaplar, kurallı satırı ekler ve ardından süreç içi bekleyiciyi kaydeder.
4. Kalıcı eklemeden sonra Gateway; mevcut onay olaylarını, oturum yansıtmalarını, kanal bildirimlerini ve yerel anlık bildirimi yayınlar.
5. Her yüzey aynı hizmet üzerinden çözümleme yapar.
6. Hizmet tek bir terminal geçişini kaydeder, çalışma zamanı bekleyicisini uyandırır ve terminal yansıtmalarını yayınlar.
7. Başarısız bir olay teslimatı, kaydedilmiş kararı hiçbir zaman geri almaz; istemciler `approval.get` veya liste yeniden oynatması aracılığıyla kurtarır.

Sahiplik sınırları:

- `src/gateway/`: onay hizmeti, yetkilendirme, RPC bağdaştırıcıları, URL oluşturma, bekleyici yaşam döngüsü ve olay yayınlama.
- `src/state/`: paylaşılan şema ve oluşturulan Kysely türleri.
- `src/infra/`: arındırılmış onay görünüm modelleri ve taşınabilir sunum oluşturma.
- `src/agents/`: döndürülen kararı isteme, bekleme ve uygulama; kalıcılık yoktur.
- `src/channels/` ve `extensions/*`: türü belirlenmiş eylemleri işler, kanal kullanıcılarını yetkilendirir, özel geri çağırmaları kodlar ve teslim edilmiş denetimleri günceller.
- `src/plugin-sdk/`: yalnızca genel onay ve sunum sözleşmeleri.
- `ui/`: bağımsız sayfa ve mevcut kuyruk/kalıcı pencere istemcileri.

Süreç içi bekleyici bir bildirim mekanizmasıdır, yetkili kaynak değildir. Kayıt işlemi, isteği yayınlamadan önce satırı ekler ve bekleyiciyi eşzamanlı olarak kurar; böylece bir çözümleyici bu adımların arasına giremez. Daha sonraki her çözümleyici, bu bekleyiciyi sonuçlandırmadan önce SQLite üzerinden kayıt yapar.

## Kalıcı kayıt

Paylaşılan durum veritabanına tek bir `operator_approvals` tablosu ekleyin.

| Sütun                                             | Amaç                                                                                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval_id`                                      | Küresel olarak benzersiz kurallı kimlik. Protokol uyumluluğu için mevcut exec kimliklerini ve `plugin:` kimliklerini koruyun, ancak türü hiçbir zaman ön ekten çıkarsamayın.      |
| `resolution_ref`                                   | Kurallı kimliği taşıyamayan aktarım geri çağırmaları için benzersiz, tam SHA-256 base64url konumlandırıcısı. Bu, yetkilendirme veya herkese açık URL kimliği değildir. |
| `kind`                                             | Kapalı `exec \| plugin` ayırıcısı.                                                                                                        |
| `status`                                           | Kapalı `pending \| allowed \| denied \| expired \| cancelled` durumu.                                                                          |
| `presentation_json`                                | Doğrulanmış, tür etiketli inceleyici izdüşümü. Ham çalışma zamanı istekleri, komut bağlamaları ve geri çağırma yükleri süreç içinde kalır.               |
| `source_agent_id`, `source_session_key`            | Kaynak kimliği ve oturum izdüşümü sabitleyicisi. Oturum anahtarı kalıcıdır; dönüşümlü oturum UUID'si kalıcı değildir.                                          |
| `audience_session_keys_json`                       | Sınırlı genişlik öncelikli sahiplik dolaşımı tarafından üretilen, sıralı ve yinelenen öğeleri kaldırılmış JSON dizisi. İstek ve terminal olayları aynı anlık görüntüyü kullanır. |
| `requested_by_device_id`, `requested_by_client_id` | Kalıcı istekte bulunan/denetim meta verileri. Bağlantı kimliği bellekte kalır ve yüzeyler arası bir asal değildir.                                         |
| `reviewer_device_ids_json`                         | Yalnızca güvenilir onay çalışma zamanı tarafından sağlanan, isteğe bağlı ve açıkça hedeflenmiş inceleyici cihazları.                                                  |
| `runtime_epoch`                                    | Bekletilen yürütmenin sahibi olan süreç dönemi; yeniden başlatma sonrasında sahipsiz satırları iptal etmek için kullanılır.                                                     |
| `created_at_ms`, `expires_at_ms`, `updated_at_ms`  | Yetkili zamanlama.                                                                                                                         |
| `decision`                                         | Mevcut olduğunda açık kullanıcı kararı.                                                                                                       |
| `terminal_reason`                                  | `user`, `timeout`, `malformed-verdict`, `no-route`, `run-aborted` veya `gateway-restart` gibi kapalı neden.                                |
| `resolved_at_ms`, `resolver_kind`, `resolver_id`   | Kazanan ve denetim kimliği sunucu tarafında tutulur. İnceleyici izdüşümleri ham çözümleyici tanımlayıcılarını içermez.                                           |
| `consumed_at_ms`, `consumed_by`                    | `allow-once` için ayrı yeniden oynatma koruması; tüketim, kaydedilen kararı silmemelidir.                                                       |

Gerekli indeksler:

| İndeks                                      | Amaç                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| unique `(resolution_ref)`                  | Ekleme sırasında sütunlar arası `approval_id`/`resolution_ref` belirsizliğini reddeder. |
| `(status, expires_at_ms)`                  | Bekleyen onayları bulur ve yetkili son tarihleri uzlaştırır.               |
| `(source_session_key, created_at_ms DESC)` | Tek bir kaynak oturumu için son onayları yeniden oynatır.                             |
| `(resolved_at_ms)`                         | Sabit saklama politikasına göre tutulan terminal onaylarını temizler.  |

Hedef kitle dizileri küçük ve sınırlıdır. Oturuma göre filtrelenmiş yeniden oynatma, önce Kysely aracılığıyla görünür bekleyen satırları seçer, ardından sınırlı hedef kitle dizilerinin kodunu çözüp uygulama kodunda filtreler; dize eşleştirme veya ham SQL JSON sorguları kullanmaz.

Terminal satırlarını, `src/audit/audit-event-store.ts` içindeki meta veri denetim saklama süresiyle uyumlu olarak 30 gün tutun. Temizleme, yeni bir yapılandırma yüzeyi değil, sabit bir bakım politikasıdır. Veritabanı özel yerel kontrol düzlemi durumudur, ancak inceleyici API'leri depolanan isteğin veya çalışma zamanı bağlamasının tamamını hiçbir zaman açığa çıkarmamalıdır.

## Durum makinesi ve karşılaştırıp ayarlama

Yalnızca şu geçişler geçerlidir:

- `pending -> allowed`: açık `allow-once` veya `allow-always`.
- `pending -> denied`: açık ret, güvenilir hatalı biçimlendirilmiş terminal hükmü veya teslimat rotasının olmaması.
- `pending -> expired`: yetkili son tarihe ulaşıldı.
- `pending -> cancelled`: çalıştırmanın durdurulması, düzgün kapatma veya yeniden başlatma sonrası sahipsiz yürütme kurtarma.

İzin verilmeyen her terminal durumunun etkin hükmü rettir.

Çözümleme, tek bir anlık SQLite işlemi ve şuna eşdeğer bir Kysely koşullu güncellemesi kullanır:

```sql
UPDATE operator_approvals
SET status = ?, decision = ?, terminal_reason = ?, resolved_at_ms = ?
WHERE approval_id = ?
  AND status = 'pending'
  AND expires_at_ms > ?;
```

Güncelleme hiçbir satırı etkilemezse aynı işlem kaydı okur:

- Eksik veya yetkisiz: bulunamadı döndürün; varlığını açığa çıkarmayın.
- Hâlâ bekliyor ancak son tarihe ulaşıldı: karşılaştırıp `expired` olarak ayarlayın, ardından bu terminal satırını döndürün.
- Kaydedilen kararla aynı: kaydedilen kazananla eşgüçlü başarı döndürün.
- Farklı karar: birleşik API, kaydedilen kazananla birlikte `applied: false` döndürür; eski bağdaştırıcılar, yayımlanmış sözleşmelerinin gerektirdiği yerlerde `APPROVAL_ALREADY_RESOLVED` değerini korur.
- Herhangi bir terminal durumu: hiçbir zaman değiştirmeyin.

`now == expires_at_ms` süresi dolmuştur. Gateway zamanı yetkilidir.

`allow-once` yürütmesi, mevcut tam komut/sistem çalıştırma bağlamına bağlı olarak `consumed_at_ms IS NULL` üzerinde ikinci bir CAS kullanır. Onay satırı tüketimden sonra denetim kaydı olarak kalır.

Kimliği doğrulanamayan veya bir onayı tanımlayamayan hatalı biçimlendirilmiş HTTP/RPC girdisi değiştirilmeden reddedilir ve hiçbir zaman onay veremez. Bilinen bir onay için güvenilir bir düzenek/bekleyiciden alınan hatalı biçimlendirilmiş terminal hükmü `denied` durumuna geçer.

## Gateway API

Türden bağımsız inceleyici yöntemleri ekleyin:

| Yöntem                                    | Sözleşme                                                                                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval.get { id }`                     | Görünür bir bekleyen veya saklanan terminal izdüşümünü döndürür.                                                                                                                                                          |
| `approval.resolve { id, kind, decision }` | Kurallı kimliği veya sabit boyutlu aktarım referansını kabul eder; ardından yetkilendirme, tür ve izin verilen karar doğrulaması, son tarih uzlaştırması ve terminal CAS işlemlerini çalıştırır. Yanıt her zaman kurallı kimliği taşır. |

Başarılı bir CAS işleminden sonra kaydedilmiş izdüşümü hemen döndürün. Eski olaylar, kanal ileticileri ve push terminalleştiricileri azami gayretli takip işlemleridir; yavaş veya başarısız bir yüzey, kazanan yanıtı geciktirmemeli ya da geri almamalıdır.

Türe özgü istek doğrulaması `exec.approval.request` ve `plugin.approval.request` içinde kalır. Mevcut `exec.approval.get/list/waitDecision/resolve` ve `plugin.approval.list/waitDecision/resolve`, yayımlanmış Gateway API oldukları için kurallı hizmete yönelik protokol sınırı bağdaştırıcılarına dönüşür. Dahili çağıranlar aynı değişiklik kapsamında hizmete geçirilir.

İnceleyici izdüşümü etiketli bir birleşimdir:

```ts
type OperatorApproval = {
  id: string;
  status: OperatorApprovalStatus;
  presentation:
    | { kind: "exec"; commandText: string /* güvenli exec önizlemesi */ }
    | { kind: "plugin"; title: string; description: string /* güvenli plugin önizlemesi */ };
  // ortak yaşam döngüsü alanları
};
```

Kararlı yol kalıcılaştırılmaz, türetilir. `approval.get`, `urlPath` döndürür; onaylı bir herkese açık kaynağı bilen yüzeyler ayrıca mutlak bir `url` alabilir. İnceleyici anlık görüntüleri kaynak ve hedef kitle oturum anahtarlarını içermez. Gateway, ayrı `session.approval` izdüşümü için bu yönlendirme anahtarlarını sunucu tarafında tutar.

## Olaylar ve taşınabilir eylemler

PR 1, yayımlanmış olay adlarını, yükleri ve mevcut kayıt düzeyindeki alıcı filtrelerini korur:

- `exec.approval.requested`
- `exec.approval.resolved`
- `plugin.approval.requested`
- `plugin.approval.resolved`

Bu eski olaylar çalışma zamanı isteğinin tamamını içerebilir; bu nedenle onay kapsamındaki her istemciye dağıtılmamalıdır. PR 5, eski olay teslimatını genişletmek yerine arındırılmış yaşam döngüsü izdüşümü aracılığıyla etiketli yaşam döngüsü alanları (`status`, `sourceSessionKey`, `urlPath`, terminal meta verileri ve sunum düzeyinde bir `kind`) ekler.

Onay kapsamlı bir `session.approval` izdüşüm olayı ekleyin. Kurallı olayı kalıcı hedef kitle anahtarlarıyla bir kez yayımlayın; tam oturum aboneleri eşleşen her anahtar için aynı olayı alır:

- `sessionKey`: izdüşümü alan akış.
- `sourceSessionKey`: geçidi oluşturan alt/kaynak.
- `phase`: onay durumuna göre ayrıştırılmış `pending \| terminal`.
- bir güvenli `OperatorApproval` izdüşümü.

İstemciler `sessions.messages.subscribe { key, agentId?, includeApprovals: true }` ile katılım sağlar. Başarılı yanıt, abone olan istemcinin kayıt düzeyinde incelemeye de yetkili olduğu, tam olarak bu akış anahtarına ait en fazla 1.000 mevcut bekleyen onayı içeren bir `approvalReplay` ekler. `truncated: false`, filtrelenmiş yeniden oynatmayı yetkili kılar ve yeniden bağlanan istemciler yerel bekleyen kümelerini bununla değiştirir; `truncated: true` bir aşırı yük sinyalidir ve istemciler kurallı arama veya sonraki yaşam döngüsü olayları bunları sonuçlandırana kadar görülmemiş yerel girdileri korumalıdır. Yeniden oynatma sırasında keşfedilen daha sonraki kalıcı bir zaman aşımı, yeni anlık görüntü döndürülmeden önce terminal mezar taşlarını yalnızca abone olan, kayıt düzeyinde yetkilendirilmiş hedef kitlelere gönderir. `operator.admin` doğrudan katılım sağlayabilir; daha dar kapsamlı istemciler hem eşleştirilmiş bir cihaz kimliği hem de `operator.approvals` gerektirir. Oturum aboneliği tek başına hiçbir zaman onay görünürlüğü sağlamaz.

Olayı `src/gateway/server-broadcast.ts` içindeki `operator.approvals` altında kaydedin. İzdüşüm gözlemseldir: hiçbir zaman transkript satırları eklemez, `sessions.changed` yayınlamaz veya bir ajanı uyandırmaz.

`src/interactive/payload.ts` içindeki `MessagePresentationAction` öğesini genişletin:

```ts
type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string }
  | {
      type: "approval";
      approvalId: string;
      approvalKind: "exec" | "plugin";
      decision: ExecApprovalDecision;
    }
  | { type: "url"; url: string }
  | { type: "web-app"; url: string };
```

Çekirdek, türü belirlenmiş karar eylemleri ve onaylanmış mutlak bir Control UI kaynağı mevcut olduğunda ayrı bir İncele bağlantısı oluşturur. Kanallar, bir onay eylemini kendi geri çağırma biçimlerinde kodlar ve çözümü kanonik hizmete gönderir. Geri çağırma, sığıyorsa tam kanonik kimliği; aksi takdirde satırın benzersiz tam özetli `resolution_ref` değerini kullanır. Başvuru yalnızca kompakt bir arama anahtarıdır: normal Gateway kimlik doğrulaması, kayıt yetkilendirmesi, açık tür, izin verilen karar doğrulaması, son tarih uzlaştırması ve ilk yanıt CAS işlemi uygulanmaya devam eder. Kanallar kimlikleri kısaltmamalı, karma öneklerini çözümlememeli, `/approve` metnini ayrıştırmamalı veya türü bir kimlik önekinden çıkarsamamalıdır.

`button.url`, `button.webApp` ve komut destekli onay denetimlerini, kullanımdan kaldırılmış plugin SDK uyumluluk girdileri olarak koruyun. Bunları SDK sınırında normalleştirin; paketlenmiş tüm dahili çağıranları aynı PR içinde taşıyın. `/approve {id} {decision}`, düğmenin anlamsal sözleşmesi değil, metin geri dönüşü ve CLI/sohbet komutu olarak kalır.

## Control UI

Rota `${basePath}/approve/{approvalId}` şeklindedir. Kimlik tek yol parametresidir; kaynak oturum kimliği kayıttan gelir.

Mevcut yönlendirici tam statik rotalara sahip olduğundan ve bilinmeyen yolları Chat'e yeniden yazdığından, bu derin bağlantıyı normal rota normalleştirmesinden önce `ui/src/app/bootstrap.ts` içinde algılayın. Normal Gateway/kimlik doğrulama kurulumunu yeniden kullanın ancak kenar çubuğu kabuğunun ve genel kalıcı iletişim kutusunun dışında bağımsız bir onay sayfası oluşturun.

Belgenin sahibi, URL'sini sunan Gateway'dir. İlk bağlantısı, tam uygulamanın kalıcı uzak Gateway seçimini, bu seçimin ayarlarını değiştirmeden veya kopyalamadan yok sayar; yalnızca kimlik doğrulama, hizmet veren Gateway oturumunun kapsamı içinde kalır. Güvenilir yerel kimlik doğrulama veya ayrıca onaylanmış bir `gatewayUrl` geçersiz kılması, hedefini değiştirebilir. Çekirdek, `.json` veya `.js` ile biten kimlikler de dahil olmak üzere, tek segmentli `/approve` ad alanını plugin HTTP rotalarından ve statik uzantı algılamasından önce ayırır; Control UI sunumu devre dışı bırakıldığında ayrılmış rota `404` ile güvenli biçimde başarısız olur. Başarısız bir geç yüklenen parçanın bir güvenlik kararını yükleme göstergesinde mahsur bırakmaması için sayfayı ana Control UI paketinde tutun.

Sayfa durumları:

- yükleniyor
- kimlik doğrulaması gerekli
- bekliyor
- çözümleniyor
- burada onaylandı veya reddedildi
- başka yerde çözümlendi
- süresi doldu
- iptal edildi
- yasak/bulunamadı
- yeniden deneme seçeneğiyle bağlantı hatası

Sayfa, kimliği doğrulanmamış ikinci bir REST API'yi değil Gateway RPC'yi çağırır. Tarayıcının yenilenmesi kalıcı durumu yeniden okur. Gateway kimlik bilgilerini hiçbir zaman URL'ye, sorguya veya parçaya yerleştirmez.

## Yetkilendirme ve gizlilik

URL bir konum belirleyicidir, yetki değildir. Çözümleme için şunlar gerekir:

1. kimliği doğrulanmış Gateway bağlantısı;
2. `operator.approvals` veya `operator.admin`;
3. kayıt düzeyinde inceleyen yetkilendirmesi.

Kayıt düzeyi kuralları:

- `operator.admin` inceleyebilir.
- `reviewer_device_ids` mevcut olduğunda belirleyicidir. Yalnızca listelenmiş eşleştirilmiş bir
  `operator.approvals` cihazı inceleyebilir; istekte bulunan cihaz, ayrıca listelenmediği
  sürece örtük erişime sahip değildir.
- Açık bir inceleyen listesi yoksa istekte bulunan eşleştirilmiş
  `operator.approvals` cihazı kendi kaydını inceleyebilir.
- İstekte bulunan veya inceleyen bağlaması olmayan gerçekten eski kayıtlar, yükseltmelerin
  zaten bekleyen işleri mahsur bırakmaması için geniş eşleştirilmiş cihaz görünürlüğünü korur.
- Cihazsız dahili çalışma zamanları, kapsamlı onay çalışma zamanı bağlantısı üzerinden
  okuyamaz ancak çözümleyebilir. Bu yetki yalnızca sunucu tarafından kimliği doğrulanmış
  çalışma zamanı belirtecinden gelir; herkese açık `approval.resolve` alanları bunu
  oluşturamaz.
- Canlı istekte bulunan bağlantısının sahipliği eski bağdaştırıcılar için geçerli kalır;
  hiçbir zaman eşleşen bir istemci adından çıkarsanmaz.
- Hedef kitle üyeliği yalnızca sunumu değiştirir. Yetkilendirmeyi hiçbir zaman genişletmez.

`approval.get`, yalnızca temizlenmiş inceleyen izdüşümünü sunar ve dahili kaynak/hedef kitle yönlendirme anahtarlarını dışarıda bırakır. PR 5 `session.approval` olayı, Gateway kalıcı hedef kitle anlık görüntüsünü sunucu tarafında uyguladıktan sonra tek hedefi olan `sessionKey` ile `sourceSessionKey` değerini taşır. Mevcut yürütme/plugin olayları, tüketiciler taşınana kadar geçmiş yüklerini ve kısıtlı alıcılarını korur. Yürütülebilir istek, komut bağlaması ve devam yalnızca işlem içi bekleyicide kalır. Kalıcı satır; güvenli sunumun yanı sıra yaşam döngüsü, yönlendirme ve denetim meta verilerini içerir; ham ortam değerlerini, kimlik bilgilerini, kimlik doğrulama başlıklarını veya kanal geri çağırma verilerini hiçbir zaman depolamaz.

## Hedef kitle izdüşümü

Hedef kitleyi eklemeden önce bir kez hesaplayın ve sıralı anlık görüntüyü kalıcılaştırın. Sahiplik her zaman tek bir üst zincir değil, bir grafiktir: bir alt öğenin hem geçerli bir denetleyicisi hem de ilk istekte bulunanı olabilir ve bu sahipler farklı köklere ulaşabilir.

Belirlenimci bir genişlik öncelikli geçiş kullanın:

1. Kuyruğu kaynak oturum anahtarıyla başlatın.
2. Kuyruktan çıkarılan her anahtar için en son alt aracı kayıt defteri satırını okuyun ve iki farklı sahiplik kenarını sabit sırayla kuyruğa ekleyin: `controllerSessionKey`, ardından `requesterSessionKey`.
3. Kullanılabilir bir kayıt defteri satırı mevcut olduğunda, yönlendirmeden sonra güncelliğini yitirmiş olabilecek oturum girdisi soyunu ayrıca izlemeyin. Aksi takdirde tek geçerli geri dönüş kenarı olan `parentSessionKey ?? spawnedBy` değerini kuyruğa ekleyin.
4. İlk ve en kısa yolun kazanması için kuyruğa ekleme sırasında normalleştirin ve yinelenenleri kaldırın.
5. 64 benzersiz anahtarda durun; bu hedef kitle boyutu sınırı geçiş derinliğini de sınırlar.

Kayıt defteri kaynağı `src/agents/subagent-registry-read.ts`; sahiplik alanları `src/agents/subagent-registry.types.ts` içinde tanımlanır. Oturum geri dönüş alanları `src/config/sessions/types.ts` içinde tanımlanır.

İstek ve sonlandırma izdüşümleri, onay beklerken odak/denetleyici sahipliği değişse bile aynı kalıcı hedef kitleyi kullanır. Bu, istek izdüşümünü alan her hedef kitle oturumu akışı için sonlandırma temizliğini garanti eder. Çözümleme her zaman kaynak onay kimliğini hedefler; hedef kitle oturumları hiçbir zaman klonlanmış onay durumu almaz. İletilen kanal mesajı temizliği, aşağıdaki ayrı teslim konumu izleme işlemidir.

Yalnızca bir onay nedeniyle döküm mesajları yazmayın, sistem istemleri eklemeyin, sahip dönüşlerini başlatmayın veya `sessions.changed` yayınlamayın.

## Teslim edilen yüzeylerin yakınsaması

Yerel onay işleyicileri, etkin denetimleri değiştirecek veya kaldıracak kadar uzun süre teslim edilen mesaj girdilerini zaten saklar. Genel iletilmiş onay mesajları şu anda `MessageReceipt` değerini attığından, başka bir yüzeydeki karar eski denetimlerinin hâlâ bekliyormuş gibi görünmesine neden olabilir. Ayrı bir izleme işlemi, paylaşılan durum veritabanındaki bir `operator_approval_deliveries` alt tablosuyla bu açığı kapatır.

Her satır; onay kimliğini, benzersiz teslim kimliğini, kanal/hesap/tam rotayı, sınırlandırılmış ve JSON ile doğrulanmış kanala özel mesaj konum belirleyicisini, teslim zaman damgalarını ve sonlandırma durumunu depolar. Geri çağırma verilerini, karar belirteçlerini veya ham onay isteklerini hiçbir zaman depolamaz. Konum belirleyici kodlama ve mesaj değişikliğinin sahibi kanaldır; kanonik durum, hedef seçimi, yeniden deneme politikası ve geri dönüş sonlandırma metninin sahibi çekirdektir.

Teslim kaydı ve sonlandırma çözümlemesi yarış durumlarını güvenli biçimde işler:

1. Bekleyen bir gönderim makbuzunu döndürdükten sonra teslim konum belirleyicisini ekleyin ve üst onay durumunu tek bir işlem içinde okuyun.
2. Üst öğe zaten sonlandırılmışsa geç teslimi beklemede bırakmak yerine hemen sonlandırılmasını zamanlayın.
3. Kaydedilen her sonlandırma geçişi, sonlandırılmamış tüm teslim satırlarını ayrıca zamanlar; bırakılabilir yayınlar tetikleyici değildir.
4. Bir kanal sonlandırıcısı `replaced`, `retired` veya `unsupported` bildirir. Değiştirildi durumu yinelenen sonlandırma mesajını engeller; kaldırıldı durumu mevcut sonlandırma izleme mesajını gönderir; desteklenmeme veya hata, onay CAS işlemini geri almadan geri dönüşü kullanır.
5. Başlangıç, tamamlanmamış teslimlere sahip sonlandırılmış onayları yeniden dener ve temizliği Gateway yeniden başlatmasına dayanıklı hâle getirir.

Bu taşıma yaşam döngüsü, bir oluşturucu veya modele yönelik mesaj eylemi değil, isteğe bağlı bir teslim bağdaştırıcısı kancasıdır. QQ C2C/grup mesajlarında şu anda düzenleme, silme veya klavye temizleme API'si yoktur; bu bağdaştırıcı desteklenmemeye devam eder ve taşıma bir değişiklik API'si edinene kadar yalnızca sonraki bir tıklamadan sonra kanonik gerçeği gösterebilir.

## Yeniden başlatma, zaman aşımı ve rota semantiği

SQLite kalıcılığı, yürütmenin sürdürüleceği anlamına gelmez. Komut/araç bağlamaları güvenlik açısından hassas çalışma zamanı bilgileri içerebildiğinden ve sürdürülebilir bir iş sözleşmesi olmadığından bellekte kalır.

Gateway başlatıldığında:

- yeni bir çalışma zamanı dönemi oluşturun;
- eski dönemlerdeki bekleyen satırları atomik olarak `gateway-restart` nedeniyle `cancelled` durumuna geçirin;
- URL'lerinin ne olduğunu açıklayabilmesi için satırları koruyun;
- eksik bir çalışma zamanı bağlamasına karşı daha sonraki bir onayı hiçbir zaman yürütmeyin.

Zamanlayıcılar uyandırma iyileştirmeleridir. Son tarih yetkisi `expires_at_ms` içinde depolanır; okumalar, beklemeler ve çözümlemelerin tümü süre sonu uzlaştırmasını çalıştırır.

Nihai katı davranış:

- zaman aşımı -> `expired`, reddet;
- rota yok -> `denied`, reddet;
- çalıştırma iptali -> `cancelled`, reddet;
- hatalı biçimlendirilmiş güvenilir karar -> `denied`, reddet;
- yalnızca izin verilen açık bir izin kararı -> `allowed`.

Şu anda yayımlanmış yürütme davranışı bu sözleşmeyle hâlâ çelişmektedir:

- `src/agents/bash-tools.exec-host-shared.ts`, `askFallback` uygulayabilir.
- `docs/tools/exec-approvals.md` ve `docs/cli/approvals.md` bu yüzeyi belgeler.

Plugin onayları artık zaman aşımı ve hatalı biçimlendirilmiş kararlarda güvenli biçimde başarısız olur; eski
`timeoutBehavior` alanı kabul edilmeye devam eder ancak yok sayılır. Yürütmenin katı semantiğine
yönelik izleme işlemi; kodu, türleri, belgeleri, testleri ve değişiklik günlüğünü açık
sahip/güvenlik incelemesiyle birlikte güncellemelidir. `askFallback` geçiş sırasında
kapı öncesi politika seçimini açıklamaya devam edebilir ancak oluşturulmuş
bekleyen bir kaydın zaman aşımını onaya dönüştürmemelidir.

## Uyumluluk planı

- Eklemeli Gateway protokolü; protokol sürümü artırılmaz.
- Harici sınırda mevcut yürütme/plugin yöntemlerini ve olaylarını koruyun.
- `plugin:` önekleri dahil mevcut kimlikleri koruyun ancak önekleri tür bilgisi olarak kullanmayı bırakın.
- `/approve` metin komutu davranışını koruyun.
- Eski düğme URL/Web App alanlarını ve komut eylemlerini plugin SDK uyumluluk girdisi olarak koruyun; yeni çekirdek çıktısı türü belirlenmiştir.
- Paketlenmiş tüm kanalları ve dahili çağıranları aynı türü belirlenmiş eylem değişikliğinde taşıyın.
- Yeni URL/sayfa ve daha sonraki zaman aşımı davranışı değişikliği için bir değişiklik günlüğü girdisi ekleyin.
- Bir bilgi isteme modu ayarı eklemeyin.

## Kullanıma sunma

### PR 1: kalıcı yaşam döngüsü

- Bu tasarım notu.
- Paylaşılan SQLite şeması, Kysely oluşturma işlemi, depo ve 30 günlük budama.
- Gateway onay hizmeti, çalışma zamanı bekleyici köprüsü ve yeniden başlatma sahipsiz kayıt işleme.
- Birleştirilmiş `approval.get/resolve`.
- Yürütme/plugin yöntem bağdaştırıcıları.
- İlk yanıt kazanır, eşgüçlülük, süre sonu, yetkilendirme ve tüketim testleri.
- Henüz UI veya kanal davranışı değişikliği yok.

### PR 2: türü belirlenmiş eylemler ve kanal geri çağırmaları

- Türü belirlenmiş onay, URL ve Web App eylemleri.
- Çekirdek sunum oluşturucuları ve plugin SDK dışa aktarımları.
- Açık sahip türüyle taşıma katmanına özel geri çağırma kodlaması.
- Taşıma sınırlarını aşan kanonik kimlikler için kalıcı, sabit boyutlu geri çağırma başvuruları.
- Paketlenmiş kanalların komut metni ve onay kimliği çıkarımından uzaklaştırılması.
- Tıklanan yüzeyde kanonik ilk yanıt doğrusu ve mümkün olan en iyi şekilde etkin yerel terminal güncellemeleri; kalıcı kanal iletisi terminalleştirmesi sonraki çalışma olarak kalır.
- SDK ve paketlenmiş kanal testleri.

### PR 3: Control UI derin bağlantısı

- Bağımsız, kimliği doğrulanmış onay sayfası ve temel yolu dikkate alan başlangıç yönlendirmesi.
- Operatörün kaydedilmiş uzak seçimini değiştirmeden hizmet sunan Gateway'e bağlanma.
- Varlık benzeri kimlikler dâhil, çekirdeğin sahip olduğu onay HTTP ad alanı.
- Gateway tarafından oluşturulan URL yükü ve yaşam döngüsü olayları kullanıma sunulana kadar bekleyen durumun yoklanması.
- Mobil genişlik, yeniden bağlanma, birbiriyle yarışan yanıtlar, yeniden yükleme ve bağlı yol kanıtı.

### PR 4: yerel istemciler

- iOS ve Android inceleme yüzeyleri türe duyarlı `approval.get/resolve` kullanır; watchOS, inceleyici açısından güvenli istemleri ve kararları eşleştirilmiş iPhone üzerinden aktarır.
- Watch, kompakt aktarma sözleşmesinin desteklediği yürütme kararlarını sunar: bir kez izin ver ve reddet.
- Kanonik ilk yanıt terminal doğrusu, yerel denenmiş karar durumunun yerini alır.
- Kaybolan veya belirsiz çözümleme alındıları, kanonik geri okuma gerçekleşene kadar denetimleri dondurur.
- Daha önce yayımlanmış Gateway v4 örnekleri, dar kapsamlı bir eski yöntem geri dönüşü üzerinden yürütme incelemesini korur; yüzeyler arasında korunan terminal durumu, birleştirilmiş yöntemleri gerektirir.
- İnceleyici uyarıları ve sahip bağlamı iPhone, Watch ve Android genelinde görünür kalır.
- Yerel birim, derleme ve platform kanıtı.

### PR 5: üst öğe yaşam döngüsü yayılımı

- PR 1'de kalıcılaştırılan hedef kitle anlık görüntüsünden `session.approval` bekleyen/terminal teslimatı.
- Transkript değişikliği veya ajan uyandırması olmadan tam oturum aboneliği, yeniden bağlanma tekrarı ve terminal mezar taşları.
- Yaşam döngüsü geri çağırmaları kalıcı ekleme/CAS işleminden sonra çalışır ve hiçbir zaman onay yetkisi hâline gelmez.
- İç içe alt ajan ve yeniden bağlanma kanıtı.

### PR 6: kapalı başarısızlık davranışı

- `node-invoke-plugin-policy.ts` ve gömülü plugin aracısını yinelenen yetkiden uzaklaştırın.
- Katı zaman aşımı, hatalı biçim, rota yokluğu, bağlama ve bir kez izin verme tüketim semantiği.
- Bir istek beklemeye alındıktan sonra bunlara uymadan, yayımlanmış izin verici zaman aşımı ayarlarını kullanımdan kaldırın.
- Çok yüzeyli çekişme ve hata ekleme kanıtı.

### Sonraki çalışma: kalıcı uzak ileti temizliği

- İletilen teslimat konumlandırıcılarını kalıcılaştırın ve yeniden başlatmadan sonra teslim edilen her kanal iletisini terminalleştirin.
- Bu taşıma yaşam döngüsünü kanonik onay yetkisinden ve türü belirlenmiş sunum eylemlerinden ayrı tutun.

## Testler

Gerekli odaklanmış kapsam:

- SQLite'ın yeniden açılması, bekleyen ve terminal projeksiyonlarını korur.
- Eşzamanlı iki çözümleyici tam olarak bir CAS kazananı üretir.
- Aynı kararın yeniden denenmesi eşgüçlü biçimde başarılı olur; çelişen yeniden deneme kaydedilmiş kazananı döndürür.
- Son tarihte veya sonrasında çözümleme, onay veremez.
- `allow-once`, terminal denetim durumunu silmeden tam olarak bir kez tüketilebilir.
- Başlangıç, daha eski çalışma zamanı dönemlerini iptal eder.
- Yetkisiz arama ve çözümleme, kaydın varlığını açığa çıkarmaz.
- Açık inceleyici izin listesi ve genel eşleştirilmiş `operator.approvals` davranışı.
- Yürütme ve plugin eski yöntemleri aynı depoyu paylaşır.
- Gateway istek/listeleme/getirme/çözümleme şemaları ve eklemeli olay yükleri.
- Türü belirlenmiş eylem normalleştirmesi, geri dönüşlü işleme, SDK dışa aktarımları ve paketlenmiş kanal geçişleri.
- Telegram geri çağırma kodlaması, taşıma katmanına özel veriler içerir ve komut dizesi çıkarımı içermez.
- Doğrudan alt öğe, dallanmış denetleyici/isteyen sahipleri, iç içe sahipler, yeniden atama, oturum alanı geri dönüşü, döngü ve hedef kitle boyutu üst sınırı.
- İstenen ve terminal hedef kitle dizileri aynıdır.
- Sahip projeksiyonları transkript değişikliğine veya ajan uyandırmasına neden olmaz.
- Control UI rotası `/` konumunda ve yapılandırılmış bir temel yolda çalışır; yenileme, bekleyen veya terminal doğrusunu gösterir.
- Eşzamanlı Control UI ve Telegram yanıtları bir kazanan, kaybeden tarafta ise "başka yerde çözümlendi" ifadesini gösterir.
- Yerel onay tanımlayıcıları ve Gateway sahip tanımlayıcıları, yönlendirme ve uzlaştırma boyunca tam UTF-8 baytlarını korur.
- Yerel RPC ailesi uzlaşması, kabul edilen her Gateway rotası için tek bir kanonik veya eski aileyi sabitler ve kullanımdan sonra hiçbir zaman sessizce alt sürüme geçmez.
- Kaybolan yerel çözümleme alındıları, kanonik geri okumaya kadar eylemleri dondurur; başarısız geri okuma bir kazanan uyduramaz veya Watch yenilemesini alındılayamaz.
- Watch anlık görüntü isteği korelasyonu yalnızca tam olarak eşleştirilmiş Gateway sahibi ve tamamlanmış kanonik iPhone geri okuması için kabul edilir.
- Mobil genişlikte bir onay sayfası, Telegram eylem temizliği ve Android, iPhone ve Watch arasında bir bekleme/çözümleme/geç kalan kaybeden gidiş dönüşü dâhil olmak üzere Testbox/Crabbox üzerinden kullanıcı yolu kanıtı.

## Gözlemlenebilirlik

Onay kimliği, tür, kaynak oturum anahtarı, durum, neden ve gecikme süresini içeren yapılandırılmış, içeriksiz geçiş günlükleri yayınlayın. Önizlemeyi veya ham bağlamayı hiçbir zaman günlüğe kaydetmeyin.

Şunları izleyin:

- türe göre istenen sayısı;
- tür/durum/nedene göre terminal sayısı;
- bekleyen göstergesi;
- istekten terminale gecikme süresi;
- çözümleme yarışı sonuçları: kazanan, eşgüçlü yeniden deneme, çakışma, süresi dolmuş;
- teslimat rotası sayısı ve rota yokluğu retleri;
- başlangıçta yetim kalanların iptalleri;
- hedef kitle boyutu.

Daha sonraki olay teslimatı başarısız olsa bile kaydedilmiş bir geçiş başarılıdır. Yaşam döngüsü aboneleri, PR 5 tekrarı ve kanonik arama yoluyla kurtarılır. Kalıcı kanal iletisi terminalleştirmesi, yukarıdaki ayrı sonraki çalışma olarak kalır.

## Açık kararlar

1. **Haricen erişilebilen Control UI kaynağı.** Her anlık görüntü, kararlı göreli `urlPath` taşır. Mutlak URL yalnızca Gateway erişimi başarıyla sağlandıktan sonra önbelleğe alınmış bir Tailscale Serve/Funnel konumundan duyurulabilir; `allowedOrigins`, istek Host üstbilgileri, `gateway.remote.url` ve yalnızca görüntüleme amaçlı geri döngü/LAN adayları kanonik kaynaklar değildir. Telegram, başlangıç hazırlığı boyunca onay yolunu korumak için kimliği doğrulanmış Mini App sarmalayıcısını kullanabilir. Ayrı olarak incelenmiş açık bir genel URL sözleşmesi bulunana kadar rastgele ters proxy'ler yalnızca göreli kalır. Bir kanalın kaynağı tahmin etmesine hiçbir zaman izin vermeyin.
2. **Yürütme katı zaman aşımı uyumluluk geçişi.** Plugin onay zaman aşımları artık kapalı biçimde başarısız olur ve `timeoutBehavior` kullanımdan kaldırılmıştır. Kalan yayımlanmış `askFallback` sözleşmesinin, bekleyen bir istek zaman aşımına uğradıktan sonra yürütmeye yetki vermeyi durdurmasından önce açık sahip/güvenlik incelemesi, değişiklik günlüğü, belgeler ve bir geçiş/kullanımdan kaldırma kararı gerekir.
3. **Gateway'siz gömülü mod.** Öneri: başlangıçta yalnızca yerel tutun, ardından bir Gateway mevcut olduğunda bunu kanonik hizmetin istemcisi hâline getirin. Hiçbir sunucunun çözümleyemeyeceği bir derin bağlantıyı duyurmayın.
