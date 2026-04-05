---
read_when:
    - Menü çubuğu simgesi davranışını değiştirme
summary: macOS üzerinde OpenClaw için menü çubuğu simgesi durumları ve animasyonları
title: Menü Çubuğu Simgesi
x-i18n:
    generated_at: "2026-04-05T14:00:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: a67a6e6bbdc2b611ba365d3be3dd83f9e24025d02366bc35ffcce9f0b121872b
    source_path: platforms/mac/icon.md
    workflow: 15
---

# Menü Çubuğu Simge Durumları

Yazar: steipete · Güncellendi: 2025-12-06 · Kapsam: macOS uygulaması (`apps/macos`)

- **Boşta:** Normal simge animasyonu (göz kırpma, ara sıra kıpırdama).
- **Duraklatıldı:** Durum öğesi `appearsDisabled` kullanır; hareket yoktur.
- **Ses tetikleyici (büyük kulaklar):** Sesle uyandırma algılayıcısı, uyandırma sözcüğü duyulduğunda `AppState.triggerVoiceEars(ttl: nil)` çağırır ve ifade yakalanırken `earBoostActive=true` durumunu korur. Kulaklar büyür (1.9x), okunabilirlik için dairesel kulak delikleri alır, ardından 1 saniyelik sessizlikten sonra `stopVoiceEars()` ile eski haline döner. Yalnızca uygulama içi ses işlem hattından tetiklenir.
- **Çalışıyor (ajan çalışıyor):** `AppState.isWorking=true`, “kuyruk/bacak telaşı” mikro hareketini tetikler: iş yürütülürken daha hızlı bacak kıpırdaması ve hafif bir ofset uygulanır. Şu anda WebChat ajan çalıştırmaları etrafında açılıp kapatılıyor; diğer uzun görevlere bağlarken aynı geçişi onların etrafına da ekleyin.

Bağlantı noktaları

- Sesle uyandırma: çalışma zamanı/test aracı, tetikleme anında `AppState.triggerVoiceEars(ttl: nil)` çağırır ve yakalama penceresiyle eşleşmesi için 1 saniyelik sessizlikten sonra `stopVoiceEars()` çağırır.
- Ajan etkinliği: iş aralıklarının etrafında `AppStateStore.shared.setWorking(true/false)` ayarlayın (WebChat ajan çağrısında zaten yapıldı). Takılı kalan animasyonları önlemek için aralıkları kısa tutun ve `defer` bloklarında sıfırlayın.

Şekiller ve boyutlar

- Temel simge `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)` içinde çizilir.
- Kulak ölçeği varsayılan olarak `1.0` değerindedir; ses güçlendirmesi `earScale=1.9` olarak ayarlar ve genel çerçeveyi değiştirmeden `earHoles=true` durumunu açar (36×36 px Retina arka depolamaya işlenen 18×18 pt şablon görüntü).
- Telaş hareketi, küçük bir yatay sarsıntıyla birlikte bacak kıpırdamasını ~1.0'a kadar çıkarır; mevcut boşta kıpırdamaya eklenir.

Davranış notları

- Kulaklar/çalışma durumu için harici CLI/broker geçişi yoktur; kazara gidip gelmeleri önlemek için bunu uygulamanın kendi sinyallerine içsel tutun.
- Simgenin bir iş takılırsa hızla temel durumuna dönmesi için TTL değerlerini kısa tutun (&lt;10 sn).
