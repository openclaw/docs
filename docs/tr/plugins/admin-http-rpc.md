---
read_when:
    - Gateway WebSocket RPC istemcisini kullanamayan ana makine araçları oluşturma
    - Gateway yönetim otomasyonunu özel ve güvenilir bir giriş noktasının arkasından erişime açma
    - Gateway yöntemlerine HTTP erişimi için güvenlik modelinin denetlenmesi
summary: Seçili Gateway kontrol düzlemi yöntemlerini, paketle birlikte sunulan ve isteğe bağlı olarak etkinleştirilen admin-http-rpc Plugin’i üzerinden kullanıma açın
title: Yönetici HTTP RPC Plugin'i
x-i18n:
    generated_at: "2026-07-12T12:30:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0709081efd0ce65cef7edac54df9a71978cbad17e2b25df83ac9075de938376c
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

Paketle birlikte gelen `admin-http-rpc` Plugin'i, Gateway WebSocket bağlantısını açık tutamayan güvenilir ana makine otomasyonları için izin listesindeki bir Gateway denetim düzlemi yöntemi kümesini HTTP üzerinden sunar.

OpenClaw ile birlikte gelir ancak varsayılan olarak devre dışıdır; devre dışıyken rota kaydedilmez. Etkinleştirildiğinde Gateway ile aynı dinleyiciye `POST /api/v1/admin/rpc` rotasını ekler (`http://<gateway-host>:<port>/api/v1/admin/rpc`).

Bunu yalnızca özel ana makine araçları, tailnet otomasyonu veya güvenilir bir dahili giriş için etkinleştirin. Bu rotayı hiçbir zaman doğrudan genel internete açmayın.

## Etkinleştirmeden önce

Yönetici HTTP RPC, tam bir operatör denetim düzlemi yüzeyidir: Gateway HTTP kimlik doğrulamasını geçen her çağıran, aşağıdaki izin listesindeki yöntemleri çalıştırabilir. Yalnızca şu koşulların tümü karşılandığında etkinleştirin:

- Çağıranın Gateway'i işletmesine güveniliyor.
- Çağıran WebSocket RPC istemcisini kullanamıyor.
- Rotaya yalnızca geri döngü, bir tailnet veya özel ve kimliği doğrulanmış bir giriş üzerinden erişilebiliyor.
- İzin verilen yöntemleri incelediniz ve bunlar çalıştırmayı planladığınız otomasyonla eşleşiyor.

Gateway WebSocket bağlantısını açık tutabilen OpenClaw istemcileri ve etkileşimli araçlar için bunun yerine WebSocket RPC kullanın.

## Etkinleştirme

Paketle birlikte gelen Plugin'i etkinleştirin:

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="Yapılandırma">
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

Rota, Plugin başlatılırken kaydedilir; bu nedenle Plugin yapılandırmasını değiştirdikten sonra Gateway'i yeniden başlatın.

HTTP yüzeyine artık ihtiyacınız kalmadığında devre dışı bırakın:

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## Rotayı doğrulama

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

Plugin devre dışıyken rota kaydedilmediği için `404` döndürür.

## Kimlik doğrulama

Plugin rotası Gateway HTTP kimlik doğrulamasını kullanır.

Yaygın kimlik doğrulama yolları:

- paylaşılan gizli bilgi kimlik doğrulaması (`gateway.auth.mode="token"` veya `"password"`): `Authorization: Bearer <token-or-password>`
- güvenilir, kimlik bilgisi taşıyan HTTP kimlik doğrulaması (`gateway.auth.mode="trusted-proxy"`): isteği yapılandırılmış kimlik farkındalıklı proxy üzerinden yönlendirin ve gerekli kimlik başlıklarını eklemesini sağlayın
- özel girişte açık kimlik doğrulama (`gateway.auth.mode="none"`): kimlik doğrulama başlığı gerekmez

## Güvenlik modeli

Bu Plugin'i tam bir Gateway operatör yüzeyi olarak değerlendirin.

- Plugin'in etkinleştirilmesi, izin listesindeki yönetici RPC yöntemlerine `/api/v1/admin/rpc` üzerinden erişimi bilinçli olarak açar.
- Plugin, ayrılmış `contracts.gatewayMethodDispatch: ["authenticated-request"]` manifest sözleşmesini bildirir; bu sözleşme, Gateway tarafından kimliği doğrulanmış HTTP rotasının denetim düzlemi yöntemlerini süreç içinde yönlendirebilmesini sağlar. Bu bir korumalı alan değildir: sözleşme, ayrılmış SDK yardımcılarının yanlışlıkla kullanılmasını önler ancak güvenilir Plugin'ler yine de Gateway sürecinde çalışır.
- Paylaşılan gizli bilgi taşıyıcı kimlik doğrulaması (`token`/`password` modları), Gateway operatör gizli bilgisinin elde bulundurulduğunu kanıtlar; bu yolda daha dar kapsamlı `x-openclaw-scopes` başlıkları yok sayılır ve normal tam operatör varsayılanları geri yüklenir.
- Güvenilir, kimlik bilgisi taşıyan HTTP kimlik doğrulaması (`trusted-proxy` modu), mevcut olduğunda `x-openclaw-scopes` değerini dikkate alır.
- `gateway.auth.mode="none"`, Plugin etkinse bu rotanın kimlik doğrulamasız olduğu anlamına gelir. Bunu yalnızca tamamen güvendiğiniz özel bir girişin arkasında kullanın.
- İstekler, Plugin rotasının kimlik doğrulamasını geçtikten sonra WebSocket RPC ile aynı Gateway yöntem işleyicileri ve kapsam denetimleri üzerinden yönlendirilir.
- Rota, hazırlanmış bir askıya alma kiralaması sırasında erişilebilir kalır. Sınırlı istek doğrulaması ve yerel `commands.list` keşif yanıtı kullanılabilir olmaya devam eder. Gateway'e yönlendirilen yöntemlerden yalnızca `gateway.suspend.prepare`, `gateway.suspend.status` ve `gateway.suspend.resume`, kabul kapalıyken çalışabilir; izin listesindeki diğer yöntemler normal, yeniden denenebilir Gateway `UNAVAILABLE` yanıtını döndürür.
- Bu rotayı geri döngü, tailnet veya özel ve güvenilir bir giriş üzerinde tutun. Doğrudan genel internete açmayın. Çağıranlar güven sınırlarını aşıyorsa ayrı Gateway'ler kullanın.

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

- `id` (dize, isteğe bağlı): yanıta kopyalanır. Belirtilmediğinde bir UUID oluşturulur.
- `method` (dize, zorunlu): izin verilen Gateway yönteminin adı.
- `params` (herhangi bir tür, isteğe bağlı): yönteme özgü parametreler.

Varsayılan azami istek gövdesi boyutu 1 MB'dir.

## Yanıt

Başarılı yanıtlar Gateway RPC biçimini kullanır:

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Gateway yöntem hataları şu biçimi kullanır:

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

HTTP durumu hata koduna göre belirlenir:

| Hata kodu                  | HTTP durumu |
| -------------------------- | ----------- |
| `INVALID_REQUEST`          | 400         |
| `APPROVAL_NOT_FOUND`       | 404         |
| `NOT_LINKED`, `NOT_PAIRED` | 409         |
| `UNAVAILABLE`              | 503         |
| `AGENT_TIMEOUT`            | 504         |
| diğer tüm kodlar           | 500         |

## İzin verilen yöntemler

- keşif: `commands.list`
  Bu Plugin tarafından izin verilen HTTP RPC yöntem adlarını döndürür.
- Gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`, `gateway.suspend.prepare`, `gateway.suspend.status`, `gateway.suspend.resume`
- yapılandırma: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- kanallar: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- web: `web.login.start`, `web.login.wait`
- modeller: `models.list`, `models.authStatus`
- aracılar: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- onaylar: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- Cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- cihazlar: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- Node'lar: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- görevler: `tasks.list`, `tasks.get`, `tasks.cancel`
- tanılama: `doctor.memory.status`, `update.status`

Diğer Gateway yöntemleri, bilinçli olarak eklenene kadar engellenir.

## WebSocket karşılaştırması

Normal Gateway WebSocket RPC yolu, OpenClaw istemcileri için tercih edilen denetim düzlemi API'si olmaya devam eder. Yönetici HTTP RPC'yi yalnızca istek/yanıt tabanlı bir HTTP yüzeyine ihtiyaç duyan ana makine araçları için kullanın.

Güvenilir bir cihaz kimliği olmayan, paylaşılan token kullanan WebSocket istemcileri bağlantı sırasında yönetici kapsamlarını kendileri bildiremez. Yönetici HTTP RPC, mevcut güvenilir HTTP operatör modelini bilinçli olarak izler: Plugin etkinleştirildiğinde, paylaşılan gizli bilgi taşıyıcı kimlik doğrulaması bu yönetici yüzeyi için tam operatör erişimi olarak değerlendirilir.

## Sorun giderme

`404 Not Found`

: Plugin devre dışıdır, etkinleştirildikten sonra Gateway yeniden başlatılmamıştır veya istek farklı bir Gateway sürecine gönderiliyordur.

`401 Unauthorized`

: İstek Gateway HTTP kimlik doğrulamasını karşılamamıştır. Taşıyıcı token'ı veya trusted-proxy kimlik başlıklarını denetleyin.

`405 Method Not Allowed`

: İstek `POST` dışında bir yöntem kullanmıştır.

`413 Payload Too Large`

: İstek gövdesi 1 MB sınırını aşmıştır.

`400 INVALID_REQUEST`

: İstek gövdesi geçerli JSON değildir, `method` alanı eksiktir, yöntem Plugin izin listesinde değildir veya askıya alma devam ettirme kimliği etkin kiralamayla eşleşmiyordur.

`503 UNAVAILABLE`

: Gateway yöntemi başlatılıyordur, hız sınırına takılmıştır, askıya alınmıştır veya çakışan bir askıya alma/devam ettirme işlemini bekliyordur. Mevcut olduğunda `error.details` alanını inceleyin ve yeniden denemeden önce `error.retryAfterMs` değerine uyun.

## İlgili konular

- [Operatör kapsamları](/tr/gateway/operator-scopes)
- [Gateway güvenliği](/tr/gateway/security)
- [Uzaktan erişim](/tr/gateway/remote)
- [Plugin manifesti](/tr/plugins/manifest#contracts-reference)
- [SDK alt yolları](/tr/plugins/sdk-subpaths)
