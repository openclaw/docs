---
read_when:
    - Kimlik bilgilerini, cihazları veya aracı varsayılanlarını etkileşimli olarak ayarlamak istiyorsunuz
summary: 'CLI başvurusu: `openclaw configure` (etkileşimli yapılandırma istemleri)'
title: Yapılandırma
x-i18n:
    generated_at: "2026-06-28T00:21:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 55178b3d772297686aeead9799b97dd5d836b908baabde1fce7918d38446fcff
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Mevcut bir kurulumda hedefli değişiklikler için etkileşimli istem: kimlik bilgileri, cihazlar, ajan varsayılanları, gateway, kanallar, Plugin'ler, Skills ve sağlık kontrolleri.

İlk çalıştırma için tam kılavuzlu süreçte `openclaw onboard` komutunu, yalnızca temel yapılandırma/çalışma alanı için `openclaw setup` komutunu ve yalnızca kanal hesabı kurulumu gerektiğinde `openclaw channels add` komutunu kullanın.

<Note>
**Model** bölümü, `agents.defaults.models` izin listesi için çoklu seçim içerir (`/model` içinde ve model seçicide görünenler). Sağlayıcı kapsamlı kurulum seçimleri, seçilen modelleri yapılandırmada zaten bulunan ilgisiz sağlayıcıları değiştirmek yerine mevcut izin listesine birleştirir.

Configure üzerinden sağlayıcı kimlik doğrulamasını yeniden çalıştırmak, sağlayıcının kimlik doğrulama adımı kendi önerilen varsayılan modelini içeren bir yapılandırma yaması döndürse bile mevcut `agents.defaults.model.primary` değerini korur. Bu, xAI, OpenRouter veya başka bir sağlayıcı eklemenin ya da yeniden doğrulamanın, mevcut birincil modelinizin yerini almadan yeni modeli kullanılabilir hale getirmesi gerektiği anlamına gelir. Varsayılan modeli kasıtlı olarak değiştirmek istediğinizde `openclaw models auth login --provider <id> --set-default` veya `openclaw models set <model>` komutunu kullanın.
</Note>

Configure bir sağlayıcı kimlik doğrulama seçimiyle başladığında, varsayılan model ve izin listesi seçicileri bu sağlayıcıyı otomatik olarak tercih eder. Volcengine ve BytePlus gibi eşleştirilmiş sağlayıcılarda, aynı tercih onların kodlama planı varyantlarıyla da eşleşir (`volcengine-plan/*`, `byteplus-plan/*`). Tercih edilen sağlayıcı filtresi boş bir liste üretirse configure, boş bir seçici göstermek yerine filtresiz kataloğa geri döner.

<Tip>
Alt komut olmadan `openclaw config` aynı sihirbazı açar. Etkileşimsiz düzenlemeler için `openclaw config get|set|unset` komutunu kullanın.
</Tip>

Web araması için `openclaw configure --section web`, bir sağlayıcı seçmenizi
ve kimlik bilgilerini yapılandırmanızı sağlar. Bazı sağlayıcılar ayrıca
sağlayıcıya özgü takip istemleri gösterir:

- **Grok**, aynı xAI OAuth profili veya API anahtarıyla isteğe bağlı `x_search` kurulumu sunabilir
  ve bir `x_search` modeli seçmenizi sağlayabilir.
- **Kimi**, Moonshot API bölgesini (`api.moonshot.ai` ile
  `api.moonshot.cn` arasında) ve varsayılan Kimi web arama modelini sorabilir.

İlgili:

- Gateway yapılandırma başvurusu: [Yapılandırma](/tr/gateway/configuration)
- Yapılandırma CLI'si: [Yapılandırma](/tr/cli/config)

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
- Yerel yapılandırma yazımlarından sonra configure, seçilen kurulum yolu gerektiriyorsa seçilen indirilebilir Plugin'leri yükler. Uzak gateway yapılandırması yerel Plugin paketlerini yüklemez.
- Kanal odaklı servisler (Slack/Discord/Matrix/Microsoft Teams), kurulum sırasında kanal/oda izin listeleri ister. Adlar veya kimlikler girebilirsiniz; sihirbaz mümkün olduğunda adları kimliklere çözümler.
- Daemon yükleme adımını çalıştırırsanız, token kimlik doğrulaması bir token gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa configure SecretRef'i doğrular, ancak çözümlenmiş düz metin token değerlerini supervisor servis ortamı meta verilerine kalıcı olarak yazmaz.
- Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenmemişse configure, daemon yüklemesini uygulanabilir düzeltme rehberliğiyle engeller.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa configure, mod açıkça ayarlanana kadar daemon yüklemesini engeller.

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
