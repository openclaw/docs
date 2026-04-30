---
read_when:
    - Kimlik bilgilerini, cihazları veya ajan varsayılanlarını etkileşimli olarak ayarlamak istiyorsunuz
summary: '`openclaw configure` için CLI başvurusu (etkileşimli yapılandırma istemleri)'
title: Yapılandır
x-i18n:
    generated_at: "2026-04-30T09:11:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bde13a139c299879ff13a85c17afdd55dce7ad758418266854428b059d8a05e
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Kimlik bilgilerini, cihazları ve ajan varsayılanlarını ayarlamak için etkileşimli istem.

<Note>
**Model** bölümü, `agents.defaults.models` izin listesi için çoklu seçim içerir (`/model` içinde ve model seçicide görünenler). Sağlayıcı kapsamlı kurulum seçimleri, seçtikleri modelleri yapılandırmada zaten bulunan ilgisiz sağlayıcıları değiştirmek yerine mevcut izin listesiyle birleştirir. Configure içinden sağlayıcı kimlik doğrulamasını yeniden çalıştırmak, mevcut bir `agents.defaults.model.primary` değerini korur. Varsayılan modeli bilerek değiştirmek istediğinizde `openclaw models auth login --provider <id> --set-default` veya `openclaw models set <model>` kullanın.
</Note>

Configure bir sağlayıcı kimlik doğrulama seçiminden başladığında, varsayılan model ve izin listesi seçicileri otomatik olarak o sağlayıcıyı tercih eder. Volcengine ve BytePlus gibi eşleştirilmiş sağlayıcılarda aynı tercih, bunların kodlama planı varyantlarıyla da eşleşir (`volcengine-plan/*`, `byteplus-plan/*`). Tercih edilen sağlayıcı filtresi boş bir liste üretirse configure boş bir seçici göstermek yerine filtrelenmemiş kataloğa geri döner.

<Tip>
Alt komut olmadan `openclaw config` aynı sihirbazı açar. Etkileşimsiz düzenlemeler için `openclaw config get|set|unset` kullanın.
</Tip>

Web araması için `openclaw configure --section web`, bir sağlayıcı seçmenize
ve kimlik bilgilerini yapılandırmanıza olanak tanır. Bazı sağlayıcılar ayrıca sağlayıcıya özel
takip istemleri de gösterir:

- **Grok**, aynı `XAI_API_KEY` ile isteğe bağlı `x_search` kurulumu sunabilir ve
  bir `x_search` modeli seçmenize olanak tanır.
- **Kimi**, Moonshot API bölgesini (`api.moonshot.ai` veya
  `api.moonshot.cn`) ve varsayılan Kimi web arama modelini sorabilir.

İlgili:

- Gateway yapılandırma başvurusu: [Yapılandırma](/tr/gateway/configuration)
- Yapılandırma CLI: [Yapılandırma](/tr/cli/config)

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

- Gateway'in nerede çalışacağını seçmek her zaman `gateway.mode` değerini günceller. İhtiyacınız olan tek şey buysa diğer bölümler olmadan "Devam" seçeneğini seçebilirsiniz.
- Kanal odaklı hizmetler (Slack/Discord/Matrix/Microsoft Teams), kurulum sırasında kanal/oda izin listeleri için istem gösterir. Adlar veya ID'ler girebilirsiniz; sihirbaz mümkün olduğunda adları ID'lere çözer.
- Daemon kurulum adımını çalıştırırsanız, token kimlik doğrulaması bir token gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa configure SecretRef'i doğrular ancak çözümlenmiş düz metin token değerlerini supervisor hizmet ortamı meta verilerine kalıcı olarak yazmaz.
- Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef'i çözümlenemiyorsa configure, uygulanabilir düzeltme rehberliğiyle daemon kurulumunu engeller.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa configure, mod açıkça ayarlanana kadar daemon kurulumunu engeller.

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
