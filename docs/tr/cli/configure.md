---
read_when:
    - Kimlik bilgilerini, cihazları veya aracı varsayılanlarını etkileşimli olarak ayarlamak istiyorsunuz
summary: '`openclaw configure` için CLI başvurusu (etkileşimli yapılandırma istemleri)'
title: Yapılandırma
x-i18n:
    generated_at: "2026-04-24T09:01:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 822c01f8c0fe9dc4c170f3418bc836b1d18b4713551355b0a18de9e613754dd0
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Kimlik bilgilerini, cihazları ve aracı varsayılanlarını ayarlamak için etkileşimli istem.

Not: **Model** bölümü artık `agents.defaults.models` izin listesi için bir çoklu seçim içerir (`/model` ve model seçicide görünenler). Sağlayıcı kapsamlı kurulum seçimleri, yapılandırmada zaten bulunan ilgisiz sağlayıcıları değiştirmek yerine seçili modellerini mevcut izin listesine birleştirir.

Yapılandırma bir sağlayıcı kimlik doğrulama seçeneğinden başlatıldığında, varsayılan model ve izin listesi seçicileri bu sağlayıcıyı otomatik olarak tercih eder. Volcengine/BytePlus gibi eşlenik sağlayıcılarda aynı tercih, kodlama planı varyantlarıyla da eşleşir (`volcengine-plan/*`, `byteplus-plan/*`). Tercih edilen sağlayıcı filtresi boş bir liste üretecekse yapılandırma boş bir seçici göstermek yerine filtrelenmemiş kataloğa geri döner.

İpucu: Alt komut olmadan `openclaw config` aynı sihirbazı açar. Etkileşimli olmayan düzenlemeler için `openclaw config get|set|unset` kullanın.

Web araması için `openclaw configure --section web`, bir sağlayıcı seçmenize ve kimlik bilgilerini yapılandırmanıza izin verir. Bazı sağlayıcılar ayrıca sağlayıcıya özgü devam istemleri de gösterir:

- **Grok**, aynı `XAI_API_KEY` ile isteğe bağlı `x_search` kurulumu sunabilir ve bir `x_search` modeli seçmenize izin verebilir.
- **Kimi**, Moonshot API bölgesini (`api.moonshot.ai` veya `api.moonshot.cn`) ve varsayılan Kimi web arama modelini sorabilir.

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

- Gateway’in nerede çalışacağını seçmek her zaman `gateway.mode` değerini günceller. İhtiyacınız olan tek şey buysa başka bölümler olmadan "Continue" seçebilirsiniz.
- Kanal odaklı hizmetler (Slack/Discord/Matrix/Microsoft Teams) kurulum sırasında kanal/oda izin listeleri ister. Ad veya kimlik girebilirsiniz; sihirbaz mümkün olduğunda adları kimliklere çözümler.
- Daemon kurulum adımını çalıştırırsanız, belirteç kimlik doğrulaması bir belirteç gerektirir ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, yapılandırma SecretRef’i doğrular ancak çözümlenmiş düz metin belirteç değerlerini supervisor hizmet ortamı meta verilerine kalıcı olarak yazmaz.
- Belirteç kimlik doğrulaması bir belirteç gerektiriyorsa ve yapılandırılmış belirteç SecretRef’i çözümlenmemişse, yapılandırma daemon kurulumunu uygulanabilir çözüm önerileriyle engeller.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, yapılandırma mod açıkça ayarlanana kadar daemon kurulumunu engeller.

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
