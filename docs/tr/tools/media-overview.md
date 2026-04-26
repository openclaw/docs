---
read_when:
    - OpenClaw'ın medya yeteneklerine genel bakış arıyorsunuz.
    - Hangi medya sağlayıcısını yapılandıracağınıza karar verme
    - Eşzamansız medya üretiminin nasıl çalıştığını anlamak
sidebarTitle: Media overview
summary: Görsel, video, müzik, konuşma ve medya anlama yeteneklerine hızlı bakış
title: Medyaya genel bakış
x-i18n:
    generated_at: "2026-04-26T11:42:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70be8062c01f57bf53ab08aad4f1561e3958adc94e478224821d722fd500e09f
    source_path: tools/media-overview.md
    workflow: 15
---

OpenClaw görseller, videolar ve müzik üretir; gelen medyayı
(görseller, ses, video) anlar ve metinden konuşmaya ile yanıtları sesli olarak okur. Tüm
medya yetenekleri araç tabanlıdır: ajan bunları ne zaman kullanacağına
konuşmaya göre karar verir ve her araç yalnızca en az bir destekleyici
sağlayıcı yapılandırıldığında görünür.

## Yetenekler

<CardGroup cols={2}>
  <Card title="Görsel üretimi" href="/tr/tools/image-generation" icon="image">
    `image_generate` aracılığıyla metin istemlerinden veya referans görsellerden
    görseller oluşturun ve düzenleyin. Eşzamanlıdır — yanıtla satır içinde tamamlanır.
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
    `tts` aracı ve `messages.tts` yapılandırması aracılığıyla
    giden yanıtları sesli sese dönüştürün. Eşzamanlıdır.
  </Card>
  <Card title="Medya anlama" href="/tr/nodes/media-understanding" icon="eye">
    Görme yetenekli model
    sağlayıcıları ve özel medya anlama Plugin'leri kullanarak gelen görselleri, sesleri ve videoları özetleyin.
  </Card>
  <Card title="Konuşmadan metne" href="/tr/nodes/audio" icon="ear-listen">
    Gelen sesli mesajları toplu STT veya Voice Call
    akış STT sağlayıcıları üzerinden döküme çevirin.
  </Card>
</CardGroup>

## Sağlayıcı yetenek matrisi

| Sağlayıcı    | Görsel | Video | Müzik | TTS | STT | Gerçek zamanlı ses | Medya anlama |
| ------------ | :----: | :---: | :---: | :-: | :-: | :----------------: | :----------: |
| Alibaba      |        |   ✓   |       |     |     |                    |              |
| BytePlus     |        |   ✓   |       |     |     |                    |              |
| ComfyUI      |   ✓    |   ✓   |   ✓   |     |     |                    |              |
| Deepgram     |        |       |       |     |  ✓  |         ✓          |              |
| ElevenLabs   |        |       |       |  ✓  |  ✓  |                    |              |
| fal          |   ✓    |   ✓   |       |     |     |                    |              |
| Google       |   ✓    |   ✓   |   ✓   |  ✓  |     |         ✓          |      ✓       |
| Gradium      |        |       |       |  ✓  |     |                    |              |
| Local CLI    |        |       |       |  ✓  |     |                    |              |
| Microsoft    |        |       |       |  ✓  |     |                    |              |
| MiniMax      |   ✓    |   ✓   |   ✓   |  ✓  |     |                    |              |
| Mistral      |        |       |       |     |  ✓  |                    |              |
| OpenAI       |   ✓    |   ✓   |       |  ✓  |  ✓  |         ✓          |      ✓       |
| Qwen         |        |   ✓   |       |     |     |                    |              |
| Runway       |        |   ✓   |       |     |     |                    |              |
| SenseAudio   |        |       |       |     |  ✓  |                    |              |
| Together     |        |   ✓   |       |     |     |                    |              |
| Vydra        |   ✓    |   ✓   |       |  ✓  |     |                    |              |
| xAI          |   ✓    |   ✓   |       |  ✓  |  ✓  |                    |      ✓       |
| Xiaomi MiMo  |   ✓    |       |       |  ✓  |     |                    |      ✓       |

<Note>
Medya anlama, sağlayıcı yapılandırmanızda kayıtlı olan görme yetenekli veya ses yetenekli herhangi bir modeli kullanır. Yukarıdaki matris, özel
medya anlama desteği olan sağlayıcıları listeler; çoğu çok kipli LLM sağlayıcısı (Anthropic, Google,
OpenAI vb.) etkin yanıt modeli olarak yapılandırıldığında gelen
medyayı da anlayabilir.
</Note>

## Eşzamansız ve eşzamanlı

| Yetenek         | Mod          | Neden                                                              |
| --------------- | ------------ | ------------------------------------------------------------------ |
| Görsel          | Eşzamanlı    | Sağlayıcı yanıtları saniyeler içinde döner; yanıtla satır içinde tamamlanır. |
| Metinden konuşmaya | Eşzamanlı | Sağlayıcı yanıtları saniyeler içinde döner; yanıt sesine eklenir.  |
| Video           | Eşzamansız   | Sağlayıcı işlemesi 30 sn ile birkaç dakika sürer.                  |
| Müzik (paylaşılan) | Eşzamansız | Video ile aynı sağlayıcı-işleme özelliği.                         |
| Müzik (ComfyUI) | Eşzamanlı    | Yerel iş akışı yapılandırılmış ComfyUI sunucusuna karşı satır içinde çalışır. |

Eşzamansız araçlarda OpenClaw isteği sağlayıcıya gönderir, hemen bir görev
kimliği döndürür ve işi görev ledger'ında izler. Ajan iş çalışırken
diğer mesajlara yanıt vermeye devam eder. Sağlayıcı işi bitirdiğinde,
OpenClaw ajanı uyandırır; böylece bitmiş medyayı özgün kanala geri
gönderebilir.

## Konuşmadan metne ve Voice Call

Deepgram, ElevenLabs, Mistral, OpenAI, SenseAudio ve xAI, yapılandırıldıklarında
toplu `tools.media.audio` yolu üzerinden gelen sesi döküme çevirebilir.
Mention geçitlemesi veya komut
ayrıştırma için bir sesli notu önceden işleyen kanal Plugin'leri, döküme çevrilmiş eki gelen bağlama işaretler; böylece paylaşılan
medya anlama geçişi, aynı ses için ikinci bir
STT çağrısı yapmak yerine bu dökümü yeniden kullanır.

Deepgram, ElevenLabs, Mistral, OpenAI ve xAI ayrıca Voice Call
akış STT sağlayıcıları da kaydeder; böylece canlı telefon sesi,
tamamlanmış bir kaydı beklemeden seçilen sağlayıcıya iletilebilir.

## Sağlayıcı eşlemeleri (sağlayıcıların yüzeyler arasında nasıl ayrıldığı)

<AccordionGroup>
  <Accordion title="Google">
    Görsel, video, müzik, toplu TTS, arka uç gerçek zamanlı ses ve
    medya anlama yüzeyleri.
  </Accordion>
  <Accordion title="OpenAI">
    Görsel, video, toplu TTS, toplu STT, Voice Call akış STT, arka uç
    gerçek zamanlı ses ve bellek embedding yüzeyleri.
  </Accordion>
  <Accordion title="xAI">
    Görsel, video, arama, kod yürütme, toplu TTS, toplu STT ve Voice
    Call akış STT. xAI Realtime voice yukarı akış bir yetenektir, ancak
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
- [Ses Node'ları](/tr/nodes/audio)
