---
read_when:
    - Canvas ana makinesi, araçları, komutları, belgeleri veya protokol sahipliğini taşıma
    - Canvas’ın hâlâ çekirdeğe ait olup olmadığını denetleme
    - Deneysel Canvas Plugin PR'ını hazırlama veya inceleme
summary: Canvas'ı çekirdekten çıkarıp birlikte gelen deneysel bir Plugin'e taşımaya yönelik plan ve denetim kontrol listesi.
title: Canvas Plugin yeniden düzenlemesi
x-i18n:
    generated_at: "2026-05-07T13:26:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Canvas Plugin yeniden düzenlemesi

Canvas düşük kullanımlı ve deneyseldir. Bunu temel bir özellik olarak değil, paketlenmiş bir Plugin olarak ele alın. Core genel Gateway, node, HTTP, kimlik doğrulama, yapılandırma ve yerel istemci tesisatını koruyabilir, ancak Canvas'a özel davranış `extensions/canvas` altında bulunmalıdır.

## Hedef

Mevcut eşleştirilmiş node davranışını korurken Canvas sahipliğini `extensions/canvas` konumuna taşıyın:

- aracıya yönelik `canvas` aracı Canvas Plugin tarafından kaydedilir
- Canvas node komutlarına yalnızca Canvas Plugin bunları kaydettiğinde izin verilir
- A2UI ana makine/kaynak dosyaları Canvas Plugin altında bulunur
- Canvas belge somutlaştırması Canvas Plugin altında bulunur
- CLI komut uygulaması Canvas Plugin altında bulunur veya Plugin sahipliğindeki bir çalışma zamanı barrel'ı üzerinden devreder
- belgeler ve Plugin envanteri Canvas'ı deneysel ve Plugin destekli olarak açıklar

## Hedef Dışı

- Bu yeniden düzenlemede yerel uygulama Canvas kullanıcı arayüzünü yeniden tasarlamayın.
- Ayrı bir ürün kararı Canvas'ın silinmesi gerektiğini söylemedikçe iOS, Android veya macOS'tan Canvas protokol/istemci desteğini kaldırmayın.
- En az bir başka paketlenmiş Plugin aynı seam'e ihtiyaç duymadıkça yalnızca Canvas için geniş bir Plugin hizmet framework'ü oluşturmayın.

## Mevcut dal durumu

Tamamlandı:

- `extensions/canvas` içinde paketlenmiş Plugin paketi eklendi.
- `extensions/canvas/openclaw.plugin.json` eklendi.
- Aracı `canvas` aracı `src/agents/tools/canvas-tool.ts` konumundan `extensions/canvas/src/tool.ts` konumuna taşındı.
- `createCanvasTool` için core kaydı `src/agents/openclaw-tools.ts` dosyasından kaldırıldı.
- Canvas ana makine uygulaması `src/canvas-host` konumundan `extensions/canvas/src/host` konumuna taşındı.
- `extensions/canvas/runtime-api.ts`, testler, paketleme ve harici genel Canvas yardımcıları için Plugin sahipliğindeki uyumluluk barrel'ı olarak korundu.
- Canvas belge somutlaştırması `src/gateway/canvas-documents.ts` konumundan `extensions/canvas/src/documents.ts` konumuna taşındı.
- Canvas CLI uygulaması ve A2UI JSONL yardımcıları `extensions/canvas/src/cli.ts` içine taşındı.
- Canvas ana makine URL'si ve kapsamlı yetenek yardımcıları `extensions/canvas/src` içine taşındı.
- Canvas node komut varsayılanları hardcoded core listelerinden çıkarılıp Plugin `nodeInvokePolicies` içine taşındı.
- `plugins.entries.canvas.config.host` konumunda Plugin sahipliğinde Canvas ana makine yapılandırması eklendi.
- Canvas ve A2UI HTTP sunumu, Canvas Plugin HTTP rota kaydının arkasına taşındı.
- Plugin sahipliğindeki HTTP rotaları için genel Plugin WebSocket yükseltme yönlendirmesi eklendi.
- Canvas'a özel Gateway ana makine URL'si ve node yetenek kimlik doğrulaması, genel barındırılan Plugin yüzeyi ve node yetenek yardımcılarıyla değiştirildi.
- Canvas belge URL'lerinin, core'un Canvas belge içlerini import etmesi yerine Canvas Plugin üzerinden çözümlenmesi için Plugin sahipliğinde barındırılan medya çözücüler eklendi.
- Canvas'ın üst komut yolunu elle yazmadan Plugin sahipliğinde bir node özelliği olarak `openclaw nodes canvas` bildirebilmesi için `api.registerNodeCliFeature(...)` eklendi.
- `extensions/canvas/runtime-api.js` için üretim `src/**` import'ları kaldırıldı.
- A2UI bundle kaynağı `apps/shared/OpenClawKit/Tools/CanvasA2UI` konumundan `extensions/canvas/src/host/a2ui-app` konumuna taşındı.
- A2UI derleme/kopyalama uygulaması `extensions/canvas/scripts` altına taşındı ve kök derleme bağlantısı genel paketlenmiş Plugin varlık hook'larıyla değiştirildi.
- Çalışma zamanı eski üst seviye `canvasHost` yapılandırma alias'ı kaldırıldı.
- Canvas doctor migration korundu; böylece `openclaw doctor --fix` eski `canvasHost` yapılandırmalarını `plugins.entries.canvas.config.host` içine yeniden yazar.
- Gateway protokol v4 arkasındaki eski aracı Canvas protokol uyumluluğu kaldırıldı. Yerel istemciler ve Gateway'ler artık yalnızca `pluginSurfaceUrls.canvas` ile `node.pluginSurface.refresh` kullanır; kullanımdan kaldırılmış `canvasHostUrl`, `canvasCapability` ve `node.canvas.capability.refresh` yolu bu deneysel yeniden düzenlemede bilinçli olarak desteklenmez.
- Oluşturulan Plugin envanteri Canvas'ı içerecek şekilde güncellendi.
- Plugin referans belgeleri `docs/plugins/reference/canvas.md` konumuna eklendi.

Bilinen kalan core sahipliğindeki Canvas yüzeyleri:

- `apps/` altındaki yerel uygulama Canvas işleyicileri hâlâ bilinçli olarak Canvas Plugin yüzeyini tüketir
- `apps/` altındaki yerel uygulama Canvas protokol/istemci işleyicileri
- yayınlanan artifact çıktısı, geriye dönük uyumlu çalışma zamanı araması için hâlâ `dist/canvas-host/a2ui` kullanır, ancak kopyalama adımı artık Plugin sahipliğindedir

## Hedef biçim

`extensions/canvas` şunlara sahip olmalıdır:

- Plugin manifestosu ve paket metadata'sı
- aracı araç kaydı
- node invoke komut politikası
- Canvas ana makinesi ve A2UI çalışma zamanı
- Canvas A2UI bundle kaynağı ve varlık derleme/kopyalama script'leri
- Canvas belge oluşturma ve varlık çözümleme
- Canvas CLI uygulaması
- Canvas belgeleri sayfası ve Plugin envanteri girdisi

Core yalnızca genel seam'lere sahip olmalıdır:

- Plugin keşfi ve kaydı
- genel aracı araç kaydı
- genel node invoke politika kaydı
- genel Gateway HTTP/kimlik doğrulama ve WebSocket yükseltme yönlendirmesi
- genel barındırılan Plugin yüzeyi URL çözümleme
- genel barındırılan medya çözücü kaydı
- genel node yetenek aktarımı
- genel yapılandırma tesisatı
- genel paketlenmiş Plugin varlık hook keşfi

Yerel uygulamalar Canvas komut işleyicilerini protokol istemcileri olarak koruyabilir. Plugin çalışma zamanı sahibi onlar değildir.

## Migration adımları

1. `plugins.entries.canvas.config.host` öğesini Plugin sahipliğindeki yapılandırma yüzeyi olarak ele alın.
2. Belgeleri Canvas deneysel paketlenmiş Plugin olarak açıklanacak şekilde güncelleyin.
3. Odaklı Canvas testlerini, Plugin envanter kontrollerini, Plugin SDK API kontrollerini ve çalışma zamanı sınırlarından etkilenen derleme/tip kapılarını çalıştırın.

## Denetim kontrol listesi

Yeniden düzenlemeyi tamamlandı saymadan önce:

- `rg "src/canvas-host|../canvas-host"` canlı kaynak import'u döndürmez.
- `rg "canvas-tool|createCanvasTool" src` core sahipliğinde Canvas araç uygulaması bulmaz.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` genel Plugin politika testleri dışında hardcoded allowlist varsayılanı bulmaz.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` boştur.
- `rg "canvas-documents" src` boştur.
- `rg "registerNodesCanvasCommands|nodes-canvas" src` boştur; Canvas Plugin, iç içe Plugin CLI metadata'sı üzerinden `openclaw nodes canvas` kaydeder.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` Gateway çalışma zamanı sahipliği döndürmez.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` yalnızca uyumluluk sarmalayıcılarını veya Plugin sahipliğindeki yolları bulur.
- `pnpm plugins:inventory:check` başarılı olur.
- `pnpm plugin-sdk:api:check` başarılı olur veya oluşturulan API baseline'ları bilinçli olarak güncellenmiş ve gözden geçirilmiştir.
- Hedefli Canvas testleri başarılı olur.
- Değişen-lane testleri Canvas ana makine/A2UI yolları için başarılı olur.
- PR gövdesi Canvas'ın deneysel ve Plugin destekli olduğunu açıkça söyler.

## Doğrulama komutları

Yineleme sırasında hedefli yerel kontroller kullanın:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

Çalışma zamanı barrel'ı, lazy import, paketleme veya yayınlanan Plugin yüzeyleri değişirse push öncesinde `pnpm build` çalıştırın.
