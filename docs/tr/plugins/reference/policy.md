---
read_when:
    - Politika Pluginini kuruyor, yapılandırıyor veya denetliyorsunuz
summary: Çalışma alanı uyumluluğu için ilke destekli doctor denetimleri ekler.
title: Politika Plugin'i
x-i18n:
    generated_at: "2026-07-12T12:38:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01de4816a191a175367c06ff69e4ebf6032ee1a105d1d9a48a74093e5e6f774
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Policy Plugin’i

Çalışma alanı uyumluluğu için policy destekli doctor denetimleri ekler.

## Dağıtım

- Paket: `@openclaw/policy`
- Kurulum yolu: OpenClaw’a dahildir

## Yüzey

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Davranış

Policy Plugin’i, policy ile yönetilen OpenClaw ayarları ve denetlenen çalışma alanı bildirimleri için doctor durum denetimleri sağlar. Policy şu anda kanal uyumluluğunu, denetlenen araç meta verilerini, MCP sunucusu durumunu, model sağlayıcısı durumunu, özel ağ erişimi durumunu, Gateway erişime açılma durumunu, ajan çalışma alanı/araç durumunu, yapılandırılmış genel/ajan başına araç durumunu, yapılandırılmış sandbox çalışma zamanı durumunu, giriş/kanal erişimi durumunu, veri işleme durumunu ve OpenClaw yapılandırmasındaki gizli bilgi sağlayıcısı/kimlik doğrulama profili durumunu kapsar.

Policy, yazılmış gereksinimleri `policy.jsonc` dosyasında saklar, mevcut OpenClaw ayarlarını ve çalışma alanı bildirimlerini kanıt olarak gözlemler ve sapmaları `openclaw policy check` ile `openclaw doctor --lint` üzerinden bildirir. Sorunsuz bir policy denetimi; operatörlerin denetim amacıyla kaydedebileceği policy, kanıt, bulgu ve tasdik karmalarını üretir.

`openclaw policy compare --baseline <file>`, bir policy dosyasını başka bir policy dosyasıyla karşılaştırır. Yalnızca yapılandırma düzeyindeki uyumluluğu denetler: denetlenen policy’nin yazılmış temel çizgiye göre eksik veya daha zayıf olmadığını doğrulamak için policy kuralı meta verilerini kullanır; çalışma zamanı durumunu, kimlik bilgilerini veya gizli bilgi değerlerini incelemez.

Araç durumu kuralları; onaylı profilleri, yalnızca çalışma alanıyla sınırlı dosya sistemi araçlarını, sınırlandırılmış exec güvenliği/sorma/ana makine ayarlarını, devre dışı bırakılmış yükseltilmiş modu, tam `alsoAllow` girdilerini ve zorunlu araç engelleme girdilerini gerekli kılabilir. Kanıt kayıtları, etkili araç durumunu genişletebildikleri için ek `alsoAllow` girdilerini kaydeder. Bu denetimler yalnızca yapılandırma uyumluluğunu gözlemler; çalışma zamanı onay durumunu okumaz veya çalışma zamanı yaptırımı eklemez.

Sandbox durumu kuralları; onaylı sandbox modlarını/arka uçlarını gerekli kılabilir, ana makine konteyner ağını ve konteyner ad alanına katılmayı engelleyebilir, salt okunur konteyner bağlamalarını zorunlu kılabilir, konteyner çalışma zamanı soketi bağlamalarını ve sınırlandırılmamış konteyner profillerini engelleyebilir ve sandbox tarayıcısının CDP kaynak aralıklarını gerekli kılabilir.
Bu denetimler yalnızca yapılandırma uyumluluğunu gözlemler; çalışma zamanı onay durumunu okumaz, çalışan konteynerleri incelemez veya çalışma zamanı yaptırımı eklemez.

Veri işleme kuralları; hassas günlük verilerinin karartılmasını ve oturum saklama bakımını gerekli kılabilir, telemetri içeriğinin yakalanmasını ve oturum dökümlerinin bellek dizinine eklenmesini engelleyebilir. Bu denetimler yalnızca yapılandırma uyumluluğunu gözlemler; ham günlükleri, telemetri dışa aktarımlarını, dökümleri, bellek dosyalarını, gizli bilgileri veya kişisel verileri incelemez.

`scopes.<scopeName>` altındaki adlandırılmış policy kapsamları, listeledikleri seçici için daha sıkı normal policy bölümleri ekleyebilir. `agentIds`; `tools`, `agents.workspace`, `sandbox` ve `dataHandling.memory` bölümlerini, `channelIds` ise `ingress.channels` bölümünü destekler.
`agents.list[]` içinde açıkça listelenmeyen çalışma zamanı ajan kimlikleri, hiçbir kanıt olmadan sessizce denetimden geçmek yerine devralınan genel/varsayılan durumla karşılaştırılarak denetlenir. `policy.jsonc` içindeki her kapsam, seçicisi için geçerli ve uygulanabilir olmalıdır. Katman kuralları ek taleplerdir; bu nedenle üst düzey policy’yi zayıflatmaz ve aynı gözlemlenen yapılandırma her iki kapsamı da ihlal ettiğinde kendi bulgularını oluşturabilir.

<!-- openclaw-plugin-reference:manual-end -->

## İlgili belgeler

- [policy](/tr/cli/policy)
