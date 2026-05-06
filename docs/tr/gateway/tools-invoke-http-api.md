---
read_when:
    - Tam bir ajan turu çalıştırmadan araçları çağırma
    - Araç politikası uygulaması gerektiren otomasyonlar oluşturma
summary: Gateway HTTP uç noktası üzerinden tek bir aracı doğrudan çağırın
title: Araçları çağırma API'si
x-i18n:
    generated_at: "2026-05-06T09:15:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fcd490d4eaa63f23b0d502e537c4094ade88afcdd04e2b7df1a5f0484a11c57
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaw'ın Gateway'i, tek bir aracı doğrudan çağırmak için basit bir HTTP endpoint'i sunar. Her zaman etkindir ve Gateway kimlik doğrulamasını artı araç ilkesini kullanır. OpenAI uyumlu `/v1/*` yüzeyi gibi, paylaşılan gizli bearer kimlik doğrulaması tüm gateway için güvenilir operatör erişimi olarak ele alınır.

- `POST /tools/invoke`
- Gateway ile aynı port (WS + HTTP multiplex): `http://<gateway-host>:<port>/tools/invoke`

Varsayılan maksimum payload boyutu 2 MB'dir.

## Kimlik Doğrulama

Gateway kimlik doğrulama yapılandırmasını kullanır.

Yaygın HTTP kimlik doğrulama yolları:

- paylaşılan gizli kimlik doğrulaması (`gateway.auth.mode="token"` veya `"password"`):
  `Authorization: Bearer <token-or-password>`
- güvenilir kimlik taşıyan HTTP kimlik doğrulaması (`gateway.auth.mode="trusted-proxy"`):
  yapılandırılmış kimlik farkındalığı olan proxy üzerinden yönlendirin ve gerekli
  kimlik header'larını onun enjekte etmesine izin verin
- özel giriş açık kimlik doğrulaması (`gateway.auth.mode="none"`):
  kimlik doğrulama header'ı gerekmez

Notlar:

- `gateway.auth.mode="token"` olduğunda, `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`) kullanın.
- `gateway.auth.mode="password"` olduğunda, `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) kullanın.
- `gateway.auth.mode="trusted-proxy"` olduğunda, HTTP isteği yapılandırılmış
  güvenilir bir proxy kaynağından gelmelidir; aynı ana makine loopback proxy'leri açıkça
  `gateway.auth.trustedProxy.allowLoopback = true` gerektirir.
- `gateway.auth.rateLimit` yapılandırılmışsa ve çok fazla kimlik doğrulama hatası oluşursa, endpoint `Retry-After` ile `429` döndürür.

## Güvenlik sınırı (önemli)

Bu endpoint'i gateway instance'ı için **tam operatör erişimli** bir yüzey olarak ele alın.

- Buradaki HTTP bearer kimlik doğrulaması dar bir kullanıcı başına kapsam modeli değildir.
- Bu endpoint için geçerli bir Gateway token'ı/parolası, sahip/operatör kimlik bilgisi gibi ele alınmalıdır.
- Paylaşılan gizli kimlik doğrulama modları (`token` ve `password`) için, çağıran daha dar bir `x-openclaw-scopes` header'ı gönderse bile endpoint normal tam operatör varsayılanlarını geri yükler.
- Paylaşılan gizli kimlik doğrulaması, bu endpoint üzerindeki doğrudan araç çağrılarını da sahip gönderen dönüşleri olarak ele alır.
- Güvenilir kimlik taşıyan HTTP modları (örneğin güvenilir proxy kimlik doğrulaması veya özel bir ingress üzerinde `gateway.auth.mode="none"`) mevcut olduğunda `x-openclaw-scopes` değerini dikkate alır ve aksi halde normal operatör varsayılan kapsam kümesine geri döner.
- Bu endpoint'i yalnızca loopback/tailnet/özel ingress üzerinde tutun; doğrudan herkese açık internete açmayın.

Kimlik doğrulama matrisi:

- `gateway.auth.mode="token"` veya `"password"` + `Authorization: Bearer ...`
  - paylaşılan gateway operatör gizlisine sahip olunduğunu kanıtlar
  - daha dar `x-openclaw-scopes` değerlerini yok sayar
  - tam varsayılan operatör kapsam kümesini geri yükler:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - bu endpoint üzerindeki doğrudan araç çağrılarını sahip gönderen dönüşleri olarak ele alır
- güvenilir kimlik taşıyan HTTP modları (örneğin güvenilir proxy kimlik doğrulaması veya özel ingress üzerinde `gateway.auth.mode="none"`)
  - bir dış güvenilir kimliği veya dağıtım sınırını doğrular
  - header mevcut olduğunda `x-openclaw-scopes` değerini dikkate alır
  - header yoksa normal operatör varsayılan kapsam kümesine geri döner
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

- `tool` (string, zorunlu): çağrılacak araç adı.
- `action` (string, isteğe bağlı): araç şeması `action` destekliyorsa ve args payload'u bunu atladıysa args içine eşlenir.
- `args` (object, isteğe bağlı): araca özgü argümanlar.
- `sessionKey` (string, isteğe bağlı): hedef oturum anahtarı. Atlanırsa veya `"main"` ise Gateway yapılandırılmış ana oturum anahtarını kullanır (`session.mainKey` ve varsayılan agent'ı dikkate alır ya da global kapsamda `global` kullanır).
- `dryRun` (boolean, isteğe bağlı): gelecekteki kullanım için ayrılmıştır; şu anda yok sayılır.

## İlke + yönlendirme davranışı

Araç kullanılabilirliği, Gateway agent'ları tarafından kullanılan aynı ilke zinciri üzerinden filtrelenir:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- grup ilkeleri (oturum anahtarı bir gruba veya kanala eşleniyorsa)
- subagent ilkesi (bir subagent oturum anahtarıyla çağırırken)

Bir araca ilke tarafından izin verilmiyorsa endpoint **404** döndürür.

Önemli sınır notları:

- Exec onayları operatör guardrail'leridir, bu HTTP endpoint'i için ayrı bir yetkilendirme sınırı değildir. Bir araca burada Gateway kimlik doğrulaması + araç ilkesi üzerinden erişilebiliyorsa, `/tools/invoke` çağrı başına ek bir onay prompt'u eklemez.
- Gateway bearer kimlik bilgilerini güvenilmeyen çağıranlarla paylaşmayın. Güven sınırları arasında ayrım gerekiyorsa ayrı gateway'ler çalıştırın (ve ideal olarak ayrı OS kullanıcıları/ana makineleri kullanın).

Gateway HTTP ayrıca varsayılan olarak katı bir reddetme listesi uygular (oturum ilkesi araca izin verse bile):

- `exec` - doğrudan komut yürütme (RCE yüzeyi)
- `spawn` - rastgele alt süreç oluşturma (RCE yüzeyi)
- `shell` - shell komutu yürütme (RCE yüzeyi)
- `fs_write` - ana makinede rastgele dosya mutasyonu
- `fs_delete` - ana makinede rastgele dosya silme
- `fs_move` - ana makinede rastgele dosya taşıma/yeniden adlandırma
- `apply_patch` - patch uygulaması rastgele dosyaları yeniden yazabilir
- `sessions_spawn` - oturum orkestrasyonu; uzaktan agent oluşturmak RCE'dir
- `sessions_send` - oturumlar arası mesaj enjeksiyonu
- `cron` - kalıcı otomasyon kontrol düzlemi
- `gateway` - gateway kontrol düzlemi; HTTP üzerinden yeniden yapılandırmayı engeller
- `nodes` - node komut relay'i eşleştirilmiş ana makinelerde system.run'a ulaşabilir
- `whatsapp_login` - terminal QR taraması gerektiren etkileşimli kurulum; HTTP üzerinde takılır

Bu reddetme listesini `gateway.tools` üzerinden özelleştirebilirsiniz:

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
- `400` → `{ ok: false, error: { type, message } }` (geçersiz istek veya araç girdisi hatası)
- `401` → yetkisiz
- `429` → kimlik doğrulaması hız sınırına takıldı (`Retry-After` ayarlanır)
- `404` → araç kullanılamıyor (bulunamadı veya allowlist'e alınmadı)
- `405` → yönteme izin verilmiyor
- `500` → `{ ok: false, error: { type, message } }` (beklenmeyen araç yürütme hatası; sterilize edilmiş mesaj)

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
