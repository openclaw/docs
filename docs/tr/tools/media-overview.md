---
read_when:
    - OpenClaw'ın medya yeteneklerine genel bir bakış mı arıyorsunuz?
    - Hangi medya sağlayıcısının yapılandırılacağına karar verme
    - Eşzamansız medya oluşturmanın nasıl çalıştığını anlama
sidebarTitle: Media overview
summary: Görüntü, video, müzik, konuşma ve medya anlama yeteneklerine genel bakış
title: Medya genel bakışı
x-i18n:
    generated_at: "2026-07-12T12:49:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f7d7bf8bd2052cdba088d7a612bb89b0fc3a95b3635c7fcd2138eb731121b85f
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw görseller, videolar ve müzik üretir; gelen medyayı
(görseller, ses ve video) anlar ve metinden sese dönüştürmeyle yanıtları sesli
olarak okur. Tüm medya yetenekleri araçlarla çalışır: aracı ne zaman
kullanacağına konuşmaya göre aracı karar verir ve her araç yalnızca en az bir
destek sağlayıcısı yapılandırıldığında görünür.

Canlı konuşma, tek seferlik medya aracı yolu yerine Talk oturumu sözleşmesini
kullanır. Talk'un üç modu vardır: sağlayıcıya özgü `realtime`, yerel veya akışlı
`stt-tts` ve yalnızca gözlem amaçlı konuşma yakalama için `transcription`. Bu
modlar; telefon, toplantı, tarayıcıda gerçek zamanlı iletişim ve yerel
bas-konuş istemcileriyle sağlayıcı kataloglarını, olay zarflarını ve iptal
anlamlarını paylaşır.

## Yetenekler

<CardGroup cols={2}>
  <Card title="Görsel üretimi" href="/tr/tools/image-generation" icon="image">
    `image_generate` aracılığıyla metin istemlerinden veya referans
    görsellerden görseller oluşturun ve düzenleyin. Sohbet oturumlarında
    eşzamansızdır; arka planda çalışır ve hazır olduğunda sonucu gönderir.
  </Card>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    `video_generate` aracılığıyla metinden videoya, görselden videoya ve
    videodan videoya üretim. Eşzamansızdır; arka planda çalışır ve hazır
    olduğunda sonucu gönderir.
  </Card>
  <Card title="Müzik üretimi" href="/tr/tools/music-generation" icon="music">
    `music_generate` aracılığıyla müzik veya ses parçaları üretin. Sohbet
    oturumlarında, paylaşılan medya üretimi görev yaşam döngüsünde eşzamansız
    çalışır.
  </Card>
  <Card title="Metinden sese" href="/tr/tools/tts" icon="microphone">
    `tts` aracı ve `messages.tts` yapılandırması aracılığıyla giden yanıtları
    sesli içeriğe dönüştürün. Eşzamanlıdır.
  </Card>
  <Card title="Medya anlama" href="/tr/nodes/media-understanding" icon="eye">
    Görme yeteneğine sahip model sağlayıcıları ve özel medya anlama
    plugin'lerini kullanarak gelen görselleri, sesleri ve videoları özetleyin.
  </Card>
  <Card title="Konuşmadan metne" href="/tr/nodes/audio" icon="ear-listen">
    Gelen sesli mesajları toplu STT veya Voice Call akışlı STT sağlayıcıları
    üzerinden yazıya dökün.
  </Card>
</CardGroup>

## Sağlayıcı yetenek matrisi

<Note>
Bu tablo, özel medya üretimi, TTS ve STT plugin'lerini kapsar. Birçok sohbet
modeli sağlayıcısı da (Anthropic, Google, OpenAI ve diğerleri) yanıt modeli
aracılığıyla gelen medyayı anlayabilir; tam sağlayıcı listesi için
[Medya anlama](/tr/nodes/media-understanding#provider-support-matrix) bölümüne
bakın.
</Note>

| Sağlayıcı         | Görsel | Video | Müzik | TTS | STT | Gerçek zamanlı ses | Medya anlama |
| ----------------- | :----: | :---: | :---: | :-: | :-: | :----------------: | :----------: |
| Alibaba           |        |   ✓   |       |     |     |                    |              |
| Azure Speech      |        |       |       |  ✓  |     |                    |              |
| BytePlus          |        |   ✓   |       |     |     |                    |              |
| ComfyUI           |   ✓    |   ✓   |   ✓   |     |     |                    |              |
| Deepgram          |        |       |       |     |  ✓  |                    |              |
| DeepInfra         |   ✓    |   ✓   |       |  ✓  |  ✓  |                    |      ✓       |
| ElevenLabs        |        |       |       |  ✓  |  ✓  |                    |              |
| fal               |   ✓    |   ✓   |   ✓   |     |     |                    |              |
| Google            |   ✓    |   ✓   |   ✓   |  ✓  |  ✓  |         ✓          |      ✓       |
| Gradium           |        |       |       |  ✓  |     |                    |              |
| Inworld           |        |       |       |  ✓  |     |                    |              |
| LiteLLM           |   ✓    |       |       |     |     |                    |              |
| Yerel CLI         |        |       |       |  ✓  |     |                    |              |
| Microsoft         |        |       |       |  ✓  |     |                    |              |
| Microsoft Foundry |   ✓    |       |       |     |     |                    |              |
| MiniMax           |   ✓    |   ✓   |   ✓   |  ✓  |     |                    |              |
| Mistral           |        |       |       |     |  ✓  |                    |              |
| OpenAI            |   ✓    |   ✓   |       |  ✓  |  ✓  |         ✓          |      ✓       |
| OpenRouter        |   ✓    |   ✓   |   ✓   |  ✓  |  ✓  |                    |      ✓       |
| PixVerse          |        |   ✓   |       |     |     |                    |              |
| Qwen              |        |   ✓   |       |     |     |                    |      ✓       |
| Runway            |        |   ✓   |       |     |     |                    |              |
| SenseAudio        |        |       |       |     |  ✓  |                    |              |
| Together          |        |   ✓   |       |     |     |                    |              |
| Volcengine        |        |       |       |  ✓  |     |                    |              |
| Vydra             |   ✓    |   ✓   |       |  ✓  |     |                    |              |
| xAI               |   ✓    |   ✓   |       |  ✓  |  ✓  |                    |      ✓       |
| Xiaomi MiMo       |        |       |       |  ✓  |     |                    |              |

<Note>
Buradaki **gerçek zamanlı ses**, sağlayıcıya özgü çift yönlü gerçek zamanlı
iletişim (Talk `realtime` modu; örneğin Gemini Live veya OpenAI Realtime API)
anlamına gelir. Şu anda bunu yalnızca Google ve OpenAI kaydeder. Deepgram,
ElevenLabs, Mistral, OpenAI ve xAI ayrıca Voice Call akışlı STT'yi (tek yönlü
sesten metne) kaydeder; aşağıdaki
[Konuşmadan metne ve Voice Call](#speech-to-text-and-voice-call) bölümüne bakın.
xAI gerçek zamanlı ses desteği üst kaynakta bulunan bir yetenektir ancak
paylaşılan gerçek zamanlı ses sözleşmesi bunu temsil edebilene kadar
OpenClaw'da kaydedilmez.
</Note>

## Eşzamansız ve eşzamanlı

| Yetenek       | Mod         | Nedeni                                                                                                          |
| ------------- | ----------- | --------------------------------------------------------------------------------------------------------------- |
| Görsel        | Eşzamansız  | Sağlayıcı işlemesi bir sohbet turundan uzun sürebilir; üretilen ekler paylaşılan tamamlama yolunu kullanır.      |
| Metinden sese | Eşzamanlı   | Sağlayıcı yanıtları saniyeler içinde döner ve yanıt sesine eklenir.                                             |
| Video         | Eşzamansız  | Sağlayıcı işlemesi 30 saniyeden birkaç dakikaya kadar sürer; yavaş kuyruklar yapılandırılmış zaman aşımına kadar çalışabilir. |
| Müzik         | Eşzamansız  | Videoyla aynı sağlayıcı işleme özelliklerine sahiptir.                                                          |

Eşzamansız araçlarda OpenClaw isteği sağlayıcıya gönderir, hemen bir görev
kimliği döndürür ve işi görev defterinde izler. İş çalışırken aracı diğer
mesajlara yanıt vermeyi sürdürür. Sağlayıcı işlemi tamamladığında OpenClaw,
üretilen medya yollarıyla aracıyı uyandırır; böylece aracı, oturumun normal
görünür yanıt modu üzerinden kullanıcıyı bilgilendirebilir: yapılandırıldığında
otomatik nihai yanıt teslimi veya oturum mesaj aracını gerektirdiğinde
`message(action="send")`. İstekte bulunan oturum etkin değilse ya da etkin
uyandırma işlemi başarısız olursa ve üretilen medyanın bir kısmı hâlâ tamamlama
yanıtında eksikse OpenClaw, yalnızca eksik medyayı içeren idempotent bir
doğrudan yedek gönderim yapar. Tamamlama yanıtıyla zaten teslim edilen medya
yeniden gönderilmez.

## Konuşmadan metne ve Voice Call

Deepgram, DeepInfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter,
SenseAudio ve xAI; yapılandırıldıklarında gelen sesleri toplu
`tools.media.audio` yolu üzerinden yazıya dökebilir. Bahsetme denetimi veya
komut ayrıştırma için bir sesli notu önceden kontrol eden kanal plugin'leri,
yazıya dökülen eki gelen bağlamda işaretler. Böylece paylaşılan medya anlama
geçişi, aynı ses için ikinci bir STT çağrısı yapmak yerine bu dökümü yeniden
kullanır.

Deepgram, ElevenLabs, Mistral, OpenAI ve xAI ayrıca Voice Call akışlı STT
sağlayıcılarını kaydeder. Böylece canlı telefon sesi, tamamlanmış bir kaydı
beklemeden seçilen sağlayıcıya iletilebilir.

Canlı kullanıcı konuşmaları için [Talk modunu](/tr/nodes/talk) tercih edin. Toplu
ses ekleri medya yolunda kalır; tarayıcıdaki gerçek zamanlı ses, yerel
bas-konuş, telefon ve toplantı sesleri Talk olaylarını ve Gateway tarafından
döndürülen oturum kapsamlı katalogları kullanmalıdır.

## Sağlayıcı eşlemeleri (sağlayıcıların yüzeylere dağılımı)

<AccordionGroup>
  <Accordion title="Google">
    Görsel, video, müzik, toplu TTS, toplu STT, arka uç gerçek zamanlı ses ve
    medya anlama yüzeyleri.
  </Accordion>
  <Accordion title="OpenAI">
    Görsel, video, toplu TTS, toplu STT, Voice Call akışlı STT, arka uç gerçek
    zamanlı ses ve bellek gömme yüzeyleri.
  </Accordion>
  <Accordion title="DeepInfra">
    Sohbet/model yönlendirme, görsel üretme/düzenleme, metinden videoya, toplu
    TTS, toplu STT, görsel medya anlama ve bellek gömme yüzeyleri. DeepInfra
    ayrıca yeniden sıralama, sınıflandırma, nesne algılama ve diğer yerel model
    türlerini sunar; OpenClaw'ın bu kategoriler için henüz bir sağlayıcı
    sözleşmesi olmadığından bu plugin bunları kaydetmez.
  </Accordion>
  <Accordion title="xAI">
    Görsel, video, arama, kod yürütme, toplu TTS, toplu STT ve Voice Call
    akışlı STT. xAI gerçek zamanlı ses desteği üst kaynakta bulunan bir
    yetenektir ancak paylaşılan gerçek zamanlı ses sözleşmesi bunu temsil
    edebilene kadar OpenClaw'da kaydedilmez.
  </Accordion>
</AccordionGroup>

## İlgili konular

- [Görsel üretimi](/tr/tools/image-generation)
- [Video üretimi](/tr/tools/video-generation)
- [Müzik üretimi](/tr/tools/music-generation)
- [Metinden sese](/tr/tools/tts)
- [Medya anlama](/tr/nodes/media-understanding)
- [Ses Node'ları](/tr/nodes/audio)
- [Talk modu](/tr/nodes/talk)
