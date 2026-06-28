---
read_when:
    - Tam bir ajan turu çalıştırmadan araçları çağırma
    - Araç politikalarının uygulanmasını gerektiren otomasyonlar oluşturma
summary: Gateway HTTP uç noktası üzerinden tek bir aracı doğrudan çağırın
title: Araçlar API'yi çağırır
x-i18n:
    generated_at: "2026-06-28T00:39:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2023505f5a705b62e2fd685d64d3f9bd7788d09adfe89ac99604e6660c78ad8a
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaw'ın Gateway'i, tek bir aracı doğrudan çağırmak için basit bir HTTP endpoint'i sunar. Her zaman etkindir ve Gateway kimlik doğrulamasını artı araç politikasını kullanır. OpenAI uyumlu `/v1/*` yüzeyi gibi, paylaşılan gizli bearer kimlik doğrulaması tüm Gateway için güvenilir operatör erişimi olarak değerlendirilir.

- `POST /tools/invoke`
- Gateway ile aynı port (WS + HTTP çoklama): `http://<gateway-host>:<port>/tools/invoke`

Varsayılan en büyük yük boyutu 2 MB'dir.

## Kimlik doğrulama

Gateway kimlik doğrulama yapılandırmasını kullanır.

Yaygın HTTP kimlik doğrulama yolları:

- paylaşılan gizli kimlik doğrulama (`gateway.auth.mode="token"` veya `"password"`):
  `Authorization: Bearer <token-or-password>`
- güvenilir kimlik taşıyan HTTP kimlik doğrulaması (`gateway.auth.mode="trusted-proxy"`):
  yapılandırılmış kimlik farkında proxy üzerinden yönlendirin ve gerekli
  kimlik başlıklarını eklemesine izin verin
- özel giriş açık kimlik doğrulaması (`gateway.auth.mode="none"`):
  kimlik doğrulama başlığı gerekmez

Notlar:

- `gateway.auth.mode="token"` olduğunda, `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`) kullanın.
- `gateway.auth.mode="password"` olduğunda, `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) kullanın.
- `gateway.auth.mode="trusted-proxy"` olduğunda, HTTP isteği yapılandırılmış bir
  güvenilir proxy kaynağından gelmelidir; aynı makinedeki loopback proxy'leri açıkça
  `gateway.auth.trustedProxy.allowLoopback = true` gerektirir.
- Proxy'yi atlayan dahili aynı makine çağırıcıları, yerel doğrudan
  yedek olarak `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`
  kullanabilir. Herhangi bir `Forwarded`, `X-Forwarded-*` veya `X-Real-IP` başlığı kanıtı
  isteği bunun yerine trusted-proxy yolunda tutar.
- `gateway.auth.rateLimit` yapılandırılmışsa ve çok fazla kimlik doğrulama hatası oluşursa, endpoint `Retry-After` ile `429` döndürür.

## Güvenlik sınırı (önemli)

Bu endpoint'i Gateway örneği için **tam operatör erişimi** yüzeyi olarak değerlendirin.

- Buradaki HTTP bearer kimlik doğrulaması dar bir kullanıcı başına kapsam modeli değildir.
- Bu endpoint için geçerli bir Gateway token/parolası, sahip/operatör kimlik bilgisi gibi değerlendirilmelidir.
- Paylaşılan gizli kimlik doğrulama modları (`token` ve `password`) için, çağıran daha dar bir `x-openclaw-scopes` başlığı gönderse bile endpoint normal tam operatör varsayılanlarını geri yükler.
- Paylaşılan gizli kimlik doğrulaması ayrıca bu endpoint üzerindeki doğrudan araç çağrılarını sahip-gönderen dönüşleri olarak değerlendirir.
- Güvenilir kimlik taşıyan HTTP modları (örneğin güvenilir proxy kimlik doğrulaması veya özel girişte `gateway.auth.mode="none"`) mevcut olduğunda `x-openclaw-scopes` değerine uyar, aksi halde normal operatör varsayılan kapsam kümesine geri döner.
- Bu endpoint'i yalnızca loopback/tailnet/özel giriş üzerinde tutun; doğrudan herkese açık internete açmayın.

Kimlik doğrulama matrisi:

- `gateway.auth.mode="token"` veya `"password"` + `Authorization: Bearer ...`
  - paylaşılan Gateway operatör gizlisine sahip olunduğunu kanıtlar
  - daha dar `x-openclaw-scopes` değerlerini yok sayar
  - tam varsayılan operatör kapsam kümesini geri yükler:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - bu endpoint üzerindeki doğrudan araç çağrılarını sahip-gönderen dönüşleri olarak değerlendirir
- güvenilir kimlik taşıyan HTTP modları (örneğin güvenilir proxy kimlik doğrulaması veya özel girişte `gateway.auth.mode="none"`)
  - bir dış güvenilir kimliği veya dağıtım sınırını doğrular
  - başlık mevcut olduğunda `x-openclaw-scopes` değerine uyar
  - başlık olmadığında normal operatör varsayılan kapsam kümesine geri döner
  - yalnızca çağıran kapsamları açıkça daraltıp `operator.admin` değerini atladığında sahip semantiğini kaybeder

## İstek gövdesi

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

Alanlar:

- `tool` (dize, zorunlu): çağrılacak araç adı.
- `action` (dize, isteğe bağlı): araç şeması `action` destekliyorsa ve args yükü bunu atladıysa args içine eşlenir.
- `args` (nesne, isteğe bağlı): araca özel bağımsız değişkenler.
- `sessionKey` (dize, isteğe bağlı): hedef oturum anahtarı. Atlanırsa veya `"main"` ise Gateway yapılandırılmış ana oturum anahtarını kullanır (`session.mainKey` ve varsayılan agent'a uyar ya da global kapsamda `global` kullanır).
- `dryRun` (boolean, isteğe bağlı): gelecekte kullanım için ayrılmıştır; şu anda yok sayılır.

## Politika + yönlendirme davranışı

Araç kullanılabilirliği, Gateway agent'ları tarafından kullanılan aynı politika zinciri üzerinden filtrelenir:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- grup politikaları (oturum anahtarı bir gruba veya kanala eşleniyorsa)
- alt agent politikası (bir alt agent oturum anahtarıyla çağırırken)

Bir araca politika tarafından izin verilmiyorsa endpoint **404** döndürür.

Önemli sınır notları:

- Exec onayları operatör koruma sınırlarıdır, bu HTTP endpoint'i için ayrı bir yetkilendirme sınırı değildir. Bir araca burada Gateway kimlik doğrulaması + araç politikası üzerinden erişilebiliyorsa, `/tools/invoke` ek bir çağrı başına onay istemi eklemez.
- `exec` burada erişilebilir durumdaysa, onu değişiklik yapabilen bir shell yüzeyi olarak değerlendirin. `write`, `edit`, `apply_patch` veya HTTP dosya sistemi yazma araçlarını reddetmek shell yürütmesini salt okunur yapmaz.
- Gateway bearer kimlik bilgilerini güvenilmeyen çağırıcılarla paylaşmayın. Güven sınırları arasında ayrım gerekiyorsa ayrı Gateway'ler (ve ideal olarak ayrı OS kullanıcıları/host'ları) çalıştırın.

Gateway HTTP ayrıca varsayılan olarak katı bir ret listesi uygular (oturum politikası araca izin verse bile):

- `exec` - doğrudan komut yürütme (RCE yüzeyi)
- `spawn` - rastgele alt süreç oluşturma (RCE yüzeyi)
- `shell` - shell komutu yürütme (RCE yüzeyi)
- `fs_write` - host üzerinde rastgele dosya değişikliği
- `fs_delete` - host üzerinde rastgele dosya silme
- `fs_move` - host üzerinde rastgele dosya taşıma/yeniden adlandırma
- `apply_patch` - yama uygulaması rastgele dosyaları yeniden yazabilir
- `sessions_spawn` - oturum orkestrasyonu; agent'ları uzaktan başlatmak RCE'dir
- `sessions_send` - oturumlar arası mesaj enjeksiyonu
- `cron` - kalıcı otomasyon kontrol düzlemi
- `gateway` - Gateway kontrol düzlemi; HTTP üzerinden yeniden yapılandırmayı önler
- `nodes` - node komut rölesi eşleştirilmiş host'larda system.run'a erişebilir
- `whatsapp_login` - terminal QR taraması gerektiren etkileşimli kurulum; HTTP üzerinde askıda kalır

Bu ret listesini `gateway.tools` üzerinden özelleştirebilirsiniz:

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list for owner/admin callers
      allow: ["gateway"],
    },
  },
}
```

`gateway.tools.allow` bir maruz bırakma geçersiz kılmasıdır, kapsam yükseltmesi değildir. Kimlik taşıyan HTTP modlarında `cron`, `gateway` ve `nodes`, `gateway.tools.allow` içinde listelenmiş olsalar bile sahip/yönetici kimliğine (`operator.admin`) sahip olmayan çağırıcılar için kullanılamaz kalır. Paylaşılan gizli bearer kimlik doğrulaması yukarıdaki tam güvenilir operatör kuralını izlemeye devam eder.

Grup politikalarının bağlamı çözmesine yardımcı olmak için isteğe bağlı olarak şunları ayarlayabilirsiniz:

- `x-openclaw-message-channel: <channel>` (örnek: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (birden çok hesap varsa)

## Yanıtlar

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (geçersiz istek veya araç girişi hatası)
- `401` → yetkisiz
- `429` → kimlik doğrulama hız sınırına takıldı (`Retry-After` ayarlı)
- `404` → araç kullanılamıyor (bulunamadı veya izin listesinde değil)
- `405` → yönteme izin verilmiyor
- `500` → `{ ok: false, error: { type, message } }` (beklenmeyen araç yürütme hatası; temizlenmiş mesaj)

## Örnek

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```

## İlgili

- [Gateway protokolü](/tr/gateway/protocol)
- [Araçlar ve plugin'ler](/tr/tools)
