---
read_when:
    - Gateway WebSocket RPC istemcisini kullanamayan ana makine araçları oluşturma
    - Güvenilir özel bir girişin arkasında Gateway yönetici otomasyonunu açığa çıkarma
    - Gateway yöntemlerine HTTP erişimi için güvenlik modelinin denetlenmesi
summary: Seçili Gateway kontrol düzlemi yöntemlerini paketle birlikte gelen, isteğe bağlı admin-http-rpc plugin’i üzerinden kullanıma açın
title: Yönetici HTTP RPC plugin
x-i18n:
    generated_at: "2026-06-28T00:50:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f701ef6be7457cd518ecb80b7ec5dade61bb057d62f4ca90984a4c1aa8fdf700
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

Birlikte gelen `admin-http-rpc` Plugin'i, normal Gateway WebSocket RPC istemcisini kullanamayan güvenilir ana makine otomasyonu için seçili Gateway denetim düzlemi yöntemlerini HTTP üzerinden sunar.

Plugin, OpenClaw ile birlikte gelir, ancak varsayılan olarak kapalıdır. Devre dışıyken rota kaydedilmez. Etkinleştirildiğinde şunları ekler:

- `POST /api/v1/admin/rpc`
- Gateway ile aynı dinleyici: `http://<gateway-host>:<port>/api/v1/admin/rpc`

Bunu yalnızca özel ana makine araçları, tailnet otomasyonu veya güvenilir bir dahili giriş için etkinleştirin. Bu rotayı doğrudan herkese açık internete açmayın.

## Etkinleştirmeden önce

Admin HTTP RPC tam bir operatör denetim düzlemi yüzeyidir. Gateway HTTP kimlik doğrulamasından geçen herhangi bir çağıran, bu sayfadaki izin listesindeki yöntemleri çağırabilir.

Bunu yalnızca şunların tümü doğruysa kullanın:

- Çağıranın Gateway'i işletmek için güvenilir olması.
- Çağıranın WebSocket RPC istemcisini kullanamaması.
- Rotanın yalnızca loopback, bir tailnet veya özel kimliği doğrulanmış bir giriş üzerinden erişilebilir olması.
- İzin verilen yöntemleri gözden geçirmiş olmanız ve bunların çalıştırmayı planladığınız otomasyonla eşleşmesi.

OpenClaw istemcileri ve Gateway WebSocket bağlantısını açık tutabilen etkileşimli araçlar için WebSocket RPC yolunu kullanın.

## Etkinleştir

Birlikte gelen Plugin'i etkinleştirin:

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="Config">
    ```json5
    {
      plugins: {
        entries: {
          "admin-http-rpc": { enabled: true },
        },
      },
    }
    ```
  </Tab>
</Tabs>

Rota, Plugin başlatma sırasında kaydedilir. Plugin yapılandırmasını değiştirdikten sonra Gateway'i yeniden başlatın.

HTTP yüzeyine artık ihtiyacınız olmadığında devre dışı bırakın:

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## Rotayı doğrula

En küçük güvenli istek olarak `health` kullanın:

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

Başarılı bir yanıtta `ok: true` bulunur:

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

Plugin devre dışıyken rota kayıtlı olmadığı için `404` döndürür.

## Kimlik doğrulama

Plugin rotası Gateway HTTP kimlik doğrulamasını kullanır.

Yaygın kimlik doğrulama yolları:

- paylaşılan gizli anahtar kimlik doğrulaması (`gateway.auth.mode="token"` veya `"password"`): `Authorization: Bearer <token-or-password>`
- güvenilir kimlik taşıyan HTTP kimlik doğrulaması (`gateway.auth.mode="trusted-proxy"`): yapılandırılmış kimlik farkındalıklı proxy üzerinden yönlendirin ve gerekli kimlik başlıklarını eklemesine izin verin
- özel giriş açık kimlik doğrulaması (`gateway.auth.mode="none"`): kimlik doğrulama başlığı gerekmez

## Güvenlik modeli

Bu Plugin'i tam bir Gateway operatör yüzeyi olarak ele alın.

- Plugin'i etkinleştirmek, `/api/v1/admin/rpc` adresindeki izin listesindeki admin RPC yöntemlerine kasıtlı olarak erişim sunar.
- Plugin, Gateway kimliği doğrulanmış HTTP rotasının denetim düzlemi yöntemlerini süreç içinde yönlendirebilmesi için ayrılmış `contracts.gatewayMethodDispatch: ["authenticated-request"]` manifest sözleşmesini bildirir.
- Paylaşılan gizli bearer kimlik doğrulaması, gateway operatör gizli anahtarına sahip olunduğunu kanıtlar.
- `token` ve `password` kimlik doğrulaması için daha dar `x-openclaw-scopes` başlıkları yok sayılır ve normal tam operatör varsayılanları geri yüklenir.
- Güvenilir kimlik taşıyan HTTP modları, mevcut olduğunda `x-openclaw-scopes` değerlerine uyar.
- `gateway.auth.mode="none"`, Plugin etkinse bu rotanın kimlik doğrulamasız olduğu anlamına gelir. Bunu yalnızca tamamen güvendiğiniz özel bir girişin arkasında kullanın.
- İstekler, Plugin rota kimlik doğrulamasından geçtikten sonra WebSocket RPC ile aynı Gateway yöntem işleyicileri ve kapsam kontrolleri üzerinden yönlendirilir.
- Bu rotayı loopback, tailnet veya özel güvenilir bir giriş üzerinde tutun. Doğrudan herkese açık internete açmayın.
- Plugin manifest sözleşmeleri bir sandbox değildir. Ayrılmış SDK yardımcılarının yanlışlıkla kullanılmasını önlerler; güvenilir Plugin'ler yine de Gateway sürecinde çalışır.

Çağıranlar güven sınırlarını aştığında ayrı gateway'ler kullanın.

## İstek

```http
POST /api/v1/admin/rpc
Authorization: Bearer <gateway-token>
Content-Type: application/json
```

```json
{
  "id": "optional-request-id",
  "method": "health",
  "params": {}
}
```

Alanlar:

- `id` (dize, isteğe bağlı): yanıta kopyalanır. Atlandığında bir UUID oluşturulur.
- `method` (dize, zorunlu): izin verilen Gateway yöntem adı.
- `params` (herhangi biri, isteğe bağlı): yönteme özgü parametreler.

Varsayılan en büyük istek gövdesi boyutu 1 MB'dir.

## Yanıt

Başarılı yanıtlar Gateway RPC biçimini kullanır:

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Gateway yöntem hataları şunu kullanır:

```json
{
  "id": "optional-request-id",
  "ok": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "bad params"
  }
}
```

HTTP durumu, mümkün olduğunda Gateway hatasını izler. Örneğin, `INVALID_REQUEST` `400`, `UNAVAILABLE` ise `503` döndürür.

## İzin verilen yöntemler

- keşif: `commands.list`
  Bu Plugin tarafından izin verilen HTTP RPC yöntem adlarını döndürür.
- Gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`
- yapılandırma: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- kanallar: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- web: `web.login.start`, `web.login.wait`
- modeller: `models.list`, `models.authStatus`
- ajanlar: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- onaylar: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- Cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- cihazlar: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- düğümler: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- görevler: `tasks.list`, `tasks.get`, `tasks.cancel`
- tanılama: `doctor.memory.status`, `update.status`

Diğer Gateway yöntemleri, kasıtlı olarak eklenene kadar engellenir.

## WebSocket karşılaştırması

Normal Gateway WebSocket RPC yolu, OpenClaw istemcileri için tercih edilen denetim düzlemi API'si olmaya devam eder. Admin HTTP RPC'yi yalnızca istek/yanıt HTTP yüzeyine ihtiyaç duyan ana makine araçları için kullanın.

Güvenilir cihaz kimliği olmayan paylaşılan token WebSocket istemcileri, bağlanma sırasında admin kapsamlarını kendileri bildiremez. Admin HTTP RPC, mevcut güvenilir HTTP operatör modelini bilinçli olarak izler: Plugin etkinleştirildiğinde, paylaşılan gizli bearer kimlik doğrulaması bu admin yüzeyi için tam operatör erişimi olarak ele alınır.

## Sorun giderme

`404 Not Found`

: Plugin devre dışıdır, etkinleştirildikten sonra Gateway yeniden başlatılmamıştır veya istek farklı bir Gateway sürecine gidiyordur.

`401 Unauthorized`

: İstek Gateway HTTP kimlik doğrulamasını karşılamadı. Bearer token'ı veya trusted-proxy kimlik başlıklarını kontrol edin.

`400 INVALID_REQUEST`

: İstek gövdesi geçerli JSON değildir, `method` alanı eksiktir veya yöntem Plugin izin listesinde değildir.

`503 UNAVAILABLE`

: Gateway yöntem işleyicisi kullanılamıyor. Gateway günlüklerini kontrol edin ve Gateway başlatmayı bitirdikten sonra yeniden deneyin.

## İlgili

- [Operatör kapsamları](/tr/gateway/operator-scopes)
- [Gateway güvenliği](/tr/gateway/security)
- [Uzaktan erişim](/tr/gateway/remote)
- [Plugin manifesti](/tr/plugins/manifest#contracts)
- [SDK alt yolları](/tr/plugins/sdk-subpaths)
