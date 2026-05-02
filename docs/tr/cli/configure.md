---
read_when:
    - Kimlik bilgilerini, cihazları veya ajan varsayılanlarını etkileşimli olarak ayarlamak istiyorsunuz
summary: '`openclaw configure` için CLI referansı (etkileşimli yapılandırma istemleri)'
title: Yapılandır
x-i18n:
    generated_at: "2026-05-02T08:49:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16e45fdead5e8026e8d359a09c799fb1248226a9425fcd9ff956d165b880663d
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Kimlik bilgilerini, cihazları ve ajan varsayılanlarını ayarlamak için etkileşimli istem.

<Note>
**Model** bölümü, `agents.defaults.models` izin listesi için çoklu seçim içerir (`/model` içinde ve model seçicide görünenler). Sağlayıcı kapsamlı kurulum seçimleri, seçtikleri modelleri yapılandırmada zaten bulunan ilgisiz sağlayıcıları değiştirmek yerine mevcut izin listesine birleştirir.

Configure içinden sağlayıcı kimlik doğrulamasını yeniden çalıştırmak, sağlayıcının kimlik doğrulama adımı kendi önerilen varsayılan modeliyle bir yapılandırma yaması döndürse bile mevcut `agents.defaults.model.primary` değerini korur. Bu, xAI, OpenRouter veya başka bir sağlayıcı eklemenin ya da yeniden kimlik doğrulaması yapmanın, geçerli birincil modelinizin yerini almadan yeni modeli kullanılabilir yapması gerektiği anlamına gelir. Varsayılan modeli bilerek değiştirmek istediğinizde `openclaw models auth login --provider <id> --set-default` veya `openclaw models set <model>` kullanın.
</Note>

Configure bir sağlayıcı kimlik doğrulama seçiminden başladığında, varsayılan model ve izin listesi seçicileri otomatik olarak o sağlayıcıyı tercih eder. Volcengine ve BytePlus gibi eşleştirilmiş sağlayıcılarda aynı tercih, bunların coding-plan varyantlarıyla da eşleşir (`volcengine-plan/*`, `byteplus-plan/*`). Tercih edilen sağlayıcı filtresi boş bir liste üretecekse, configure boş bir seçici göstermek yerine filtresiz kataloğa geri döner.

<Tip>
Alt komut olmadan `openclaw config` aynı sihirbazı açar. Etkileşimli olmayan düzenlemeler için `openclaw config get|set|unset` kullanın.
</Tip>

Web araması için `openclaw configure --section web`, bir sağlayıcı seçmenizi
ve kimlik bilgilerini yapılandırmanızı sağlar. Bazı sağlayıcılar ayrıca sağlayıcıya özgü
takip istemleri de gösterir:

- **Grok**, aynı `XAI_API_KEY` ile isteğe bağlı `x_search` kurulumu sunabilir ve
  bir `x_search` modeli seçmenize izin verebilir.
- **Kimi**, Moonshot API bölgesini (`api.moonshot.ai` veya
  `api.moonshot.cn`) ve varsayılan Kimi web araması modelini sorabilir.

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

- Gateway'in nerede çalışacağını seçmek her zaman `gateway.mode` değerini günceller. İhtiyacınız olan tek şey buysa diğer bölümler olmadan "Devam"ı seçebilirsiniz.
- Yerel yapılandırma yazmalarından sonra configure, seçilen kurulum yolu gerektiriyorsa seçili indirilebilir plugins paketlerini kurar. Uzak Gateway yapılandırması yerel Plugin paketlerini kurmaz.
- Kanal odaklı hizmetler (Slack/Discord/Matrix/Microsoft Teams), kurulum sırasında kanal/oda izin listeleri için istem gösterir. Adlar veya kimlikler girebilirsiniz; sihirbaz mümkün olduğunda adları kimliklere çözer.
- Daemon kurulum adımını çalıştırırsanız, belirteç kimlik doğrulaması bir belirteç gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, configure SecretRef'i doğrular ancak çözümlenmiş düz metin belirteç değerlerini supervisor hizmet ortamı meta verilerine kalıcı olarak yazmaz.
- Belirteç kimlik doğrulaması bir belirteç gerektiriyorsa ve yapılandırılmış belirteç SecretRef'i çözümlenemiyorsa, configure uygulanabilir düzeltme yönergeleriyle daemon kurulumunu engeller.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, configure mod açıkça ayarlanana kadar daemon kurulumunu engeller.

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
