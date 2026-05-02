---
read_when:
    - Sağlayıcı kullanım/kota yüzeylerini bağlıyorsunuz
    - Kullanım takibi davranışını veya kimlik doğrulama gereksinimlerini açıklamanız gerekiyor
summary: Kullanım izleme yüzeyleri ve kimlik bilgisi gereksinimleri
title: Kullanım takibi
x-i18n:
    generated_at: "2026-05-02T08:53:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4faa5daff55668a6be73981b730edece51939d99954e784907c99fb101fcaaa7
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Ne olduğu

- Sağlayıcı kullanımını/kotasını doğrudan onların kullanım uç noktalarından çeker.
- Tahmini maliyet yoktur; yalnızca sağlayıcının bildirdiği pencereler vardır.
- İnsan tarafından okunabilir durum çıktısı, upstream API tüketilen kotayı, kalan kotayı veya yalnızca ham sayıları bildirse bile `X% left` biçimine normalleştirilir.
- Oturum düzeyi `/status` ve `session_status`, canlı oturum anlık görüntüsü seyrek olduğunda en son transcript kullanım girdisine geri dönebilir. Bu geri dönüş eksik token/cache sayaçlarını doldurur, etkin çalışma zamanı model etiketini kurtarabilir ve oturum metadata’sı eksik ya da daha küçük olduğunda daha büyük prompt odaklı toplamı tercih eder. Mevcut sıfır olmayan canlı değerler yine önceliklidir.

## Nerede görünür

- Sohbetlerde `/status`: oturum token’ları + tahmini maliyet içeren emoji açısından zengin durum kartı (yalnızca API anahtarı). Sağlayıcı kullanımı, mevcut olduğunda **geçerli model sağlayıcısı** için normalleştirilmiş `X% left` penceresi olarak gösterilir.
- Sohbetlerde `/usage off|tokens|full`: yanıt başına kullanım alt bilgisi (OAuth yalnızca token’ları gösterir).
- Sohbetlerde `/usage cost`: OpenClaw oturum günlüklerinden toplanan yerel maliyet özeti.
- CLI: `openclaw status --usage`, sağlayıcı başına tam dökümü yazdırır.
- CLI: `openclaw channels list`, sağlayıcı yapılandırmasının yanında aynı kullanım anlık görüntüsünü yazdırır (atlamak için `--no-usage` kullanın).
- macOS menü çubuğu: Context altında “Kullanım” bölümü (yalnızca kullanılabiliyorsa).

## Sağlayıcılar + kimlik bilgileri

- **Anthropic (Claude)**: Kimlik doğrulama profillerindeki OAuth token’ları.
- **GitHub Copilot**: Kimlik doğrulama profillerindeki OAuth token’ları.
- **Gemini CLI**: Kimlik doğrulama profillerindeki OAuth token’ları.
  - JSON kullanımı `stats` değerine geri döner; `stats.cached`, `cacheRead` içine normalleştirilir.
- **OpenAI Codex**: Kimlik doğrulama profillerindeki OAuth token’ları (varsa accountId kullanılır).
- **MiniMax**: API anahtarı veya MiniMax OAuth kimlik doğrulama profili. OpenClaw, `minimax`, `minimax-cn` ve `minimax-portal` değerlerini aynı MiniMax kota yüzeyi olarak ele alır, mevcutsa saklanan MiniMax OAuth’u tercih eder ve aksi halde `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` veya `MINIMAX_API_KEY` değerlerine geri döner. Kullanım yoklaması, yapılandırılmışsa Coding Plan host’unu `models.providers.minimax-portal.baseUrl` veya `models.providers.minimax.baseUrl` değerinden türetir; aksi halde MiniMax CN host’unu kullanır. MiniMax’in ham `usage_percent` / `usagePercent` alanları **kalan** kotayı ifade eder, bu yüzden OpenClaw bunları göstermeden önce tersine çevirir; mevcut olduğunda sayım tabanlı alanlar önceliklidir.
  - Coding-plan pencere etiketleri, mevcut olduğunda sağlayıcının saat/dakika alanlarından gelir, ardından `start_time` / `end_time` aralığına geri döner.
  - Coding-plan uç noktası `model_remains` döndürürse OpenClaw chat-model girdisini tercih eder, açık `window_hours` / `window_minutes` alanları yoksa pencere etiketini zaman damgalarından türetir ve plan etiketine model adını dahil eder.
- **Xiaomi MiMo**: env/config/auth deposu üzerinden API anahtarı (`XIAOMI_API_KEY`).
- **z.ai**: env/config/auth deposu üzerinden API anahtarı.

Kullanılabilir sağlayıcı kullanım kimlik doğrulaması çözümlenemediğinde kullanım gizlenir. Sağlayıcılar Plugin’e özgü kullanım kimlik doğrulama mantığı sağlayabilir; aksi halde OpenClaw, kimlik doğrulama profillerinden, ortam değişkenlerinden veya yapılandırmadan eşleşen OAuth/API anahtarı kimlik bilgilerine geri döner.

## İlgili

- [Token kullanımı ve maliyetler](/tr/reference/token-use)
- [API kullanımı ve maliyetler](/tr/reference/api-usage-costs)
- [Prompt caching](/tr/reference/prompt-caching)
