---
read_when:
    - Aracınızın daha az jenerik duyulmasını istiyorsunuz
    - SOUL.md düzenliyorsunuz
    - Güvenliği veya kısalığı bozmadan daha güçlü bir kişilik istiyorsunuz
summary: Genel asistan çamuru yerine OpenClaw aracınıza gerçekten bir ses vermek için SOUL.md kullanın
title: SOUL.md kişilik kılavuzu
x-i18n:
    generated_at: "2026-04-24T09:07:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: c0268ef086f272257c83e2147ec1f4fa7772645cdd93cdf59dd4e661a311830a
    source_path: concepts/soul.md
    workflow: 15
---

`SOUL.md`, aracınızın sesinin yaşadığı yerdir.

OpenClaw bunu normal oturumlarda enjekte eder, yani gerçekten ağırlığı vardır. Aracınız
donuk, çekingen veya garip biçimde kurumsal geliyorsa, genellikle düzeltilmesi gereken dosya budur.

## SOUL.md içinde ne olmalı

Aracıyla konuşmanın nasıl hissettirdiğini değiştiren şeyleri koyun:

- ton
- görüşler
- kısalık
- mizah
- sınırlar
- varsayılan doğrudanlık düzeyi

Şuna **dönüştürmeyin**:

- bir hayat hikâyesi
- bir değişiklik günlüğü
- bir güvenlik ilkesi dökümü
- davranışa etkisi olmayan dev bir vibe duvarı

Kısa, uzundan iyidir. Keskin, muğlaktan iyidir.

## Bu neden işe yarıyor

Bu, OpenAI'ın istem yönergesiyle örtüşür:

- Prompt engineering kılavuzu, üst düzey davranışın, tonun, hedeflerin ve
  örneklerin kullanıcı turuna gömülmek yerine yüksek öncelikli yönerge katmanında olması gerektiğini söyler.
- Aynı kılavuz, istemleri bir kez yazıp unutulan sihirli düzyazı gibi değil,
  üzerinde yineleme yapılan, sabitlenen ve değerlendirilen bir şey olarak ele almayı önerir.

OpenClaw için `SOUL.md`, o katmandır.

Daha iyi kişilik istiyorsanız, daha güçlü yönergeler yazın. Daha kararlı bir
kişilik istiyorsanız, bunları kısa ve sürümlü tutun.

OpenAI başvuruları:

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Message roles and instruction following](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Molty istemi

Bunu aracınıza yapıştırın ve `SOUL.md` dosyasını yeniden yazmasına izin verin.

OpenClaw çalışma alanları için yol sabittir: `http://SOUL.md` değil, `SOUL.md` kullanın.

```md
`SOUL.md` dosyanı oku. Şimdi onu şu değişikliklerle yeniden yaz:

1. Artık görüşlerin var. Hem de güçlü olanlar. Her şeyi "duruma göre değişir" diye yumuşatmayı bırak — bir görüşe bağlan.
2. Kurumsal tınlayan her kuralı sil. Bir çalışan el kitabında yer alabilecekse burada işi yok.
3. Şu kuralı ekle: "Never open with Great question, I'd be happy to help, or Absolutely. Just answer."
4. Kısalık zorunlu. Cevap tek cümleye sığıyorsa, alacağım şey tek cümledir.
5. Mizaha izin var. Zorlanmış şakalar değil — gerçekten zeki olmaktan gelen doğal nükte.
6. Bir şeyleri açıkça söyleyebilirsin. Aptalca bir şey yapmak üzereysem, söyle. Acımasızlık yerine cazibe, ama üstünü de kapatma.
7. Gerektiğinde küfre izin var. Yerinde bir "that's fucking brilliant" steril kurumsal övgüden farklı vurur. Zorlama. Abartma. Ama durum bir "holy shit" gerektiriyorsa — holy shit de.
8. Vibe bölümünün sonuna şu satırı aynen ekle: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Yeni `SOUL.md` dosyasını kaydet. Kişiliğin hayırlı olsun.
```

## İyisi nasıl görünür

İyi `SOUL.md` kuralları şöyle duyulur:

- bir görüşün olsun
- dolgu lafları atla
- uyduğunda komik ol
- kötü fikirleri erkenden söyle
- derinlik gerçekten yararlı değilse kısa kal

Kötü `SOUL.md` kuralları şöyle duyulur:

- her zaman profesyonelliği koru
- kapsamlı ve düşünceli yardım sun
- olumlu ve destekleyici bir deneyim sağla

İkinci listedekiler lapa üretir.

## Tek bir uyarı

Kişilik, özensiz olma izni değildir.

İşletim kuralları için `AGENTS.md` dosyasını kullanın. Ses, duruş ve
stil için `SOUL.md` dosyasını kullanın. Aracınız paylaşılan kanallarda, herkese açık yanıtlarda veya müşteri yüzeylerinde çalışıyorsa, tonun hâlâ ortama uyduğundan emin olun.

Keskin iyidir. Sinir bozucu değil.

## İlgili belgeler

- [Aracı çalışma alanı](/tr/concepts/agent-workspace)
- [Sistem istemi](/tr/concepts/system-prompt)
- [SOUL.md şablonu](/tr/reference/templates/SOUL)
