---
read_when:
    - Kimlik bilgilerini, cihazları veya ajan varsayılanlarını etkileşimli olarak değiştirmek istiyorsunuz
summary: '`openclaw configure` için CLI referansı (etkileşimli yapılandırma istemleri)'
title: Yapılandır
x-i18n:
    generated_at: "2026-05-10T19:28:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: aba5320fefb856c208405511619fc1a4314e3f5e3990f221e987a03d692189fb
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Mevcut bir kurulumda hedefli değişiklikler için etkileşimli istem: kimlik bilgileri, cihazlar, agent varsayılanları, Gateway, kanallar, plugins, Skills ve sağlık kontrolleri.

Tam kılavuzlu ilk çalıştırma yolculuğu için `openclaw onboard`, yalnızca temel yapılandırma/çalışma alanı için `openclaw setup` ve yalnızca kanal hesabı kurulumu gerektiğinde `openclaw channels add` kullanın.

<Note>
**Model** bölümü, `agents.defaults.models` izin listesi için çoklu seçim içerir (`/model` içinde ve model seçicide görünenler). Sağlayıcı kapsamlı kurulum seçimleri, seçilen modelleri yapılandırmada zaten bulunan ilgisiz sağlayıcıların yerine koymak yerine mevcut izin listesine ekler.

Configure içinden sağlayıcı kimlik doğrulamasını yeniden çalıştırmak, sağlayıcının kimlik doğrulama adımı kendi önerilen varsayılan modeliyle bir yapılandırma yaması döndürse bile mevcut `agents.defaults.model.primary` değerini korur. Bu, xAI, OpenRouter veya başka bir sağlayıcı eklemenin ya da yeniden kimlik doğrulaması yapmanın, geçerli birincil modelinizin yerini almadan yeni modeli kullanılabilir hale getirmesi gerektiği anlamına gelir. Varsayılan modeli bilerek değiştirmek istediğinizde `openclaw models auth login --provider <id> --set-default` veya `openclaw models set <model>` kullanın.
</Note>

Configure bir sağlayıcı kimlik doğrulama seçimiyle başladığında, varsayılan model ve izin listesi seçicileri bu sağlayıcıyı otomatik olarak tercih eder. Volcengine ve BytePlus gibi eşleşmiş sağlayıcılar için aynı tercih, bunların kodlama planı varyantlarıyla da eşleşir (`volcengine-plan/*`, `byteplus-plan/*`). Tercih edilen sağlayıcı filtresi boş bir liste oluşturacaksa configure, boş bir seçici göstermek yerine filtresiz kataloğa geri döner.

<Tip>
Alt komut olmadan `openclaw config` aynı sihirbazı açar. Etkileşimsiz düzenlemeler için `openclaw config get|set|unset` kullanın.
</Tip>

Web araması için `openclaw configure --section web`, bir sağlayıcı seçmenizi
ve kimlik bilgilerini yapılandırmanızı sağlar. Bazı sağlayıcılar sağlayıcıya özgü
takip istemleri de gösterir:

- **Grok**, aynı `XAI_API_KEY` ile isteğe bağlı `x_search` kurulumu sunabilir ve
  bir `x_search` modeli seçmenizi sağlayabilir.
- **Kimi**, Moonshot API bölgesini (`api.moonshot.ai` veya
  `api.moonshot.cn`) ve varsayılan Kimi web arama modelini sorabilir.

İlgili:

- Gateway yapılandırma başvurusu: [Yapılandırma](/tr/gateway/configuration)
- Config CLI: [Config](/tr/cli/config)

## Seçenekler

- `--section <section>`: tekrarlanabilir bölüm filtresi

Kullanılabilir bölümler:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

Notlar:

- Gateway’in nerede çalışacağını seçmek her zaman `gateway.mode` değerini günceller. İhtiyacınız olan tek şey buysa diğer bölümler olmadan "Devam" seçebilirsiniz.
- Yerel yapılandırma yazmalarından sonra configure, seçilen kurulum yolu gerektiriyorsa seçili indirilebilir plugins’i yükler. Uzak gateway yapılandırması yerel plugin paketlerini yüklemez.
- Kanal odaklı hizmetler (Slack/Discord/Matrix/Microsoft Teams), kurulum sırasında kanal/oda izin listeleri için istem gösterir. Adlar veya kimlikler girebilirsiniz; sihirbaz mümkün olduğunda adları kimliklere çözer.
- Daemon yükleme adımını çalıştırırsanız, token kimlik doğrulaması bir token gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa configure SecretRef’i doğrular, ancak çözümlenmiş düz metin token değerlerini supervisor hizmet ortamı meta verilerine kalıcı olarak yazmaz.
- Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenemiyorsa configure, daemon yüklemesini uygulanabilir düzeltme rehberliğiyle engeller.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa configure, mode açıkça ayarlanana kadar daemon yüklemesini engeller.

## Örnekler

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## İlgili

- [CLI başvurusu](/tr/cli)
- [Yapılandırma](/tr/gateway/configuration)
