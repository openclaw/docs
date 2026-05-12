---
read_when:
    - OpenClaw'ın medya yeteneklerine genel bir bakış mı arıyorsunuz
    - Hangi medya sağlayıcısını yapılandıracağınıza karar verme
    - Eşzamansız medya oluşturmanın nasıl çalıştığını anlama
sidebarTitle: Media overview
summary: Görüntü, video, müzik, konuşma ve medya anlama yeteneklerine genel bakış
title: Medya genel bakışı
x-i18n:
    generated_at: "2026-05-12T08:46:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7ca89d058467968ee140cb3318fe8a1fb96d09fe7c59982efce36eb9b714591
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw görüntüler, videolar ve müzik üretir, gelen medyayı
(görüntüler, ses, video) anlar ve metinden konuşmaya ile yanıtları sesli okur. Tüm
medya yetenekleri araç odaklıdır: agent, konuşmaya göre bunları ne zaman
kullanacağına karar verir ve her araç yalnızca en az bir destekleyen
sağlayıcı yapılandırıldığında görünür.

Canlı konuşma, tek seferlik medya aracı yolu yerine Talk oturum sözleşmesini
kullanır. Talk üç moda sahiptir: sağlayıcıya özgü `realtime`, yerel veya akış
`stt-tts` ve yalnızca gözlem amaçlı konuşma yakalama için `transcription`. Bu modlar
telefoni, toplantılar, tarayıcı gerçek zamanlı, ve yerel bas-konuş istemcileriyle
sağlayıcı kataloglarını, olay zarflarını ve iptal semantiklerini paylaşır.

## Yetenekler

<CardGroup cols={2}>
  <Card title="Görüntü üretimi" href="/tr/tools/image-generation" icon="image">
    Metin istemlerinden veya referans görüntülerden `image_generate` aracılığıyla
    görüntüler oluşturun ve düzenleyin. Senkron — yanıtla birlikte satır içinde tamamlanır.
  </Card>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    `video_generate` aracılığıyla metinden videoya, görüntüden videoya ve videodan videoya.
    Asenkron — arka planda çalışır ve hazır olduğunda sonucu gönderir.
  </Card>
  <Card title="Müzik üretimi" href="/tr/tools/music-generation" icon="music">
    `music_generate` aracılığıyla müzik veya ses parçaları üretin. Paylaşılan
    sağlayıcılarda asenkron; ComfyUI iş akışı yolu senkron çalışır.
  </Card>
  <Card title="Metinden konuşmaya" href="/tr/tools/tts" icon="microphone">
    Giden yanıtları `tts` aracı ve `messages.tts` yapılandırmasıyla konuşma sesine
    dönüştürün. Senkron.
  </Card>
  <Card title="Medya anlama" href="/tr/nodes/media-understanding" icon="eye">
    Görme yetenekli model sağlayıcıları ve özel medya anlama pluginleri kullanarak
    gelen görüntüleri, sesleri ve videoları özetleyin.
  </Card>
  <Card title="Konuşmadan metne" href="/tr/nodes/audio" icon="ear-listen">
    Gelen sesli mesajları toplu STT veya Sesli Arama akış STT sağlayıcıları üzerinden
    yazıya dökün.
  </Card>
</CardGroup>

## Sağlayıcı yetenek matrisi

| Sağlayıcı   | Görüntü | Video | Müzik | TTS | STT | Gerçek zamanlı ses | Medya anlama |
| ----------- | :-----: | :---: | :---: | :-: | :-: | :----------------: | :----------: |
| Alibaba     |         |   ✓   |       |     |     |                    |              |
| BytePlus    |         |   ✓   |       |     |     |                    |              |
| ComfyUI     |    ✓    |   ✓   |   ✓   |     |     |                    |              |
| DeepInfra   |    ✓    |   ✓   |       |  ✓  |  ✓  |                    |      ✓       |
| Deepgram    |         |       |       |     |  ✓  |         ✓          |              |
| ElevenLabs  |         |       |       |  ✓  |  ✓  |                    |              |
| fal         |    ✓    |   ✓   |       |     |     |                    |              |
| Google      |    ✓    |   ✓   |   ✓   |  ✓  |     |         ✓          |      ✓       |
| Gradium     |         |       |       |  ✓  |     |                    |              |
| Local CLI   |         |       |       |  ✓  |     |                    |              |
| Microsoft   |         |       |       |  ✓  |     |                    |              |
| MiniMax     |    ✓    |   ✓   |   ✓   |  ✓  |     |                    |              |
| Mistral     |         |       |       |     |  ✓  |                    |              |
| OpenAI      |    ✓    |   ✓   |       |  ✓  |  ✓  |         ✓          |      ✓       |
| OpenRouter  |    ✓    |   ✓   |       |  ✓  |  ✓  |                    |      ✓       |
| Qwen        |         |   ✓   |       |     |     |                    |              |
| Runway      |         |   ✓   |       |     |     |                    |              |
| SenseAudio  |         |       |       |     |  ✓  |                    |              |
| Together    |         |   ✓   |       |     |     |                    |              |
| Vydra       |    ✓    |   ✓   |       |  ✓  |     |                    |              |
| xAI         |    ✓    |   ✓   |       |  ✓  |  ✓  |                    |      ✓       |
| Xiaomi MiMo |    ✓    |       |       |  ✓  |     |                    |      ✓       |

<Note>
Medya anlama, sağlayıcı yapılandırmanızda kayıtlı herhangi bir görme yetenekli
veya ses yetenekli modeli kullanır. Yukarıdaki matris, özel medya anlama
desteğine sahip sağlayıcıları listeler; çoğu çok modlu LLM sağlayıcısı
(Anthropic, Google, OpenAI vb.) etkin yanıt modeli olarak yapılandırıldığında
gelen medyayı da anlayabilir.
</Note>

## Asenkron ve senkron

| Yetenek         | Mod       | Neden                                                                                                  |
| --------------- | --------- | ------------------------------------------------------------------------------------------------------ |
| Görüntü         | Senkron   | Sağlayıcı yanıtları saniyeler içinde döner; yanıtla birlikte satır içinde tamamlanır.                  |
| Metinden konuşmaya | Senkron | Sağlayıcı yanıtları saniyeler içinde döner; yanıt sesine eklenir.                                      |
| Video           | Asenkron  | Sağlayıcı işleme 30 sn ile birkaç dakika sürer; yavaş kuyruklar yapılandırılan zaman aşımına kadar çalışabilir. |
| Müzik (paylaşılan) | Asenkron | Videoyla aynı sağlayıcı işleme özelliğine sahiptir.                                                   |
| Müzik (ComfyUI) | Senkron   | Yerel iş akışı, yapılandırılan ComfyUI sunucusuna karşı satır içinde çalışır.                          |

Asenkron araçlar için OpenClaw isteği sağlayıcıya gönderir, hemen bir görev
kimliği döndürür ve işi görev defterinde izler. Agent, iş çalışırken diğer
mesajlara yanıt vermeye devam eder. Sağlayıcı tamamladığında, OpenClaw agent'ı
üretilen medya yollarıyla uyandırır; böylece kullanıcıya bilgi verebilir ve
kaynak teslim politikası gerektirdiğinde sonucu mesaj aracı üzerinden iletebilir.
Yalnızca mesaj aracı kullanan grup/kanal rotaları için OpenClaw, eksik mesaj aracı
teslim kanıtını başarısız bir tamamlama denemesi olarak değerlendirir ve üretilen
medya yedeğini doğrudan özgün kanala gönderir.

## Konuşmadan metne ve Sesli Arama

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, OpenRouter, SenseAudio ve xAI; yapılandırıldığında
toplu `tools.media.audio` yolu üzerinden gelen sesleri yazıya dökebilir.
Bir sesli notu bahsetme geçidi veya komut ayrıştırma için ön denetimden geçiren
kanal pluginleri, yazıya dökülen eki gelen bağlam üzerinde işaretler; böylece
paylaşılan medya anlama geçişi, aynı ses için ikinci bir STT çağrısı yapmak yerine
bu dökümü yeniden kullanır.

Deepgram, ElevenLabs, Mistral, OpenAI ve xAI ayrıca Sesli Arama akış STT
sağlayıcılarını kaydeder; böylece canlı telefon sesi, tamamlanmış bir kayıt
beklenmeden seçilen satıcıya iletilebilir.

Canlı kullanıcı konuşmaları için [Talk modu](/tr/nodes/talk) tercih edin. Toplu ses
ekleri medya yolunda kalır; tarayıcı gerçek zamanlı, yerel bas-konuş, telefoni
ve toplantı sesi, Talk olaylarını ve Gateway tarafından döndürülen oturum kapsamlı
katalogları kullanmalıdır.

## Sağlayıcı eşlemeleri (satıcılar yüzeylere nasıl ayrılır)

<AccordionGroup>
  <Accordion title="Google">
    Görüntü, video, müzik, toplu TTS, arka uç gerçek zamanlı ses ve
    medya anlama yüzeyleri.
  </Accordion>
  <Accordion title="OpenAI">
    Görüntü, video, toplu TTS, toplu STT, Sesli Arama akış STT, arka uç
    gerçek zamanlı ses ve bellek gömme yüzeyleri.
  </Accordion>
  <Accordion title="DeepInfra">
    Sohbet/model yönlendirme, görüntü üretimi/düzenleme, metinden videoya, toplu TTS,
    toplu STT, görüntü medya anlama ve bellek gömme yüzeyleri.
    DeepInfra'ya özgü yeniden sıralama/sınıflandırma/nesne algılama modelleri,
    OpenClaw bu kategoriler için özel sağlayıcı sözleşmelerine sahip olana kadar
    kaydedilmez.
  </Accordion>
  <Accordion title="xAI">
    Görüntü, video, arama, kod yürütme, toplu TTS, toplu STT ve Sesli Arama
    akış STT. xAI Realtime ses, upstream bir yetenektir ancak paylaşılan
    gerçek zamanlı ses sözleşmesi bunu temsil edebilene kadar OpenClaw'da
    kaydedilmez.
  </Accordion>
</AccordionGroup>

## İlgili

- [Görüntü üretimi](/tr/tools/image-generation)
- [Video üretimi](/tr/tools/video-generation)
- [Müzik üretimi](/tr/tools/music-generation)
- [Metinden konuşmaya](/tr/tools/tts)
- [Medya anlama](/tr/nodes/media-understanding)
- [Ses düğümleri](/tr/nodes/audio)
- [Talk modu](/tr/nodes/talk)
