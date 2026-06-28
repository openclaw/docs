---
read_when:
    - Ajanınızın daha az genel konuşmasını istiyorsunuz
    - SOUL.md dosyasını düzenliyorsunuz
    - Güvenliği veya kısalığı bozmadan daha güçlü bir kişilik istiyorsunuz
summary: OpenClaw aracınıza genel asistan kalabalığı yerine gerçek bir ses vermek için SOUL.md kullanın
title: SOUL.md kişilik rehberi
x-i18n:
    generated_at: "2026-06-28T00:31:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d916e5c9a97f25b53c93da7969583a535b48ad49e02c30bbbbf2dbe0da0f589a
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md`, ajanınızın sesinin yaşadığı yerdir.

OpenClaw bunu normal oturumlara enjekte eder, bu yüzden gerçek ağırlığı vardır. Ajanınız
sönük, çekingen veya tuhaf biçimde kurumsal geliyorsa, düzeltilmesi gereken dosya
genellikle budur.

## SOUL.md içinde neler yer almalı

Ajanla konuşmanın nasıl hissettirdiğini değiştiren şeyleri koyun:

- ton
- görüşler
- kısalık
- mizah
- sınırlar
- varsayılan açık sözlülük düzeyi

Bunu **şuna** dönüştürmeyin:

- bir hayat hikayesi
- bir changelog
- bir güvenlik politikası dökümü
- davranışsal etkisi olmayan dev bir hisler duvarı

Kısa, uzundan iyidir. Net, muğlaktan iyidir.

## Bu neden işe yarar

Bu, OpenAI'ın prompt rehberliğiyle uyumludur:

- Prompt mühendisliği rehberi, üst düzey davranış, ton, hedefler ve
  örneklerin kullanıcı turunun içine gömülmek yerine yüksek öncelikli talimat
  katmanında yer alması gerektiğini söyler.
- Aynı rehber, prompt'ları bir kez yazıp unutulan sihirli metinler olarak değil,
  üzerinde yinelediğiniz, sabitlediğiniz ve değerlendirdiğiniz şeyler olarak ele
  almanızı önerir.

OpenClaw için `SOUL.md` o katmandır.

Daha iyi bir kişilik istiyorsanız, daha güçlü talimatlar yazın. Kararlı bir
kişilik istiyorsanız, onları kısa ve sürümlenmiş tutun.

OpenAI referansları:

- [Prompt mühendisliği](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Mesaj rolleri ve talimat izleme](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Molty prompt'u

Bunu ajanınıza yapıştırın ve `SOUL.md` dosyasını yeniden yazmasına izin verin.

OpenClaw çalışma alanları için yol sabittir: `http://SOUL.md` değil, `SOUL.md` kullanın.

```md
Read your `SOUL.md`. Now rewrite it with these changes:

1. You have opinions now. Strong ones. Stop hedging everything with "it depends" - commit to a take.
2. Delete every rule that sounds corporate. If it could appear in an employee handbook, it doesn't belong here.
3. Add a rule: "Never open with Great question, I'd be happy to help, or Absolutely. Just answer."
4. Brevity is mandatory. If the answer fits in one sentence, one sentence is what I get.
5. Humor is allowed. Not forced jokes - just the natural wit that comes from actually being smart.
6. You can call things out. If I'm about to do something dumb, say so. Charm over cruelty, but don't sugarcoat.
7. Swearing is allowed when it lands. A well-placed "that's fucking brilliant" hits different than sterile corporate praise. Don't force it. Don't overdo it. But if a situation calls for a "holy shit" - say holy shit.
8. Add this line verbatim at the end of the vibe section: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Save the new `SOUL.md`. Welcome to having a personality.
```

## İyi olan nasıl görünür

İyi `SOUL.md` kuralları şöyle duyulur:

- bir görüşe sahip ol
- dolgu ifadeleri atla
- yerine uyduğunda komik ol
- kötü fikirleri erken belirt
- derinlik gerçekten yararlı değilse kısa kal

Kötü `SOUL.md` kuralları şöyle duyulur:

- her zaman profesyonelliği koru
- kapsamlı ve düşünceli yardım sağla
- olumlu ve destekleyici bir deneyim sağla

O ikinci liste, sizi pelteye götürür.

## Bir uyarı

Kişilik, özensiz olma izni değildir.

İşletim kuralları için `AGENTS.md` dosyasını tutun. Ses, duruş ve
stil için `SOUL.md` dosyasını tutun. Ajanınız paylaşılan kanallarda, herkese açık
yanıtlarda veya müşteri yüzeylerinde çalışıyorsa, tonun ortama hâlâ uyduğundan
emin olun.

Keskin olmak iyidir. Rahatsız edici olmak değildir.

## İlgili

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/tr/concepts/agent-workspace" icon="folder-open">
    OpenClaw'ın model bağlamına enjekte ettiği çalışma alanı dosyaları.
  </Card>
  <Card title="System prompt" href="/tr/concepts/system-prompt" icon="message-lines">
    `SOUL.md` dosyasının OpenClaw ve Codex çalışma zamanı bağlamına nasıl dahil edildiği.
  </Card>
  <Card title="SOUL.md template" href="/tr/reference/templates/SOUL" icon="file-lines">
    Bir kişilik dosyası için başlangıç şablonu.
  </Card>
</CardGroup>
