---
read_when:
    - Bir aracının web sohbetinde etkileşimli bir sonuç oluşturmasını istiyorsunuz
    - show_widget girdi, güvenlik veya saklama sözleşmesine ihtiyacınız var
sidebarTitle: Show widget
summary: Web sohbetinde bağımsız SVG veya HTML bileşenlerini satır içinde işleyin
title: Widget'ı göster
x-i18n:
    generated_at: "2026-07-12T12:50:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2de3760ec3aba9e6551eb31129c32f74fc69a8a158f9d6bde5a823136e5eae87
    source_path: tools/show-widget.md
    workflow: 16
---

`show_widget`, Control UI sohbet dökümünde kendi kendine yeten bir SVG veya HTML parçasını satır içinde işler. Birlikte gelen Canvas Plugin, aracın sahibidir ve her sonucu aynı kaynaklı bir Canvas belgesi olarak barındırır.

Araç yalnızca isteği başlatan Gateway istemcisi `inline-widgets` yeteneğini bildirdiğinde kullanılabilir. Control UI bu yeteneği otomatik olarak bildirir. Telegram ve WhatsApp gibi kanal çalıştırmaları `show_widget` aracını almaz.

Yetenek aktarımı; gömülü, Codex app-server ve CLI destekli model arka uçlarını kapsar. İzinle kimliği doğrulanmış MCP çağırıcıları ve doğrudan HTTP araç çağırıcıları, istemci yeteneklerini bildirmedikleri için varsayılan olarak erişime kapalı kalır.

## Aracı kullanma

Aracı iki zorunlu dizeyle agent sağlar:

<ParamField path="title" type="string" required>
  Satır içi önizlemeyle birlikte ve barındırılan belgenin başlığında gösterilen kısa başlık.
</ParamField>

<ParamField path="widget_code" type="string" required>
  Kendi kendine yeten SVG veya HTML parçası. Kırpıldıktan sonra `<svg` ile başlayan girdi SVG modunda işlenir; diğer tüm girdiler HTML parçası olarak değerlendirilir. En fazla uzunluk: 262.144 karakter.
</ParamField>

Araç sonucu bir Canvas önizleme tanıtıcısı içerir; böylece web sohbeti widget'ı doğrudan araç çağrısından işler ve geçmiş yeniden yüklendikten sonra geri yükler. Önizlemeleri işlemeyen dökümler barındırılan Canvas yolunu yine de gösterir.

## Güvenlik ve depolama

Widget belgeleri kısıtlayıcı bir İçerik Güvenliği Politikası kullanır: satır içi stil ve betiklere izin verilir, görseller `data:` URL'lerini kullanabilir; harici getirme işlemleri ve kaynak yüklemeleri ise engellenir. Tüm işaretlemeyi, stilleri, betikleri ve görsel verilerini `widget_code` içinde tutun.

Control UI'ın genel gömme modu `trusted` olsa bile iframe her zaman `allow-same-origin` niteliğini içermez; böylece widget betikleri üst uygulamanın kaynağını okuyamaz. Canvas sunucusu ayrıca widget belgelerini `Content-Security-Policy: sandbox allow-scripts` yanıt üstbilgisiyle sunar; dolayısıyla barındırılan URL doğrudan açıldığında bile widget, Control UI kaynağı yerine opak bir kaynakta çalışır. Tarayıcı korumalı alanı, bir betiğin kendi iframe'inde gezinmesini engellemez; yalnızca bu yalıtılmış çerçevede çalıştırmayı kabul ettiğiniz widget kodunu işleyin.

Iframe ayrıca [`gateway.controlUi.embedSandbox`](/tr/web/control-ui#hosted-embeds) ayarına uyar. Varsayılan `scripts` katmanı, kaynak yalıtımını korurken etkileşimli widget'ları destekler.

Canvas, oturum başına (oturum yoksa agent başına) en fazla 32 widget saklar. Başka bir widget oluşturulduğunda, bu kapsamdaki en eski belge kaldırılır.

## İlgili

- [Control UI tarafından barındırılan gömmeler](/tr/web/control-ui#hosted-embeds)
- [Canvas Plugin](/tr/plugins/reference/canvas)
- [Gateway protokolü istemci yetenekleri](/tr/gateway/protocol#client-capabilities)
