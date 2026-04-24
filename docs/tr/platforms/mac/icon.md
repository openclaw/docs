---
read_when:
    - Menü çubuğu simgesi davranışını değiştirme
summary: macOS üzerinde OpenClaw için menü çubuğu simgesi durumları ve animasyonlar
title: Menü çubuğu simgesi
x-i18n:
    generated_at: "2026-04-24T09:19:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6900d702358afcf0481f713ea334236e1abf973d0eeff60eaf0afcf88f9327b2
    source_path: platforms/mac/icon.md
    workflow: 15
---

# Menü Çubuğu Simge Durumları

Yazar: steipete · Güncelleme: 2025-12-06 · Kapsam: macOS uygulaması (`apps/macos`)

- **Boşta:** Normal simge animasyonu (göz kırpma, ara sıra kıpırdanma).
- **Duraklatıldı:** Durum öğesi `appearsDisabled` kullanır; hareket yoktur.
- **Ses tetikleyici (büyük kulaklar):** Sesle uyandırma algılayıcısı, uyandırma sözcüğü duyulduğunda `AppState.triggerVoiceEars(ttl: nil)` çağrısı yapar; ifade yakalanırken `earBoostActive=true` durumunu korur. Kulaklar büyür (1.9x), okunabilirlik için dairesel kulak delikleri alır, ardından 1 saniyelik sessizlikten sonra `stopVoiceEars()` ile normale döner. Yalnızca uygulama içi ses işlem hattından tetiklenir.
- **Çalışıyor (agent çalışıyor):** `AppState.isWorking=true`, “kuyruk/bacak koşturması” mikro hareketini sürer: iş devam ederken daha hızlı bacak kıpırdaması ve hafif kayma olur. Şu anda WebChat agent çalıştırmaları etrafında açılıp kapatılıyor; diğer uzun görevlere bağladığınızda aynı geçişi onların etrafına da ekleyin.

Bağlantı noktaları

- Sesle uyandırma: çalışma zamanı/test aracı tetikleme anında `AppState.triggerVoiceEars(ttl: nil)` çağırır ve yakalama penceresiyle eşleşmesi için 1 saniyelik sessizlikten sonra `stopVoiceEars()` çağırır.
- Agent etkinliği: çalışma aralıkları etrafında `AppStateStore.shared.setWorking(true/false)` ayarlayın (WebChat agent çağrısında zaten yapılıyor). Animasyonların takılı kalmasını önlemek için aralıkları kısa tutun ve `defer` bloklarında sıfırlayın.

Şekiller ve boyutlar

- Temel simge `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)` içinde çizilir.
- Kulak ölçeği varsayılan olarak `1.0` değerindedir; ses güçlendirmesi `earScale=1.9` ayarlar ve genel çerçeveyi değiştirmeden `earHoles=true` durumunu açar (36×36 px Retina arka plan deposuna işlenen 18×18 pt şablon görsel).
- Koşturma, küçük bir yatay kıpırdamayla birlikte yaklaşık `1.0` düzeyine kadar bacak kıpırdaması kullanır; mevcut boşta kıpırdamasına eklenir.

Davranış notları

- Kulaklar/çalışma durumu için harici CLI/broker geçişi yoktur; yanlışlıkla sürekli açılıp kapanmayı önlemek için bunu uygulamanın kendi sinyallerine içsel tutun.
- TTL değerlerini kısa tutun (`<10s`), böylece bir iş takılırsa simge hızla temel duruma döner.

## İlgili

- [Menü çubuğu](/tr/platforms/mac/menu-bar)
- [macOS uygulaması](/tr/platforms/macos)
