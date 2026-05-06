---
read_when:
    - OpenClaw'ın medya yeteneklerine genel bir bakış arıyor
    - Hangi medya sağlayıcısının yapılandırılacağına karar verme
    - Asenkron medya oluşturmanın nasıl çalıştığını anlamak
sidebarTitle: Media overview
summary: Görüntü, video, müzik, konuşma ve medya anlama yeteneklerine genel bakış
title: Medya genel bakışı
x-i18n:
    generated_at: "2026-05-06T09:35:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 201d01244fc6a587b730ae3033de5990b2f01f63e6e40339c738c95040e085b3
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw görüntüler, videolar ve müzik üretir, gelen medyayı
(görüntüler, ses, video) anlar ve metinden sese ile yanıtları sesli olarak söyler. Tüm
medya yetenekleri araç odaklıdır: ajan, konuşmaya göre bunları ne zaman kullanacağına
karar verir ve her araç yalnızca en az bir destekleyici
sağlayıcı yapılandırıldığında görünür.

Canlı konuşma, tek seferlik medya aracı
yolu yerine Talk oturumu sözleşmesini kullanır. Talk'un üç modu vardır: sağlayıcıya özgü `realtime`, yerel veya akışlı
`stt-tts` ve yalnızca gözlem amaçlı konuşma yakalama için `transcription`. Bu modlar,
telefon, toplantılar, tarayıcı realtime ve yerel bas-konuş istemcileriyle
sağlayıcı kataloglarını, olay zarflarını ve iptal semantiklerini paylaşır.

## Yetenekler

<CardGroup cols={2}>
  <Card title="Görüntü üretimi" href="/tr/tools/image-generation" icon="image">
    Metin istemlerinden veya referans görüntülerden
    `image_generate` aracılığıyla görüntüler oluşturun ve düzenleyin. Senkron — yanıtla satır içinde tamamlanır.
  </Card>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    `video_generate` aracılığıyla metinden videoya, görüntüden videoya ve videodan videoya.
    Asenkron — arka planda çalışır ve hazır olduğunda sonucu gönderir.
  </Card>
  <Card title="Müzik üretimi" href="/tr/tools/music-generation" icon="music">
    `music_generate` aracılığıyla müzik veya ses parçaları üretin. Paylaşılan
    sağlayıcılarda asenkron; ComfyUI iş akışı yolu senkron çalışır.
  </Card>
  <Card title="Metinden sese" href="/tr/tools/tts" icon="microphone">
    Giden yanıtları `tts` aracı ve
    `messages.tts` yapılandırması ile konuşulan sese dönüştürün. Senkron.
  </Card>
  <Card title="Medya anlama" href="/tr/nodes/media-understanding" icon="eye">
    Görme yetenekli model sağlayıcılarını ve özel medya anlama Plugin'lerini
    kullanarak gelen görüntüleri, sesi ve videoyu özetleyin.
  </Card>
  <Card title="Konuşmadan metne" href="/tr/nodes/audio" icon="ear-listen">
    Toplu STT veya Voice Call akışlı STT sağlayıcıları üzerinden
    gelen sesli mesajları yazıya dökün.
  </Card>
</CardGroup>

## Sağlayıcı yetenek matrisi

| Sağlayıcı   | Görüntü | Video | Müzik | TTS | STT | Realtime ses | Medya anlama |
| ----------- | :-----: | :---: | :---: | :-: | :-: | :----------: | :----------: |
| Alibaba     |         |   ✓   |       |     |     |              |              |
| BytePlus    |         |   ✓   |       |     |     |              |              |
| ComfyUI     |    ✓    |   ✓   |   ✓   |     |     |              |              |
| DeepInfra   |    ✓    |   ✓   |       |  ✓  |  ✓  |              |      ✓       |
| Deepgram    |         |       |       |     |  ✓  |      ✓       |              |
| ElevenLabs  |         |       |       |  ✓  |  ✓  |              |              |
| fal         |    ✓    |   ✓   |       |     |     |              |              |
| Google      |    ✓    |   ✓   |   ✓   |  ✓  |     |      ✓       |      ✓       |
| Gradium     |         |       |       |  ✓  |     |              |              |
| Yerel CLI   |         |       |       |  ✓  |     |              |              |
| Microsoft   |         |       |       |  ✓  |     |              |              |
| MiniMax     |    ✓    |   ✓   |   ✓   |  ✓  |     |              |              |
| Mistral     |         |       |       |     |  ✓  |              |              |
| OpenAI      |    ✓    |   ✓   |       |  ✓  |  ✓  |      ✓       |      ✓       |
| OpenRouter  |    ✓    |   ✓   |       |  ✓  |     |              |      ✓       |
| Qwen        |         |   ✓   |       |     |     |              |              |
| Runway      |         |   ✓   |       |     |     |              |              |
| SenseAudio  |         |       |       |     |  ✓  |              |              |
| Together    |         |   ✓   |       |     |     |              |              |
| Vydra       |    ✓    |   ✓   |       |  ✓  |     |              |              |
| xAI         |    ✓    |   ✓   |       |  ✓  |  ✓  |              |      ✓       |
| Xiaomi MiMo |    ✓    |       |       |  ✓  |     |              |      ✓       |

<Note>
Medya anlama, sağlayıcı yapılandırmanızda kayıtlı herhangi bir görme yetenekli
veya ses yetenekli modeli kullanır. Yukarıdaki matris, özel
medya anlama desteği olan sağlayıcıları listeler; çoğu çok modlu LLM sağlayıcısı
(Anthropic, Google, OpenAI vb.) da etkin yanıt modeli olarak yapılandırıldığında
gelen medyayı anlayabilir.
</Note>

## Asenkron ve senkron

| Yetenek         | Mod       | Neden                                                                                                 |
| --------------- | --------- | ----------------------------------------------------------------------------------------------------- |
| Görüntü         | Senkron   | Sağlayıcı yanıtları saniyeler içinde döner; yanıtla satır içinde tamamlanır.                          |
| Metinden sese   | Senkron   | Sağlayıcı yanıtları saniyeler içinde döner; yanıt sesine eklenir.                                     |
| Video           | Asenkron  | Sağlayıcı işlemesi 30 sn ile birkaç dakika sürer; yavaş kuyruklar yapılandırılan zaman aşımına kadar çalışabilir. |
| Müzik (paylaşılan) | Asenkron | Video ile aynı sağlayıcı işleme özelliği.                                                           |
| Müzik (ComfyUI) | Senkron   | Yerel iş akışı, yapılandırılan ComfyUI sunucusuna karşı satır içinde çalışır.                         |

Asenkron araçlar için OpenClaw isteği sağlayıcıya gönderir, hemen bir görev
kimliği döndürür ve işi görev defterinde izler. Ajan, iş çalışırken
diğer mesajlara yanıt vermeye devam eder. Sağlayıcı tamamladığında,
OpenClaw ajanı üretilen medya yollarıyla uyandırır; böylece ajan
kullanıcıya bilgi verebilir ve kaynak teslim politikası gerektirdiğinde
sonucu mesaj aracı üzerinden iletebilir. Yalnızca mesaj aracı kullanılan grup/kanal rotalarında OpenClaw,
eksik mesaj aracı teslim kanıtını başarısız bir tamamlama girişimi olarak değerlendirir ve
üretilen medya yedeğini doğrudan özgün kanala gönderir.

## Konuşmadan metne ve Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio ve xAI, yapılandırıldığında
toplu `tools.media.audio` yolu üzerinden gelen sesi yazıya dökebilir.
Bahsetme geçidi veya komut ayrıştırma için bir sesli notu ön kontrolden geçiren
kanal Plugin'leri, yazıya dökülen eki gelen bağlamda işaretler; böylece paylaşılan
medya anlama geçişi aynı ses için ikinci bir
STT çağrısı yapmak yerine bu dökümü yeniden kullanır.

Deepgram, ElevenLabs, Mistral, OpenAI ve xAI ayrıca Voice Call
akışlı STT sağlayıcılarını da kaydeder; böylece canlı telefon sesi, tamamlanmış bir kayıt beklenmeden
seçilen satıcıya iletilebilir.

Canlı kullanıcı konuşmaları için [Talk modu](/tr/nodes/talk) tercih edin. Toplu ses
ekleri medya yolunda kalır; tarayıcı realtime, yerel bas-konuş,
telefon ve toplantı sesi, Gateway tarafından döndürülen oturum kapsamlı
katalogları ve Talk olaylarını kullanmalıdır.

## Sağlayıcı eşlemeleri (satıcıların yüzeylere nasıl ayrıldığı)

<AccordionGroup>
  <Accordion title="Google">
    Görüntü, video, müzik, toplu TTS, arka uç realtime ses ve
    medya anlama yüzeyleri.
  </Accordion>
  <Accordion title="OpenAI">
    Görüntü, video, toplu TTS, toplu STT, Voice Call akışlı STT, arka uç
    realtime ses ve bellek gömme yüzeyleri.
  </Accordion>
  <Accordion title="DeepInfra">
    Sohbet/model yönlendirme, görüntü üretimi/düzenleme, metinden videoya, toplu TTS,
    toplu STT, görüntü medya anlama ve bellek gömme yüzeyleri.
    DeepInfra'ya özgü yeniden sıralama/sınıflandırma/nesne algılama modelleri,
    OpenClaw bu kategoriler için özel sağlayıcı sözleşmelerine sahip olana kadar
    kaydedilmez.
  </Accordion>
  <Accordion title="xAI">
    Görüntü, video, arama, kod yürütme, toplu TTS, toplu STT ve Voice
    Call akışlı STT. xAI Realtime ses, yukarı akışta bir yetenektir ancak
    paylaşılan realtime ses sözleşmesi bunu temsil edebilene kadar
    OpenClaw içinde kaydedilmez.
  </Accordion>
</AccordionGroup>

## İlgili

- [Görüntü üretimi](/tr/tools/image-generation)
- [Video üretimi](/tr/tools/video-generation)
- [Müzik üretimi](/tr/tools/music-generation)
- [Metinden sese](/tr/tools/tts)
- [Medya anlama](/tr/nodes/media-understanding)
- [Ses düğümleri](/tr/nodes/audio)
- [Talk modu](/tr/nodes/talk)
