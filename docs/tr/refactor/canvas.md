---
read_when:
    - Canvas ana bilgisayarının, araçlarının, komutlarının, belgelerinin veya protokol sahipliğinin taşınması
    - Canvas'ın hâlâ çekirdek tarafından yönetilip yönetilmediğini denetleme
    - Deneysel Canvas Plugin PR'sini hazırlama veya inceleme
summary: Canvas'ı çekirdekten çıkarıp paketle birlikte gelen deneysel bir Plugin'e taşımaya yönelik plan ve denetim kontrol listesi.
title: Canvas plugin yeniden düzenlemesi
x-i18n:
    generated_at: "2026-07-12T12:45:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
---

# Canvas Plugin yeniden düzenlemesi

Canvas az kullanılan ve deneyseldir. Onu temel bir özellik olarak değil, paketle birlikte sunulan bir Plugin olarak değerlendirin. Temel; genel Gateway, Node, HTTP, kimlik doğrulama, yapılandırma ve yerel istemci altyapısını koruyabilir ancak Canvas'a özgü davranışlar `extensions/canvas` altında bulunmalıdır.

## Hedef

Mevcut eşleştirilmiş Node davranışını koruyarak Canvas sahipliğini `extensions/canvas` konumuna taşıyın:

- aracıya yönelik `canvas` aracı Canvas Plugin tarafından kaydedilir
- Canvas Node komutlarına yalnızca Canvas Plugin bunları kaydettiğinde izin verilir
- A2UI ana makine/kaynak dosyaları Canvas Plugin altında bulunur
- Canvas belgelerinin somutlaştırılması Canvas Plugin altında gerçekleştirilir
- CLI komutu uygulaması Canvas Plugin altında bulunur veya Plugin sahipliğindeki bir çalışma zamanı dışa aktarım modülü üzerinden yetki devreder
- belgeler ve Plugin envanteri Canvas'ı deneme aşamasında ve Plugin destekli olarak tanımlar

## Hedef dışı konular

- Bu yeniden düzenlemede yerel uygulamanın Canvas kullanıcı arayımını yeniden tasarlamayın.
- Ayrı bir ürün kararı Canvas'ın silinmesi gerektiğini belirtmedikçe iOS, Android veya macOS'tan Canvas protokolü/istemci desteğini kaldırmayın.
- En az bir başka paketle birlikte sunulan Plugin aynı bağlantı noktasına ihtiyaç duymadıkça yalnızca Canvas için geniş kapsamlı bir Plugin hizmeti çatısı oluşturmayın.

## Geçerli dalın durumu

Tamamlananlar:

- `extensions/canvas` konumuna paketle birlikte sunulan Plugin paketi eklendi.
- `extensions/canvas/openclaw.plugin.json` eklendi.
- Aracı `canvas` aracı `src/agents/tools/canvas-tool.ts` konumundan `extensions/canvas/src/tool.ts` konumuna taşındı.
- `createCanvasTool` temel kaydı `src/agents/openclaw-tools.ts` dosyasından kaldırıldı.
- Canvas ana makine uygulaması `src/canvas-host` konumundan `extensions/canvas/src/host` konumuna taşındı.
- Testler, paketleme ve harici herkese açık Canvas yardımcıları için Plugin sahipliğindeki uyumluluk dışa aktarım modülü olarak `extensions/canvas/runtime-api.ts` korundu.
- Canvas belgelerinin somutlaştırılması `src/gateway/canvas-documents.ts` konumundan `extensions/canvas/src/documents.ts` konumuna taşındı.
- Canvas CLI uygulaması ve A2UI JSONL yardımcıları `extensions/canvas/src/cli.ts` konumuna taşındı.
- Canvas ana makine URL'si ve kapsamlı yetenek yardımcıları `extensions/canvas/src` konumuna taşındı.
- Canvas Node komutu varsayılanları sabit kodlanmış temel listelerden çıkarılarak Plugin `nodeInvokePolicies` bölümüne taşındı.
- `plugins.entries.canvas.config.host` konumuna Plugin sahipliğinde Canvas ana makine yapılandırması eklendi.
- Canvas ve A2UI HTTP sunumu Canvas Plugin HTTP rotası kaydının arkasına taşındı.
- Plugin sahipliğindeki HTTP rotaları için genel Plugin WebSocket yükseltme yönlendirmesi eklendi.
- Canvas'a özgü Gateway ana makine URL'si ve Node yeteneği kimlik doğrulaması, genel barındırılan Plugin yüzeyi ve Node yeteneği yardımcılarıyla değiştirildi.
- Canvas belge URL'lerinin, temel katmanın Canvas belge iç bileşenlerini içe aktarması yerine Canvas Plugin üzerinden çözümlenmesi için Plugin sahipliğinde barındırılan medya çözümleyicileri eklendi.
- Canvas'ın üst komut yolunu elle belirtmeden `openclaw nodes canvas` komutunu Plugin sahipliğinde bir Node özelliği olarak bildirebilmesi için `api.registerNodeCliFeature(...)` eklendi.
- Üretimdeki `extensions/canvas/runtime-api.js` içe aktarımları `src/**` dosyalarından kaldırıldı.
- A2UI paket kaynağı `apps/shared/OpenClawKit/Tools/CanvasA2UI` konumundan `extensions/canvas/src/host/a2ui-app` konumuna taşındı.
- A2UI derleme/kopyalama uygulaması `extensions/canvas/scripts` altına taşındı ve kök derleme bağlantıları genel paketle birlikte sunulan Plugin varlık kancalarıyla değiştirildi.
- Çalışma zamanındaki eski üst düzey `canvasHost` yapılandırma diğer adı kaldırıldı.
- `openclaw doctor --fix` komutunun eski `canvasHost` yapılandırmalarını `plugins.entries.canvas.config.host` biçiminde yeniden yazması için Canvas doctor geçişi korundu.
- Eski aracı Canvas protokolü uyumluluğu Gateway protokolü v4'ün arkasından kaldırıldı. Yerel istemciler ve Gateway'ler artık yalnızca `pluginSurfaceUrls.canvas` ile `node.pluginSurface.refresh` kullanıyor; kullanımdan kaldırılan `canvasHostUrl`, `canvasCapability` ve `node.canvas.capability.refresh` yolu bu deneysel yeniden düzenlemede kasıtlı olarak desteklenmiyor.
- Oluşturulan Plugin envanteri Canvas'ı içerecek şekilde güncellendi.
- `docs/plugins/reference/canvas.md` konumuna Plugin başvuru belgeleri eklendi.

Temelin sahipliğinde kaldığı bilinen Canvas yüzeyleri:

- `apps/` altındaki yerel uygulama Canvas işleyicileri Canvas Plugin yüzeyini kasıtlı olarak kullanmaya devam ediyor
- `apps/` altındaki yerel uygulama Canvas protokolü/istemci işleyicileri
- yayımlanan yapıt çıktısı geriye dönük uyumlu çalışma zamanı araması için hâlâ `dist/canvas-host/a2ui` kullanıyor ancak kopyalama adımı artık Plugin sahipliğinde

## Hedef yapı

`extensions/canvas` şunların sahibi olmalıdır:

- Plugin manifestosu ve paket meta verileri
- aracı aracı kaydı
- Node çağırma komutu ilkesi
- Canvas ana makinesi ve A2UI çalışma zamanı
- Canvas A2UI paket kaynağı ve varlık derleme/kopyalama betikleri
- Canvas belgesi oluşturma ve varlık çözümleme
- Canvas CLI uygulaması
- Canvas belgeleri sayfası ve Plugin envanteri girdisi

Temel yalnızca genel bağlantı noktalarının sahibi olmalıdır:

- Plugin keşfi ve kaydı
- genel aracı aracı kayıt defteri
- genel Node çağırma ilkesi kayıt defteri
- genel Gateway HTTP/kimlik doğrulama ve WebSocket yükseltme yönlendirmesi
- genel barındırılan Plugin yüzeyi URL çözümlemesi
- genel barındırılan medya çözümleyicisi kaydı
- genel Node yeteneği aktarımı
- genel yapılandırma altyapısı
- genel paketle birlikte sunulan Plugin varlık kancası keşfi

Yerel uygulamalar protokol istemcileri olarak Canvas komut işleyicilerini koruyabilir. Bunlar Plugin çalışma zamanının sahibi değildir.

## Geçiş adımları

1. `plugins.entries.canvas.config.host` öğesini Plugin sahipliğindeki yapılandırma yüzeyi olarak değerlendirin.
2. Belgeleri Canvas'ın deneysel ve paketle birlikte sunulan bir Plugin olarak tanımlanacağı şekilde güncelleyin.
3. Odaklanmış Canvas testlerini, Plugin envanteri denetimlerini, Plugin SDK API denetimlerini ve çalışma zamanı sınırlarından etkilenen derleme/tür kapılarını çalıştırın.

## Denetim kontrol listesi

Yeniden düzenlemenin tamamlandığını belirtmeden önce:

- `rg "src/canvas-host|../canvas-host"` hiçbir etkin kaynak içe aktarımı döndürmez.
- `rg "canvas-tool|createCanvasTool" src` temel sahipliğinde bir Canvas aracı uygulaması bulmaz.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` genel Plugin ilkesi testleri dışında sabit kodlanmış izin listesi varsayılanları bulmaz.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` boş sonuç döndürür.
- `rg "canvas-documents" src` boş sonuç döndürür.
- `rg "registerNodesCanvasCommands|nodes-canvas" src` boş sonuç döndürür; Canvas Plugin, iç içe Plugin CLI meta verileri aracılığıyla `openclaw nodes canvas` komutunu kaydeder.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` Gateway çalışma zamanı sahipliği döndürmez.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` yalnızca uyumluluk sarmalayıcılarını veya Plugin sahipliğindeki yolları bulur.
- `pnpm plugins:inventory:check` başarılı olur.
- `pnpm plugin-sdk:api:check` başarılı olur veya oluşturulan API temel çizgileri kasıtlı olarak güncellenip incelenir.
- Hedeflenen Canvas testleri başarılı olur.
- Canvas ana makinesi/A2UI yolları için değişen hat testleri başarılı olur.
- PR gövdesi Canvas'ın deneysel ve Plugin destekli olduğunu açıkça belirtir.

## Doğrulama komutları

Yineleme sırasında hedefli yerel denetimleri kullanın:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

Çalışma zamanı dışa aktarım modülü, gecikmeli içe aktarım, paketleme veya yayımlanan Plugin yüzeyleri değişirse göndermeden önce `pnpm build` komutunu çalıştırın.
