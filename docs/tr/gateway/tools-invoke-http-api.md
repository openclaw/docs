---
read_when:
    - Tam bir aracı turu çalıştırmadan araç çağırma
    - Araç ilkesi zorlamasına ihtiyaç duyan otomasyonlar oluşturma
summary: Gateway HTTP uç noktası üzerinden doğrudan tek bir araç çağırın
title: Tools Invoke API
x-i18n:
    generated_at: "2026-04-05T13:54:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: e924f257ba50b25dea0ec4c3f9eed4c8cac8a53ddef18215f87ac7de330a37fd
    source_path: gateway/tools-invoke-http-api.md
    workflow: 15
---

# Tools Invoke (HTTP)

OpenClaw'ın Gateway'i, doğrudan tek bir aracı çağırmak için basit bir HTTP uç noktası sunar. Her zaman etkindir ve Gateway auth ile araç ilkesini kullanır. OpenAI uyumlu `/v1/*` yüzeyi gibi, paylaşılan gizli bearer auth bu gateway'in tamamı için güvenilir operatör erişimi olarak değerlendirilir.

- `POST /tools/invoke`
- Gateway ile aynı port (WS + HTTP çoklama): `http://<gateway-host>:<port>/tools/invoke`

Varsayılan en büyük payload boyutu 2 MB'tır.

## Kimlik doğrulama

Gateway auth yapılandırmasını kullanır.

Yaygın HTTP auth yolları:

- paylaşılan gizli auth (`gateway.auth.mode="token"` veya `"password"`):
  `Authorization: Bearer <token-or-password>`
- güvenilir kimlik taşıyan HTTP auth (`gateway.auth.mode="trusted-proxy"`):
  yapılandırılmış kimlik farkında proxy üzerinden yönlendirin ve gerekli
  kimlik üstbilgilerini onun eklemesine izin verin
- özel girişte açık auth (`gateway.auth.mode="none"`):
  auth üstbilgisi gerekmez

Notlar:

- `gateway.auth.mode="token"` olduğunda `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`) kullanın.
- `gateway.auth.mode="password"` olduğunda `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) kullanın.
- `gateway.auth.mode="trusted-proxy"` olduğunda HTTP isteği, yapılandırılmış
  loopback olmayan güvenilir bir proxy kaynağından gelmelidir; aynı ana makinedeki loopback proxy'leri
  bu modu karşılamaz.
- `gateway.auth.rateLimit` yapılandırılmışsa ve çok fazla auth hatası oluşursa uç nokta `Retry-After` ile birlikte `429` döndürür.

## Güvenlik sınırı (önemli)

Bu uç noktayı, gateway örneği için **tam operatör erişimi** sağlayan bir yüzey olarak değerlendirin.

- Buradaki HTTP bearer auth dar kapsamlı kullanıcı başına bir model değildir.
- Bu uç nokta için geçerli bir Gateway token/password değeri sahip/operatör kimlik bilgisi gibi değerlendirilmelidir.
- Paylaşılan gizli auth modlarında (`token` ve `password`), çağıran daha dar bir `x-openclaw-scopes` üstbilgisi gönderse bile uç nokta normal tam operatör varsayılanlarını geri yükler.
- Paylaşılan gizli auth ayrıca bu uç noktadaki doğrudan araç çağrılarını owner-sender turu olarak değerlendirir.
- Güvenilir kimlik taşıyan HTTP modları (örneğin trusted proxy auth veya özel girişte `gateway.auth.mode="none"`) varsa `x-openclaw-scopes` üstbilgisini uygular, yoksa normal operatör varsayılan kapsam kümesine geri döner.
- Bu uç noktayı yalnızca loopback/tailnet/özel girişte tutun; doğrudan genel internete açmayın.

Auth matrisi:

- `gateway.auth.mode="token"` veya `"password"` + `Authorization: Bearer ...`
  - paylaşılan gateway operatör gizli verisine sahip olunduğunu kanıtlar
  - daha dar `x-openclaw-scopes` değerlerini yok sayar
  - tam varsayılan operatör kapsam kümesini geri yükler:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - bu uç noktadaki doğrudan araç çağrılarını owner-sender turu olarak değerlendirir
- güvenilir kimlik taşıyan HTTP modları (örneğin trusted proxy auth veya özel girişte `gateway.auth.mode="none"`)
  - bazı dış güvenilir kimlik veya dağıtım sınırlarını doğrular
  - üstbilgi mevcut olduğunda `x-openclaw-scopes` değerini uygular
  - üstbilgi yoksa normal operatör varsayılan kapsam kümesine geri döner
  - yalnızca çağıran kapsamları açıkça daraltıp `operator.admin` değerini atladığında owner anlamını kaybeder

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
- `action` (string, isteğe bağlı): araç şeması `action` alanını destekliyorsa ve args payload'ı bunu atladıysa args içine eşlenir.
- `args` (object, isteğe bağlı): araca özgü bağımsız değişkenler.
- `sessionKey` (string, isteğe bağlı): hedef oturum anahtarı. Atlanırsa veya `"main"` ise Gateway yapılandırılmış ana oturum anahtarını kullanır (`session.mainKey` ve varsayılan aracıyı veya global kapsamda `global` değerini dikkate alır).
- `dryRun` (boolean, isteğe bağlı): gelecekte kullanım için ayrılmıştır; şu anda yok sayılır.

## İlke + yönlendirme davranışı

Araç kullanılabilirliği, Gateway aracıları tarafından kullanılan aynı ilke zinciri üzerinden filtrelenir:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- grup ilkeleri (oturum anahtarı bir gruba veya kanala eşleniyorsa)
- alt aracı ilkesi (bir subagent oturum anahtarı ile çağrılıyorsa)

Bir araca ilke gereği izin verilmiyorsa uç nokta **404** döndürür.

Önemli sınır notları:

- Exec onayları, bu HTTP uç noktası için ayrı bir yetkilendirme sınırı değil, operatör korkuluklarıdır. Bir araca burada Gateway auth + araç ilkesi aracılığıyla erişilebiliyorsa `/tools/invoke`, çağrı başına ek bir onay istemi eklemez.
- Gateway bearer kimlik bilgilerini güvenilmeyen çağıranlarla paylaşmayın. Güven sınırları arasında ayrım gerekiyorsa ayrı gateway'ler çalıştırın (ve ideal olarak ayrı OS kullanıcıları/ana makineler).

Gateway HTTP ayrıca varsayılan olarak katı bir deny list uygular (oturum ilkesi araca izin verse bile):

- `exec` — doğrudan komut yürütme (RCE yüzeyi)
- `spawn` — keyfi alt süreç oluşturma (RCE yüzeyi)
- `shell` — shell komutu yürütme (RCE yüzeyi)
- `fs_write` — ana makinede keyfi dosya değiştirme
- `fs_delete` — ana makinede keyfi dosya silme
- `fs_move` — ana makinede keyfi dosya taşıma/yeniden adlandırma
- `apply_patch` — yama uygulama keyfi dosyaları yeniden yazabilir
- `sessions_spawn` — oturum orkestrasyonu; uzaktan aracı başlatmak RCE'dir
- `sessions_send` — oturumlar arası mesaj enjeksiyonu
- `cron` — kalıcı otomasyon kontrol düzlemi
- `gateway` — gateway kontrol düzlemi; HTTP üzerinden yeniden yapılandırmayı önler
- `nodes` — node komut aktarma paired ana makinelerde system.run işlevine ulaşabilir
- `whatsapp_login` — terminalde QR taraması gerektiren etkileşimli kurulum; HTTP üzerinde takılır

Bu deny list'i `gateway.tools` ile özelleştirebilirsiniz:

```json5
{
  gateway: {
    tools: {
      // HTTP /tools/invoke üzerinden engellenecek ek araçlar
      deny: ["browser"],
      // Varsayılan deny list içinden araç kaldır
      allow: ["gateway"],
    },
  },
}
```

Grup ilkelerinin bağlamı çözmesine yardımcı olmak için isteğe bağlı olarak şunları ayarlayabilirsiniz:

- `x-openclaw-message-channel: <channel>` (örnek: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (birden fazla hesap varsa)

## Yanıtlar

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (geçersiz istek veya araç girdisi hatası)
- `401` → yetkisiz
- `429` → auth hız sınırına takıldı (`Retry-After` ayarlıdır)
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
