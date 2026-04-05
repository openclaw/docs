---
read_when:
    - Kimlik bilgilerini, cihazları veya ajan varsayılanlarını etkileşimli olarak ayarlamak istiyorsunuz
summary: '`openclaw configure` için CLI başvurusu (etkileşimli yapılandırma istemleri)'
title: configure
x-i18n:
    generated_at: "2026-04-05T13:48:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 989569fdb8e1b31ce3438756b3ed9bf18e0c8baf611c5981643ba5925459c98f
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Kimlik bilgilerini, cihazları ve ajan varsayılanlarını ayarlamak için etkileşimli istem.

Not: **Model** bölümü artık
`agents.defaults.models` izin listesi için çoklu seçim içerir (`/model` içinde ve model seçicide neyin görüneceği).

Configure, sağlayıcı auth seçiminden başladığında varsayılan model ve
izin listesi seçicileri bu sağlayıcıyı otomatik olarak tercih eder. Volcengine/BytePlus gibi
eşlenmiş sağlayıcılarda aynı tercih, bunların coding-plan
varyantlarıyla da eşleşir (`volcengine-plan/*`, `byteplus-plan/*`). Tercih edilen sağlayıcı
filtresi boş bir liste üretecekse, configure boş bir seçici göstermek yerine
filtrelenmemiş kataloğa geri döner.

İpucu: Alt komut olmadan `openclaw config` aynı sihirbazı açar. Etkileşimli olmayan düzenlemeler için
`openclaw config get|set|unset` kullanın.

Web araması için `openclaw configure --section web`, bir sağlayıcı seçmenize
ve onun kimlik bilgilerini yapılandırmanıza olanak tanır. Bazı sağlayıcılar ayrıca sağlayıcıya özgü
ek istemler de gösterir:

- **Grok**, aynı `XAI_API_KEY` ile isteğe bağlı `x_search` kurulumunu önerebilir ve
  bir `x_search` modeli seçmenize izin verebilir.
- **Kimi**, Moonshot API bölgesini (`api.moonshot.ai` veya
  `api.moonshot.cn`) ve varsayılan Kimi web-search modelini sorabilir.

İlgili:

- Gateway yapılandırma başvurusu: [Configuration](/gateway/configuration)
- Config CLI: [Config](/cli/config)

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

- Gateway'in nerede çalışacağını seçmek her zaman `gateway.mode` değerini günceller. İhtiyacınız olan tek şey buysa başka bölüm olmadan "Continue" seçeneğini seçebilirsiniz.
- Kanal odaklı hizmetler (Slack/Discord/Matrix/Microsoft Teams), kurulum sırasında kanal/oda izin listelerini ister. Adları veya kimlikleri girebilirsiniz; sihirbaz mümkün olduğunda adları kimliklere çözümler.
- Daemon kurulum adımını çalıştırırsanız, token auth bir token gerektirir ve `gateway.auth.token` SecretRef ile yönetilir; configure SecretRef'i doğrular ancak çözümlenmiş düz metin token değerlerini supervisor service ortam meta verilerine kalıcı olarak yazmaz.
- Token auth bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenmemişse, configure uygulanabilir düzeltme yönergeleriyle daemon kurulumunu engeller.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, configure mod açıkça ayarlanana kadar daemon kurulumunu engeller.

## Örnekler

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```
