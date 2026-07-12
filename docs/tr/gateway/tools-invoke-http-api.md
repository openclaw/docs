---
read_when:
    - Tam bir ajan turu çalıştırmadan araçları çağırma
    - Araç politikası uygulaması gerektiren otomasyonlar oluşturma
summary: Gateway HTTP uç noktası üzerinden tek bir aracı doğrudan çağırın
title: Araçlar API'yi çağırır
x-i18n:
    generated_at: "2026-07-12T12:20:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d07f765d63255e718d5e558b662589e77b2992538f43288cd83e6e3f2a06dda
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaw'ın Gateway'i, tek bir aracı doğrudan çağırmak için bir HTTP uç noktası sunar. Bu uç nokta her zaman etkindir ve Gateway kimlik doğrulamasının yanı sıra araç politikasını kullanır. OpenAI uyumlu `/v1/*` yüzeyinde olduğu gibi, paylaşılan gizli anahtara dayalı taşıyıcı kimlik doğrulaması, Gateway'in tamamı için güvenilir operatör erişimi olarak değerlendirilir.

- `POST /tools/invoke`
- Gateway ile aynı bağlantı noktası (WS + HTTP çoğullama): `http://<gateway-host>:<port>/tools/invoke`
- Varsayılan en yüksek istek gövdesi boyutu: 2 MB

## Kimlik doğrulama

Gateway kimlik doğrulama yapılandırmasını kullanır.

Yaygın HTTP kimlik doğrulama yolları:

- paylaşılan gizli anahtar kimlik doğrulaması (`gateway.auth.mode="token"` veya `"password"`): `Authorization: Bearer <token-or-password>`
- kimlik bilgisi taşıyan güvenilir HTTP kimlik doğrulaması (`gateway.auth.mode="trusted-proxy"`): isteği yapılandırılmış kimlik duyarlı proxy üzerinden yönlendirin ve gerekli kimlik üstbilgilerini eklemesini sağlayın
- özel girişte açık kimlik doğrulaması (`gateway.auth.mode="none"`): kimlik doğrulama üstbilgisi gerekmez

Notlar:

- `mode="token"`, `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`) kullanır.
- `mode="password"`, `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) kullanır.
- `mode="trusted-proxy"`, HTTP isteğinin yapılandırılmış güvenilir bir proxy kaynağından gelmesini gerektirir; aynı ana makinedeki local loopback proxy'ler için açıkça `gateway.auth.trustedProxy.allowLoopback = true` ayarlanmalıdır.
- Proxy'yi atlayan, aynı ana makinedeki dahili çağıranlar yerel doğrudan geri dönüş olarak `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` kullanabilir. Herhangi bir `Forwarded`, `X-Forwarded-*` veya `X-Real-IP` üstbilgisi kanıtı, isteğin bunun yerine güvenilir proxy yolunda kalmasını sağlar.
- `gateway.auth.rateLimit` yapılandırılmışsa ve çok fazla kimlik doğrulama hatası oluşursa uç nokta, `Retry-After` ile birlikte `429` döndürür.

## Güvenlik sınırı (önemli)

Bu uç noktayı, Gateway örneği için **tam operatör erişimi** sağlayan bir yüzey olarak değerlendirin.

- Buradaki HTTP taşıyıcı kimlik doğrulaması, kullanıcı başına dar kapsamlı bir model değildir.
- Bu uç nokta için geçerli bir Gateway belirteci/parolası, sahip/operatör kimlik bilgisi gibi değerlendirilmelidir.
- Paylaşılan gizli anahtar kimlik doğrulama modlarında (`token` ve `password`), çağıran daha dar bir `x-openclaw-scopes` üstbilgisi gönderse bile uç nokta normal tam operatör varsayılanlarını geri yükler.
- Paylaşılan gizli anahtar kimlik doğrulaması, bu uç noktadaki doğrudan araç çağrılarını da sahip-gönderen etkileşimleri olarak değerlendirir.
- Kimlik bilgisi taşıyan güvenilir HTTP modları (güvenilir proxy kimlik doğrulaması veya özel girişte `gateway.auth.mode="none"`), mevcut olduğunda `x-openclaw-scopes` üstbilgisini dikkate alır; aksi hâlde normal varsayılan operatör kapsamı kümesine geri döner.
- Bu uç noktayı yalnızca local loopback/tailnet/özel giriş üzerinde tutun; doğrudan genel internete açmayın.

Kimlik doğrulama matrisi:

| Kimlik doğrulama modu                                                                   | Davranış                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `token` veya `password` + `Authorization: Bearer ...`                                   | Paylaşılan Gateway operatör gizli anahtarına sahip olunduğunu kanıtlar. Daha dar `x-openclaw-scopes` değerlerini yok sayar. Tam varsayılan operatör kapsamı kümesini geri yükler: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Doğrudan araç çağrılarını sahip-gönderen etkileşimleri olarak değerlendirir. |
| Kimlik bilgisi taşıyan güvenilir HTTP (güvenilir proxy kimlik doğrulaması veya özel girişte `mode="none"`) | Dıştaki güvenilir bir kimliğin veya dağıtım sınırının kimliğini doğrular. Mevcut olduğunda `x-openclaw-scopes` üstbilgisini dikkate alır. Üstbilgi yoksa normal varsayılan operatör kapsamı kümesine geri döner. Sahip anlamını yalnızca çağıran kapsamları açıkça daraltıp `operator.admin` kapsamını dışarıda bıraktığında kaybeder. |

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

- `tool` / `name` (dize, zorunlu): çağrılacak aracın adı. Her ikisi de gönderilirse `name` önceliklidir.
- `action` (dize, isteğe bağlı): araç şeması bir `action` özelliğini destekliyorsa ve `args` içinde zaten ayarlanmamışsa `args.action` ile birleştirilir.
- `args` (nesne, isteğe bağlı): araca özgü bağımsız değişkenler.
- `sessionKey` (dize, isteğe bağlı): hedef oturum anahtarı. Belirtilmezse veya `"main"` ise Gateway, yapılandırılmış ana oturum anahtarını kullanır (`session.mainKey` ve varsayılan aracıyı ya da genel oturum kapsamında `global` değerini dikkate alır).
- `agentId` (dize, isteğe bağlı): ilgili aracı için oturum anahtarını çözümler. Zaten farklı bir aracıyla eşleşen açık bir `sessionKey` ile çakışırsa `400` hatası verir.
- `idempotencyKey` (dize, isteğe bağlı): çağrı için kararlı bir araç çağrısı kimliği türetmek amacıyla kullanılır.
- `dryRun` (boole, isteğe bağlı): ileride kullanılmak üzere ayrılmıştır; şu anda yok sayılır.

## Politika ve yönlendirme davranışı

Araç kullanılabilirliği, Gateway aracıları tarafından kullanılan aynı politika zinciri üzerinden filtrelenir:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- grup politikaları (oturum anahtarı bir grup veya kanalla eşleşiyorsa)
- alt aracı politikası (bir alt aracı oturum anahtarıyla çağrı yapıldığında)

Bir araca politika tarafından izin verilmiyorsa uç nokta **404** döndürür.

Önemli sınır notları:

- Exec onayları, bu HTTP uç noktası için ayrı bir yetkilendirme sınırı değil, operatör koruma önlemleridir. Bir araca burada Gateway kimlik doğrulaması ve araç politikası aracılığıyla erişilebiliyorsa `/tools/invoke`, çağrı başına ek bir onay istemi eklemez.
- `exec` aracına buradan erişilebiliyorsa bunu değişiklik yapan bir kabuk yüzeyi olarak değerlendirin. `write`, `edit`, `apply_patch` veya HTTP dosya sistemi yazma araçlarını reddetmek, kabuk yürütmesini salt okunur hâle getirmez.
- Gateway taşıyıcı kimlik bilgilerini güvenilmeyen çağıranlarla paylaşmayın. Güven sınırları arasında ayrım gerekiyorsa ayrı Gateway'ler çalıştırın (tercihen ayrı işletim sistemi kullanıcıları/ana makineleri üzerinde).

Gateway HTTP ayrıca varsayılan olarak kesin bir engelleme listesi uygular (oturum politikası araca izin verse bile):

| Araç             | Neden                                                     |
| ---------------- | --------------------------------------------------------- |
| `exec`           | Doğrudan komut yürütme (RCE yüzeyi)                       |
| `spawn`          | İsteğe bağlı alt süreç oluşturma (RCE yüzeyi)             |
| `shell`          | Kabuk komutu yürütme (RCE yüzeyi)                         |
| `fs_write`       | Ana makinede isteğe bağlı dosya değişikliği               |
| `fs_delete`      | Ana makinede isteğe bağlı dosya silme                     |
| `fs_move`        | Ana makinede isteğe bağlı dosya taşıma/yeniden adlandırma |
| `apply_patch`    | Yama uygulaması isteğe bağlı dosyaları yeniden yazabilir  |
| `sessions_spawn` | Oturum düzenleme; aracıların uzaktan başlatılması RCE'dir |
| `sessions_send`  | Oturumlar arası ileti ekleme                              |
| `cron`           | Kalıcı otomasyon denetim düzlemi                           |
| `gateway`        | Gateway denetim düzlemi; HTTP üzerinden yeniden yapılandırmayı önler |
| `nodes`          | Node komut aktarımı, eşleştirilmiş ana makinelerde `system.run` komutuna erişebilir |

`cron`, `gateway` ve `nodes` ayrıca yalnızca sahip içindir: bu varsayılan engelleme listesinin dışında olsalar bile sahip olmayan çağıranlar bunları bu yüzeyde çağıramaz.

Genel engelleme listesini `gateway.tools` üzerinden özelleştirin:

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

`gateway.tools.allow` bir erişime açma geçersiz kılmasıdır, kapsam yükseltmesi değildir. Kimlik bilgisi taşıyan HTTP modlarında `cron`, `gateway` ve `nodes`, `gateway.tools.allow` içinde listelenseler bile sahip/yönetici kimliği (`operator.admin`) olmayan çağıranlar tarafından kullanılamaz. Paylaşılan gizli anahtara dayalı taşıyıcı kimlik doğrulaması, yukarıdaki tam güvenilir operatör kuralını izlemeye devam eder.

Grup politikalarının bağlamı çözümlemesine yardımcı olmak için isteğe bağlı olarak şunları ayarlayabilirsiniz:

- `x-openclaw-message-channel: <channel>` (örnek: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (birden fazla hesap olduğunda)
- `x-openclaw-message-to: <target>` (ileti aracı politikası için teslimat hedefi)
- `x-openclaw-thread-id: <threadId>` (ileti aracı politikası için ileti dizisi bağlamı)

## Yanıtlar

| Durum | Anlam                                                                                          |
| ----- | ---------------------------------------------------------------------------------------------- |
| `200` | `{ ok: true, result }`                                                                         |
| `400` | `{ ok: false, error: { type, message } }` (geçersiz istek veya araç girdisi hatası)             |
| `401` | Yetkisiz                                                                                       |
| `403` | `{ ok: false, error: { type, message, requiresApproval? } }` (araç çağrısı politika tarafından engellendi) |
| `404` | Araç kullanılamıyor (bulunamadı veya izin listesinde değil)                                    |
| `405` | Yönteme izin verilmiyor                                                                        |
| `408` | İstek gövdesi okuma işlemi zaman aşımına uğradı                                                |
| `413` | İstek gövdesi en yüksek veri yükü boyutunu aştı                                                |
| `429` | Kimlik doğrulama hız sınırına takıldı (`Retry-After` ayarlandı)                                |
| `500` | `{ ok: false, error: { type, message } }` (beklenmeyen araç yürütme hatası; temizlenmiş ileti)   |

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
- [Araçlar ve Plugin'ler](/tr/tools)
