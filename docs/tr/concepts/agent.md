---
read_when:
    - Ajan çalışma zamanını, çalışma alanı önyüklemesini veya oturum davranışını değiştirme
summary: Ajan çalışma zamanı, çalışma alanı sözleşmesi ve oturum önyüklemesi
title: Ajan çalışma zamanı
x-i18n:
    generated_at: "2026-05-06T09:06:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 372cf6a02b35646c24e68d96938bba57721eeec512e17c2d40c8e721e7561bd1
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw, **tek bir gömülü ajan çalışma zamanı** çalıştırır - her Gateway için bir ajan süreci; kendi çalışma alanı, önyükleme dosyaları ve oturum deposu vardır. Bu sayfa bu çalışma zamanı sözleşmesini kapsar: çalışma alanının ne içermesi gerektiği, hangi dosyaların enjekte edildiği ve oturumların buna göre nasıl önyüklendiği.

## Çalışma alanı (zorunlu)

OpenClaw, araçlar ve bağlam için ajanın **tek** çalışma dizini (`cwd`) olarak tek bir ajan çalışma alanı dizini (`agents.defaults.workspace`) kullanır.

Önerilen: `~/.openclaw/openclaw.json` eksikse oluşturmak ve çalışma alanı dosyalarını başlatmak için `openclaw setup` kullanın.

Tam çalışma alanı düzeni + yedekleme kılavuzu: [Ajan çalışma alanı](/tr/concepts/agent-workspace)

`agents.defaults.sandbox` etkinse, ana olmayan oturumlar bunu `agents.defaults.sandbox.workspaceRoot` altındaki oturum başına çalışma alanlarıyla geçersiz kılabilir (bkz. [Gateway yapılandırması](/tr/gateway/configuration)).

## Önyükleme dosyaları (enjekte edilir)

OpenClaw, `agents.defaults.workspace` içinde şu kullanıcı tarafından düzenlenebilir dosyaları bekler:

- `AGENTS.md` - çalıştırma talimatları + "bellek"
- `SOUL.md` - persona, sınırlar, ton
- `TOOLS.md` - kullanıcı tarafından sürdürülen araç notları (örn. `imsg`, `sag`, kurallar)
- `BOOTSTRAP.md` - tek seferlik ilk çalıştırma ritüeli (tamamlandıktan sonra silinir)
- `IDENTITY.md` - ajan adı/havası/emoji
- `USER.md` - kullanıcı profili + tercih edilen hitap

Yeni bir oturumun ilk turunda OpenClaw, bu dosyaların içeriklerini sistem isteminin Proje Bağlamı bölümüne enjekte eder.

Boş dosyalar atlanır. Büyük dosyalar kırpılır ve istemlerin hafif kalması için bir işaretçiyle kesilir (tam içerik için dosyayı okuyun).

Bir dosya eksikse OpenClaw tek bir "eksik dosya" işaretçi satırı enjekte eder (ve `openclaw setup` güvenli bir varsayılan şablon oluşturur).

`BOOTSTRAP.md` yalnızca **tamamen yeni bir çalışma alanı** için oluşturulur (başka önyükleme dosyası yoksa). Beklemedeyken OpenClaw bunu Proje Bağlamı içinde tutar ve kullanıcı iletisine kopyalamak yerine ilk ritüel için sistem istemine önyükleme rehberliği ekler. Ritüeli tamamladıktan sonra silerseniz, sonraki yeniden başlatmalarda yeniden oluşturulmamalıdır.

Önyükleme dosyası oluşturmayı tamamen devre dışı bırakmak için (önceden hazırlanmış çalışma alanları için) şunu ayarlayın:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Yerleşik araçlar

Çekirdek araçlar (read/exec/edit/write ve ilgili sistem araçları), araç politikasına tabi olarak her zaman kullanılabilir. `apply_patch` isteğe bağlıdır ve `tools.exec.applyPatch` tarafından denetlenir. `TOOLS.md` hangi araçların var olduğunu denetlemez; bu, _sizin_ onların nasıl kullanılmasını istediğinize dair rehberliktir.

## Skills

OpenClaw, Skills öğelerini şu konumlardan yükler (en yüksek öncelik önce):

- Çalışma alanı: `<workspace>/skills`
- Proje ajan Skills: `<workspace>/.agents/skills`
- Kişisel ajan Skills: `~/.agents/skills`
- Yönetilen/yerel: `~/.openclaw/skills`
- Paketlenmiş (kurulumla birlikte gelir)
- Ek Skills klasörleri: `skills.load.extraDirs`

Skills yapılandırma/env ile kapılanabilir (bkz. [Gateway yapılandırması](/tr/gateway/configuration) içinde `skills`).

## Çalışma zamanı sınırları

Gömülü ajan çalışma zamanı, Pi ajan çekirdeği (modeller, araçlar ve istem işlem hattı) üzerine kuruludur. Oturum yönetimi, keşif, araç bağlama ve kanal teslimi, bu çekirdeğin üstündeki OpenClaw sahipli katmanlardır.

## Oturumlar

Oturum transkriptleri JSONL olarak şurada saklanır:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

Oturum kimliği kararlıdır ve OpenClaw tarafından seçilir.
Diğer araçlardan gelen eski oturum klasörleri okunmaz.

## Akış sırasında yönlendirme

Kuyruk modu `steer` olduğunda, gelen iletiler geçerli çalıştırmaya enjekte edilir. Kuyruğa alınan yönlendirme, **geçerli asistan turu araç çağrılarını yürütmeyi bitirdikten sonra**, bir sonraki LLM çağrısından önce teslim edilir. Pi, `steer` için bekleyen tüm yönlendirme iletilerini birlikte boşaltır; eski `queue`, model sınırı başına bir ileti boşaltır. Yönlendirme artık geçerli asistan iletisindeki kalan araç çağrılarını atlamaz.

Kuyruk modu `followup` veya `collect` olduğunda, gelen iletiler geçerli tur sona erene kadar tutulur; ardından kuyruktaki yüklerle yeni bir ajan turu başlar. Mod ve sınır davranışı için bkz. [Kuyruk](/tr/concepts/queue) ve [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

Blok akışı, tamamlanan asistan bloklarını biter bitmez gönderir; **varsayılan olarak kapalıdır** (`agents.defaults.blockStreamingDefault: "off"`).
Sınırı `agents.defaults.blockStreamingBreak` ile ayarlayın (`text_end` ve `message_end`; varsayılan text_end).
Yumuşak blok parçalamayı `agents.defaults.blockStreamingChunk` ile denetleyin (varsayılan 800-1200 karakter; paragraf sonlarını, sonra yeni satırları tercih eder; cümleler en son).
Tek satırlık spam’i azaltmak için aktarılan parçaları `agents.defaults.blockStreamingCoalesce` ile birleştirin (göndermeden önce boşta kalmaya dayalı birleştirme). Telegram dışı kanallar, blok yanıtlarını etkinleştirmek için açıkça `*.blockStreaming: true` gerektirir.
Ayrıntılı araç özetleri araç başlangıcında yayılır (debounce yoktur); Control UI, mevcut olduğunda araç çıktısını ajan olayları üzerinden aktarır.
Daha fazla ayrıntı: [Akış + parçalama](/tr/concepts/streaming).

## Model referansları

Yapılandırmadaki model referansları (örneğin `agents.defaults.model` ve `agents.defaults.models`), **ilk** `/` karakterine göre bölünerek ayrıştırılır.

- Modelleri yapılandırırken `provider/model` kullanın.
- Model kimliğinin kendisi `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini dahil edin (örnek: `openrouter/moonshotai/kimi-k2`).
- Sağlayıcıyı atlarsanız OpenClaw önce bir takma adı dener, ardından tam o model kimliği için benzersiz yapılandırılmış sağlayıcı eşleşmesini dener ve ancak bundan sonra yapılandırılmış varsayılan sağlayıcıya geri döner. Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw, eski kaldırılmış sağlayıcı varsayılanını göstermek yerine ilk yapılandırılmış sağlayıcı/model çiftine geri döner.

## Yapılandırma (asgari)

En azından şunları ayarlayın:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (şiddetle önerilir)

---

_Sıradaki: [Grup Sohbetleri](/tr/channels/group-messages)_ 🦞

## İlgili

- [Ajan çalışma alanı](/tr/concepts/agent-workspace)
- [Çok ajanlı yönlendirme](/tr/concepts/multi-agent)
- [Oturum yönetimi](/tr/concepts/session)
