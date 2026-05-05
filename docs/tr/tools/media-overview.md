---
read_when:
    - OpenClaw'ın medya özelliklerine genel bir bakış arıyorsanız
    - Hangi medya sağlayıcısının yapılandırılacağına karar verme
    - Eşzamansız medya oluşturmanın nasıl çalıştığını anlama
sidebarTitle: Media overview
summary: Görüntü, video, müzik, konuşma ve medya anlama özellikleri bir bakışta
title: Medyaya genel bakış
x-i18n:
    generated_at: "2026-05-05T01:50:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bd6b93fd79897001d24f3ba5a5c8cb9bd17281116fad17262a6389214db7059
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw görseller, videolar ve müzik üretir; gelen medyayı
(görseller, ses, video) anlar ve yanıtları metinden konuşmaya ile sesli
olarak söyler. Tüm medya yetenekleri araç odaklıdır: ajan, konuşmaya göre
bunları ne zaman kullanacağına karar verir ve her araç yalnızca en az bir
destek sağlayıcı yapılandırıldığında görünür.

## Yetenekler

<CardGroup cols={2}>
  <Card title="Görsel üretimi" href="/tr/tools/image-generation" icon="image">
    Metin istemlerinden veya referans görsellerden `image_generate` aracılığıyla
    görseller oluşturun ve düzenleyin. Eşzamanlıdır — yanıtla birlikte satır içinde tamamlanır.
  </Card>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    `video_generate` aracılığıyla metinden videoya, görselden videoya ve videodan videoya.
    Eşzamansızdır — arka planda çalışır ve hazır olduğunda sonucu gönderir.
  </Card>
  <Card title="Müzik üretimi" href="/tr/tools/music-generation" icon="music">
    `music_generate` aracılığıyla müzik veya ses parçaları üretin. Paylaşılan
    sağlayıcılarda eşzamansızdır; ComfyUI iş akışı yolu eşzamanlı çalışır.
  </Card>
  <Card title="Metinden konuşmaya" href="/tr/tools/tts" icon="microphone">
    `tts` aracı ve `messages.tts` yapılandırmasıyla giden yanıtları konuşma
    sesine dönüştürün. Eşzamanlıdır.
  </Card>
  <Card title="Medya anlama" href="/tr/nodes/media-understanding" icon="eye">
    Görme yetenekli model sağlayıcıları ve özel medya anlama plugin'leri
    kullanarak gelen görselleri, sesi ve videoyu özetleyin.
  </Card>
  <Card title="Konuşmadan metne" href="/tr/nodes/audio" icon="ear-listen">
    Toplu STT veya Voice Call akış STT sağlayıcıları üzerinden gelen sesli
    mesajları yazıya dökün.
  </Card>
</CardGroup>

## Sağlayıcı yetenek matrisi

| Sağlayıcı   | Görsel | Video | Müzik | TTS | STT | Gerçek zamanlı ses | Medya anlama |
| ----------- | :----: | :---: | :---: | :-: | :-: | :----------------: | :----------: |
| Alibaba     |        |   ✓   |       |     |     |                    |              |
| BytePlus    |        |   ✓   |       |     |     |                    |              |
| ComfyUI     |   ✓    |   ✓   |   ✓   |     |     |                    |              |
| DeepInfra   |   ✓    |   ✓   |       |  ✓  |  ✓  |                    |      ✓       |
| Deepgram    |        |       |       |     |  ✓  |         ✓          |              |
| ElevenLabs  |        |       |       |  ✓  |  ✓  |                    |              |
| fal         |   ✓    |   ✓   |       |     |     |                    |              |
| Google      |   ✓    |   ✓   |   ✓   |  ✓  |     |         ✓          |      ✓       |
| Gradium     |        |       |       |  ✓  |     |                    |              |
| Local CLI   |        |       |       |  ✓  |     |                    |              |
| Microsoft   |        |       |       |  ✓  |     |                    |              |
| MiniMax     |   ✓    |   ✓   |   ✓   |  ✓  |     |                    |              |
| Mistral     |        |       |       |     |  ✓  |                    |              |
| OpenAI      |   ✓    |   ✓   |       |  ✓  |  ✓  |         ✓          |      ✓       |
| OpenRouter  |   ✓    |   ✓   |       |  ✓  |     |                    |      ✓       |
| Qwen        |        |   ✓   |       |     |     |                    |              |
| Runway      |        |   ✓   |       |     |     |                    |              |
| SenseAudio  |        |       |       |     |  ✓  |                    |              |
| Together    |        |   ✓   |       |     |     |                    |              |
| Vydra       |   ✓    |   ✓   |       |  ✓  |     |                    |              |
| xAI         |   ✓    |   ✓   |       |  ✓  |  ✓  |                    |      ✓       |
| Xiaomi MiMo |   ✓    |       |       |  ✓  |     |                    |      ✓       |

<Note>
Medya anlama, sağlayıcı yapılandırmanızda kayıtlı herhangi bir görme yetenekli
veya ses yetenekli modeli kullanır. Yukarıdaki matris, özel medya anlama
desteği olan sağlayıcıları listeler; çoğu çok modlu LLM sağlayıcısı
(Anthropic, Google, OpenAI vb.) etkin yanıt modeli olarak yapılandırıldığında
gelen medyayı da anlayabilir.
</Note>

## Eşzamansız ve eşzamanlı

| Yetenek          | Mod          | Neden                                                              |
| ---------------- | ------------ | ------------------------------------------------------------------ |
| Görsel           | Eşzamanlı    | Sağlayıcı yanıtları saniyeler içinde döner; yanıtla satır içinde tamamlanır. |
| Metinden konuşmaya | Eşzamanlı  | Sağlayıcı yanıtları saniyeler içinde döner; yanıt sesine eklenir. |
| Video            | Eşzamansız   | Sağlayıcı işlemesi 30 sn ile birkaç dakika arasında sürer.         |
| Müzik (paylaşılan) | Eşzamansız | Videoyla aynı sağlayıcı işleme özelliğine sahiptir.                |
| Müzik (ComfyUI)  | Eşzamanlı    | Yerel iş akışı, yapılandırılan ComfyUI sunucusuna karşı satır içinde çalışır. |

Eşzamansız araçlarda OpenClaw isteği sağlayıcıya gönderir, hemen bir görev
kimliği döndürür ve işi görev defterinde izler. İş çalışırken ajan diğer
mesajlara yanıt vermeye devam eder. Sağlayıcı tamamladığında OpenClaw, üretilen
medya yollarıyla ajanı uyandırır; böylece ajan kullanıcıya bilgi verebilir ve
kaynak teslim ilkesi gerektirdiğinde sonucu mesaj aracı üzerinden iletebilir.

## Konuşmadan metne ve Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio ve xAI, yapılandırıldığında
toplu `tools.media.audio` yolu üzerinden gelen sesi yazıya dökebilir.
Bahsetme denetimi veya komut ayrıştırması için sesli notu önceden kontrol eden
kanal plugin'leri, yazıya dökülmüş eki gelen bağlamda işaretler; böylece
paylaşılan medya anlama geçişi aynı ses için ikinci bir STT çağrısı yapmak
yerine bu transkripti yeniden kullanır.

Deepgram, ElevenLabs, Mistral, OpenAI ve xAI ayrıca Voice Call akış STT
sağlayıcılarını kaydeder; böylece canlı telefon sesi, tamamlanmış bir kaydı
beklemeden seçilen satıcıya iletilebilir.

## Sağlayıcı eşlemeleri (satıcıların yüzeylere göre ayrımı)

<AccordionGroup>
  <Accordion title="Google">
    Görsel, video, müzik, toplu TTS, arka uç gerçek zamanlı ses ve
    medya anlama yüzeyleri.
  </Accordion>
  <Accordion title="OpenAI">
    Görsel, video, toplu TTS, toplu STT, Voice Call akış STT, arka uç
    gerçek zamanlı ses ve bellek gömme yüzeyleri.
  </Accordion>
  <Accordion title="DeepInfra">
    Sohbet/model yönlendirme, görsel üretimi/düzenleme, metinden videoya,
    toplu TTS, toplu STT, görsel medya anlama ve bellek gömme yüzeyleri.
    DeepInfra'ya özgü yeniden sıralama/sınıflandırma/nesne algılama modelleri,
    OpenClaw bu kategoriler için özel sağlayıcı sözleşmelerine sahip olana
    kadar kaydedilmez.
  </Accordion>
  <Accordion title="xAI">
    Görsel, video, arama, kod yürütme, toplu TTS, toplu STT ve Voice
    Call akış STT. xAI Realtime voice bir üst kaynak yeteneğidir ancak
    paylaşılan gerçek zamanlı ses sözleşmesi bunu temsil edebilene kadar
    OpenClaw içinde kaydedilmez.
  </Accordion>
</AccordionGroup>

## İlgili

- [Görsel üretimi](/tr/tools/image-generation)
- [Video üretimi](/tr/tools/video-generation)
- [Müzik üretimi](/tr/tools/music-generation)
- [Metinden konuşmaya](/tr/tools/tts)
- [Medya anlama](/tr/nodes/media-understanding)
- [Ses düğümleri](/tr/nodes/audio)
