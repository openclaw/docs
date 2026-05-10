---
read_when:
    - Tam bir ajan turu çalıştırmadan araçları çağırma
    - Araç politikası yaptırımı gerektiren otomasyonlar oluşturma
summary: Tek bir aracı Gateway HTTP uç noktası üzerinden doğrudan çağırın
title: Araç çağırma API'si
x-i18n:
    generated_at: "2026-05-10T19:39:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 531e77673fb9c06d0cc8f8145d874e22f7e590dc3e4c5dee1574874af5666886
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaw'ın Gateway'i, tek bir aracı doğrudan çağırmak için basit bir HTTP uç noktası sunar. Her zaman etkindir ve Gateway kimlik doğrulaması ile araç ilkesini kullanır. OpenAI uyumlu `/v1/*` yüzeyi gibi, paylaşılan gizli anahtar bearer kimlik doğrulaması tüm gateway için güvenilir operatör erişimi olarak ele alınır.

- `POST /tools/invoke`
- Gateway ile aynı port (WS + HTTP çoklama): `http://<gateway-host>:<port>/tools/invoke`

Varsayılan en büyük yük boyutu 2 MB'dir.

## Kimlik Doğrulama

Gateway kimlik doğrulama yapılandırmasını kullanır.

Yaygın HTTP kimlik doğrulama yolları:

- paylaşılan gizli anahtar kimlik doğrulaması (`gateway.auth.mode="token"` veya `"password"`):
  `Authorization: Bearer <token-or-password>`
- güvenilir kimlik taşıyan HTTP kimlik doğrulaması (`gateway.auth.mode="trusted-proxy"`):
  yapılandırılmış kimlik duyarlı proxy üzerinden yönlendirin ve gerekli
  kimlik başlıklarını onun eklemesine izin verin
- özel-ingress açık kimlik doğrulaması (`gateway.auth.mode="none"`):
  kimlik doğrulama başlığı gerekmez

Notlar:

- `gateway.auth.mode="token"` olduğunda, `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`) kullanın.
- `gateway.auth.mode="password"` olduğunda, `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) kullanın.
- `gateway.auth.mode="trusted-proxy"` olduğunda, HTTP isteği yapılandırılmış bir
  güvenilir proxy kaynağından gelmelidir; aynı ana makinedeki loopback proxy'leri açıkça
  `gateway.auth.trustedProxy.allowLoopback = true` gerektirir.
- `gateway.auth.rateLimit` yapılandırılmışsa ve çok fazla kimlik doğrulama hatası oluşursa, uç nokta `Retry-After` ile birlikte `429` döndürür.

## Güvenlik sınırı (önemli)

Bu uç noktayı Gateway örneği için **tam operatör erişimi** yüzeyi olarak ele alın.

- Buradaki HTTP bearer kimlik doğrulaması dar bir kullanıcı başına kapsam modeli değildir.
- Bu uç nokta için geçerli bir Gateway token'ı/parolası, sahip/operatör kimlik bilgisi gibi ele alınmalıdır.
- Paylaşılan gizli anahtar kimlik doğrulama modlarında (`token` ve `password`), çağıran daha dar bir `x-openclaw-scopes` başlığı gönderse bile uç nokta normal tam operatör varsayılanlarını geri yükler.
- Paylaşılan gizli anahtar kimlik doğrulaması, bu uç noktadaki doğrudan araç çağrılarını sahip-gönderen turları olarak da ele alır.
- Güvenilir kimlik taşıyan HTTP modları (örneğin güvenilir proxy kimlik doğrulaması veya özel bir ingress üzerinde `gateway.auth.mode="none"`), mevcut olduğunda `x-openclaw-scopes` değerini dikkate alır; aksi halde normal operatör varsayılan kapsam kümesine geri döner.
- Bu uç noktayı yalnızca loopback/tailnet/özel ingress üzerinde tutun; doğrudan genel internete açmayın.

Kimlik doğrulama matrisi:

- `gateway.auth.mode="token"` veya `"password"` + `Authorization: Bearer ...`
  - paylaşılan gateway operatör gizli anahtarına sahip olunduğunu kanıtlar
  - daha dar `x-openclaw-scopes` değerlerini yok sayar
  - tam varsayılan operatör kapsam kümesini geri yükler:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - bu uç noktadaki doğrudan araç çağrılarını sahip-gönderen turları olarak ele alır
- güvenilir kimlik taşıyan HTTP modları (örneğin güvenilir proxy kimlik doğrulaması veya özel ingress üzerinde `gateway.auth.mode="none"`)
  - bir dış güvenilir kimliği veya dağıtım sınırını doğrular
  - başlık mevcut olduğunda `x-openclaw-scopes` değerini dikkate alır
  - başlık yoksa normal operatör varsayılan kapsam kümesine geri döner
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
- `args` (nesne, isteğe bağlı): araca özgü bağımsız değişkenler.
- `sessionKey` (dize, isteğe bağlı): hedef oturum anahtarı. Atlanırsa veya `"main"` ise, Gateway yapılandırılmış ana oturum anahtarını kullanır (`session.mainKey` ve varsayılan ajanı dikkate alır ya da global kapsamda `global` kullanır).
- `dryRun` (boolean, isteğe bağlı): gelecekte kullanım için ayrılmıştır; şu anda yok sayılır.

## İlke + yönlendirme davranışı

Araç kullanılabilirliği, Gateway ajanları tarafından kullanılan aynı ilke zinciri üzerinden filtrelenir:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- grup ilkeleri (oturum anahtarı bir grup veya kanala eşleniyorsa)
- alt ajan ilkesi (bir alt ajan oturum anahtarıyla çağırırken)

Bir araca ilke tarafından izin verilmiyorsa, uç nokta **404** döndürür.

Önemli sınır notları:

- Exec onayları operatör koruma sınırlarıdır; bu HTTP uç noktası için ayrı bir yetkilendirme sınırı değildir. Bir araca burada Gateway kimlik doğrulaması + araç ilkesi aracılığıyla erişilebiliyorsa, `/tools/invoke` ek bir çağrı başına onay istemi eklemez.
- `exec` burada erişilebilir durumdaysa, bunu değişiklik yapabilen bir shell yüzeyi olarak ele alın. `write`, `edit`, `apply_patch` veya HTTP dosya sistemi yazma araçlarını reddetmek shell yürütmesini salt okunur yapmaz.
- Gateway bearer kimlik bilgilerini güvenilmeyen çağıranlarla paylaşmayın. Güven sınırları arasında ayrım gerekiyorsa ayrı gateway'ler (ve ideal olarak ayrı işletim sistemi kullanıcıları/ana makineleri) çalıştırın.

Gateway HTTP ayrıca varsayılan olarak sabit bir reddetme listesi uygular (oturum ilkesi araca izin verse bile):

- `exec` - doğrudan komut yürütme (RCE yüzeyi)
- `spawn` - rastgele alt süreç oluşturma (RCE yüzeyi)
- `shell` - shell komutu yürütme (RCE yüzeyi)
- `fs_write` - ana makinede rastgele dosya değişikliği
- `fs_delete` - ana makinede rastgele dosya silme
- `fs_move` - ana makinede rastgele dosya taşıma/yeniden adlandırma
- `apply_patch` - yama uygulaması rastgele dosyaları yeniden yazabilir
- `sessions_spawn` - oturum orkestrasyonu; ajanları uzaktan başlatmak RCE'dir
- `sessions_send` - oturumlar arası mesaj enjeksiyonu
- `cron` - kalıcı otomasyon kontrol düzlemi
- `gateway` - gateway kontrol düzlemi; HTTP üzerinden yeniden yapılandırmayı önler
- `nodes` - düğüm komut aktarma, eşleştirilmiş ana makinelerde system.run'a ulaşabilir
- `whatsapp_login` - terminal QR taraması gerektiren etkileşimli kurulum; HTTP üzerinde takılı kalır

Bu reddetme listesini `gateway.tools` aracılığıyla özelleştirebilirsiniz:

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list
      allow: ["gateway"],
    },
  },
}
```

Grup ilkelerinin bağlamı çözmesine yardımcı olmak için isteğe bağlı olarak şunları ayarlayabilirsiniz:

- `x-openclaw-message-channel: <channel>` (örnek: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (birden fazla hesap olduğunda)

## Yanıtlar

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (geçersiz istek veya araç girdi hatası)
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
- [Araçlar ve pluginler](/tr/tools)
