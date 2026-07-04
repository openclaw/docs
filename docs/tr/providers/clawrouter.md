---
read_when:
    - Birden fazla model sağlayıcısı için tek bir yönetilen anahtar istiyorsunuz
    - OpenClaw’da ClawRouter model keşfine veya kota raporlamasına ihtiyacınız var
summary: Kimlik bilgisi kapsamındaki modelleri ClawRouter üzerinden yönlendirin ve yönetilen kotaları gösterin
title: ClawRouter
x-i18n:
    generated_at: "2026-07-04T04:03:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 363426cc68e74f6a910f6fa956c323449ab827aee43db4320e98620245e593d2
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter, OpenClaw'a birden fazla yukarı akış model sağlayıcısı için ilke kapsamlı tek bir anahtar verir. Paketle gelen Plugin yalnızca bu anahtar için izin verilen modelleri keşfeder, her modeli bildirilen protokolü üzerinden yönlendirir ve anahtarın bütçesini ve toplam kullanımını OpenClaw kullanım yüzeylerinde raporlar.

OpenClaw ana makinesinde her yukarı akış sağlayıcı Plugin'ini kurmanız veya kimliğini doğrulamanız gerekmez. Yukarı akış kimlik bilgileri ve sağlayıcıya özgü iletme ClawRouter'da kalır. OpenClaw yalnızca paketle gelen `@openclaw/clawrouter` Plugin'ine ve verilmiş bir ClawRouter kimlik bilgisine ihtiyaç duyar.

| Özellik       | Değer                                    |
| ------------- | ---------------------------------------- |
| Sağlayıcı     | `clawrouter`                             |
| Paket         | `@openclaw/clawrouter`                   |
| Kimlik Doğrulama | `CLAWROUTER_API_KEY`                  |
| Varsayılan URL | `https://clawrouter.openclaw.ai`       |
| Model kataloğu | `/v1/catalog` üzerinden kimlik bilgisi kapsamlı |
| Kotalar       | `/v1/usage` üzerinden aylık bütçe ve kullanım |

## Başlarken

<Steps>
  <Step title="Get a scoped credential">
    ClawRouter yöneticinizden, kullanmanız gereken sağlayıcıları, modelleri ve aylık bütçeyi içeren ilkeye sahip bir kimlik bilgisi isteyin. Kimlik bilgileri verildiğinde yalnızca bir kez gösterilir.
  </Step>
  <Step title="Configure OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    Plugin, OpenClaw ile paketlenmiş olarak gelir. Yapılandırmanız `plugins.allow` ayarlıyorsa, etkinleştirmeden önce bu listeye `clawrouter` ekleyin. Özel bir dağıtım için `models.providers.clawrouter.baseUrl` değerini ClawRouter kaynağına ayarlayın; varsayılan `https://clawrouter.openclaw.ai` değeridir.

  </Step>
  <Step title="List granted models">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    Döndürülen model başvurularını tam olarak gösterildiği gibi kullanın. `clawrouter/openai/...`, `clawrouter/anthropic/...` veya `clawrouter/google/...` gibi yukarı akış ad alanını korurlar. Yapılandırmanızda `agents.defaults.models` bir izin listesi ise, seçilen her ClawRouter başvurusunu buna ekleyin.

  </Step>
  <Step title="Select a model">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    Döndürülen bir modeli tek bir çalıştırma için `openclaw agent --model clawrouter/<provider>/<model> --message "..."` ile de seçebilirsiniz.

  </Step>
</Steps>

## Model keşfi

`GET /v1/catalog` doğruluk kaynağıdır. OpenClaw, ClawRouter modellerinin ikinci ve sabit bir listesini göndermez. ClawRouter'da yapılandırılmış bir model şu durumlarda görünür:

- kimlik bilgisinin ilkesi sağlayıcısını verir;
- sağlayıcı bağlantısı etkin ve hazırdır;
- katalog modeli desteklenen bir LLM yeteneği duyurur; ve
- katalog, Plugin tarafından desteklenen bir aktarım sözleşmesi sunar.

Bu nedenle desteklenen bir ClawRouter sağlayıcısına başka bir model eklemek için OpenClaw sürümü veya başka bir sağlayıcı Plugin'i gerekmez. Sonraki katalog yenilemesi onu keşfeder. Yeni bir tel protokolüne ihtiyaç duyan bir modelin, OpenClaw tarafından duyurulmadan önce ClawRouter Plugin'inde desteklenmesi gerekir.

## Protokol ve sağlayıcı Plugin'leri

Her yukarı akış şirketinin kimlik doğrulama Plugin'ini kurmanız gerekmez. ClawRouter yukarı akış kimlik bilgilerine sahiptir; kataloğu OpenClaw'a hangi aktarımın kullanılacağını söyler. Plugin şunları destekler:

| Katalog rotası                 | OpenClaw aktarımı      |
| ------------------------------ | ---------------------- |
| OpenAI uyumlu sohbet           | `openai-completions`   |
| OpenAI uyumlu Responses        | `openai-responses`     |
| Yerel Anthropic Messages       | `anthropic-messages`   |
| Yerel Google Gemini akışı      | `google-generative-ai` |

Plugin ayrıca bu aileler için eşleşen tekrar oynatma ve araç şeması ilkelerini uygular. Başka bir istek/akış biçimi kullanan katalog satırları kasıtlı olarak OpenClaw metin modelleri olarak duyurulmaz. Uyumsuz bir yük göndermek yerine bu sağlayıcıları ClawRouter'da desteklenen sözleşmelerden birine normalleştirin.

## Kotalar ve kullanım

ClawRouter'ın `/v1/usage` yanıtı normal OpenClaw sağlayıcı kullanım yüzeylerini besler. `/status` ve ilgili pano durumu, anahtarın bir sınırı olduğunda aylık bütçe penceresini; ayrıca istek, token ve harcama toplamlarını gösterir. Ölçümlenmeyen anahtarlar yine de yüzde penceresi olmadan toplam kullanımı gösterir.

Kota araması, model keşfiyle aynı kapsamlı anahtarı kullanır. Başarısız bir kota araması model yürütmeyi engellemez.

Canlı anlık görüntüyü şununla kontrol edin:

```bash
openclaw status --usage
openclaw models status
```

Aynı sağlayıcı anlık görüntüsü sohbette `/status` ve OpenClaw'ın kullanım kullanıcı arayüzü için kullanılabilir. Bütçe ilke geneline aittir, bu nedenle aynı ClawRouter ilkesini kullanan başka bir istemci tarafından yapılan istekler kalan yüzdeyi değiştirebilir.

## Sorun giderme

| Belirti                                  | Kontrol                                                                                                                                        |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| ClawRouter modeli yok                    | Plugin'in etkin olduğunu ve `plugins.allow` tarafından izin verildiğini doğrulayın, ardından kimlik bilgisinin etkin olduğunu ve en az bir hazır sağlayıcı verdiğini kontrol edin. |
| Yapılandırılmış bir ClawRouter modeli eksik | `/v1/catalog` yeteneğini ve rota biçimini inceleyin. Desteklenmeyen aktarım sözleşmeleri kasıtlı olarak filtrelenir.                         |
| `Unknown model: clawrouter/...`          | Bu yapılandırma haritası izin listesi olarak kullanılıyorsa tam katalog başvurusunu `agents.defaults.models` içine ekleyin.                    |
| Katalog veya kullanımdan `401` ya da `403` | ClawRouter kimlik bilgisini yeniden verin veya yeniden kapsamlandırın; OpenClaw yukarı akış sağlayıcı anahtarlarına geri dönmez.              |
| Model çağrısı keşiften sonra başarısız oluyor | ClawRouter'da sağlayıcı bağlantısını ve yukarı akış sağlığını kontrol edin, ardından hazırlık durumu düzeldikten sonra yeniden deneyin.       |
| Kullanımda toplamlar var ama yüzde yok   | İlke ölçümlenmemiştir; yüzde penceresi göstermek için ClawRouter'da aylık bütçe ekleyin.                                                       |

## Güvenlik davranışı

- Katalog keşfi yapılandırılmış proxy anahtarıyla kapsamlandırılır ve anahtar başına önbelleğe alınır.
- Proxy anahtarı yalnızca istek gönderimi sırasında eklenir; model meta verilerinde saklanmaz.
- Yerel Anthropic ve Gemini model kimlikleri yalnızca gönderim sırasında yukarı akış kimliklerine yeniden yazılır.
- Desteklenmeyen veya verilmeyen katalog satırları kapalı biçimde başarısız olur ve seçilebilir değildir.

## İlgili

<CardGroup cols={2}>
  <Card title="Model providers" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcı yapılandırması ve model seçimi.
  </Card>
  <Card title="Usage tracking" href="/tr/concepts/usage-tracking" icon="chart-line">
    OpenClaw kullanım ve durum yüzeyleri.
  </Card>
</CardGroup>
