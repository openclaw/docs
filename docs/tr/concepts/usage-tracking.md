---
read_when:
    - Sağlayıcı kullanım/kota yüzeylerini bağlıyorsunuz
    - Kullanım izleme davranışını veya kimlik doğrulama gereksinimlerini açıklamanız gerekir
summary: Kullanım takibi yüzeyleri ve kimlik bilgisi gereksinimleri
title: Kullanım takibi
x-i18n:
    generated_at: "2026-07-12T12:15:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c413dcbe838d94c57ba3f6ef9609331e139de6d0abbdb3860753a519bd490314
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Nedir

- Sağlayıcı kullanımını/kotasını doğrudan her sağlayıcının kullanım uç noktasından alır. Tahmini sağlayıcı faturalandırması yoktur; yalnızca sağlayıcının bildirdiği plan adları, kota aralıkları, bakiyeler, harcamalar, bütçeler, günlük maliyet geçmişi, token/model ilişkilendirmesi veya hesap durumu özetleri kullanılır.
- İnsanlar tarafından okunabilir kota aralığı çıktısı, sağlayıcı tüketilen kotayı, kalan kotayı veya yalnızca ham sayıları bildirse bile `X% kaldı` biçimine normalleştirilir. Sıfırlanabilir kota aralıkları olmayan sağlayıcılar bunun yerine sağlayıcı özet metnini (örneğin bir bakiye) gösterir.
- Oturum düzeyindeki `/status` ve `session_status` aracı, canlı oturum anlık görüntüsünde token/model verileri eksik olduğunda oturumun transkript günlüğüne geri döner. Bu geri dönüş eksik token/önbellek sayaçlarını doldurur, etkin çalışma zamanı model etiketini kurtarabilir ve oturum meta verileri eksik veya daha küçük olduğunda (`totalTokensFresh !== true`, sıfır ya da transkriptten türetilen değerin altında) istem odaklı daha büyük toplamı tercih eder. Sıfır olmayan canlı değerler her zaman geri dönüşe göre önceliklidir.

## Nerede görünür

- Sohbetlerde `/status`: oturum token'larını ve tahmini maliyeti içeren durum kartı (yalnızca API anahtarı kullanılan modeller). Sağlayıcı kullanımı, mevcut olduğunda **geçerli model sağlayıcısı** için normalleştirilmiş bir `X% kaldı` aralığı veya sağlayıcı özet metni olarak gösterilir.
- Sohbetlerde `/usage off|tokens|full`: yanıt başına kullanım altbilgisi.
- Sohbetlerde `/usage cost`: OpenClaw oturum günlüklerinden birleştirilen yerel maliyet özeti.
- CLI: `openclaw status --usage`, sağlayıcı başına tam kullanım/kota dökümünü yazdırır.
- CLI: `openclaw models status`, OAuth/token kimlik doğrulama profillerini listeler ve kullanım aralığı olan her sağlayıcının yanında bunun özetini gösterir.
- Denetim Arayüzü: **Kullanım**, OpenClaw'ın oturumdan türetilen token ve tahmini maliyet analizinin üzerinde sağlayıcı planı ve faturalandırma kartlarını gösterir. Anthropic ve OpenAI Admin API kimlik bilgileri, sağlayıcı tarafından bildirilen bugünkü, 7 günlük ve 30 günlük harcamayı; günlük eğilimleri, token toplamlarını, en çok kullanılan modelleri ve maliyet kategorilerini ekler.
- Denetim Arayüzü: sohbet oluşturucunun bağlam halkası açılır penceresi, abonelik sağlayıcıları için **plan kullanımını** gösterir: sıfırlanma zamanlarıyla birlikte aralık başına çubuklar (5 saatlik, haftalık, model kapsamlı), biliniyorsa sağlayıcı planı (örneğin `Max (20x)`) ve ek kullanım kredileri. Plan üzerinden faturalandırılan oturumlar token başına dolar tahminlerini gizler; API üzerinden faturalandırılan oturumlar `Tahm. maliyet` ve türe göre maliyet dökümünü göstermeye devam eder. Claude Code CLI (`claude-cli`) kurulumları aynı Anthropic abonelik kullanımını yeniden kullanır.
- macOS menü çubuğu: sağlayıcı kullanım anlık görüntüleri mevcut olduğunda Bağlam'ın altında kök düzeyinde bir "Kullanım" bölümü görünür. Bkz. [Menü çubuğu](/tr/platforms/mac/menu-bar).

`openclaw channels list` artık sağlayıcı kullanımını yazdırmaz; bunun yerine kullanıcıları `openclaw status` veya `openclaw models list` komutuna yönlendirir.

## Anthropic ve OpenAI maliyet geçmişi

Abonelik kotası ile API faturalandırması farklı sağlayıcı yüzeyleridir:

- Anthropic abonelik/kurulum kimlik bilgileri Claude kota aralıklarını ve isteğe bağlı ek kullanım bütçelerini göstermeye devam eder. Bunun yerine kuruluş Kullanım ve Maliyet API'si geçmişini göstermek için `ANTHROPIC_ADMIN_KEY` veya `ANTHROPIC_ADMIN_API_KEY` ayarlayın. `sk-ant-admin` ile başlayan bir Anthropic sağlayıcı kimlik bilgisi otomatik olarak algılanır.
- OpenAI ChatGPT/Codex OAuth, planı, kota aralıklarını ve kredi bakiyesini göstermeye devam eder. Bunun yerine kuruluş maliyetini ve tamamlama kullanım geçmişini göstermek için `OPENAI_ADMIN_KEY` ayarlayın; isteğe bağlı olarak kapsamı tek bir projeyle sınırlamak için `OPENAI_PROJECT_ID` ayarlayın. Bu anahtarlar özel uç noktalara ait olabileceğinden OpenClaw, `OPENAI_API_KEY`, sağlayıcı yapılandırması veya kimlik doğrulama profillerindeki çıkarım kimlik bilgilerini kuruluş API'lerine hiçbir zaman göndermez.

Yönetici kimlik bilgileri, gerçek kuruluş faturalandırmasını sağladıkları için önceliklidir. OpenClaw, sağlayıcının bildirdiği bu toplamları yerel oturum tahminleriyle birleştirmez; iki bölüm bilinçli olarak farklı soruları yanıtlar.

## Varsayılan kullanım altbilgisi modu

`/usage off|tokens|full`, bir oturumun altbilgisini ayarlar ve bu seçim söz konusu
oturum için hatırlanır. `messages.responseUsage`, henüz seçim yapmamış oturumların
modunu başlangıçta belirler; böylece her seferinde `/usage` yazmadan altbilgi
varsayılan olarak açık olabilir.

Her kanal için tek bir mod veya `default` geri dönüşü içeren kanal başına bir eşleme ayarlayın:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // veya: { "default": "off", "discord": "full" }
  },
}
```

Kabul edilen değerler: `"off"`, `"tokens"`, `"full"` ve eski diğer ad `"on"` (`"tokens"` olarak değerlendirilir).

### Üç farklı oturum durumu

Bir oturumun `responseUsage` alanının temsil edilebilir üç durumu vardır ve her
birinin anlamı farklıdır:

| Durum                      | Saklanan değer                  | Etkin mod                                                               |
| -------------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| **Ayarlanmamış / devral**  | `undefined` (yok)               | `messages.responseUsage` yapılandırma varsayılanına, ardından `off` değerine geçer. |
| **Açıkça kapalı**          | `"off"` (saklanır)              | Her zaman kapalıdır; kapalı olmayan bir yapılandırma varsayılanı altbilgiyi yeniden etkinleştiremez. |
| **Açıkça açık**            | `"tokens"` veya `"full"` (saklanır) | Yapılandırma varsayılanından bağımsız olarak bu mod kullanılır.          |

### Öncelik

Etkin mod = oturum geçersiz kılması → kanal yapılandırma girdisi → `default` → `off`.

Açıkça verilen `/usage off`, oturumda `"off"` değişmez değeri olarak
**kalıcılaştırılır**; bu, "ayarlanmamış" ile aynı değildir. Kapalı olmayan bir
`messages.responseUsage` varsayılanı, kullanıcı açıkça devre dışı bıraktıktan
sonra altbilgiyi yeniden açamaz.

### Sıfırlama ile kapatma arasındaki fark

- `/usage off`, altbilgiyi kapalı olmaya zorlar ve bu seçimi kalıcılaştırır.
  Yapılandırılmış kapalı olmayan bir varsayılan bunu geçersiz kılamaz.
- `/usage reset` (diğer adlar: `default`, `inherit`, `inherited`, `clear`, `unpin`) oturum
  geçersiz kılmasını temizler. Ardından oturum, etkin yapılandırma varsayılanını
  (`messages.responseUsage`) **devralır**. Herhangi bir varsayılan yapılandırılmamışsa altbilgi kapalı kalır.
- Tam oturum sıfırlaması (`/reset` veya `/new`) ya da oturum devri, kullanıcının
  görüntüleme seçiminin oturum devirlerinde korunması için açık kullanım modu
  tercihini **korur**. Geçersiz kılmayı yalnızca `/usage reset` (ve diğer adları) temizler.

### Geçiş davranışı

Bağımsız değişken olmadan `/usage` şu sırayla geçiş yapar: kapalı → token'lar → tam → kapalı. Döngünün
başlangıç noktası **etkin** geçerli moddur (ayarlanmamışsa oturum geçersiz kılması
yapılandırma varsayılanına geçer); böylece döngü her zaman kullanıcının
altbilgide o anda gördüğüyle eşleşir.

### Yapılandırma

Yapılandırma yoksa önceki davranış korunur (altbilgi, `/usage` kullanılana kadar kapalıdır).
Oturum geçersiz kılmasını temizleyip yapılandırılmış varsayılanı yeniden devralmak için
`/usage reset` kullanın.

## Özel `/usage full` altbilgisi

`/usage tokens` her zaman düz bir `Usage: X in / Y out` satırı (mevcut olduğunda
önbellek ve tahmini maliyet son ekleriyle birlikte) oluşturur. Aşağıda açıklanan
daha zengin altbilgiyi yalnızca `/usage full` oluşturur.

`/usage full`, bu alanlar mevcut olduğunda model, akıl yürütme, hızlı/yavaş,
bağlam penceresi ve maliyet bilgilerini içeren yerleşik, kompakt bir altbilgi gösterir.
Yerleşik altbilgi için şablon dosyası gerekmez.

`messages.usageTemplate` yalnızca gelişmiş özel düzenler içindir. Değer, bir
JSON dosya yolu (`~` desteklenir) veya satır içi nesnedir ve geçerli olduğunda
yerleşik altbilginin yerini alır. Dosya yolu izlenir ve değişiklik olduğunda canlı olarak yeniden yüklenir.

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Eksik veya boş şablonlar sessizce yerleşik altbilgiye geri döner. Okunamayan
veya geçersiz yapılandırılmış şablonlar (bozuk JSON ya da oluşturulabilir çıktı
parçası bulunmayan bir şekil) da yerleşik altbilgiye geri döner ve operatör uyarısı verir.

Özel şablonlara yerleşik şekille başlayın, ardından değiştirmek istediğiniz
bölümleri düzenleyin:

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": {
    "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿",
    "block": "░▏▎▍▌▋▊▉█",
    "shade": "░▒▓█",
    "moon": "🌑🌘🌗🌖🌕",
    "level": "▁▂▃▄▅▆▇█",
    "weather": ["🥶", "☁️", "🌥", "⛅️", "🌤", "☀️"],
    "plants": ["🪾", "🍂", "🌱", "☘️", "🍀", "🌿"],
    "moons6": ["🌑", "🌚", "🌘", "🌗", "🌖", "🌝"],
  },
  "aliases": {
    "models": {
      "claude-opus-4-6": "opus46",
      "claude-opus-4-8": "opus48",
      "claude-sonnet-4-6": "sonnet46",
      "claude-haiku-4-5": "haiku45",
      "gpt-5.5": "gpt5.5",
    },
    "reasoning": {
      "off": "🌑",
      "minimal": "🌚",
      "low": "🌘",
      "medium": "🌗",
      "high": "🌕",
      "xhigh": "🌝",
    },
  },
  "output": {
    "sep": "",
    "default": [
      { "text": "{model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": "🔄" } },
      { "map": "model.is_override", "cases": { "true": "📌" } },
      { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
      {
        "when": "context.max_tokens",
        "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### Şekil

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // string (1 glyph/char) or array
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // joins surviving pieces
    "default": [/* pieces */], // fallback for any surface
    "surfaces": {
      "discord": [/* pieces */],
      "telegram": [/* pieces */],
    },
  },
}
```

Her yüzey sıralı bir **parçalar** listesidir; motor her birini oluşturur, boşları
atar ve kalanları `sep` ile birleştirir. Girdisi olmayan bir yüzey
`output.default` değerini kullanır.

### Sözleşme Yolları

Bir parça, değerleri dönüş başına sözleşmeden noktalı yol aracılığıyla okur. Olmayan değerler
boştur (böylece bir `when` koruması veya `|fallback`, parçayı temiz tutar).

| Yol                                                                                 | Anlamı                                                                                                          |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `surface`                                                                           | kanal kimliği (`discord`/`telegram`/vb.)                                                                        |
| `agentId` / `chat_type`                                                             | sahip olan ajan kimliği / sohbet yüzeyi türü                                                                    |
| `model.id` / `model.display_name` / `model.provider`                                | model kimliği / görünen ad / sağlayıcı kimliği                                                                  |
| `model.actual`, `model.resolved_ref`                                                | tur için gerçekten kullanılan sağlayıcı/model başvurusu                                                         |
| `model.requested`                                                                   | istenen sağlayıcı/model başvurusu (geri dönüşten önce)                                                          |
| `model.reasoning`                                                                   | efor (`off` ile `xhigh` arası)                                                                                  |
| `model.is_fallback` / `model.is_override`                                           | mantıksal değer: geri dönüş kullanıldı / model sabitlendi                                                       |
| `model.override_source` / `model.auth_mode`                                         | geçersiz kılma kaynağı etiketi / kimlik bilgisi modu (`oauth`, `api-key`, `token`, `mixed`, `aws-sdk`, `unknown`) |
| `state.fast_mode`                                                                   | mantıksal değer: hızlı veya yavaş                                                                               |
| `state.compactions`                                                                 | oturumun Compaction sayısı                                                                                      |
| `context.max_tokens` / `context.used_tokens` / `context.pct_used`                   | pencere bütçesi / kullanılan tokenlar / kullanılan 0-100                                                       |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | tur toplamı                                                                                                     |
| `usage.cache_read_tokens` / `usage.cache_write_tokens`                              | tur için önbellekten okunan ve önbelleğe yazılan tokenlar                                                       |
| `usage.has_tokens` / `usage.has_split_tokens` / `usage.has_total_only_tokens`       | token görüntüleme korumaları                                                                                    |
| `usage.cache_hit_pct`                                                               | toplam istem tokenları içindeki önbellekten okuma payı                                                          |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | yalnızca son model çağrısı (`cache_read_tokens`, `cache_write_tokens`, `total_tokens` da bulunur)                |
| `cost.turn_usd` / `cost.available`                                                  | tahmini tur maliyeti / bir maliyet tablosunun çözümlenip çözümlenmediği                                         |
| `timing.duration_ms`                                                                | gerçek zamana göre tur süresi                                                                                   |
| `identity.name` / `identity.emoji` / `identity.avatar`                              | ajan kimliği adı / emoji / avatar                                                                               |
| `session.id`                                                                        | oturum kimliği                                                                                                  |

(Sağlayıcı hız sınırı pencereleri bu sözleşmede **yer almaz**; günümüzde dizi değerli bir yol bulunmadığından bir `each` parçasının yineleyebileceği hiçbir şey yoktur.)

### Fiiller

Bir değeri fiillerden soldan sağa doğru geçirin; fiil olmayan bir bölüm geri dönüş değeridir.

| Fiil            | Etki                                            | Örnek                             |
| --------------- | ----------------------------------------------- | --------------------------------- |
| `num`           | kompakt sayı                                    | `272000 -> 272k`                  |
| `fixed:N`       | N ondalık basamak (varsayılan 2)                | `0.0377`                          |
| `dur`           | saniyeyi süreye dönüştürür                      | `14820 -> 4h07m`                  |
| `pct`           | `%` ekler                                       | `96 -> 96%`                       |
| `inv`           | `100 - x`                                       | kullanılandan kalana dönüştürmek için |
| `alias:TABLE`   | `aliases` içinde arar, listelenmemişse aynen döndürür | `medium -> 🌗`              |
| `meter:W:SCALE` | 0-100 değeri üzerinde W hücreli glif çubuğu     | `[⣿⣿⠐⠐⠐]` (`meter:1` = bir glif) |

### Parça biçimleri

- `{ "text": "📚 {context.max_tokens|num}" }`: sabit metin + değer ekleme.
- `{ "when": "<path>", "text": "..." }`: yalnızca yolun değeri doğruysa oluşturur.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: değeri glife dönüştürür (bir `_default` durumu eşleşmeyen değerleri kapsar).
- `{ "each": "<array-path>", "item": "{label}" }`: dizi değerli bir yolu yineler (mevcut sözleşmedeki hiçbir yol dizi değildir).

### Örnek

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿" },
  "aliases": { "reasoning": { "medium": "🌗", "high": "🌕" } },
  "output": {
    "surfaces": {
      "discord": [
        { "text": "{model.display_name}" },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
      ],
    },
  },
}
```

örneğin `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k` olarak oluşturulur.

## Sağlayıcılar + kimlik bilgileri

Kullanılabilir bir sağlayıcı kullanım yetkilendirmesi çözümlenemediğinde kullanım gizlenir. OpenClaw, `contracts.usageProviders` bildiren ve hem `resolveUsageAuth` hem de `fetchUsageSnapshot` uygulayan etkin sağlayıcı pluginlerini otomatik olarak keşfeder; ayrı bir çekirdek sağlayıcı izin listesi yoktur. Statik sözleşme, her sağlayıcı pluginini içe aktarmadan keşfin kapsamını sınırlar. Her plugin kendi üst sistem uç noktasına ve yanıt eşlemesine sahiptir. Paylaşılan anlık görüntü; plan adlarını, kota pencerelerini, bakiyeleri, harcamaları ve bütçeleri CLI, uygulama ve Control UI tüketicileri için sağlayıcıdan bağımsız tutar.

- **Anthropic (Claude)**: Kimlik doğrulama profillerindeki OAuth tokenları. OAuth tokenında `user:profile` kapsamı yoksa ve ayarlanmışsa bir `claude.ai` web oturumuna (`CLAUDE_AI_SESSION_KEY`, `CLAUDE_WEB_SESSION_KEY` veya `CLAUDE_WEB_COOKIE` içindeki bir `sessionKey=` çerezi) geri döner. Anthropic bildirdiğinde model kapsamlı sınırlar ve etkinleştirilmiş ek kullanımın aylık harcamaları/bütçeleri dahil edilir. Bunun yerine açıkça belirtilmiş bir Anthropic Admin API anahtarı veya otomatik algılanan bir `sk-ant-admin...` sağlayıcı profili, 30 günlük kuruluş maliyetini ve Messages API geçmişini gösterir.
- **ClawRouter**: API anahtarı (`CLAWROUTER_API_KEY`). Yapılandırıldığında aylık bir bütçe penceresi ve türü belirtilmiş USD bütçesi gösterir; aksi takdirde toplam harcamayı ve istek/token/maliyet özetini gösterir.
- **DeepSeek**: Ortam/yapılandırma/kimlik doğrulama deposu üzerinden API anahtarı (`DEEPSEEK_API_KEY`). Sağlayıcının bildirdiği her para birimi bakiyesini gösterir.
- **GitHub Copilot**: Kimlik doğrulama profillerindeki OAuth tokenları.
- **Gemini CLI**: Kimlik doğrulama profillerindeki OAuth tokenları.
- **MiniMax**: API anahtarı veya MiniMax OAuth kimlik doğrulama profili. OpenClaw, `minimax`, `minimax-cn` ve `minimax-portal` değerlerini aynı MiniMax kota yüzeyi olarak ele alır; varsa depolanmış MiniMax OAuth'u tercih eder, aksi takdirde `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` veya `MINIMAX_API_KEY` değerine geri döner. Kullanım yoklaması, yapılandırılmışsa Coding Plan sunucusunu `models.providers.minimax-portal.baseUrl` veya `models.providers.minimax.baseUrl` değerinden türetir; aksi takdirde MiniMax CN sunucusunu kullanır. MiniMax'in ham `usage_percent` / `usagePercent` alanları **kalan** kotayı ifade eder; bu nedenle OpenClaw bunları görüntülemeden önce tersine çevirir. Mevcut olduğunda sayı tabanlı alanlar önceliklidir.
  - Pencere etiketleri, mevcut olduğunda sağlayıcının saat/dakika alanlarından gelir; ardından `start_time` / `end_time` aralığına geri döner.
  - Coding Plan uç noktası `model_remains` döndürürse OpenClaw sohbet modeli girdisini tercih eder, açık `window_hours` / `window_minutes` alanları bulunmadığında pencere etiketini zaman damgalarından türetir ve model adını plan etiketine dahil eder.
- **OpenAI (Codex/ChatGPT planı)**: Kimlik doğrulama profillerindeki OAuth tokenları (bir hesap kimliği mevcut olduğunda `ChatGPT-Account-Id` üstbilgisi gönderilir). ChatGPT planını, sıfırlanabilir Codex pencerelerini ve bildirildiğinde kredi bakiyesini gösterir. Krediler sağlayıcı kredisi olarak kalır; OpenClaw bunları dolar olarak etiketlemez. `OPENAI_ADMIN_KEY`, anahtar Usage Dashboard erişimine sahip olduğunda 30 günlük kuruluş maliyetini ve tamamlama kullanım geçmişini ekler. Çıkarım kimlik bilgileri hiçbir zaman kuruluş API'lerine iletilmez.
- **OpenRouter**: API anahtarı veya OAuth destekli API anahtarı (`OPENROUTER_API_KEY` ya da bir kimlik doğrulama profili). Hesap kredileri uç noktasını anahtar kota uç noktasıyla birleştirir; böylece kimlik bilgisi bunlara erişebildiğinde hesap bakiyesi/harcaması, anahtar bütçesi ve günlük/haftalık/aylık kullanım görünür. Her iki uç nokta da anlık görüntüyü birbirinden bağımsız olarak zenginleştirebilir.
- **Venice**: Ortam/yapılandırma/kimlik doğrulama deposu üzerinden API anahtarı (`VENICE_API_KEY`). Bildirildiğinde USD ve DIEM bakiyelerinin yanı sıra DIEM dönem tahsisi kullanımını gösterir.
- **Xiaomi MiMo**: İki ayrı kullanım yüzeyi. Kullandıkça öde seçeneği bir API anahtarı (`XIAOMI_API_KEY`), Token Plan ise ayrı bir anahtar (`XIAOMI_TOKEN_PLAN_API_KEY`) kullanır. Şu anda ikisi de kota pencerelerini bildirmez.
- **z.ai**: Ortam/yapılandırma/kimlik doğrulama deposu üzerinden API anahtarı (`ZAI_API_KEY` veya `Z_AI_API_KEY`).

## İlgili

- [Token kullanımı ve maliyetleri](/tr/reference/token-use)
- [API kullanımı ve maliyetleri](/tr/reference/api-usage-costs)
- [İstem önbelleğe alma](/tr/reference/prompt-caching)
- [Menü çubuğu](/tr/platforms/mac/menu-bar)
