---
read_when:
    - Sağlayıcı kullanım/kota yüzeylerini bağlıyorsunuz
    - Kullanım izleme davranışını veya kimlik doğrulama gereksinimlerini açıklamanız gerekiyor
summary: Kullanım izleme yüzeyleri ve kimlik bilgisi gereksinimleri
title: Kullanım İzleme
x-i18n:
    generated_at: "2026-04-05T13:52:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62164492c61a8d602e3b73879c13ce3e14ce35964b7f2ffd389a4e6a7ec7e9c0
    source_path: concepts/usage-tracking.md
    workflow: 15
---

# Kullanım izleme

## Nedir

- Sağlayıcı kullanımını/kotasını doğrudan kendi kullanım uç noktalarından çeker.
- Tahmini maliyet yoktur; yalnızca sağlayıcının bildirdiği pencereler kullanılır.
- İnsan tarafından okunabilir durum çıktısı, yukarı akış API tüketilmiş kota, kalan kota veya yalnızca ham sayılar bildirse bile `X% left` biçimine normalize edilir.
- Oturum düzeyindeki `/status` ve `session_status`, canlı oturum anlık görüntüsü seyrek olduğunda en son transkript kullanım girdisine geri dönebilir. Bu geri dönüş, eksik token/önbellek sayaçlarını doldurur, etkin çalışma zamanı model etiketini geri kazanabilir ve oturum meta verileri eksik olduğunda veya daha küçük olduğunda istem odaklı daha büyük toplamı tercih eder. Var olan sıfır olmayan canlı değerler yine de önceliklidir.

## Nerede görünür

- Sohbetlerde `/status`: oturum token’ları + tahmini maliyet (yalnızca API anahtarı) içeren emoji açısından zengin durum kartı. Sağlayıcı kullanımı, mevcut olduğunda **geçerli model sağlayıcısı** için normalize edilmiş `X% left` penceresi olarak gösterilir.
- Sohbetlerde `/usage off|tokens|full`: yanıt başına kullanım altbilgisi (OAuth yalnızca token’ları gösterir).
- Sohbetlerde `/usage cost`: OpenClaw oturum günlüklerinden toplanan yerel maliyet özeti.
- CLI: `openclaw status --usage`, sağlayıcı başına tam döküm yazdırır.
- CLI: `openclaw channels list`, aynı kullanım anlık görüntüsünü sağlayıcı yapılandırmasının yanında yazdırır (atlamak için `--no-usage` kullanın).
- macOS menü çubuğu: Context altında “Usage” bölümü (yalnızca mevcutsa).

## Sağlayıcılar + kimlik bilgileri

- **Anthropic (Claude)**: auth profillerinde OAuth token’ları.
- **GitHub Copilot**: auth profillerinde OAuth token’ları.
- **Gemini CLI**: auth profillerinde OAuth token’ları.
  - JSON kullanımı `stats` alanına geri döner; `stats.cached`, `cacheRead` olarak normalize edilir.
- **OpenAI Codex**: auth profillerinde OAuth token’ları (mevcutsa `accountId` kullanılır).
- **MiniMax**: API anahtarı veya MiniMax OAuth auth profili. OpenClaw,
  `minimax`, `minimax-cn` ve `minimax-portal` değerlerini aynı MiniMax kota
  yüzeyi olarak ele alır, mevcutsa saklanan MiniMax OAuth’u tercih eder ve aksi hâlde
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` veya `MINIMAX_API_KEY` değerlerine geri döner.
  MiniMax’ın ham `usage_percent` / `usagePercent` alanları **kalan**
  kotayı ifade eder; bu nedenle OpenClaw bunları göstermeden önce tersine çevirir; mevcutsa
  sayım tabanlı alanlar önceliklidir.
  - Coding-plan pencere etiketleri, mevcutsa önce sağlayıcının saat/dakika alanlarından gelir,
    ardından `start_time` / `end_time` aralığına geri döner.
  - Coding-plan uç noktası `model_remains` döndürürse, OpenClaw
    chat-model girdisini tercih eder, açık `window_hours` / `window_minutes` alanları yoksa pencere etiketini zaman damgalarından türetir ve plan etiketine model
    adını dahil eder.
- **Xiaomi MiMo**: env/config/auth store üzerinden API anahtarı (`XIAOMI_API_KEY`).
- **z.ai**: env/config/auth store üzerinden API anahtarı.

Kullanılabilir sağlayıcı kullanım kimlik doğrulaması çözümlenemediğinde kullanım gizlenir. Sağlayıcılar
plugin’e özgü kullanım kimlik doğrulama mantığı sağlayabilir; aksi takdirde OpenClaw, auth profillerinden, ortam değişkenlerinden
veya yapılandırmadan eşleşen OAuth/API anahtarı kimlik bilgilerine geri döner.
