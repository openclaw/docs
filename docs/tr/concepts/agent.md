---
read_when:
    - Aracı çalışma zamanını, çalışma alanı önyüklemesini veya oturum davranışını değiştirme
summary: Ajan çalışma zamanı, çalışma alanı sözleşmesi ve oturum önyüklemesi
title: Ajan çalışma zamanı
x-i18n:
    generated_at: "2026-04-30T09:15:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d65ee96cece296251d7d3a0512f12d2dfa900db0e5ffc0f37dcddae7ea55ad
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw, **tek bir gömülü ajan çalışma zamanı** çalıştırır — her Gateway için bir ajan süreci; kendi çalışma alanı, önyükleme dosyaları ve oturum deposu vardır. Bu sayfa bu çalışma zamanı sözleşmesini kapsar: çalışma alanının neleri içermesi gerektiğini, hangi dosyaların enjekte edildiğini ve oturumların buna göre nasıl önyüklendiğini.

## Çalışma alanı (zorunlu)

OpenClaw, araçlar ve bağlam için ajanın **tek** çalışma dizini (`cwd`) olarak tek bir ajan çalışma alanı dizini (`agents.defaults.workspace`) kullanır.

Önerilen: Eksikse `~/.openclaw/openclaw.json` oluşturmak ve çalışma alanı dosyalarını başlatmak için `openclaw setup` kullanın.

Tam çalışma alanı düzeni + yedekleme kılavuzu: [Ajan çalışma alanı](/tr/concepts/agent-workspace)

`agents.defaults.sandbox` etkinse, ana olmayan oturumlar bunu `agents.defaults.sandbox.workspaceRoot` altındaki oturum başına çalışma alanlarıyla geçersiz kılabilir ([Gateway yapılandırması](/tr/gateway/configuration) bölümüne bakın).

## Önyükleme dosyaları (enjekte edilir)

`agents.defaults.workspace` içinde OpenClaw şu kullanıcı tarafından düzenlenebilir dosyaları bekler:

- `AGENTS.md` — çalışma talimatları + “bellek”
- `SOUL.md` — kişilik, sınırlar, ton
- `TOOLS.md` — kullanıcı tarafından tutulan araç notları (örn. `imsg`, `sag`, kurallar)
- `BOOTSTRAP.md` — tek seferlik ilk çalıştırma ritüeli (tamamlandıktan sonra silinir)
- `IDENTITY.md` — ajan adı/havası/emoji
- `USER.md` — kullanıcı profili + tercih edilen hitap

Yeni bir oturumun ilk turunda OpenClaw, bu dosyaların içeriklerini doğrudan ajan bağlamına enjekte eder.

Boş dosyalar atlanır. Büyük dosyalar kırpılır ve istemlerin sade kalması için bir işaretleyiciyle kısaltılır (tam içerik için dosyayı okuyun).

Bir dosya eksikse, OpenClaw tek bir “eksik dosya” işaretleyici satırı enjekte eder (ve `openclaw setup` güvenli bir varsayılan şablon oluşturur).

`BOOTSTRAP.md` yalnızca **tamamen yeni bir çalışma alanı** için oluşturulur (başka önyükleme dosyası yoksa). Ritüeli tamamladıktan sonra bunu silerseniz, sonraki yeniden başlatmalarda yeniden oluşturulmamalıdır.

Önyükleme dosyası oluşturmayı tamamen devre dışı bırakmak için (önceden hazırlanmış çalışma alanları için) şunu ayarlayın:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Yerleşik araçlar

Çekirdek araçlar (read/exec/edit/write ve ilgili sistem araçları) araç politikasına tabi olarak her zaman kullanılabilir. `apply_patch` isteğe bağlıdır ve `tools.exec.applyPatch` ile kapılanır. `TOOLS.md` hangi araçların var olduğunu denetlemez; _sizin_ bunların nasıl kullanılmasını istediğinize dair rehberlik sağlar.

## Skills

OpenClaw, Skills öğelerini şu konumlardan yükler (en yüksek öncelik ilk sırada):

- Çalışma alanı: `<workspace>/skills`
- Proje ajan Skills öğeleri: `<workspace>/.agents/skills`
- Kişisel ajan Skills öğeleri: `~/.agents/skills`
- Yönetilen/yerel: `~/.openclaw/skills`
- Paketle birlikte gelen (kurulumla gönderilir)
- Ek Skills klasörleri: `skills.load.extraDirs`

Skills, yapılandırma/env ile kapılanabilir ([Gateway yapılandırması](/tr/gateway/configuration) içindeki `skills` bölümüne bakın).

## Çalışma zamanı sınırları

Gömülü ajan çalışma zamanı, Pi ajan çekirdeği (modeller, araçlar ve istem hattı) üzerine kuruludur. Oturum yönetimi, keşif, araç bağlantıları ve kanal teslimi, bu çekirdeğin üzerinde OpenClaw tarafından sahiplenilen katmanlardır.

## Oturumlar

Oturum dökümleri JSONL olarak şurada saklanır:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

Oturum kimliği kararlıdır ve OpenClaw tarafından seçilir.
Diğer araçlardan kalan eski oturum klasörleri okunmaz.

## Akış sırasında yönlendirme

Sıra modu `steer` olduğunda, gelen mesajlar mevcut çalıştırmaya enjekte edilir. Sıraya alınmış yönlendirme, **mevcut asistan turu araç çağrılarını yürütmeyi bitirdikten sonra**, bir sonraki LLM çağrısından önce teslim edilir. Pi, `steer` için bekleyen tüm yönlendirme mesajlarını birlikte boşaltır; eski `queue`, her model sınırında bir mesaj boşaltır. Yönlendirme artık mevcut asistan mesajındaki kalan araç çağrılarını atlamaz.

Sıra modu `followup` veya `collect` olduğunda, gelen mesajlar mevcut tur bitene kadar tutulur; ardından sıraya alınmış yüklerle yeni bir ajan turu başlar. Mod ve sınır davranışı için [Sıra](/tr/concepts/queue) ve [Yönlendirme sırası](/tr/concepts/queue-steering) bölümlerine bakın.

Blok akışı, tamamlanan asistan bloklarını biter bitmez gönderir; **varsayılan olarak kapalıdır** (`agents.defaults.blockStreamingDefault: "off"`).
Sınırı `agents.defaults.blockStreamingBreak` ile ayarlayın (`text_end` vs `message_end`; varsayılan text_end).
Yumuşak blok parçalamayı `agents.defaults.blockStreamingChunk` ile denetleyin (varsayılan 800–1200 karakter; önce paragraf sonlarını, sonra yeni satırları tercih eder; cümleler en son gelir).
Tek satırlık spam’i azaltmak için akıştaki parçaları `agents.defaults.blockStreamingCoalesce` ile birleştirin (göndermeden önce boşta kalmaya dayalı birleştirme). Telegram dışı kanallarda blok yanıtlarını etkinleştirmek için açıkça `*.blockStreaming: true` gerekir.
Ayrıntılı araç özetleri araç başlangıcında yayınlanır (debounce yoktur); Control UI, kullanılabilir olduğunda araç çıktısını ajan olayları üzerinden akıtır.
Daha fazla ayrıntı: [Akış + parçalama](/tr/concepts/streaming).

## Model başvuruları

Yapılandırmadaki model başvuruları (örneğin `agents.defaults.model` ve `agents.defaults.models`), **ilk** `/` karakterinden bölünerek ayrıştırılır.

- Modelleri yapılandırırken `provider/model` kullanın.
- Model kimliğinin kendisi `/` içeriyorsa (OpenRouter tarzı), provider önekini ekleyin (örnek: `openrouter/moonshotai/kimi-k2`).
- Provider’ı atlarsanız, OpenClaw önce bir alias dener, ardından aynı model kimliği için benzersiz bir yapılandırılmış-provider eşleşmesi arar ve ancak bundan sonra yapılandırılmış varsayılan provider’a geri döner. Bu provider yapılandırılmış varsayılan modeli artık sunmuyorsa, OpenClaw eski kaldırılmış-provider varsayılanını göstermesi yerine ilk yapılandırılmış provider/model çiftine geri döner.

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
