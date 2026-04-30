---
read_when:
    - Tam bir ajan turu çalıştırmadan araçları çağırma
    - Araç politikası uygulaması gerektiren otomasyonlar oluşturma
summary: Gateway HTTP uç noktası üzerinden tek bir aracı doğrudan çağırın
title: Araçlar API'yi çağırır
x-i18n:
    generated_at: "2026-04-30T09:25:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ba20b7471de76e7f6bccc4d7a3d72c00d9d7b9843ad4e74825685c992a33f1a
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

# Araç Çağırma (HTTP)

OpenClaw’ın Gateway’i, tek bir aracı doğrudan çağırmak için basit bir HTTP uç noktası sunar. Her zaman etkindir ve Gateway kimlik doğrulaması ile araç politikasını kullanır. OpenAI uyumlu `/v1/*` yüzeyinde olduğu gibi, paylaşılan gizli bearer kimlik doğrulaması tüm Gateway için güvenilir operatör erişimi olarak değerlendirilir.

- `POST /tools/invoke`
- Gateway ile aynı port (WS + HTTP çoklama): `http://<gateway-host>:<port>/tools/invoke`

Varsayılan azami yük boyutu 2 MB’dir.

## Kimlik doğrulama

Gateway kimlik doğrulama yapılandırmasını kullanır.

Yaygın HTTP kimlik doğrulama yolları:

- paylaşılan gizli kimlik doğrulaması (`gateway.auth.mode="token"` veya `"password"`):
  `Authorization: Bearer <token-or-password>`
- güvenilir kimlik taşıyan HTTP kimlik doğrulaması (`gateway.auth.mode="trusted-proxy"`):
  yapılandırılmış kimlik farkındalığı olan proxy üzerinden yönlendirin ve gerekli
  kimlik başlıklarını eklemesine izin verin
- özel giriş açık kimlik doğrulaması (`gateway.auth.mode="none"`):
  kimlik doğrulama başlığı gerekmez

Notlar:

- `gateway.auth.mode="token"` olduğunda `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`) kullanın.
- `gateway.auth.mode="password"` olduğunda `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) kullanın.
- `gateway.auth.mode="trusted-proxy"` olduğunda HTTP isteği yapılandırılmış
  güvenilir bir proxy kaynağından gelmelidir; aynı ana makine local loopback proxy’leri açıkça
  `gateway.auth.trustedProxy.allowLoopback = true` gerektirir.
- `gateway.auth.rateLimit` yapılandırılmışsa ve çok fazla kimlik doğrulama hatası oluşursa uç nokta `Retry-After` ile `429` döndürür.

## Güvenlik sınırı (önemli)

Bu uç noktayı Gateway örneği için **tam operatör erişimi** yüzeyi olarak ele alın.

- Buradaki HTTP bearer kimlik doğrulaması dar bir kullanıcı başına kapsam modeli değildir.
- Bu uç nokta için geçerli bir Gateway token/parolası, sahip/operatör kimlik bilgisi gibi ele alınmalıdır.
- Paylaşılan gizli kimlik doğrulama modlarında (`token` ve `password`), çağıran daha dar bir `x-openclaw-scopes` başlığı gönderse bile uç nokta normal tam operatör varsayılanlarını geri yükler.
- Paylaşılan gizli kimlik doğrulaması, bu uç noktadaki doğrudan araç çağrılarını da sahip-gönderen turları olarak değerlendirir.
- Güvenilir kimlik taşıyan HTTP modları (örneğin güvenilir proxy kimlik doğrulaması veya özel girişte `gateway.auth.mode="none"`) mevcut olduğunda `x-openclaw-scopes` değerine uyar, aksi halde normal operatör varsayılan kapsam kümesine geri döner.
- Bu uç noktayı yalnızca loopback/tailnet/özel giriş üzerinde tutun; doğrudan genel internete açmayın.

Kimlik doğrulama matrisi:

- `gateway.auth.mode="token"` veya `"password"` + `Authorization: Bearer ...`
  - paylaşılan Gateway operatör sırrına sahip olunduğunu kanıtlar
  - daha dar `x-openclaw-scopes` değerlerini yok sayar
  - tam varsayılan operatör kapsam kümesini geri yükler:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - bu uç noktadaki doğrudan araç çağrılarını sahip-gönderen turları olarak değerlendirir
- güvenilir kimlik taşıyan HTTP modları (örneğin güvenilir proxy kimlik doğrulaması veya özel girişte `gateway.auth.mode="none"`)
  - dıştaki güvenilir bir kimliği veya dağıtım sınırını kimlik doğrulamasından geçirir
  - başlık mevcut olduğunda `x-openclaw-scopes` değerine uyar
  - başlık yoksa normal operatör varsayılan kapsam kümesine geri döner
  - yalnızca çağıran kapsamları açıkça daraltıp `operator.admin` değerini atladığında sahip anlamını kaybeder

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
- `action` (string, isteğe bağlı): araç şeması `action` değerini destekliyorsa ve args yükü bunu atlamışsa args içine eşlenir.
- `args` (object, isteğe bağlı): araca özgü bağımsız değişkenler.
- `sessionKey` (string, isteğe bağlı): hedef oturum anahtarı. Atlanırsa veya `"main"` ise Gateway yapılandırılmış ana oturum anahtarını kullanır (`session.mainKey` ve varsayılan aracıya uyar, ya da global kapsamda `global`).
- `dryRun` (boolean, isteğe bağlı): gelecekte kullanım için ayrılmıştır; şu anda yok sayılır.

## Politika + yönlendirme davranışı

Araç kullanılabilirliği, Gateway aracıları tarafından kullanılan aynı politika zinciri üzerinden filtrelenir:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- grup politikaları (oturum anahtarı bir gruba veya kanala eşleniyorsa)
- alt aracı politikası (alt aracı oturum anahtarıyla çağrıldığında)

Bir araca politika tarafından izin verilmiyorsa uç nokta **404** döndürür.

Önemli sınır notları:

- Exec onayları, bu HTTP uç noktası için ayrı bir yetkilendirme sınırı değil, operatör koruma raylarıdır. Bir araca burada Gateway kimlik doğrulaması + araç politikası üzerinden erişilebiliyorsa `/tools/invoke` çağrı başına ek bir onay istemi eklemez.
- Gateway bearer kimlik bilgilerini güvenilmeyen çağıranlarla paylaşmayın. Güven sınırları arasında ayrım gerekiyorsa ayrı gateway’ler (ve ideal olarak ayrı işletim sistemi kullanıcıları/ana makineleri) çalıştırın.

Gateway HTTP ayrıca varsayılan olarak katı bir engelleme listesi uygular (oturum politikası araca izin verse bile):

- `exec` — doğrudan komut yürütme (RCE yüzeyi)
- `spawn` — rastgele alt süreç oluşturma (RCE yüzeyi)
- `shell` — kabuk komutu yürütme (RCE yüzeyi)
- `fs_write` — ana makinede rastgele dosya değişikliği
- `fs_delete` — ana makinede rastgele dosya silme
- `fs_move` — ana makinede rastgele dosya taşıma/yeniden adlandırma
- `apply_patch` — yama uygulama rastgele dosyaları yeniden yazabilir
- `sessions_spawn` — oturum orkestrasyonu; uzaktan aracı başlatma RCE’dir
- `sessions_send` — oturumlar arası mesaj ekleme
- `cron` — kalıcı otomasyon kontrol düzlemi
- `gateway` — Gateway kontrol düzlemi; HTTP üzerinden yeniden yapılandırmayı engeller
- `nodes` — Node komut aktarma, eşleştirilmiş ana makinelerde system.run’a erişebilir
- `whatsapp_login` — terminal QR taraması gerektiren etkileşimli kurulum; HTTP’de takılı kalır

Bu engelleme listesini `gateway.tools` aracılığıyla özelleştirebilirsiniz:

```json5
{
  gateway: {
    tools: {
      // HTTP /tools/invoke üzerinden engellenecek ek araçlar
      deny: ["browser"],
      // Varsayılan engelleme listesinden araçları kaldır
      allow: ["gateway"],
    },
  },
}
```

Grup politikalarının bağlamı çözmesine yardımcı olmak için isteğe bağlı olarak şunları ayarlayabilirsiniz:

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
- [Araçlar ve Plugin’ler](/tr/tools)
