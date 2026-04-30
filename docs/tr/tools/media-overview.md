---
read_when:
    - OpenClaw'un medya özelliklerine genel bir bakış arama
    - Yapılandırılacak medya sağlayıcısına karar verme
    - Eşzamansız medya oluşturmanın nasıl çalıştığını anlamak
sidebarTitle: Media overview
summary: Görüntü, video, müzik, konuşma ve medya anlama yeteneklerine genel bakış
title: Medyaya genel bakış
x-i18n:
    generated_at: "2026-04-30T09:50:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9f40e4fb86832438ae99dd2dc42da93c41937541314d95486c97c210dfef508
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw görüntüler, videolar ve müzik oluşturur, gelen medyayı
(görüntüler, ses, video) anlar ve yanıtları metinden sese ile sesli okur. Tüm
medya yetenekleri araç odaklıdır: ajan, konuşmaya göre bunları ne zaman
kullanacağına karar verir ve her araç yalnızca en az bir destekleyici
sağlayıcı yapılandırıldığında görünür.

## Yetenekler

<CardGroup cols={2}>
  <Card title="Görüntü oluşturma" href="/tr/tools/image-generation" icon="image">
    Metin istemlerinden veya referans görüntülerden `image_generate` ile
    görüntüler oluşturun ve düzenleyin. Eşzamanlı — yanıtla birlikte satır içi
    tamamlanır.
  </Card>
  <Card title="Video oluşturma" href="/tr/tools/video-generation" icon="video">
    `video_generate` ile metinden videoya, görüntüden videoya ve videodan
    videoya. Eşzamansız — arka planda çalışır ve hazır olduğunda sonucu
    gönderir.
  </Card>
  <Card title="Müzik oluşturma" href="/tr/tools/music-generation" icon="music">
    `music_generate` ile müzik veya ses parçaları oluşturun. Paylaşılan
    sağlayıcılarda eşzamansızdır; ComfyUI iş akışı yolu eşzamanlı çalışır.
  </Card>
  <Card title="Metinden sese" href="/tr/tools/tts" icon="microphone">
    Giden yanıtları `tts` aracı ve `messages.tts` yapılandırmasıyla konuşulan
    sese dönüştürün. Eşzamanlıdır.
  </Card>
  <Card title="Medya anlama" href="/tr/nodes/media-understanding" icon="eye">
    Görme yetenekli model sağlayıcıları ve özel medya anlama pluginleri
    kullanarak gelen görüntüleri, sesleri ve videoları özetleyin.
  </Card>
  <Card title="Konuşmadan metne" href="/tr/nodes/audio" icon="ear-listen">
    Gelen sesli mesajları toplu STT veya Sesli Arama akış STT sağlayıcıları
    üzerinden metne dönüştürün.
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
| Yerel CLI   |         |       |       |  ✓  |     |                    |              |
| Microsoft   |         |       |       |  ✓  |     |                    |              |
| MiniMax     |    ✓    |   ✓   |   ✓   |  ✓  |     |                    |              |
| Mistral     |         |       |       |     |  ✓  |                    |              |
| OpenAI      |    ✓    |   ✓   |       |  ✓  |  ✓  |         ✓          |      ✓       |
| OpenRouter  |    ✓    |   ✓   |       |  ✓  |     |                    |      ✓       |
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

## Eşzamansız ve eşzamanlı

| Yetenek         | Mod          | Neden                                                              |
| --------------- | ------------ | ------------------------------------------------------------------ |
| Görüntü         | Eşzamanlı    | Sağlayıcı yanıtları saniyeler içinde döner; yanıtla satır içi tamamlanır. |
| Metinden sese   | Eşzamanlı    | Sağlayıcı yanıtları saniyeler içinde döner; yanıt sesine eklenir. |
| Video           | Eşzamansız   | Sağlayıcı işlemesi 30 sn ile birkaç dakika arasında sürer.        |
| Müzik (paylaşılan) | Eşzamansız | Video ile aynı sağlayıcı işleme özelliğine sahiptir.              |
| Müzik (ComfyUI) | Eşzamanlı    | Yerel iş akışı, yapılandırılmış ComfyUI sunucusuna karşı satır içi çalışır. |

Eşzamansız araçlar için OpenClaw isteği sağlayıcıya gönderir, hemen bir görev
kimliği döndürür ve işi görev defterinde izler. Ajan, iş çalışırken diğer
mesajlara yanıt vermeye devam eder. Sağlayıcı bitirdiğinde OpenClaw ajanı
uyandırır; böylece tamamlanan medyayı özgün kanala geri gönderebilir.

## Konuşmadan metne ve Sesli Arama

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio ve xAI, yapılandırıldıklarında
toplu `tools.media.audio` yolu üzerinden gelen sesi metne dönüştürebilir.
Bahsetme geçidi veya komut ayrıştırma için bir sesli notu ön denetleyen kanal
pluginleri, metne dönüştürülmüş eki gelen bağlamda işaretler; böylece paylaşılan
medya anlama geçişi, aynı ses için ikinci bir STT çağrısı yapmak yerine bu
dökümü yeniden kullanır.

Deepgram, ElevenLabs, Mistral, OpenAI ve xAI ayrıca Sesli Arama akış STT
sağlayıcılarını kaydeder; böylece canlı telefon sesi, tamamlanmış bir kaydı
beklemeden seçilen satıcıya iletilebilir.

## Sağlayıcı eşlemeleri (satıcıların yüzeylere nasıl ayrıldığı)

<AccordionGroup>
  <Accordion title="Google">
    Görüntü, video, müzik, toplu TTS, arka uç gerçek zamanlı ses ve medya
    anlama yüzeyleri.
  </Accordion>
  <Accordion title="OpenAI">
    Görüntü, video, toplu TTS, toplu STT, Sesli Arama akış STT, arka uç gerçek
    zamanlı ses ve bellek gömme yüzeyleri.
  </Accordion>
  <Accordion title="DeepInfra">
    Sohbet/model yönlendirme, görüntü oluşturma/düzenleme, metinden videoya,
    toplu TTS, toplu STT, görüntü medya anlama ve bellek gömme yüzeyleri.
    DeepInfra yerel yeniden sıralama/sınıflandırma/nesne algılama modelleri,
    OpenClaw bu kategoriler için özel sağlayıcı sözleşmelerine sahip olana
    kadar kaydedilmez.
  </Accordion>
  <Accordion title="xAI">
    Görüntü, video, arama, kod yürütme, toplu TTS, toplu STT ve Sesli Arama
    akış STT. xAI Realtime ses bir üst kaynak yeteneğidir ancak paylaşılan
    gerçek zamanlı ses sözleşmesi bunu temsil edebilene kadar OpenClaw içinde
    kaydedilmez.
  </Accordion>
</AccordionGroup>

## İlgili

- [Görüntü oluşturma](/tr/tools/image-generation)
- [Video oluşturma](/tr/tools/video-generation)
- [Müzik oluşturma](/tr/tools/music-generation)
- [Metinden sese](/tr/tools/tts)
- [Medya anlama](/tr/nodes/media-understanding)
- [Ses düğümleri](/tr/nodes/audio)
