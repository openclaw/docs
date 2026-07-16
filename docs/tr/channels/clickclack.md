---
read_when:
    - OpenClaw'u bir ClickClack çalışma alanına bağlama
    - ClickClack bot kimliklerini test etme
summary: ClickClack bot belirteci kanal kurulumu ve hedef söz dizimi
title: ClickClack
x-i18n:
    generated_at: "2026-07-16T16:36:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c422664ecdc9e41eb1810ca61654b886f1c51357fb9f48054d30c20a86ea8bc
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack, OpenClaw'u birinci sınıf ClickClack bot belirteçleri aracılığıyla kendi sunucunuzda barındırılan bir ClickClack çalışma alanına bağlar.

Bir OpenClaw ajanının ClickClack bot kullanıcısı olarak görünmesini istediğinizde bunu kullanın. ClickClack, bağımsız hizmet botlarını ve kullanıcıya ait botları destekler; kullanıcıya ait botlar bir `owner_user_id` tutar ve yalnızca verdiğiniz belirteç kapsamlarını alır.

## Hızlı kurulum

ClickClack'te **Workspace settings → Integrations → OpenClaw** bölümünü açın, bir
bot oluşturun ve belirtecini kopyalayın. Ardından kanalı yapılandırın:

```bash
openclaw channels add clickclack --base-url https://clickclack.example.com --token ccb_... --workspace default
```

`workspace` bir çalışma alanı kimliğini (`wsp_...`), kısa adı veya görünen adı kabul eder.
`channels add`, kaydettikten sonra sunucuyu, belirteci ve çalışma alanını doğrular; ardından
çalışan Gateway'in yeni hesabı alıp almadığını bildirir. OpenClaw
zaten çalışıyorsa ClickClack otomatik olarak bağlanır ve ikinci bir komuta
gerek kalmaz. Aksi takdirde şununla başlatın:

```bash
openclaw gateway
```

Yönlendirmeli kurulum için şunu çalıştırın:

```bash
openclaw onboard
```

ClickClack'i seçin, ardından istendiğinde sunucu URL'sini, bot belirtecini ve çalışma alanını
girin. Yönlendirmeli kurulum, kaydettikten sonra sunucuyu, belirteci ve çalışma alanını denetler;
başarısız bir denetim yapılandırmayı silmez.

### Alternatif: ortam değişkeni tabanlı belirteç

Varsayılan hesap, yapılandırmada bir belirteç saklamak yerine `CLICKCLACK_BOT_TOKEN` okuyabilir:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw channels add clickclack --base-url https://clickclack.example.com --workspace default --use-env
openclaw gateway
```

Adlandırılmış hesaplar yapılandırılmış bir belirteç veya belirteç dosyası kullanmalıdır; paylaşılan ortam
değişkeni kasıtlı olarak varsayılan hesapla sınırlıdır.

### JSON5 referansı

Eşdeğer yapılandırma biçimi şöyledir:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
    },
  },
}
```

Bir hesap yalnızca `baseUrl`, bir belirteç kaynağı ve
`workspace` ayarlarının tümü yapıldığında yapılandırılmış sayılır. Bir belirteç kaynağı, varsayılan hesap için `token`, `tokenFile` veya
`CLICKCLACK_BOT_TOKEN` olabilir. `workspace` bir çalışma alanı
kimliğini (`wsp_...`), kısa adı veya adı kabul eder; Gateway başlangıçta bunu kimliğe çözümler.

### Hesap yapılandırma anahtarları

| Anahtar                 | Varsayılan          | Notlar                                                                                  |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | yok (zorunlu)       | ClickClack sunucu URL'si.                                                               |
| `token`                 | yok                 | Düz metin veya gizli değer referansı (`source: "env" \| "file" \| "exec"`) olarak bot belirteci.        |
| `tokenFile`             | yok                 | Bot belirteci dosyasının yolu; `token` değerinden önceliklidir.              |
| `workspace`             | yok (zorunlu)       | Çalışma alanı kimliği, kısa adı veya adı.                                                |
| `replyMode`             | `"agent"`           | `"agent"` tam ajan işlem hattını çalıştırır; `"model"` kısa, doğrudan model tamamlamaları gönderir. |
| `defaultTo`             | `"channel:general"` | Giden bir yol hedef belirtmediğinde kullanılan hedef.                                   |
| `allowFrom`             | `["*"]`             | Gelen doğrudan mesajlar ve kanal mesajları için kullanıcı kimliği izin listesi.         |
| `botUserId`             | otomatik algılanır  | Başlangıçta bot belirteci kimliğinden çözümlenir.                                        |
| `agentId`               | yönlendirme varsayılanı | Bu hesabın gelen mesajlarını tek bir ajana sabitler.                                 |
| `toolsAllow`            | yok                 | Bu hesaptan gelen ajan yanıtları için araç izin listesi.                                |
| `model`, `systemPrompt` | yok                 | `replyMode: "model"` tamamlamaları tarafından kullanılır.                                 |
| `commandMenu`           | `true`              | Yerel komutları ClickClack oluşturucu otomatik tamamlamasında yayımlar.                  |
| `reconnectMs`           | `1500`              | Gerçek zamanlı yeniden bağlanma gecikmesi (100 ila 60000).                               |

`plugins.allow` boş olmayan kısıtlayıcı bir listeyse kanal kurulumunda
ClickClack'i açıkça seçmek veya `openclaw plugins enable clickclack` çalıştırmak,
bu listeye `clickclack` ekler. İlk katılım kurulumu aynı
açık seçim davranışını kullanır. Bu yollar `plugins.deny` değerini veya
genel bir `plugins.enabled: false` ayarını geçersiz kılmaz. Doğrudan
`openclaw plugins install @openclaw/clickclack`, normal
Plugin kurulum politikasını izler ve ayrıca ClickClack'i mevcut bir izin listesine kaydeder.

## Birden fazla bot

Her hesap kendi ClickClack gerçek zamanlı bağlantısını açar ve kendi bot belirtecini kullanır.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
        },
        support: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SUPPORT_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "support-bot",
        },
      },
    },
  },
}
```

## Yanıt modları

- `replyMode: "agent"` (varsayılan), gelen mesajları oturum kaydı ve araç politikası dâhil olmak üzere normal ajan işlem hattından geçirir.
- `replyMode: "model"`, ajan işlem hattını atlar ve doğrudan bot yanıtları için Plugin çalışma zamanının `llm.complete` değerini kullanır; yanıtlar isteğe bağlı olarak `model` ve `systemPrompt` ile biçimlendirilir. Tamamlama bütçesi seçilen sağlayıcıya ve modele aittir.

Model modu, tamamlamaları çözümlenen bot ajan kimliğiyle çalıştırır; bunun için açık
`plugins.entries.clickclack.llm.allowAgentIdOverride: true` güven
biti gerekir:

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
}
```

Yalnızca varsayılan `agent` yanıt modunu kullanıyorsanız güven bitini kapalı tutun;
bu modda gerekli değildir.

## Komut menüsü

Gateway başlangıcında yapılandırılmış her hesap, OpenClaw'un yerel
komutlarını ClickClack'te yayımlar. Bunlar, botun kullanıcı adıyla etiketlenmiş olarak
oluşturucu otomatik tamamlamasında görünür. Yayımlanan küme her başlangıçta bütünüyle değiştirilir;
yerel komut kataloğu boş olduğunda eski bir menünün temizlenmesi de buna dâhildir.

Komut menüsü eşitlemesi varsayılan olarak etkindir. Devre dışı bırakmak için bir hesapta
`commandMenu: false` ayarını yapın:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      commandMenu: false,
    },
  },
}
```

Belirteç için `commands:write` gerekir. Güncel ClickClack `bot:write` ve
`bot:admin` paketleri bu kapsamı içerir ve kapsam ayrıca tek başına da verilebilir.
Komut menüleri kullanıma sunulmadan önce oluşturulan belirteçlere kapsamın eklenmesi veya
belirtecin değiştirilmesi gerekebilir.

Eşitleme en iyi çaba esasına göre yapılır ve her Gateway başlangıcında bir kez çalışır. Eksik bir kapsam veya ağ
hatası bir uyarı kaydeder; uç noktaya sahip olmayan eski bir ClickClack sunucusu
hata ayıklama düzeyinde kayıt oluşturur. Bu hataların hiçbiri gerçek zamanlı başlatmayı engellemez. Menüler,
ajan çevrimdışıyken kullanılabilir durumda kalır ve bot çalışma alanından ayrıldığında kaldırılır.

Bu sürüm yalnızca yerel komut belirtimlerini yayımlar. Takma adlar ve
skill, Plugin veya özel komut katalogları menüye eklenmez. Bir
ad aynı zamanda HTTP eğik çizgi komutu olarak kaydedilmişse ClickClack önce bu kaydı
çalıştırır; diğer menü komutları normal mesaj
teslimatı üzerinden devam eder.

Hizmetler arası korelasyon kanıtı için `agent` modunu kullanın. Standart `msg_<ulid>`
biçimindeki yetkili bir ClickClack mesaj kimliği için kanal,
belirleyici OpenClaw çalıştırma kimliği `clickclack:<message-id>` değerini türetir. Her model çağrısı
daha sonra tanılamada `clickclack:<message-id>:model:<n>` olarak görünür; bu
tur ClawRouter kullandığında aynı model çağrısı kimliği `X-Request-ID` olarak gönderilir.
`model` modu normal ajan çalıştırma/oturum tanılamasını atlar ve bu nedenle
bu kanıt yolu için uygun değildir.

Gerçek zamanlı bir olay doğrulanmış bir `payload.correlation_id` içerdiğinde
kanal, bunu yetkili mesaj getirme işleminde ve
sonuçta oluşan ClickClack yanıt isteklerinde `X-Correlation-ID` olarak taşır. Değerler ClickClack'in güvenli
128 karakterlik kümesini (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:` ve `-`) kullanır; geçersiz değerler
atlanır. Bu birleştirmeler yalnızca tanımlayıcıları içerir; asla mesaj gövdelerini,
istemleri, tamamlamaları, kimlik bilgilerini veya araç çıktılarını içermez.

## Kalıcı medya teslimatı

Medya içeren ajan yanıtları zorunlu kalıcı teslimatı kullanır. OpenClaw,
ilk ClickClack yazma işleminden önce parça başına kararlı mesaj ve yükleme tek seferlik değerleri atar; böylece
yeniden deneme, depolama kotasını tüketmek veya yinelenen içerik yayımlamak yerine aynı yüklemeyi ve mesajı yeniden kullanır.
Yükleme yeniden başlatmanın ardından zaten mevcutsa
OpenClaw özgün yerel yolu veya uzak medya URL'sini tekrar okumaz.

Bu kurtarma sözleşmesi, aşağıdakileri destekleyen bir ClickClack sunucusu gerektirir:

- `GET /api/uploads/by-nonce` ile
  bulunan ve bulunmayan sonuçlarda `X-ClickClack-Upload-Nonce: supported`.
- `GET /api/messages/by-nonce` ile
  bulunan ve bulunmayan sonuçlarda `X-ClickClack-Message-Nonce: supported`.
- Aynı
  sahip kapsamlı tek seferlik değer ve yükleme için eş etkili mesaj oluşturma ve ek ilişkilendirme.

Eski bir sunucunun genel 404 yanıtı, bir gönderimin mevcut olmadığının kanıtı olarak değerlendirilmez.
OpenClaw, yinelenen gönderim riskine girmek yerine teslimatı çözümlenmemiş bırakır; medya üreten
ajan yanıtlarını etkinleştirmeden önce ClickClack'i güncelleyin.

## Ajan etkinliği satırları

Varsayılan olarak bir ClickClack kanalı, ajan turu çalışırken hiçbir şey göstermez; yalnızca son yanıt iletilir. Tur devam ederken kalıcı `agent_commentary` ve `agent_tool` mesaj satırlarını yayımlamak için bir hesapta `agentActivity: true` ayarını yapın:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      agentActivity: true,
    },
  },
}
```

Gereksinimler ve davranış:

- **Varsayılan olarak kapalıdır.** Standart kurulumlara ve eski ClickClack sunucularına dokunulmaz.
- **`agent_activity:write` belirteç kapsamını gerektirir.** Bu kapsam `bot:write` kapsamından ayrıdır ve ondan devralınmaz; seçeneği etkinleştirmeden önce bot belirtecini `--scopes bot:write,agent_activity:write` ile oluşturun (veya kapsamı mevcut bir belirtece verin).
- **En iyi çaba esaslı işlev azalması.** Belirteçte `agent_activity:write` yoksa veya sunucu etkinlik yazma işlemlerini reddederse hatalar kaydedilir ve son yanıt yine normal şekilde teslim edilir; etkinlik satırları görünmez.
- Satırlar tur başına (`turn_id`) gruplandırılır, bir mantıksal adım bir satır olacak şekilde birleştirilir ve araç satırları Discord/Slack/Telegram ile aynı ilerleme biçimlendirmesini kullanır (araç adı ve komut ayrıntısı).
- **İlişkilendirme meta verileri.** Ajan tarafından oluşturulan gönderiler (etkinlik satırları ve son yanıt), tur için gerçekten kullanılan modelden (geri dönüş sonrasında da) çözümlenen `author_model` ve `author_thinking` alanlarını taşır. Bu sütunları tanımlamayan sunucular bilinmeyen JSON alanlarını yok sayar; bunları kalıcılaştıran sunucular mesaj başına "bu satırı hangi model, hangi düşünme düzeyinde söyledi" sorusunu yanıtlayabilir.

## Hedefler

- `channel:<name-or-id>` bir çalışma alanı kanalına gönderir. Önek içermeyen hedefler varsayılan olarak `channel:` değerini kullanır.
- `dm:<user_id>` söz konusu kullanıcıyla doğrudan bir konuşma oluşturur veya mevcut konuşmayı yeniden kullanır.
- `thread:<message_id>` söz konusu iletinin başlattığı ileti dizisinde yanıt verir.

Açık giden hedefler ayrıca `clickclack:` veya `cc:` sağlayıcı önekini içerebilir.

Giden medya, ClickClack'in yükleme API'sini kullanır ve ardından kalıcı yüklemeyi
oluşturulan kanal iletisine, ileti dizisi yanıtına veya DM'ye ekler. Yerel dosyalar ve desteklenen
uzak medya URL'leri, dosya başına 64 MiB sınırıyla OpenClaw'in normal medya erişimi
politikasına uyar. Kalıcı kuyruğa alınmış gönderimler, her yükleme ve ileti bölümü için
sahip kapsamlı ayrı nonce değerleri kullanır ve ardından aynı nesnelerle ek ilişkilendirmesini
yeniden dener. Sunucu sözleşmesi ve kurtarma davranışı için [Kalıcı medya teslimatı](#durable-media-delivery)
bölümüne bakın.

Örnekler:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## İzinler

ClickClack belirteç kapsamları ClickClack API'si tarafından uygulanır.

- `bot:read`: çalışma alanı/kanal/ileti/ileti dizisi/DM/gerçek zamanlı/profil verilerini okur.
- `bot:write`: `bot:read` ile birlikte kanal iletileri, ileti dizisi yanıtları, DM'ler, yüklemeler ve komut menüsü yayımlama.
- `bot:admin`: `bot:write` ile birlikte kanal oluşturma.
- `commands:write`: botun komut menüsünü yayımlar. Mevcut `bot:write` ve `bot:admin` paketlerine dahildir ve ayrı olarak verilebilir.
- `agent_activity:write`: kalıcı aracı etkinliği satırları (`agent_commentary` / `agent_tool`). `bot:write` veya `bot:admin` tarafından devralınmaz; yalnızca `agentActivity: true` ayarlandığında gereklidir.

OpenClaw, normal aracı sohbeti ve komut menüsü eşitlemesi için yalnızca mevcut `bot:write` değerine ihtiyaç duyar. [Aracı etkinliği satırlarını](#agent-activity-rows) etkinleştirirken `agent_activity:write` ekleyin.

## Sorun Giderme

- `ClickClack is not configured for account "<id>"`: söz konusu hesap için `baseUrl`, `token` (örneğin `CLICKCLACK_BOT_TOKEN` aracılığıyla) ve `workspace` değerlerini ayarlayın.
- `ClickClack workspace not found: <value>`: `workspace` değerini ClickClack tarafından döndürülen çalışma alanı kimliği, kısa adı veya adı olarak ayarlayın.
- Gelen yanıt yok: belirtecin gerçek zamanlı okuma erişimine sahip olduğunu doğrulayın ve botun kendi iletilerini ve diğer botlardan gelen iletileri yok saydığını unutmayın.
- Kanala gönderimler başarısız oluyor: botun çalışma alanının üyesi olduğunu ve `bot:write` iznine sahip olduğunu doğrulayın.
- Komut menüsü yok: `commandMenu` değerinin `false` olmadığını, ClickClack sunucusunun `PUT /api/bots/self/commands` özelliğini desteklediğini ve belirtecin `commands:write` iznine sahip olduğunu doğrulayın.
