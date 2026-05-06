---
read_when:
    - Sağlayıcı kullanım/kota arayüzlerini entegre ediyorsunuz
    - Kullanım izleme davranışını veya kimlik doğrulama gereksinimlerini açıklamanız gerekir
summary: Kullanım izleme yüzeyleri ve kimlik bilgisi gereksinimleri
title: Kullanım takibi
x-i18n:
    generated_at: "2026-05-06T09:11:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14210813bf3c078a1323b1560a1a3da586f55880e05a9b310e1b6a2d5490f956
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Nedir?

- Sağlayıcı kullanımını/kotasını doğrudan kullanım uç noktalarından çeker.
- Tahmini maliyet yoktur; yalnızca sağlayıcının bildirdiği pencereler vardır.
- İnsan tarafından okunabilir durum çıktısı, yukarı akış API'si tüketilen kotayı, kalan kotayı veya yalnızca ham sayımları bildirse bile `X% left` biçimine normalleştirilir.
- Oturum düzeyindeki `/status` ve `session_status`, canlı oturum anlık görüntüsü seyrek olduğunda en son transkript kullanım girdisine geri dönebilir. Bu geri dönüş eksik token/cache sayaçlarını doldurur, etkin çalışma zamanı model etiketini kurtarabilir ve oturum meta verileri eksik ya da daha küçük olduğunda daha büyük, istem odaklı toplamı tercih eder. Mevcut sıfır olmayan canlı değerler yine de önceliklidir.

## Nerede görünür?

- Sohbetlerde `/status`: oturum token'ları + tahmini maliyet içeren emoji açısından zengin durum kartı (yalnızca API anahtarı). Sağlayıcı kullanımı, mevcut olduğunda **geçerli model sağlayıcısı** için normalleştirilmiş `X% left` penceresi olarak gösterilir.
- Sohbetlerde `/usage off|tokens|full`: yanıt başına kullanım alt bilgisi (OAuth yalnızca token'ları gösterir).
- Sohbetlerde `/usage cost`: OpenClaw oturum günlüklerinden toplanan yerel maliyet özeti.
- CLI: `openclaw status --usage`, sağlayıcı başına tam bir döküm yazdırır.
- CLI: `openclaw channels list`, sağlayıcı yapılandırmasının yanında aynı kullanım anlık görüntüsünü yazdırır (atlamak için `--no-usage` kullanın).
- macOS menü çubuğu: Bağlam altında "Kullanım" bölümü (yalnızca mevcutsa).

## Sağlayıcılar + kimlik bilgileri

- **Anthropic (Claude)**: kimlik doğrulama profillerinde OAuth token'ları.
- **GitHub Copilot**: kimlik doğrulama profillerinde OAuth token'ları.
- **Gemini CLI**: kimlik doğrulama profillerinde OAuth token'ları.
  - JSON kullanımı `stats` değerine geri döner; `stats.cached`, `cacheRead` içine normalleştirilir.
- **OpenAI Codex**: kimlik doğrulama profillerinde OAuth token'ları (mevcut olduğunda accountId kullanılır).
- **MiniMax**: API anahtarı veya MiniMax OAuth kimlik doğrulama profili. OpenClaw, `minimax`, `minimax-cn` ve `minimax-portal` değerlerini aynı MiniMax kota yüzeyi olarak ele alır, mevcut olduğunda saklanan MiniMax OAuth değerini tercih eder ve aksi halde `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` veya `MINIMAX_API_KEY` değerlerine geri döner.
  Kullanım yoklaması, yapılandırılmışsa Coding Plan ana makinesini `models.providers.minimax-portal.baseUrl` veya `models.providers.minimax.baseUrl` değerinden türetir; aksi halde MiniMax CN ana makinesini kullanır.
  MiniMax'in ham `usage_percent` / `usagePercent` alanları **kalan** kota anlamına gelir, bu nedenle OpenClaw bunları görüntülemeden önce tersine çevirir; mevcut olduğunda sayım tabanlı alanlar önceliklidir.
  - Coding-plan pencere etiketleri, mevcut olduğunda sağlayıcının saat/dakika alanlarından gelir; ardından `start_time` / `end_time` aralığına geri döner.
  - Coding-plan uç noktası `model_remains` döndürürse OpenClaw sohbet modeli girdisini tercih eder, açık `window_hours` / `window_minutes` alanları yoksa pencere etiketini zaman damgalarından türetir ve plan etiketine model adını ekler.
- **Xiaomi MiMo**: env/config/auth store aracılığıyla API anahtarı (`XIAOMI_API_KEY`).
- **z.ai**: env/config/auth store aracılığıyla API anahtarı.

Kullanılabilir sağlayıcı kullanım kimlik doğrulaması çözümlenemediğinde kullanım gizlenir. Sağlayıcılar Plugin'e özgü kullanım kimlik doğrulama mantığı sağlayabilir; aksi halde OpenClaw, kimlik doğrulama profillerinden, ortam değişkenlerinden veya yapılandırmadan eşleşen OAuth/API anahtarı kimlik bilgilerine geri döner.

## İlgili

- [Token kullanımı ve maliyetleri](/tr/reference/token-use)
- [API kullanımı ve maliyetleri](/tr/reference/api-usage-costs)
- [Prompt önbelleğe alma](/tr/reference/prompt-caching)
