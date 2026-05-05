---
read_when:
    - OpenClaw'ın medya yeteneklerine genel bir bakış arıyorsunuz
    - Yapılandırılacak medya sağlayıcısına karar verme
    - Eşzamansız medya oluşturmanın nasıl çalıştığını anlamak
sidebarTitle: Media overview
summary: Görüntü, video, müzik, konuşma ve medya anlama yeteneklerine genel bakış
title: Medyaya genel bakış
x-i18n:
    generated_at: "2026-05-05T06:19:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd02d4418fe294fda5f1437dd3a07c4aeb4de3b46a1b70bfe36914bc27123cc4
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw görüntüler, videolar ve müzik üretir, gelen medyayı
(görüntüler, ses, video) anlar ve yanıtları metinden konuşmaya ile sesli
olarak söyler. Tüm medya yetenekleri araç odaklıdır: agent, konuşmaya göre
bunları ne zaman kullanacağına karar verir ve her araç yalnızca en az bir
destekleyici sağlayıcı yapılandırıldığında görünür.

## Yetenekler

<CardGroup cols={2}>
  <Card title="Image generation" href="/tr/tools/image-generation" icon="image">
    Metin istemlerinden veya referans görüntülerden `image_generate` ile
    görüntüler oluşturun ve düzenleyin. Eşzamanlıdır — yanıtla satır içinde
    tamamlanır.
  </Card>
  <Card title="Video generation" href="/tr/tools/video-generation" icon="video">
    `video_generate` ile metinden videoya, görüntüden videoya ve videodan
    videoya. Eşzamansızdır — arka planda çalışır ve hazır olduğunda sonucu
    gönderir.
  </Card>
  <Card title="Music generation" href="/tr/tools/music-generation" icon="music">
    `music_generate` ile müzik veya ses parçaları üretin. Paylaşılan
    sağlayıcılarda eşzamansızdır; ComfyUI iş akışı yolu eşzamanlı çalışır.
  </Card>
  <Card title="Text-to-speech" href="/tr/tools/tts" icon="microphone">
    Giden yanıtları `tts` aracı ve `messages.tts` yapılandırmasıyla konuşma
    sesine dönüştürün. Eşzamanlıdır.
  </Card>
  <Card title="Media understanding" href="/tr/nodes/media-understanding" icon="eye">
    Gelen görüntüleri, sesleri ve videoları görme yetenekli model
    sağlayıcıları ve özel medya anlama plugin’leri kullanarak özetleyin.
  </Card>
  <Card title="Speech-to-text" href="/tr/nodes/audio" icon="ear-listen">
    Gelen sesli mesajları toplu STT veya Voice Call akış STT sağlayıcıları
    üzerinden yazıya dökün.
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
veya ses yetenekli modeli kullanır. Yukarıdaki matris özel medya anlama
desteği olan sağlayıcıları listeler; çoğu çok modlu LLM sağlayıcısı (Anthropic,
Google, OpenAI vb.) etkin yanıt modeli olarak yapılandırıldığında gelen medyayı
da anlayabilir.
</Note>

## Eşzamansız ve eşzamanlı

| Yetenek         | Mod          | Neden                                                                                                |
| --------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| Görüntü         | Eşzamanlı    | Sağlayıcı yanıtları saniyeler içinde döner; yanıtla satır içinde tamamlanır.                         |
| Metinden konuşmaya | Eşzamanlı | Sağlayıcı yanıtları saniyeler içinde döner; yanıt sesine eklenir.                                    |
| Video           | Eşzamansız   | Sağlayıcı işlemesi 30 saniyeden birkaç dakikaya kadar sürer; yavaş kuyruklar yapılandırılmış zaman aşımına kadar çalışabilir. |
| Müzik (paylaşılan) | Eşzamansız | Video ile aynı sağlayıcı işleme özelliğine sahiptir.                                                  |
| Müzik (ComfyUI) | Eşzamanlı    | Yerel iş akışı, yapılandırılmış ComfyUI sunucusuna karşı satır içinde çalışır.                       |

Eşzamansız araçlar için OpenClaw isteği sağlayıcıya gönderir, hemen bir görev
kimliği döndürür ve işi görev defterinde izler. İş çalışırken agent diğer
mesajlara yanıt vermeye devam eder. Sağlayıcı tamamladığında OpenClaw, üretilen
medya yollarıyla agent’ı uyandırır; böylece agent kullanıcıya bilgi verebilir
ve kaynak teslim politikası gerektirdiğinde sonucu mesaj aracı üzerinden
iletebilir. Yalnızca mesaj aracı kullanılan grup/kanal rotalarında OpenClaw,
eksik mesaj aracı teslim kanıtını başarısız bir tamamlama girişimi olarak
değerlendirir ve üretilen medya yedeğini doğrudan özgün kanala gönderir.

## Konuşmadan metne ve Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio ve xAI, yapılandırıldığında
toplu `tools.media.audio` yolu üzerinden gelen sesi yazıya dökebilir.
Bahsetme kapısı veya komut ayrıştırma için bir sesli notu ön kontrolden
geçiren kanal plugin’leri, gelen bağlamda yazıya dökülmüş eki işaretler; böylece
paylaşılan medya anlama geçişi aynı ses için ikinci bir STT çağrısı yapmak
yerine bu dökümü yeniden kullanır.

Deepgram, ElevenLabs, Mistral, OpenAI ve xAI ayrıca Voice Call akış STT
sağlayıcılarını kaydeder; böylece canlı telefon sesi, tamamlanmış bir kaydı
beklemeden seçilen satıcıya iletilebilir.

## Sağlayıcı eşlemeleri (satıcıların yüzeylere nasıl ayrıldığı)

<AccordionGroup>
  <Accordion title="Google">
    Görüntü, video, müzik, toplu TTS, arka uç gerçek zamanlı ses ve
    medya anlama yüzeyleri.
  </Accordion>
  <Accordion title="OpenAI">
    Görüntü, video, toplu TTS, toplu STT, Voice Call akış STT, arka uç
    gerçek zamanlı ses ve bellek gömme yüzeyleri.
  </Accordion>
  <Accordion title="DeepInfra">
    Sohbet/model yönlendirme, görüntü oluşturma/düzenleme, metinden videoya,
    toplu TTS, toplu STT, görüntü medya anlama ve bellek gömme yüzeyleri.
    DeepInfra’ya özgü yeniden sıralama/sınıflandırma/nesne algılama modelleri,
    OpenClaw bu kategoriler için özel sağlayıcı sözleşmelerine sahip olana
    kadar kaydedilmez.
  </Accordion>
  <Accordion title="xAI">
    Görüntü, video, arama, kod yürütme, toplu TTS, toplu STT ve Voice
    Call akış STT. xAI Realtime voice bir üst kaynak yeteneğidir, ancak
    paylaşılan gerçek zamanlı ses sözleşmesi bunu temsil edebilene kadar
    OpenClaw’da kaydedilmez.
  </Accordion>
</AccordionGroup>

## İlgili

- [Görüntü oluşturma](/tr/tools/image-generation)
- [Video oluşturma](/tr/tools/video-generation)
- [Müzik oluşturma](/tr/tools/music-generation)
- [Metinden konuşmaya](/tr/tools/tts)
- [Medya anlama](/tr/nodes/media-understanding)
- [Ses düğümleri](/tr/nodes/audio)
