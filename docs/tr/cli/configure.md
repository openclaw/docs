---
read_when:
    - Kimlik bilgilerini, cihazları veya ajan varsayılanlarını etkileşimli olarak düzenlemek istiyorsunuz
summary: CLI `openclaw configure` başvurusu (etkileşimli yapılandırma istemleri)
title: Yapılandır
x-i18n:
    generated_at: "2026-06-30T22:29:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96241eddd8bc0eaf936d0bb7555a217858d71dcc8009dc5608cecbc55d292bce
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Mevcut bir kurulumda hedefli değişiklikler için etkileşimli istem: kimlik bilgileri, cihazlar, ajan varsayılanları, Gateway, kanallar, plugin'ler, Skills ve sağlık kontrolleri.

Tam rehberli ilk çalıştırma yolculuğu için `openclaw onboard` veya `openclaw setup`, yalnızca temel yapılandırma/çalışma alanı için `openclaw setup --baseline`, yalnızca kanal hesabı kurulumu gerektiğinde ise `openclaw channels add` kullanın.

<Note>
**Model** bölümü, `agents.defaults.models` izin listesi için çoklu seçim içerir (`/model` içinde ve model seçicide görünenler). Sağlayıcı kapsamlı kurulum seçimleri, yapılandırmada zaten bulunan ilgisiz sağlayıcıları değiştirmek yerine seçili modellerini mevcut izin listesiyle birleştirir.

Configure üzerinden sağlayıcı kimlik doğrulamasını yeniden çalıştırmak, sağlayıcının kimlik doğrulama adımı kendi önerilen varsayılan modeliyle bir yapılandırma yaması döndürse bile mevcut `agents.defaults.model.primary` değerini korur. Bu, xAI, OpenRouter veya başka bir sağlayıcı eklemenin ya da yeniden kimlik doğrulaması yapmanın, mevcut birincil modelinizin yerini almadan yeni modeli kullanılabilir hale getirmesi gerektiği anlamına gelir. Varsayılan modeli özellikle değiştirmek istediğinizde `openclaw models auth login --provider <id> --set-default` veya `openclaw models set <model>` kullanın.
</Note>

Configure bir sağlayıcı kimlik doğrulama seçiminden başladığında, varsayılan model ve izin listesi seçicileri o sağlayıcıyı otomatik olarak tercih eder. Volcengine ve BytePlus gibi eşleşmiş sağlayıcılarda aynı tercih, onların kodlama planı varyantlarıyla da eşleşir (`volcengine-plan/*`, `byteplus-plan/*`). Tercih edilen sağlayıcı filtresi boş bir liste üretecekse configure, boş bir seçici göstermek yerine filtresiz kataloğa geri döner.

<Tip>
Alt komut olmadan `openclaw config` aynı sihirbazı açar. Etkileşimsiz düzenlemeler için `openclaw config get|set|unset` kullanın.
</Tip>

Web araması için `openclaw configure --section web`, bir sağlayıcı seçmenizi
ve kimlik bilgilerini yapılandırmanızı sağlar. Bazı sağlayıcılar sağlayıcıya özgü
takip istemleri de gösterir:

- **Grok**, aynı xAI OAuth profili veya API anahtarıyla isteğe bağlı `x_search`
  kurulumu sunabilir ve bir `x_search` modeli seçmenizi sağlayabilir.
- **Kimi**, Moonshot API bölgesini (`api.moonshot.ai` ya da
  `api.moonshot.cn`) ve varsayılan Kimi web arama modelini sorabilir.

İlgili:

- Gateway yapılandırma başvurusu: [Yapılandırma](/tr/gateway/configuration)
- Config CLI: [Config](/tr/cli/config)

## Seçenekler

- `--section <section>`: yinelenebilir bölüm filtresi

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

- Tam sihirbaz ve Gateway ile ilgili bölümler, Gateway'in nerede çalıştığını sorar ve `gateway.mode` değerini günceller. `gateway`, `daemon` veya `health` içermeyen bölüm filtreleri doğrudan istenen kuruluma gider.
- Yerel yapılandırma yazımlarından sonra configure, seçilen kurulum yolu gerektirdiğinde seçili indirilebilir plugin'leri kurar. Uzak Gateway yapılandırması yerel plugin paketlerini kurmaz.
- Kanal odaklı hizmetler (Slack/Discord/Matrix/Microsoft Teams) kurulum sırasında kanal/oda izin listeleri ister. Adlar veya ID'ler girebilirsiniz; sihirbaz mümkün olduğunda adları ID'lere çözer.
- Daemon kurulum adımını çalıştırırsanız, token kimlik doğrulaması bir token gerektiriyorsa ve `gateway.auth.token` SecretRef ile yönetiliyorsa configure SecretRef'i doğrular, ancak çözümlenmiş düz metin token değerlerini supervisor hizmeti ortam meta verilerinde kalıcı hale getirmez.
- Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenemiyorsa configure, daemon kurulumunu uygulanabilir düzeltme rehberliğiyle engeller.
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
