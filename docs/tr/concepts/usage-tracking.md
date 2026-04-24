---
read_when:
    - Sağlayıcı kullanım/kota yüzeylerini bağlıyorsunuz
    - Kullanım izleme davranışını veya kimlik doğrulama gereksinimlerini açıklamanız gerekiyor
summary: Kullanım izleme yüzeyleri ve kimlik bilgisi gereksinimleri
title: Kullanım izleme
x-i18n:
    generated_at: "2026-04-24T09:07:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 21c2ae0c32d9f28b301abed22d6edcb423d46831cb1d78f4c2908df0ecf82854
    source_path: concepts/usage-tracking.md
    workflow: 15
---

## Nedir

- Sağlayıcı kullanım/kota bilgilerini doğrudan onların kullanım uç noktalarından çeker.
- Tahmini maliyet yoktur; yalnızca sağlayıcının bildirdiği pencereler vardır.
- İnsan tarafından okunabilir durum çıktısı, yukarı akış API tüketilmiş kota, kalan kota veya yalnızca ham sayılar bildirse bile `X% left` olarak normalize edilir.
- Oturum düzeyindeki `/status` ve `session_status`, canlı oturum anlık görüntüsü seyrek olduğunda en son transkript kullanım girdisine geri dönebilir. Bu
  geri dönüş eksik token/önbellek sayaçlarını doldurur, etkin çalışma zamanı
  model etiketini kurtarabilir ve oturum
  meta verisi eksik veya daha küçük olduğunda istem odaklı daha büyük toplamı tercih eder. Mevcut sıfır olmayan canlı değerler yine önceliklidir.

## Nerede görünür

- Sohbetlerde `/status`: oturum token'ları + tahmini maliyet içeren emoji açısından zengin durum kartı (yalnızca API anahtarı). Sağlayıcı kullanımı, mevcut olduğunda **geçerli model sağlayıcısı** için normalize edilmiş `X% left` penceresi olarak gösterilir.
- Sohbetlerde `/usage off|tokens|full`: yanıt başına kullanım altbilgisi (OAuth yalnızca token gösterir).
- Sohbetlerde `/usage cost`: OpenClaw oturum günlüklerinden toplanan yerel maliyet özeti.
- CLI: `openclaw status --usage` tam sağlayıcı başına döküm yazdırır.
- CLI: `openclaw channels list`, sağlayıcı yapılandırmasının yanında aynı kullanım anlık görüntüsünü yazdırır (`--no-usage` ile atlayın).
- macOS menü çubuğu: Context altındaki “Usage” bölümü (yalnızca mevcutsa).

## Sağlayıcılar + kimlik bilgileri

- **Anthropic (Claude)**: auth profillerinde OAuth token'ları.
- **GitHub Copilot**: auth profillerinde OAuth token'ları.
- **Gemini CLI**: auth profillerinde OAuth token'ları.
  - JSON kullanımı `stats` alanına geri döner; `stats.cached`,
    `cacheRead` olarak normalize edilir.
- **OpenAI Codex**: auth profillerinde OAuth token'ları (varsa accountId kullanılır).
- **MiniMax**: API anahtarı veya MiniMax OAuth auth profili. OpenClaw,
  `minimax`, `minimax-cn` ve `minimax-portal` değerlerini aynı MiniMax kota
  yüzeyi olarak ele alır, varsa depolanmış MiniMax OAuth'u tercih eder, aksi halde
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` veya `MINIMAX_API_KEY` değerlerine geri döner.
  MiniMax'ın ham `usage_percent` / `usagePercent` alanları **kalan**
  kotayı ifade eder, bu yüzden OpenClaw bunları göstermeden önce tersine çevirir; mevcutsa
  sayım tabanlı alanlar önceliklidir.
  - Coding-plan pencere etiketleri, mevcut olduğunda sağlayıcının saat/dakika alanlarından gelir, sonra `start_time` / `end_time` aralığına geri döner.
  - Coding-plan uç noktası `model_remains` döndürürse, OpenClaw
    sohbet modeli girdisini tercih eder, açık
    `window_hours` / `window_minutes` alanları olmadığında pencere etiketini zaman damgalarından türetir ve model
    adını plan etiketine dahil eder.
- **Xiaomi MiMo**: env/config/auth store üzerinden API anahtarı (`XIAOMI_API_KEY`).
- **z.ai**: env/config/auth store üzerinden API anahtarı.

Kullanılabilir sağlayıcı kullanım kimlik doğrulaması çözümlenemediğinde kullanım gizlenir. Sağlayıcılar
Plugin'e özgü kullanım kimlik doğrulama mantığı sağlayabilir; aksi halde OpenClaw, auth profilleri, ortam değişkenleri
veya yapılandırmadaki eşleşen OAuth/API anahtarı kimlik bilgilerine geri döner.

## İlgili

- [Token kullanımı ve maliyetler](/tr/reference/token-use)
- [API kullanımı ve maliyetler](/tr/reference/api-usage-costs)
- [İstem önbellekleme](/tr/reference/prompt-caching)
