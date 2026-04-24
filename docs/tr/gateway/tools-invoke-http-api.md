---
read_when:
    - Tam bir agent turu çalıştırmadan araçları çağırma
    - Araç ilkesi uygulaması gerektiren otomasyonlar oluşturma
summary: Gateway HTTP uç noktası üzerinden tek bir aracı doğrudan çağırın
title: Araç çağırma API'si
x-i18n:
    generated_at: "2026-04-24T09:11:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: edae245ca8b3eb2f4bd62fb9001ddfcb3086bec40ab976b5389b291023f6205e
    source_path: gateway/tools-invoke-http-api.md
    workflow: 15
---

# Araç Çağırma (HTTP)

OpenClaw Gateway, tek bir aracı doğrudan çağırmak için basit bir HTTP uç noktası sunar. Her zaman etkindir ve Gateway auth ile araç ilkesini kullanır. OpenAI uyumlu `/v1/*` yüzeyi gibi, paylaşılan gizli anahtar bearer auth da tüm Gateway için güvenilir operatör erişimi olarak değerlendirilir.

- `POST /tools/invoke`
- Gateway ile aynı port (WS + HTTP çoklama): `http://<gateway-host>:<port>/tools/invoke`

Varsayılan maksimum payload boyutu 2 MB'dır.

## Kimlik doğrulama

Gateway auth yapılandırmasını kullanır.

Yaygın HTTP auth yolları:

- paylaşılan gizli anahtar auth (`gateway.auth.mode="token"` veya `"password"`):
  `Authorization: Bearer <token-or-password>`
- güvenilir kimlik taşıyan HTTP auth (`gateway.auth.mode="trusted-proxy"`):
  isteği yapılandırılmış kimlik farkındalıklı proxy üzerinden yönlendirin ve onun gerekli kimlik başlıklarını enjekte etmesine izin verin
- özel giriş açık auth (`gateway.auth.mode="none"`):
  auth başlığı gerekmez

Notlar:

- `gateway.auth.mode="token"` olduğunda `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`) kullanın.
- `gateway.auth.mode="password"` olduğunda `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) kullanın.
- `gateway.auth.mode="trusted-proxy"` olduğunda HTTP isteği,
  yapılandırılmış local loopback olmayan güvenilir proxy kaynağından gelmelidir; aynı host üzerindeki local loopback proxy'ler bu modu karşılamaz.
- `gateway.auth.rateLimit` yapılandırılmışsa ve çok fazla auth hatası olursa uç nokta `Retry-After` ile birlikte `429` döndürür.

## Güvenlik sınırı (önemli)

Bu uç noktayı, Gateway örneği için **tam operatör erişimi** yüzeyi olarak değerlendirin.

- Buradaki HTTP bearer auth, dar kullanıcı başına kapsam modeli değildir.
- Bu uç nokta için geçerli bir Gateway token'ı/password'ü, sahip/operatör kimlik bilgisi gibi ele alınmalıdır.
- Paylaşılan gizli anahtar auth modlarında (`token` ve `password`), çağıran daha dar bir `x-openclaw-scopes` başlığı gönderse bile uç nokta normal tam operatör varsayılanlarını geri yükler.
- Paylaşılan gizli anahtar auth, bu uç noktadaki doğrudan araç çağrılarını da sahip-gönderen turları olarak değerlendirir.
- Güvenilir kimlik taşıyan HTTP modları (örneğin trusted proxy auth veya özel girişte `gateway.auth.mode="none"`), varsa `x-openclaw-scopes` başlığını dikkate alır; yoksa normal operatör varsayılan kapsam kümesine geri düşer.
- Bu uç noktayı yalnızca local loopback/tailnet/özel giriş üzerinde tutun; doğrudan genel internete açmayın.

Auth matrisi:

- `gateway.auth.mode="token"` veya `"password"` + `Authorization: Bearer ...`
  - paylaşılan Gateway operatör sırrına sahip olunduğunu kanıtlar
  - daha dar `x-openclaw-scopes` başlıklarını yok sayar
  - tam varsayılan operatör kapsam kümesini geri yükler:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - bu uç noktadaki doğrudan araç çağrılarını sahip-gönderen turları olarak değerlendirir
- güvenilir kimlik taşıyan HTTP modları (örneğin trusted proxy auth veya özel girişte `gateway.auth.mode="none"`)
  - dış güvenilir bir kimliği veya dağıtım sınırını kimlik doğrular
  - başlık mevcut olduğunda `x-openclaw-scopes` değerini dikkate alır
  - başlık yoksa normal operatör varsayılan kapsam kümesine geri düşer
  - yalnızca çağıran açıkça kapsamları daraltır ve `operator.admin` alanını atlarsa sahip semantiğini kaybeder

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

- `tool` (string, gerekli): çağrılacak araç adı.
- `action` (string, isteğe bağlı): araç şeması `action` destekliyorsa ve args payload'u bunu atladıysa args içine eşlenir.
- `args` (object, isteğe bağlı): araca özgü argümanlar.
- `sessionKey` (string, isteğe bağlı): hedef oturum anahtarı. Atlanırsa veya `"main"` ise Gateway yapılandırılmış ana oturum anahtarını kullanır (`session.mainKey` ve varsayılan agent'i veya global kapsamda `global` değerini dikkate alır).
- `dryRun` (boolean, isteğe bağlı): gelecekte kullanım için ayrılmıştır; şu anda yok sayılır.

## İlke + yönlendirme davranışı

Araç kullanılabilirliği, Gateway agent'lerinin kullandığı aynı ilke zinciri üzerinden filtrelenir:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- grup ilkeleri (oturum anahtarı bir gruba veya kanala eşleniyorsa)
- alt agent ilkesi (bir alt agent oturum anahtarı ile çağrıldığında)

Bir araca ilke tarafından izin verilmiyorsa uç nokta **404** döndürür.

Önemli sınır notları:

- Exec onayları, bu HTTP uç noktası için ayrı bir yetkilendirme sınırı değil, operatör koruma korkuluklarıdır. Bir araca Gateway auth + araç ilkesi üzerinden buradan erişilebiliyorsa `/tools/invoke` çağrı başına ek onay istemi eklemez.
- Gateway bearer kimlik bilgilerini güvenilmeyen çağıranlarla paylaşmayın. Güven sınırları arasında ayrım gerekiyorsa ayrı Gateway'ler çalıştırın (ve tercihen ayrı OS kullanıcıları/host'lar kullanın).

Gateway HTTP ayrıca varsayılan olarak katı bir deny list de uygular (oturum ilkesi araca izin verse bile):

- `exec` — doğrudan komut yürütme (RCE yüzeyi)
- `spawn` — rastgele alt süreç oluşturma (RCE yüzeyi)
- `shell` — shell komutu yürütme (RCE yüzeyi)
- `fs_write` — host üzerinde rastgele dosya değiştirme
- `fs_delete` — host üzerinde rastgele dosya silme
- `fs_move` — host üzerinde rastgele dosya taşıma/yeniden adlandırma
- `apply_patch` — patch uygulama rastgele dosyaları yeniden yazabilir
- `sessions_spawn` — oturum orkestrasyonu; uzaktan agent başlatmak RCE'dir
- `sessions_send` — oturumlar arası mesaj enjeksiyonu
- `cron` — kalıcı otomasyon kontrol düzlemi
- `gateway` — Gateway kontrol düzlemi; HTTP üzerinden yeniden yapılandırmayı engeller
- `nodes` — Node komut iletimi eşleştirilmiş hostlarda system.run erişebilir
- `whatsapp_login` — terminalde QR taraması gerektiren etkileşimli kurulum; HTTP üzerinde takılır

Bu deny list'i `gateway.tools` ile özelleştirebilirsiniz:

```json5
{
  gateway: {
    tools: {
      // HTTP /tools/invoke üzerinden engellenecek ek araçlar
      deny: ["browser"],
      // Varsayılan deny list'ten çıkarılacak araçlar
      allow: ["gateway"],
    },
  },
}
```

Grup ilkelerinin bağlamı çözümlemesine yardımcı olmak için isteğe bağlı olarak şunları ayarlayabilirsiniz:

- `x-openclaw-message-channel: <channel>` (örnek: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (birden fazla hesap varsa)

## Yanıtlar

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (geçersiz istek veya araç girdi hatası)
- `401` → yetkisiz
- `429` → auth hız sınırına takıldı (`Retry-After` ayarlanır)
- `404` → araç kullanılamıyor (bulunamadı veya allowlist'te değil)
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

- [Gateway protocol](/tr/gateway/protocol)
- [Tools and plugins](/tr/tools)
