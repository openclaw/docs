---
read_when:
    - Kontrol paneli kimlik doğrulamasını veya erişime açma modlarını değiştirme
summary: Gateway panosuna (Kontrol Arayüzü) erişim ve kimlik doğrulama
title: Gösterge Paneli
x-i18n:
    generated_at: "2026-07-16T18:01:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 34d7ab6c5f503f2dd3ab212a1fc6b47c84fcd47c5ad88aa9cdbbbbc73b7ef90e
    source_path: web/dashboard.md
    workflow: 16
---

Gateway panosu, varsayılan olarak `/` adresinde sunulan tarayıcı Control UI'sidir (`gateway.controlUi.basePath` ile geçersiz kılınabilir).

Hızlı açma (yerel Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))
- `gateway.tls.enabled: true` ile WebSocket uç noktası için `https://127.0.0.1:18789/` ve `wss://127.0.0.1:18789` kullanın.

Temel başvuru kaynakları:

- Kullanım ve kullanıcı arayüzü özellikleri için [Control UI](/tr/web/control-ui).
- Serve/Funnel otomasyonu için [Tailscale](/tr/gateway/tailscale).
- Bağlama modları ve güvenlik notları için [Web yüzeyleri](/tr/web).

Kimlik doğrulama, yapılandırılmış gateway kimlik doğrulama yolu üzerinden WebSocket el sıkışması sırasında uygulanır:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik üstbilgileri
- `gateway.auth.mode: "trusted-proxy"` olduğunda güvenilir proxy kimlik üstbilgileri

[Gateway yapılandırması](/tr/gateway/configuration) bölümündeki `gateway.auth` öğesine bakın.

<Warning>
Control UI bir **yönetici yüzeyidir** (sohbet, yapılandırma, çalıştırma onayları). Herkese açık olarak erişime sunmayın. Kullanıcı arayüzü, pano URL'si belirteçlerini geçerli tarayıcı sekmesi ve seçili gateway URL'si için sessionStorage'da tutar ve yüklemeden sonra bunları URL'den kaldırır. localhost, Tailscale Serve veya bir SSH tünelini tercih edin.
</Warning>

## Hızlı yol (önerilen)

- İlk kurulumdan sonra CLI, panoyu otomatik olarak açar ve temiz (belirteç içermeyen) bir bağlantı yazdırır.
- İstediğiniz zaman yeniden açın: `openclaw dashboard` (bağlantıyı kopyalar, mümkünse bir tarayıcı açar, başsız ortamdaysa bir SSH ipucu yazdırır).
- Hem panoya kopyalama hem de tarayıcıya iletme başarısız olursa `openclaw dashboard`, temiz URL'yi yine de yazdırır ve belirtecinizi (`OPENCLAW_GATEWAY_TOKEN` veya `gateway.auth.token` kaynağından) `token` URL parçası anahtarı olarak eklemenizi söyler; belirteç değerini günlüklere hiçbir zaman yazdırmaz.
- Kullanıcı arayüzü paylaşılan gizli bilgiyle kimlik doğrulama isterse yapılandırılmış belirteci veya parolayı Control UI ayarlarına yapıştırın.

## Kimlik doğrulama temelleri (yerel ve uzak)

- **Localhost**: `http://127.0.0.1:18789/` adresini açın.
- **Gateway TLS**: `gateway.tls.enabled: true` olduğunda pano/durum bağlantıları `https://`, Control UI WebSocket bağlantıları ise `wss://` kullanır.
- **Paylaşılan gizli belirtecin kaynağı**: `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`). `openclaw dashboard`, tek seferlik önyükleme için bunu URL parçası aracılığıyla iletebilir; Control UI bunu localStorage'da değil, geçerli sekme ve seçili gateway URL'si için sessionStorage'da tutar.
- `gateway.auth.token` SecretRef tarafından yönetiliyorsa `openclaw dashboard`, harici olarak yönetilen belirteçlerin kabuk günlüklerinde, pano geçmişinde veya tarayıcı başlatma bağımsız değişkenlerinde açığa çıkmasını önlemek amacıyla tasarım gereği belirteç içermeyen bir URL yazdırır, kopyalar ve açar. Başvuru geçerli kabuğunuzda çözümlenmemişse yine de belirteç içermeyen URL'yi ve uygulanabilir kimlik doğrulama kurulum yönergelerini yazdırır.
- **Paylaşılan gizli parola**: yapılandırılmış `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) öğesini kullanın. Pano, yeniden yüklemeler arasında parolaları kalıcı olarak saklamaz.
- **Kimlik taşıyan modlar**: `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve, kimlik üstbilgileri aracılığıyla Control UI/WebSocket kimlik doğrulamasını karşılar; geri döngü olmayan ve kimlik bilgisine duyarlı bir ters proxy ise `gateway.auth.mode: "trusted-proxy"` koşulunu karşılar. WebSocket için ikisinde de paylaşılan gizli bilginin yapıştırılması gerekmez.
- **Localhost değilse**: Tailscale Serve, geri döngü olmayan paylaşılan gizli bilgi bağlaması, `gateway.auth.mode: "trusted-proxy"` ile geri döngü olmayan ve kimlik bilgisine duyarlı bir ters proxy veya bir SSH tüneli kullanın. Özel girişli `gateway.auth.mode: "none"` ya da güvenilir proxy HTTP kimlik doğrulamasını kasıtlı olarak çalıştırmadığınız sürece HTTP API'leri paylaşılan gizli bilgiyle kimlik doğrulamayı kullanmaya devam eder. [Web yüzeyleri](/tr/web) bölümüne bakın.

## Telegram'da açma

Telegram botları, `/dashboard` ile panoyu bir Telegram Mini App olarak açabilir.

Gereksinimler:

- Telegram'ın bir HTTPS Mini App URL'si alması için `gateway.tailscale.mode: "serve"` veya `"funnel"`.
- Telegram göndereni botun sahibi olmalıdır: `commands.ownerAllowFrom` içindeki sayısal bir Telegram kullanıcı kimliği veya seçili hesabın geçerli `channels.telegram.allowFrom` değeri.
- Botla yapılan bir DM'de `/dashboard` komutunu çalıştırın. Grup çağrıları yalnızca komutu DM'de açmanızı söyler ve düğme içermez.
- Docker kurulumları: Serve/Funnel modları, gateway'in `tailscaled` yanında geri döngüye bağlanmasını gerektirir; yayımlanmış bağlantı noktalarıyla köprü ağı bunu karşılayamaz. Gateway kapsayıcısını `network_mode: host` ile çalıştırın ve ana makinedeki `tailscaled` yuvasını (`/var/run/tailscale`) ve `tailscale` CLI'ını kapsayıcıya bağlayın.

Mini App, tek seferlik bir sahip devri gerçekleştirir ve kısa ömürlü bir önyükleme belirteciyle Control UI'ye yönlendirir. URL'de paylaşılan gateway belirtecini açığa çıkarmaz.

v1 kapsamı dışındakiler:

- Telegram Web iframe desteklenmez.
- Tailscale Serve/Funnel, desteklenen tek yayımlanmış URL yoludur.

<a id="if-you-see-unauthorized-1008"></a>

## "unauthorized" / 1008 görürseniz

- Gateway'e erişilebildiğini doğrulayın: yerelde `openclaw status`; uzakta SSH tüneli `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`, ardından `http://127.0.0.1:18789/` adresini açın.
- `AUTH_TOKEN_MISMATCH` için gateway yeniden deneme ipuçları döndürdüğünde istemciler, önbelleğe alınmış bir cihaz belirteciyle tek bir güvenilir yeniden deneme yapabilir; bu yeniden deneme, belirtecin önbelleğe alınmış onaylı kapsamlarını yeniden kullanır (açık `deviceToken`/`scopes` çağıranları, istedikleri kapsam kümesini korur). Bu yeniden denemeden sonra kimlik doğrulama hâlâ başarısız olursa belirteç sapmasını elle giderin.
- `AUTH_SCOPE_MISMATCH` için cihaz belirteci tanındı ancak istenen kapsamları taşımıyor; paylaşılan gateway belirtecini döndürmek yerine yeniden eşleştirin veya yeni kapsam kümesini onaylayın.
- Bu yeniden deneme yolunun dışında bağlantı kimlik doğrulaması önceliği şöyledir: açıkça belirtilen paylaşılan belirteç/parola, ardından açıkça belirtilen `deviceToken`, ardından saklanan cihaz belirteci, ardından önyükleme belirteci.
- Eşzamansız Tailscale Serve yolunda, aynı `{scope, ip}` için başarısız girişimler, başarısız kimlik doğrulama sınırlayıcısı bunları kaydetmeden önce sıraya alınır; bu nedenle eşzamanlı ikinci bir hatalı yeniden deneme doğrudan `retry later` gösterebilir.
- Belirteç sapmasını giderme adımları için [Belirteç sapmasını kurtarma denetim listesi](/tr/cli/devices#token-drift-recovery-checklist) bölümüne bakın.
- Paylaşılan gizli bilgiyi gateway ana makinesinden alın veya sağlayın:
  - Belirteç: `openclaw config get gateway.auth.token`
  - Parola: yapılandırılmış `gateway.auth.password` veya `OPENCLAW_GATEWAY_PASSWORD` öğesini çözümleyin
  - SecretRef tarafından yönetilen belirteç: harici gizli bilgi sağlayıcısını çözümleyin veya bu kabukta `OPENCLAW_GATEWAY_TOKEN` dışa aktarın ve `openclaw dashboard` komutunu yeniden çalıştırın
  - Yapılandırılmış paylaşılan gizli bilgi yok: `openclaw doctor --generate-gateway-token`
- Pano ayarlarında belirteci veya parolayı kimlik doğrulama alanına yapıştırın, ardından bağlanın.
- Kullanıcı arayüzü dil seçici, Appearance altında değil **Settings -> General -> Language** yolundadır.

## İlgili

- [Control UI](/tr/web/control-ui)
- [WebChat](/tr/web/webchat)
