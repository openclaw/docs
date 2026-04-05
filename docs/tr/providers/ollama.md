---
read_when:
    - OpenClaw'ı Ollama üzerinden bulut veya yerel modellerle çalıştırmak istiyorsanız
    - Ollama kurulumu ve yapılandırması hakkında yönlendirmeye ihtiyacınız varsa
summary: OpenClaw'ı Ollama ile çalıştırma (bulut ve yerel modeller)
title: Ollama
x-i18n:
    generated_at: "2026-04-05T14:04:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 337b8ec3a7756e591e6d6f82e8ad13417f0f20c394ec540e8fc5756e0fc13c29
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

Ollama, makinenizde açık kaynak modeller çalıştırmayı kolaylaştıran yerel bir LLM çalışma zamanıdır. OpenClaw, Ollama'nın yerel API'siyle (`/api/chat`) entegre olur, akış ve araç çağırmayı destekler ve `OLLAMA_API_KEY` (veya bir auth profili) ile etkinleştirmeyi seçtiğinizde ve açık bir `models.providers.ollama` girdisi tanımlamadığınızda yerel Ollama modellerini otomatik olarak keşfedebilir.

<Warning>
**Uzak Ollama kullanıcıları**: OpenClaw ile `/v1` OpenAI uyumlu URL'yi (`http://host:11434/v1`) kullanmayın. Bu, araç çağırmayı bozar ve modeller ham araç JSON'unu düz metin olarak çıkarabilir. Bunun yerine yerel Ollama API URL'sini kullanın: `baseUrl: "http://host:11434"` (`/v1` olmadan).
</Warning>

## Hızlı başlangıç

### Onboarding (önerilen)

Ollama kurmanın en hızlı yolu onboarding üzerinden geçer:

```bash
openclaw onboard
```

Sağlayıcı listesinden **Ollama** seçin. Onboarding şunları yapar:

1. Ollama örneğinize erişilebilen Ollama temel URL'sini sorar (varsayılan `http://127.0.0.1:11434`).
2. **Cloud + Local** (bulut modelleri ve yerel modeller) veya **Local** (yalnızca yerel modeller) seçmenize izin verir.
3. **Cloud + Local** seçerseniz ve ollama.com'da oturum açmamışsanız tarayıcıda bir oturum açma akışı açar.
4. Kullanılabilir modelleri keşfeder ve varsayılanlar önerir.
5. Seçilen model yerelde mevcut değilse onu otomatik olarak çeker.

Etkileşimsiz mod da desteklenir:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --accept-risk
```

İsteğe bağlı olarak özel bir temel URL veya model belirtebilirsiniz:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

### Manuel kurulum

1. Ollama'yı kurun: [https://ollama.com/download](https://ollama.com/download)

2. Yerel çıkarım istiyorsanız yerel bir model çekin:

```bash
ollama pull glm-4.7-flash
# veya
ollama pull gpt-oss:20b
# veya
ollama pull llama3.3
```

3. Bulut modellerini de istiyorsanız oturum açın:

```bash
ollama signin
```

4. Onboarding çalıştırın ve `Ollama` seçin:

```bash
openclaw onboard
```

- `Local`: yalnızca yerel modeller
- `Cloud + Local`: yerel modeller ve bulut modelleri
- `kimi-k2.5:cloud`, `minimax-m2.5:cloud` ve `glm-5:cloud` gibi bulut modelleri için yerel `ollama pull` **gerekmez**

OpenClaw şu anda şunları önerir:

- yerel varsayılan: `glm-4.7-flash`
- bulut varsayılanları: `kimi-k2.5:cloud`, `minimax-m2.5:cloud`, `glm-5:cloud`

5. Manuel kurulum tercih ediyorsanız Ollama'yı doğrudan OpenClaw için etkinleştirin (herhangi bir değer çalışır; Ollama gerçek bir anahtar gerektirmez):

```bash
# Ortam değişkenini ayarlayın
export OLLAMA_API_KEY="ollama-local"

# Veya yapılandırma dosyanızda yapılandırın
openclaw config set models.providers.ollama.apiKey "ollama-local"
```

6. Modelleri inceleyin veya değiştirin:

```bash
openclaw models list
openclaw models set ollama/glm-4.7-flash
```

7. Ya da yapılandırmada varsayılanı ayarlayın:

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/glm-4.7-flash" },
    },
  },
}
```

## Model keşfi (örtük sağlayıcı)

`OLLAMA_API_KEY` (veya bir auth profili) ayarladığınızda ve `models.providers.ollama` tanımlamadığınızda, OpenClaw yerel Ollama örneğindeki modelleri `http://127.0.0.1:11434` adresinden keşfeder:

- `/api/tags` sorgulanır
- Kullanılabilir olduğunda `contextWindow` okumak için en iyi çabayla `/api/show` aramaları kullanılır
- Model adı sezgisiyle (`r1`, `reasoning`, `think`) `reasoning` işaretlenir
- `maxTokens`, OpenClaw'ın kullandığı varsayılan Ollama maksimum token sınırına ayarlanır
- Tüm maliyetler `0` olarak ayarlanır

Bu, katalogu yerel Ollama örneğiyle uyumlu tutarken manuel model girdilerinden kaçınır.

Hangi modellerin kullanılabilir olduğunu görmek için:

```bash
ollama list
openclaw models list
```

Yeni bir model eklemek için Ollama ile çekmeniz yeterlidir:

```bash
ollama pull mistral
```

Yeni model otomatik olarak keşfedilir ve kullanılabilir hale gelir.

`models.providers.ollama` öğesini açıkça ayarlarsanız otomatik keşif atlanır ve modelleri manuel olarak tanımlamanız gerekir (aşağıya bakın).

## Yapılandırma

### Temel kurulum (örtük keşif)

Ollama'yı etkinleştirmenin en basit yolu ortam değişkeni kullanmaktır:

```bash
export OLLAMA_API_KEY="ollama-local"
```

### Açık kurulum (manuel modeller)

Aşağıdaki durumlarda açık yapılandırma kullanın:

- Ollama başka bir ana makinede/bağlantı noktasında çalışıyordur.
- Belirli bağlam pencerelerini veya model listelerini zorlamak istiyorsunuzdur.
- Tamamen manuel model tanımları istiyorsunuzdur.

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
        apiKey: "ollama-local",
        api: "ollama",
        models: [
          {
            id: "gpt-oss:20b",
            name: "GPT-OSS 20B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 8192,
            maxTokens: 8192 * 10
          }
        ]
      }
    }
  }
}
```

`OLLAMA_API_KEY` ayarlanmışsa, sağlayıcı girdisindeki `apiKey` alanını atlayabilirsiniz; OpenClaw bunu kullanılabilirlik denetimleri için doldurur.

### Özel temel URL (açık yapılandırma)

Ollama farklı bir ana makinede veya bağlantı noktasında çalışıyorsa (açık yapılandırma otomatik keşfi devre dışı bırakır, bu yüzden modelleri manuel tanımlayın):

```json5
{
  models: {
    providers: {
      ollama: {
        apiKey: "ollama-local",
        baseUrl: "http://ollama-host:11434", // /v1 yok - yerel Ollama API URL'sini kullanın
        api: "ollama", // Yerel araç çağırma davranışını garanti etmek için açıkça ayarlayın
      },
    },
  },
}
```

<Warning>
URL'ye `/v1` eklemeyin. `/v1` yolu OpenAI uyumlu modu kullanır; bu modda araç çağırma güvenilir değildir. Yol son eki olmayan temel Ollama URL'sini kullanın.
</Warning>

### Model seçimi

Yapılandırıldıktan sonra tüm Ollama modelleriniz kullanılabilir olur:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## Bulut modelleri

Bulut modelleri, bulutta barındırılan modelleri (örneğin `kimi-k2.5:cloud`, `minimax-m2.5:cloud`, `glm-5:cloud`) yerel modellerinizle birlikte çalıştırmanıza olanak tanır.

Bulut modellerini kullanmak için kurulum sırasında **Cloud + Local** modunu seçin. Sihirbaz oturum açıp açmadığınızı denetler ve gerektiğinde tarayıcıda oturum açma akışı açar. Kimlik doğrulama doğrulanamazsa sihirbaz yerel model varsayılanlarına geri döner.

Doğrudan [ollama.com/signin](https://ollama.com/signin) adresinde de oturum açabilirsiniz.

## Ollama Web Search

OpenClaw ayrıca paketlenmiş bir `web_search`
sağlayıcısı olarak **Ollama Web Search** desteği sunar.

- Yapılandırılmış Ollama ana makinenizi kullanır (`models.providers.ollama.baseUrl`
  ayarlıysa onu, değilse `http://127.0.0.1:11434`).
- Anahtarsızdır.
- Ollama'nın çalışmasını ve `ollama signin` ile oturum açılmış olmasını gerektirir.

`openclaw onboard` veya
`openclaw configure --section web` sırasında **Ollama Web Search** seçin ya da şunu ayarlayın:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Tam kurulum ve davranış ayrıntıları için [Ollama Web Search](/tools/ollama-search) bölümüne bakın.

## Gelişmiş

### Reasoning modelleri

OpenClaw varsayılan olarak `deepseek-r1`, `reasoning` veya `think` gibi adlara sahip modelleri reasoning yetenekli olarak değerlendirir:

```bash
ollama pull deepseek-r1:32b
```

### Model Maliyetleri

Ollama ücretsizdir ve yerelde çalışır, bu nedenle tüm model maliyetleri $0 olarak ayarlanır.

### Akış Yapılandırması

OpenClaw'ın Ollama entegrasyonu varsayılan olarak **yerel Ollama API'sini** (`/api/chat`) kullanır; bu API akışı ve araç çağırmayı aynı anda tam olarak destekler. Özel bir yapılandırma gerekmez.

#### Eski OpenAI Uyumlu Mod

<Warning>
**Araç çağırma OpenAI uyumlu modda güvenilir değildir.** Bu modu yalnızca bir proxy için OpenAI biçimine ihtiyaç duyuyorsanız ve yerel araç çağırma davranışına bağlı değilseniz kullanın.
</Warning>

Bunun yerine OpenAI uyumlu uç noktayı kullanmanız gerekiyorsa (örneğin yalnızca OpenAI biçimini destekleyen bir proxy arkasında), `api: "openai-completions"` değerini açıkça ayarlayın:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: true, // varsayılan: true
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

Bu mod aynı anda akış + araç çağırmayı desteklemeyebilir. Model yapılandırmasında `params: { streaming: false }` ile akışı devre dışı bırakmanız gerekebilir.

Ollama ile `api: "openai-completions"` kullanıldığında, OpenClaw varsayılan olarak `options.num_ctx` ekler; böylece Ollama sessizce 4096 bağlam penceresine geri dönmez. Proxy/yukarı akış bilinmeyen `options` alanlarını reddediyorsa bu davranışı devre dışı bırakın:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: false,
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

### Bağlam pencereleri

Otomatik keşfedilen modeller için OpenClaw, kullanılabiliyorsa Ollama tarafından bildirilen bağlam penceresini kullanır; aksi takdirde OpenClaw'ın kullandığı varsayılan Ollama bağlam penceresine geri döner. Açık sağlayıcı yapılandırmasında `contextWindow` ve `maxTokens` değerlerini geçersiz kılabilirsiniz.

## Sorun giderme

### Ollama algılanmıyor

Ollama'nın çalıştığından ve `OLLAMA_API_KEY` (veya bir auth profili) ayarladığınızdan ve açık bir `models.providers.ollama` girdisi tanımlamadığınızdan **emin olun**:

```bash
ollama serve
```

Ve API'nin erişilebilir olduğunu doğrulayın:

```bash
curl http://localhost:11434/api/tags
```

### Kullanılabilir model yok

Modeliniz listelenmiyorsa şu seçeneklerden birini kullanın:

- Modeli yerel olarak çekin veya
- Modeli `models.providers.ollama` içinde açıkça tanımlayın.

Model eklemek için:

```bash
ollama list  # Kurulu olanları görün
ollama pull glm-4.7-flash
ollama pull gpt-oss:20b
ollama pull llama3.3     # Veya başka bir model
```

### Bağlantı reddedildi

Ollama'nın doğru bağlantı noktasında çalıştığını kontrol edin:

```bash
# Ollama'nın çalışıp çalışmadığını kontrol edin
ps aux | grep ollama

# Veya Ollama'yı yeniden başlatın
ollama serve
```

## Ayrıca bkz.

- [Model Sağlayıcıları](/tr/concepts/model-providers) - Tüm sağlayıcıların genel görünümü
- [Model Seçimi](/tr/concepts/models) - Modeller nasıl seçilir
- [Yapılandırma](/tr/gateway/configuration) - Tam yapılandırma başvurusu
