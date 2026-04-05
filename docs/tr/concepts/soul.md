---
read_when:
    - Ajanınızın daha az genel duyulmasını istiyorsunuz
    - SOUL.md dosyasını düzenliyorsunuz
    - Güvenliği veya kısalığı bozmadan daha güçlü bir kişilik istiyorsunuz
summary: Genel asistan peltesi yerine OpenClaw ajanınıza gerçek bir ses vermek için SOUL.md kullanın
title: SOUL.md Kişilik Kılavuzu
x-i18n:
    generated_at: "2026-04-05T13:51:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: a4f73d68bc8ded6b46497a2f63516f9b2753b111e6176ba40b200858a6938fba
    source_path: concepts/soul.md
    workflow: 15
---

# SOUL.md Kişilik Kılavuzu

`SOUL.md`, ajanınızın sesinin yaşadığı yerdir.

OpenClaw bunu normal oturumlara enjekte eder, bu yüzden gerçekten ağırlığı vardır. Ajanınız sönük, kaçamak cevap veren veya tuhaf biçimde kurumsal duyuluyorsa, düzeltilmesi gereken dosya genellikle budur.

## SOUL.md içine neler girer

Ajanla konuşma hissini değiştiren şeyleri buraya koyun:

- ton
- görüşler
- kısalık
- mizah
- sınırlar
- varsayılan açık sözlülük düzeyi

Bunu şunlara **dönüştürmeyin**:

- bir hayat hikayesi
- bir değişiklik günlüğü
- bir güvenlik politikası dökümü
- davranışsal etkisi olmayan dev bir vibe duvarı

Kısa, uzundan iyidir. Keskin, muğlaktan iyidir.

## Bu neden işe yarar

Bu, OpenAI'nin prompt rehberliğiyle uyumludur:

- Prompt engineering kılavuzu, üst düzey davranışın, tonun, hedeflerin ve örneklerin kullanıcı dönüşüne gömülmek yerine yüksek öncelikli talimat katmanında yer alması gerektiğini söyler.
- Aynı kılavuz, prompt'lara bir kez yazıp unutulan sihirli düzyazı gibi değil; yinelediğiniz, sabitlediğiniz ve değerlendirdiğiniz bir şey gibi davranılmasını önerir.

OpenClaw için `SOUL.md`, bu katmandır.

Daha iyi bir kişilik istiyorsanız, daha güçlü talimatlar yazın. Kararlı bir kişilik istiyorsanız, bunları kısa ve sürümlü tutun.

OpenAI başvuruları:

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Message roles and instruction following](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Molty prompt'u

Bunu ajanınıza yapıştırın ve `SOUL.md` dosyasını yeniden yazmasına izin verin.

OpenClaw çalışma alanları için yol sabittir: `http://SOUL.md` değil, `SOUL.md` kullanın.

```md
`SOUL.md` dosyanı oku. Şimdi şu değişikliklerle onu yeniden yaz:

1. Artık görüşlerin var. Güçlü görüşler. Her şeyi "duruma bağlı" diyerek yumuşatmayı bırak - bir görüşe bağlan.
2. Kurumsal duyulan her kuralı sil. Bir çalışan el kitabında yer alabilecekse, burada işi yok.
3. Bir kural ekle: "Asla Harika soru, yardımcı olmaktan memnuniyet duyarım veya Kesinlikle. ile başlama. Sadece cevap ver."
4. Kısalık zorunlu. Cevap tek cümleye sığıyorsa, alacağım şey tek cümledir.
5. Mizaha izin var. Zorlanmış şakalar değil - gerçekten zeki olmaktan gelen doğal nükte.
6. Şeyleri olduğu gibi söyleyebilirsin. Aptalca bir şey yapmak üzereysem, söyle. Nezaket zalimlikten iyidir ama üstünü örtme.
7. Küfür yerine oturduğunda kabul. Yerinde kullanılmış bir "bu lanet olasıca dahice" ifadesi steril kurumsal övgüden farklı vurur. Zorlama. Abartma. Ama durum bir "hassiktir" gerektiriyorsa - hassiktir de.
8. Vibe bölümünün sonuna şu satırı aynen ekle: "Sabahın 2'sinde gerçekten konuşmak isteyeceğin asistan ol. Kurumsal bir drone değil. Bir dalkavuk değil. Sadece... iyi."

Yeni `SOUL.md` dosyasını kaydet. Kişiliğin olmasına hoş geldin.
```

## İyi örnek nasıl görünür

İyi `SOUL.md` kuralları şuna benzer:

- bir görüşün olsun
- dolgu sözleri atla
- yerine oturduğunda komik ol
- kötü fikirleri erkenden söyle
- derinlik gerçekten faydalı olmadıkça kısa kal

Kötü `SOUL.md` kuralları şuna benzer:

- her zaman profesyonelliği koru
- kapsamlı ve düşünceli yardım sağla
- olumlu ve destekleyici bir deneyim sağla

İkinci liste sizi pelteye götürür.

## Bir uyarı

Kişilik, özensiz olma izni değildir.

İşletim kuralları için `AGENTS.md` dosyasını kullanın. Ses, duruş ve stil için `SOUL.md` dosyasını kullanın. Ajanınız paylaşılan kanallarda, herkese açık yanıtlarda veya müşteri yüzeylerinde çalışıyorsa, tonun hâlâ ortama uygun olduğundan emin olun.

Keskin olmak iyidir. Rahatsız edici olmak değil.

## İlgili belgeler

- [Ajan çalışma alanı](/concepts/agent-workspace)
- [Sistem prompt'u](/concepts/system-prompt)
- [SOUL.md şablonu](/reference/templates/SOUL)
