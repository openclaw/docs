---
x-i18n:
    generated_at: "2026-04-05T14:04:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 895b701d3a3950ea7482e5e870663ed93e0355e679199ed4622718d588ef18fa
    source_path: providers/qwen.md
    workflow: 15
---

summary: "Qwen Cloud'u OpenClaw'ın paketlenmiş qwen sağlayıcısı üzerinden kullanın"
read_when:

- OpenClaw ile Qwen kullanmak istiyorsunuz
- Daha önce Qwen OAuth kullandınız
  title: "Qwen"

---

# Qwen

<Warning>

**Qwen OAuth kaldırıldı.** `portal.qwen.ai` uç noktalarını kullanan
ücretsiz katman OAuth entegrasyonu (`qwen-portal`) artık kullanılamıyor.
Arka plan için [Issue #49557](https://github.com/openclaw/openclaw/issues/49557)
konusuna bakın.

</Warning>

## Önerilen: Qwen Cloud

OpenClaw artık Qwen'i kanonik kimliği
`qwen` olan birinci sınıf paketlenmiş sağlayıcı olarak ele alıyor. Paketlenmiş sağlayıcı, Qwen Cloud / Alibaba DashScope ve
Coding Plan uç noktalarını hedefler ve eski `modelstudio` kimliklerini
uyumluluk takma adı olarak çalışır durumda tutar.

- Sağlayıcı: `qwen`
- Tercih edilen ortam değişkeni: `QWEN_API_KEY`
- Uyumluluk için ayrıca kabul edilir: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API stili: OpenAI uyumlu

`qwen3.6-plus` kullanmak istiyorsanız, **Standard (pay-as-you-go)** uç noktasını tercih edin.
Coding Plan desteği genel katalogun gerisinde kalabilir.

```bash
# Genel Coding Plan uç noktası
openclaw onboard --auth-choice qwen-api-key

# Çin Coding Plan uç noktası
openclaw onboard --auth-choice qwen-api-key-cn

# Genel Standard (pay-as-you-go) uç noktası
openclaw onboard --auth-choice qwen-standard-api-key

# Çin Standard (pay-as-you-go) uç noktası
openclaw onboard --auth-choice qwen-standard-api-key-cn
```

Eski `modelstudio-*` auth-choice kimlikleri ve `modelstudio/...` model başvuruları
uyumluluk takma adları olarak çalışmaya devam eder, ancak yeni kurulum akışlarında
kanonik `qwen-*` auth-choice kimlikleri ve `qwen/...` model başvuruları tercih edilmelidir.

Onboarding'den sonra bir varsayılan model ayarlayın:

```json5
{
  agents: {
    defaults: {
      model: { primary: "qwen/qwen3.5-plus" },
    },
  },
}
```

## Yetenek planı

`qwen` uzantısı, yalnızca kodlama/metin modelleri için değil,
tam Qwen Cloud yüzeyi için üretici ana evi olarak konumlandırılıyor.

- Metin/sohbet modelleri: şimdi paketlenmiş
- Araç çağırma, yapılandırılmış çıktı, düşünme: OpenAI uyumlu taşıma katmanından devralınır
- Görüntü üretimi: sağlayıcı-plugin katmanında planlanıyor
- Görüntü/video anlama: Standard uç noktada şimdi paketlenmiş
- Konuşma/ses: sağlayıcı-plugin katmanında planlanıyor
- Bellek embeddings/reranking: embedding bağdaştırıcı yüzeyi üzerinden planlanıyor
- Video üretimi: paylaşılan video üretimi yeteneği üzerinden şimdi paketlenmiş

## Çok modlu eklentiler

`qwen` uzantısı artık ayrıca şunları da sunuyor:

- `qwen-vl-max-latest` üzerinden video anlama
- Şunlar üzerinden Wan video üretimi:
  - `wan2.6-t2v` (varsayılan)
  - `wan2.6-i2v`
  - `wan2.6-r2v`
  - `wan2.6-r2v-flash`
  - `wan2.7-r2v`

Bu çok modlu yüzeyler **Standard** DashScope uç noktalarını kullanır,
Coding Plan uç noktalarını değil.

- Genel/Uluslararası Standard taban URL'si: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- Çin Standard taban URL'si: `https://dashscope.aliyuncs.com/compatible-mode/v1`

Video üretimi için OpenClaw, işi göndermeden önce yapılandırılmış Qwen bölgesini
eşleşen DashScope AIGC ana makinesine eşler:

- Genel/Uluslararası: `https://dashscope-intl.aliyuncs.com`
- Çin: `https://dashscope.aliyuncs.com`

Bu, Coding Plan veya Standard Qwen ana makinelerinden herhangi birine işaret eden normal bir
`models.providers.qwen.baseUrl` değerinin yine de video üretimini doğru
bölgesel DashScope video uç noktasında tuttuğu anlamına gelir.

Video üretimi için varsayılan modeli açıkça ayarlayın:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Geçerli paketlenmiş Qwen video üretimi sınırları:

- İstek başına en fazla **1** çıktı videosu
- En fazla **1** girdi görüntüsü
- En fazla **4** girdi videosu
- En fazla **10 saniye** süre
- `size`, `aspectRatio`, `resolution`, `audio` ve `watermark` desteklenir

Uç nokta düzeyi ayrıntılar
ve uyumluluk notları için [Qwen / Model Studio](/providers/qwen_modelstudio) bölümüne bakın.
