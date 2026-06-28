---
read_when:
    - Policy plugin'ini kuruyor, yapılandırıyor veya denetliyorsunuz
summary: Çalışma alanı uyumluluğu için politika destekli doctor denetimleri ekler.
title: Politika Plugin'i
x-i18n:
    generated_at: "2026-06-28T01:02:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01de4816a191a175367c06ff69e4ebf6032ee1a105d1d9a48a74093e5e6f774
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Policy Plugin

Çalışma alanı uyumluluğu için policy destekli doctor denetimleri ekler.

## Dağıtım

- Paket: `@openclaw/policy`
- Kurulum yolu: OpenClaw'a dahil

## Yüzey

plugin

<!-- openclaw-plugin-reference:manual-start -->

## Davranış

Policy Plugin, policy tarafından yönetilen OpenClaw ayarları ve yönetilen çalışma alanı bildirimleri için doctor sağlık denetimleri sağlar. Policy şu anda kanal uyumluluğunu, yönetilen araç meta verilerini, MCP sunucusu durumunu, model sağlayıcı durumunu, özel ağ erişim durumunu, Gateway açığa çıkarma durumunu, ajan çalışma alanı/araç durumunu, yapılandırılmış genel/ajan başına araç durumunu, yapılandırılmış sandbox çalışma zamanı durumunu, giriş/kanal erişim durumunu, veri işleme durumunu ve OpenClaw yapılandırma secret sağlayıcı/auth profili durumunu kapsar.

Policy, yazılmış gereksinimleri `policy.jsonc` içinde saklar, mevcut OpenClaw ayarlarını ve çalışma alanı bildirimlerini kanıt olarak gözlemler ve sapmaları `openclaw policy check` ile `openclaw doctor --lint` üzerinden raporlar. Temiz bir policy denetimi; operatörlerin denetim için kaydedebileceği policy, kanıt, bulgular ve onay hash'leri üretir.

`openclaw policy compare --baseline <file>` bir policy dosyasını başka bir policy dosyasıyla karşılaştırır. Bu yalnızca yapılandırma düzeyinde uyumluluktur: denetlenen policy'nin yazılmış tabana göre eksik veya daha zayıf olmadığını doğrulamak için policy kuralı meta verilerini kullanır ve çalışma zamanı durumunu, kimlik bilgilerini veya secret değerlerini incelemez.

Araç durumu kuralları onaylanmış profilleri, yalnızca çalışma alanı dosya sistemi araçlarını, sınırlandırılmış exec security/ask/host ayarlarını, devre dışı bırakılmış yükseltilmiş modu, tam `alsoAllow` girdilerini ve zorunlu araç reddetme girdilerini gerektirebilir. Kanıt kayıtları eklemeli `alsoAllow` girdilerini kaydeder çünkü bunlar etkin araç durumunu genişletebilir. Bu denetimler yalnızca yapılandırma uyumluluğunu gözlemler; çalışma zamanı onay durumunu okumaz veya çalışma zamanı enforcement'ı eklemez.

Sandbox durumu kuralları onaylanmış sandbox modlarını/arka uçlarını gerektirebilir, host container ağ kullanımını reddedebilir, container namespace katılımlarını reddedebilir, salt okunur container bağlamalarını gerektirebilir, container çalışma zamanı socket bağlamalarını ve kısıtlanmamış container profillerini reddedebilir ve sandbox tarayıcı CDP kaynak aralıklarını gerektirebilir.
Bu denetimler yalnızca yapılandırma uyumluluğunu gözlemler; çalışma zamanı onay durumunu okumaz, canlı container'ları incelemez veya çalışma zamanı enforcement'ı eklemez.

Veri işleme kuralları hassas günlük redaksiyonunu gerektirebilir, telemetri içerik yakalamayı reddedebilir, oturum saklama bakımını gerektirebilir ve oturum transcript bellek indekslemeyi reddedebilir. Bu denetimler yalnızca yapılandırma uyumluluğunu gözlemler; ham günlükleri, telemetri dışa aktarımlarını, transcript'leri, bellek dosyalarını, secret'ları veya kişisel verileri incelemez.

`scopes.<scopeName>` altındaki adlandırılmış policy kapsamları, listeledikleri seçici için daha katı normal policy bölümleri ekleyebilir. `agentIds`; `tools`, `agents.workspace`, `sandbox` ve `dataHandling.memory` destekler; `channelIds` ise `ingress.channels` destekler.
`agents.list[]` içinde açıkça listelenmeyen çalışma zamanı ajan kimlikleri, kanıt olmadan sessizce geçmek yerine devralınan genel/varsayılan duruma göre denetlenir. `policy.jsonc` içinde bulunan her kapsam, seçicisi için geçerli ve enforcement uygulanabilir olmalıdır. Overlay kuralları ek iddialardır; bu yüzden üst düzey policy'yi zayıflatmazlar ve aynı gözlemlenen yapılandırma her iki kapsamı da ihlal ettiğinde kendi bulgularını üretebilirler.

<!-- openclaw-plugin-reference:manual-end -->

## İlgili belgeler

- [policy](/tr/cli/policy)
