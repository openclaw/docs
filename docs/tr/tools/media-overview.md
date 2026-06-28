---
read_when:
    - OpenClaw'ın medya yeteneklerine genel bakış aranıyor
    - Hangi medya sağlayıcısının yapılandırılacağına karar verme
    - Eşzamansız medya üretiminin nasıl çalıştığını anlama
sidebarTitle: Media overview
summary: Görüntü, video, müzik, konuşma ve medya anlama yeteneklerine genel bakış
title: Medya genel bakışı
x-i18n:
    generated_at: "2026-06-28T01:23:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c04beb60abbd06d1503302be144e633b526ae55435f061fbb94f6fef85ca9d66
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw görüntüler, videolar ve müzik üretir, gelen medyayı
(görüntüler, ses, video) anlar ve yanıtları metinden sese ile sesli olarak söyler. Tüm
medya yetenekleri araç güdümlüdür: agent, konuşmaya bağlı olarak bunları ne zaman
kullanacağına karar verir ve her araç yalnızca en az bir destekleyen sağlayıcı
yapılandırıldığında görünür.

Canlı konuşma, tek seferlik medya aracı yolu yerine Talk oturumu sözleşmesini
kullanır. Talk üç moda sahiptir: sağlayıcıya özgü `realtime`, yerel veya akışlı
`stt-tts` ve yalnızca gözlem amaçlı konuşma yakalama için `transcription`. Bu modlar,
sağlayıcı kataloglarını, olay zarflarını ve iptal semantiklerini telefon, toplantılar,
tarayıcı gerçek zamanlı, ve yerel bas-konuş istemcileriyle paylaşır.

## Yetenekler

<CardGroup cols={2}>
  <Card title="Image generation" href="/tr/tools/image-generation" icon="image">
    Metin istemlerinden veya referans görüntülerden `image_generate` aracılığıyla
    görüntüler oluşturun ve düzenleyin. Sohbet oturumlarında eşzamansızdır — arka planda
    çalışır ve hazır olduğunda sonucu gönderir.
  </Card>
  <Card title="Video generation" href="/tr/tools/video-generation" icon="video">
    `video_generate` aracılığıyla metinden videoya, görüntüden videoya ve videodan videoya.
    Eşzamansızdır — arka planda çalışır ve hazır olduğunda sonucu gönderir.
  </Card>
  <Card title="Music generation" href="/tr/tools/music-generation" icon="music">
    `music_generate` aracılığıyla müzik veya ses parçaları üretin. Sohbet
    oturumlarında, paylaşılan medya üretimi görev yaşam döngüsünde eşzamansızdır.
  </Card>
  <Card title="Text-to-speech" href="/tr/tools/tts" icon="microphone">
    Giden yanıtları `tts` aracı ve `messages.tts` yapılandırmasıyla konuşulan sese
    dönüştürün. Eşzamanlıdır.
  </Card>
  <Card title="Media understanding" href="/tr/nodes/media-understanding" icon="eye">
    Görü yetenekli model sağlayıcıları ve ayrılmış medya anlama Plugin'leri kullanarak
    gelen görüntüleri, sesleri ve videoları özetleyin.
  </Card>
  <Card title="Speech-to-text" href="/tr/nodes/audio" icon="ear-listen">
    Gelen sesli mesajları toplu STT veya Sesli Arama akışlı STT sağlayıcılarıyla
    metne dönüştürün.
  </Card>
</CardGroup>

## Sağlayıcı yetenek matrisi

| Sağlayıcı         | Görüntü | Video | Müzik | TTS | STT | Gerçek zamanlı ses | Medya anlama |
| ----------------- | :-----: | :---: | :---: | :-: | :-: | :----------------: | :----------: |
| Alibaba           |         |   ✓   |       |     |     |                    |              |
| BytePlus          |         |   ✓   |       |     |     |                    |              |
| ComfyUI           |    ✓    |   ✓   |   ✓   |     |     |                    |              |
| DeepInfra         |    ✓    |   ✓   |       |  ✓  |  ✓  |                    |      ✓       |
| Deepgram          |         |       |       |     |  ✓  |         ✓          |              |
| ElevenLabs        |         |       |       |  ✓  |  ✓  |                    |              |
| fal               |    ✓    |   ✓   |   ✓   |     |     |                    |              |
| Google            |    ✓    |   ✓   |   ✓   |  ✓  |     |         ✓          |      ✓       |
| Gradium           |         |       |       |  ✓  |     |                    |              |
| Local CLI         |         |       |       |  ✓  |     |                    |              |
| Microsoft         |         |       |       |  ✓  |     |                    |              |
| Microsoft Foundry |    ✓    |       |       |     |     |                    |              |
| MiniMax           |    ✓    |   ✓   |   ✓   |  ✓  |     |                    |              |
| Mistral           |         |       |       |     |  ✓  |                    |              |
| OpenAI            |    ✓    |   ✓   |       |  ✓  |  ✓  |         ✓          |      ✓       |
| OpenRouter        |    ✓    |   ✓   |   ✓   |  ✓  |  ✓  |                    |      ✓       |
| Qwen              |         |   ✓   |       |     |     |                    |              |
| Runway            |         |   ✓   |       |     |     |                    |              |
| SenseAudio        |         |       |       |     |  ✓  |                    |              |
| Together          |         |   ✓   |       |     |     |                    |              |
| Vydra             |    ✓    |   ✓   |       |  ✓  |     |                    |              |
| xAI               |    ✓    |   ✓   |       |  ✓  |  ✓  |                    |      ✓       |
| Xiaomi MiMo       |    ✓    |       |       |  ✓  |     |                    |      ✓       |

<Note>
Medya anlama, sağlayıcı yapılandırmanızda kayıtlı herhangi bir görü yetenekli
veya ses yetenekli modeli kullanır. Yukarıdaki matris, ayrılmış medya anlama
desteğine sahip sağlayıcıları listeler; çoğu çok modlu LLM sağlayıcısı
(Anthropic, Google, OpenAI vb.) etkin yanıt modeli olarak yapılandırıldığında
gelen medyayı da anlayabilir.
</Note>

## Eşzamansız ve eşzamanlı

| Yetenek        | Mod          | Neden                                                                                                |
| -------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| Görüntü        | Eşzamansız   | Sağlayıcı işlemesi bir sohbet turundan uzun sürebilir; üretilen ekler paylaşılan tamamlama yolunu kullanır. |
| Metinden sese  | Eşzamanlı    | Sağlayıcı yanıtları saniyeler içinde döner; yanıt sesine eklenir.                                     |
| Video          | Eşzamansız   | Sağlayıcı işlemesi 30 sn ile birkaç dakika sürer; yavaş kuyruklar yapılandırılan zaman aşımına kadar çalışabilir. |
| Müzik          | Eşzamansız   | Video ile aynı sağlayıcı işleme özelliğine sahiptir.                                                  |

Eşzamansız araçlar için OpenClaw isteği sağlayıcıya gönderir, hemen bir görev
kimliği döndürür ve işi görev defterinde izler. Agent, iş çalışırken diğer
mesajlara yanıt vermeye devam eder. Sağlayıcı tamamladığında OpenClaw, üretilen
medya yollarıyla agent'ı uyandırır; böylece agent, oturumun normal görünür yanıt
modu üzerinden kullanıcıya bildirebilir: yapılandırıldığında otomatik son yanıt
teslimi veya oturum mesaj aracını gerektiriyorsa `message(action="send")`.
İstekte bulunan oturum etkin değilse veya etkin uyanışı başarısız olursa ve
üretilen medyanın bir kısmı hâlâ tamamlama yanıtında eksikse, OpenClaw yalnızca
eksik medyayı içeren idempotent bir doğrudan geri dönüş gönderir. Tamamlama
yanıtıyla zaten teslim edilmiş medya tekrar gönderilmez.

## Konuşmadan metne ve Sesli Arama

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, OpenRouter, SenseAudio ve xAI, yapılandırıldığında
toplu `tools.media.audio` yolu üzerinden gelen sesin tamamını metne dönüştürebilir.
Bahsetme geçidi veya komut ayrıştırma için bir sesli notu ön kontrolden geçiren
kanal Plugin'leri, metne dönüştürülen eki gelen bağlam üzerinde işaretler; böylece
paylaşılan medya anlama geçişi, aynı ses için ikinci bir STT çağrısı yapmak yerine
bu transkripti yeniden kullanır.

Deepgram, ElevenLabs, Mistral, OpenAI ve xAI ayrıca Sesli Arama akışlı STT
sağlayıcılarını kaydeder; böylece canlı telefon sesi, tamamlanmış bir kayıt
beklenmeden seçilen tedarikçiye iletilebilir.

Canlı kullanıcı konuşmaları için [Talk modu](/tr/nodes/talk) tercih edin. Toplu ses
ekleri medya yolunda kalır; tarayıcı gerçek zamanlı, yerel bas-konuş, telefon ve
toplantı sesi Talk olaylarını ve Gateway tarafından döndürülen oturum kapsamlı
katalogları kullanmalıdır.

## Sağlayıcı eşlemeleri (tedarikçilerin yüzeylere nasıl ayrıldığı)

<AccordionGroup>
  <Accordion title="Google">
    Görüntü, video, müzik, toplu TTS, arka uç gerçek zamanlı ses ve
    medya anlama yüzeyleri.
  </Accordion>
  <Accordion title="OpenAI">
    Görüntü, video, toplu TTS, toplu STT, Sesli Arama akışlı STT, arka uç
    gerçek zamanlı ses ve bellek gömme yüzeyleri.
  </Accordion>
  <Accordion title="DeepInfra">
    Sohbet/model yönlendirme, görüntü oluşturma/düzenleme, metinden videoya, toplu TTS,
    toplu STT, görüntü medyası anlama ve bellek gömme yüzeyleri.
    DeepInfra'ya özgü yeniden sıralama/sınıflandırma/nesne algılama modelleri,
    OpenClaw bu kategoriler için ayrılmış sağlayıcı sözleşmelerine sahip olana kadar
    kaydedilmez.
  </Accordion>
  <Accordion title="xAI">
    Görüntü, video, arama, kod yürütme, toplu TTS, toplu STT ve Sesli
    Arama akışlı STT. xAI Realtime ses, upstream bir yetenektir ancak
    paylaşılan gerçek zamanlı ses sözleşmesi bunu temsil edebilene kadar
    OpenClaw'da kaydedilmez.
  </Accordion>
</AccordionGroup>

## İlgili

- [Görüntü oluşturma](/tr/tools/image-generation)
- [Video oluşturma](/tr/tools/video-generation)
- [Müzik oluşturma](/tr/tools/music-generation)
- [Metinden sese](/tr/tools/tts)
- [Medya anlama](/tr/nodes/media-understanding)
- [Ses düğümleri](/tr/nodes/audio)
- [Talk modu](/tr/nodes/talk)
