---
read_when:
    - Kimlik bilgilerini, cihazları veya ajan varsayılanlarını etkileşimli olarak ayarlamak istiyorsunuz
summary: '`openclaw configure` için CLI referansı (etkileşimli yapılandırma istemleri)'
title: Yapılandır
x-i18n:
    generated_at: "2026-07-12T12:09:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6001ea712ee4db3f7bdc2db784a9df2e3f15a8360890b69aec2ea67694c3514b
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Mevcut bir kurulumda hedefe yönelik değişiklikler yapmak için etkileşimli istemler: kimlik bilgileri, cihazlar, ajan varsayılanları, Gateway, kanallar, Plugin'ler, Skills ve sistem durumu denetimleri.

İlk çalıştırmaya yönelik tam rehberli süreç için `openclaw onboard` veya `openclaw setup`, yalnızca temel yapılandırma/çalışma alanı için `openclaw setup --baseline`, yalnızca kanal hesabı kurulumu gerektiğinde ise `openclaw channels add` kullanın.

<Tip>
Alt komut olmadan çalıştırılan `openclaw config` aynı sihirbazı açar. Etkileşimsiz düzenlemeler için `openclaw config get|set|unset` kullanın.
</Tip>

## Seçenekler

`--section <section>`: Tekrarlanabilir bölüm filtresi. Kullanılabilir bölümler:

`workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

`gateway`, `daemon` veya `health` seçildiğinde (ya da `--section` olmadan tam sihirbaz çalıştırıldığında), Gateway'in nerede çalışacağı sorulur ve `gateway.mode` güncellenir. Bu üç bölümün tamamını atlayan bölüm filtreleri, Gateway modu istemini göstermeden doğrudan istenen kuruluma geçer. Uzak Gateway modu seçildiğinde uzak yapılandırma yazılır ve işlem hemen sonlandırılır; Plugin kurulumları gibi yalnızca yerelde gerçekleştirilen adımlar çalıştırılmaz.

<Note>
`openclaw configure` etkileşimli bir terminal gerektirir (hem stdin hem de stdout TTY olmalıdır). Etkileşimli terminal olmadığında kısmen çalışmak yerine eşdeğer etkileşimsiz `openclaw config get|set|patch|validate` komutlarını yazdırır ve hatayla sonlanır.
</Note>

## Model bölümü

<Note>
**Model**, `agents.defaults.models` izin listesi (`/model` içinde ve model seçicide gösterilenler) için çoklu seçim içerir. Sağlayıcı kapsamındaki kurulum seçenekleri, yapılandırmada zaten bulunan ilgisiz sağlayıcıları değiştirmek yerine seçilen modelleri mevcut izin listesiyle birleştirir.

Yapılandırma aracından sağlayıcı kimlik doğrulamasını yeniden çalıştırmak, sağlayıcının kimlik doğrulama adımı kendi önerilen varsayılan modelini içeren bir yapılandırma yaması döndürse bile mevcut `agents.defaults.model.primary` değerini korur. Bir sağlayıcı eklemek veya sağlayıcının kimliğini yeniden doğrulamak, mevcut birincil modelinizin yerini almadan o sağlayıcının modellerini kullanılabilir hâle getirir. Varsayılan modeli bilinçli olarak değiştirmek için `openclaw models auth login --provider <id> --set-default` veya `openclaw models set <model>` kullanın.
</Note>

Yapılandırma bir sağlayıcı kimlik doğrulama seçeneğinden başlatıldığında, varsayılan model ve izin listesi seçicileri otomatik olarak o sağlayıcıyı tercih eder. Volcengine ve BytePlus gibi eşleştirilmiş sağlayıcılarda aynı tercih, bunların kodlama planı varyantlarıyla da (`volcengine-plan/*`, `byteplus-plan/*`) eşleşir. Tercih edilen sağlayıcı filtresi boş bir liste oluşturacaksa yapılandırma aracı boş bir seçici göstermek yerine filtrelenmemiş kataloğa geri döner.

## Web bölümü

`openclaw configure --section web`, bir web arama sağlayıcısı seçer ve sağlayıcının kimlik bilgilerini yapılandırır. Bazı sağlayıcılar kendilerine özgü ek adımlar gösterir:

- **Grok**, aynı xAI OAuth profili veya API anahtarıyla isteğe bağlı `x_search` kurulumu sunabilir ve bir `x_search` modeli seçmenize olanak tanıyabilir.
- **Kimi**, Moonshot API bölgesini (`api.moonshot.ai` veya `api.moonshot.cn`) ve varsayılan Kimi web arama modelini sorabilir.

## Diğer notlar

- Yerel yapılandırma yazıldıktan sonra, seçilen kurulum yolu gerektiriyorsa yapılandırma aracı seçilen indirilebilir Plugin'leri kurar. Uzak Gateway yapılandırması yerel Plugin paketlerini kurmaz.
- Kanal odaklı hizmetler (Slack/Discord/Matrix/Microsoft Teams), kurulum sırasında kanal/oda izin listelerini ister. Ad veya kimlik girebilirsiniz; sihirbaz mümkün olduğunda adları kimliklere dönüştürür.
- Arka plan hizmeti kurulum adımını çalıştırırsanız belirteç kimlik doğrulaması için bir belirteç gerekir. `gateway.auth.token`, SecretRef tarafından yönetiliyorsa yapılandırma aracı SecretRef'i doğrular ancak çözümlenen düz metin belirteç değerlerini denetleyici hizmetin ortam meta verilerinde kalıcı hâle getirmez; SecretRef çözümlenemiyorsa yapılandırma aracı uygulanabilir düzeltme yönergeleriyle arka plan hizmeti kurulumunu engeller.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa yapılandırma aracı, modu açıkça ayarlayana kadar arka plan hizmeti kurulumunu engeller.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Yapılandırma](/tr/gateway/configuration)
- Yapılandırma CLI'si: [Yapılandırma](/tr/cli/config)
