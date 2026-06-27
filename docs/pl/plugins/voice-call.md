---
read_when:
    - Chcesz wykonać wychodzące połączenie głosowe z OpenClaw
    - Konfigurujesz lub rozwijasz Plugin połączeń głosowych
    - Potrzebujesz obsługi głosu w czasie rzeczywistym lub transkrypcji strumieniowej w telefonii
sidebarTitle: Voice call
summary: Nawiązuj połączenia głosowe wychodzące i odbieraj przychodzące przez Twilio, Telnyx lub Plivo, z opcjonalną obsługą głosu w czasie rzeczywistym i transkrypcją strumieniową
title: Plugin połączeń głosowych
x-i18n:
    generated_at: "2026-06-27T18:09:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6eff6fe188644d6ac2f4868b28727783bd1859025e8745b1901e20637d68611c
    source_path: plugins/voice-call.md
    workflow: 16
---

Połączenia głosowe dla OpenClaw za pośrednictwem Plugin. Obsługuje powiadomienia wychodzące,
konwersacje wieloturowe, pełnodupleksowy głos w czasie rzeczywistym, strumieniową
transkrypcję oraz połączenia przychodzące z zasadami listy dozwolonych.

**Obecni dostawcy:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (dev/no network).

<Note>
Plugin Voice Call działa **wewnątrz procesu Gateway**. Jeśli używasz
zdalnego Gateway, zainstaluj i skonfiguruj Plugin na maszynie uruchamiającej
Gateway, a następnie zrestartuj Gateway, aby go załadować.
</Note>

## Szybki start

<Steps>
  <Step title="Install the plugin">
    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="From a local folder (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Użyj samego pakietu, aby śledzić bieżący oficjalny tag wydania. Przypinaj
    dokładną wersję tylko wtedy, gdy potrzebujesz powtarzalnej instalacji.

    Następnie zrestartuj Gateway, aby Plugin został załadowany.

  </Step>
  <Step title="Configure provider and webhook">
    Ustaw konfigurację w `plugins.entries.voice-call.config` (pełny kształt
    znajdziesz poniżej w sekcji [Konfiguracja](#configuration)). Co najmniej:
    `provider`, dane uwierzytelniające dostawcy, `fromNumber` oraz publicznie
    osiągalny URL Webhook.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    Domyślne wyjście jest czytelne w logach czatu i terminalach. Sprawdza
    włączenie Plugin, dane uwierzytelniające dostawcy, ekspozycję Webhook oraz to,
    czy aktywny jest tylko jeden tryb audio (`streaming` albo `realtime`). Użyj
    `--json` dla skryptów.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Oba polecenia domyślnie są przebiegami próbnymi. Dodaj `--yes`, aby faktycznie
    wykonać krótkie wychodzące połączenie powiadamiające:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Dla Twilio, Telnyx i Plivo konfiguracja musi wskazywać **publiczny URL Webhook**.
Jeśli `publicUrl`, URL tunelu, URL Tailscale albo rezerwowa konfiguracja serwera
rozwiązuje się do loopback lub prywatnej przestrzeni sieciowej, konfiguracja
kończy się niepowodzeniem zamiast uruchamiać dostawcę, który nie może odbierać
Webhook od operatora.
</Warning>

## Konfiguracja

Jeśli `enabled: true`, ale wybranemu dostawcy brakuje danych uwierzytelniających,
uruchamianie Gateway zapisuje ostrzeżenie o nieukończonej konfiguracji z brakującymi
kluczami i pomija uruchomienie runtime. Polecenia, wywołania RPC i narzędzia agenta
nadal zwracają dokładną brakującą konfigurację dostawcy, gdy zostaną użyte.

<Note>
Dane uwierzytelniające voice-call akceptują SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` i `plugins.entries.voice-call.config.tts.providers.*.apiKey` są rozwiązywane przez standardową powierzchnię SecretRef; zobacz [powierzchnia danych uwierzytelniających SecretRef](/pl/reference/secretref-credential-surface).
</Note>

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // or TWILIO_FROM_NUMBER for Twilio
          toNumber: "+15550005678",
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, how can I help?",
              responseSystemPrompt: "You are a concise baseball card specialist.",
              tts: {
                providers: {
                  openai: { speakerVoice: "alloy" },
                },
              },
            },
          },

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Mission Control Portal
            // (Base64; can also be set via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },
          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook server
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook security (recommended for tunnels/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Public exposure (pick one)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* see Streaming transcription */ },
          realtime: { enabled: false /* see Realtime voice */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Provider exposure and security notes">
    - Twilio, Telnyx i Plivo wymagają **publicznie osiągalnego** URL Webhook.
    - `mock` jest lokalnym dostawcą deweloperskim (bez wywołań sieciowych).
    - Telnyx wymaga `telnyx.publicKey` (albo `TELNYX_PUBLIC_KEY`), chyba że `skipSignatureVerification` ma wartość true.
    - `skipSignatureVerification` służy wyłącznie do lokalnego testowania.
    - W darmowej warstwie ngrok ustaw `publicUrl` na dokładny URL ngrok; weryfikacja podpisu jest zawsze wymuszana.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` zezwala na Webhook Twilio z nieprawidłowymi podpisami **tylko** wtedy, gdy `tunnel.provider="ngrok"` i `serve.bind` to loopback (lokalny agent ngrok). Tylko lokalny development.
    - URL-e darmowej warstwy ngrok mogą się zmieniać albo dodawać stronę pośrednią; jeśli `publicUrl` się rozjedzie, podpisy Twilio zawiodą. Produkcja: preferuj stabilną domenę albo tunel Tailscale.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` zamyka gniazda, które nigdy nie wysyłają prawidłowej ramki `start`.
    - `streaming.maxPendingConnections` ogranicza łączną liczbę nieuwierzytelnionych gniazd przed startem.
    - `streaming.maxPendingConnectionsPerIp` ogranicza nieuwierzytelnione gniazda przed startem na źródłowy adres IP.
    - `streaming.maxConnections` ogranicza łączną liczbę otwartych gniazd strumieni multimediów (oczekujących + aktywnych).

  </Accordion>
  <Accordion title="Legacy config migrations">
    Starsze konfiguracje używające `provider: "log"`, `twilio.from` albo starszych
    kluczy OpenAI `streaming.*` są przepisywane przez `openclaw doctor --fix`.
    Rezerwowa ścieżka runtime na razie nadal akceptuje stare klucze voice-call, ale
    ścieżką przepisywania jest `openclaw doctor --fix`, a shim zgodności jest
    tymczasowy.

    Automatycznie migrowane klucze strumieniowania:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Zakres sesji

Domyślnie Voice Call używa `sessionScope: "per-phone"`, aby powtarzane połączenia
od tego samego dzwoniącego zachowywały pamięć konwersacji. Ustaw `sessionScope: "per-call"`,
gdy każde połączenie operatora powinno zaczynać się ze świeżym kontekstem, na przykład
w przepływach recepcji, rezerwacji, IVR albo mostka Google Meet, gdzie ten sam numer
telefonu może reprezentować różne spotkania.

Voice Call przechowuje wygenerowane klucze sesji w skonfigurowanej przestrzeni nazw agenta
(`agent:<agentId>:voice:*`), dzięki czemu pamięć połączeń przetrwa kanonikalizację
klucza sesji Gateway po restartach. Surowe jawne klucze integracji używają tej samej
przestrzeni nazw agenta. Kanoniczny klucz `agent:<configuredAgentId>:*` zachowuje tego
właściciela, a jego główne aliasy respektują podstawowe `session.mainKey` i zakres globalny.
Obce albo zniekształcone wejście `agent:*` jest traktowane jako nieprzezroczysty klucz
w skonfigurowanym agencie; `global` i `unknown` pozostają globalnymi sentinelami.
Uruchomienie Gateway promuje starsze surowe klucze w domyślnych magazynach albo magazynach
szablonowanych `{agentId}`, gdy ścieżka dowodzi jednego właściciela. W stałych magazynach
niestandardowych niejednoznaczne starsze wiersze pozostają nietknięte, ponieważ nie zawierają
dość informacji, aby wybrać właściciela; nowe połączenia używają kanonicznej historii
zakresowanej do agenta.

## Konwersacje głosowe w czasie rzeczywistym

`realtime` wybiera pełnodupleksowego dostawcę głosu w czasie rzeczywistym dla dźwięku
połączeń na żywo. Jest oddzielne od `streaming`, które tylko przekazuje dźwięk do
dostawców transkrypcji w czasie rzeczywistym.

<Warning>
`realtime.enabled` nie może być łączone z `streaming.enabled`. Wybierz jeden
tryb audio na połączenie.
</Warning>

Bieżące zachowanie runtime:

- `realtime.enabled` jest obsługiwane dla Twilio Media Streams.
- `realtime.provider` jest opcjonalne. Jeśli nie jest ustawione, Voice Call używa pierwszego zarejestrowanego dostawcy głosu w czasie rzeczywistym.
- Dołączani dostawcy głosu w czasie rzeczywistym: Google Gemini Live (`google`) i OpenAI (`openai`), rejestrowani przez ich Plugins dostawców.
- Surowa konfiguracja należąca do dostawcy znajduje się pod `realtime.providers.<providerId>`.
- Voice Call domyślnie udostępnia współdzielone narzędzie czasu rzeczywistego `openclaw_agent_consult`. Model czasu rzeczywistego może je wywołać, gdy dzwoniący prosi o głębsze rozumowanie, aktualne informacje albo zwykłe narzędzia OpenClaw.
- `realtime.consultPolicy` opcjonalnie dodaje wskazówki, kiedy model czasu rzeczywistego powinien wywołać `openclaw_agent_consult`.
- `realtime.agentContext.enabled` jest domyślnie wyłączone. Po włączeniu Voice Call wstrzykuje ograniczoną tożsamość agenta oraz wybraną kapsułę plików obszaru roboczego do instrukcji dostawcy czasu rzeczywistego podczas konfiguracji sesji.
- `realtime.fastContext.enabled` jest domyślnie wyłączone. Po włączeniu Voice Call najpierw przeszukuje zaindeksowaną pamięć/kontekst sesji dla pytania konsultacyjnego i zwraca te fragmenty do modelu czasu rzeczywistego w czasie `realtime.fastContext.timeoutMs`, zanim przejdzie do pełnego agenta konsultacyjnego tylko wtedy, gdy `realtime.fastContext.fallbackToConsult` ma wartość true.
- Jeśli `realtime.provider` wskazuje niezarejestrowanego dostawcę albo w ogóle nie zarejestrowano dostawcy głosu w czasie rzeczywistym, Voice Call zapisuje ostrzeżenie i pomija media czasu rzeczywistego zamiast powodować niepowodzenie całego Plugin.
- Klucze sesji konsultacji ponownie używają zapisanej sesji połączenia, gdy jest dostępna, a następnie wracają do skonfigurowanego `sessionScope` (`per-phone` domyślnie albo `per-call` dla izolowanych połączeń).

### Zasady narzędzi

`realtime.toolPolicy` kontroluje uruchomienie konsultacji:

| Zasada           | Zachowanie                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Udostępnia narzędzie konsultacji i ogranicza zwykłego agenta do `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` i `memory_get`. |
| `owner`          | Udostępnia narzędzie konsultacji i pozwala zwykłemu agentowi używać normalnych zasad narzędzi agenta.                                   |
| `none`           | Nie udostępnia narzędzia konsultacji. Niestandardowe `realtime.tools` nadal są przekazywane do dostawcy czasu rzeczywistego.            |

`realtime.consultPolicy` kontroluje tylko instrukcje modelu czasu rzeczywistego:

| Zasada        | Wskazówki                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | Zachowaj domyślny prompt i pozwól dostawcy zdecydować, kiedy wywołać narzędzie konsultacji.     |
| `substantive` | Odpowiadaj bezpośrednio na proste elementy konwersacyjne i konsultuj przed faktami, pamięcią, narzędziami lub kontekstem. |
| `always`      | Konsultuj przed każdą merytoryczną odpowiedzią.                                                 |

### Kontekst głosowy agenta

Włącz `realtime.agentContext`, gdy mostek głosowy ma brzmieć jak
skonfigurowany agent OpenClaw bez ponoszenia kosztu pełnego cyklu agent-consult
przy zwykłych turach. Kapsuła kontekstu jest dodawana jednorazowo podczas
tworzenia sesji realtime, więc nie zwiększa opóźnienia każdej tury. Wywołania
`openclaw_agent_consult` nadal uruchamiają pełnego agenta OpenClaw i należy ich
używać do pracy z narzędziami, bieżących informacji, wyszukiwań w pamięci lub
stanu obszaru roboczego.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          agentId: "main",
          realtime: {
            enabled: true,
            provider: "google",
            toolPolicy: "safe-read-only",
            consultPolicy: "substantive",
            agentContext: {
              enabled: true,
              maxChars: 6000,
              includeIdentity: true,
              includeWorkspaceFiles: true,
              files: ["SOUL.md", "IDENTITY.md", "USER.md"],
            },
          },
        },
      },
    },
  },
}
```

### Przykłady dostawców realtime

<Tabs>
  <Tab title="Google Gemini Live">
    Wartości domyślne: klucz API z `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` lub `GOOGLE_GENERATIVE_AI_API_KEY`; model
    `gemini-2.5-flash-native-audio-preview-12-2025`; głos `Kore`.
    `sessionResumption` i `contextWindowCompression` są domyślnie włączone dla dłuższych,
    możliwych do ponownego połączenia rozmów. Użyj `silenceDurationMs`, `startSensitivity` i
    `endSensitivity`, aby dostroić szybsze przejmowanie tury w dźwięku telefonicznym.

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              provider: "twilio",
              inboundPolicy: "allowlist",
              allowFrom: ["+15550005678"],
              realtime: {
                enabled: true,
                provider: "google",
                instructions: "Speak briefly. Call openclaw_agent_consult before using deeper tools.",
                toolPolicy: "safe-read-only",
                consultPolicy: "substantive",
                consultThinkingLevel: "low",
                consultFastMode: true,
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    speakerVoice: "Kore",
                    silenceDurationMs: 500,
                    startSensitivity: "high",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="OpenAI">
    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              realtime: {
                enabled: true,
                provider: "openai",
                providers: {
                  openai: { apiKey: "${OPENAI_API_KEY}" },
                },
              },
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

Zobacz [dostawcę Google](/pl/providers/google) i
[dostawcę OpenAI](/pl/providers/openai), aby poznać opcje głosu realtime
specyficzne dla dostawcy.

## Transkrypcja strumieniowa

`streaming` wybiera dostawcę transkrypcji realtime dla dźwięku rozmowy na żywo.

Bieżące zachowanie runtime:

- `streaming.provider` jest opcjonalne. Jeśli nie jest ustawione, Voice Call używa pierwszego zarejestrowanego dostawcy transkrypcji realtime.
- Dołączani dostawcy transkrypcji realtime: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) i xAI (`xai`), rejestrowani przez ich pluginy dostawców.
- Surowa konfiguracja należąca do dostawcy znajduje się pod `streaming.providers.<providerId>`.
- Po wysłaniu przez Twilio zaakceptowanego komunikatu `start` strumienia Voice Call natychmiast rejestruje strumień, kolejkowuje przychodzące media przez dostawcę transkrypcji podczas łączenia dostawcy i uruchamia początkowe powitanie dopiero po gotowości transkrypcji realtime.
- Jeśli `streaming.provider` wskazuje niezarejestrowanego dostawcę albo żaden nie jest zarejestrowany, Voice Call loguje ostrzeżenie i pomija strumieniowanie mediów zamiast powodować awarię całego pluginu.

### Przykłady dostawców strumieniowania

<Tabs>
  <Tab title="OpenAI">
    Wartości domyślne: klucz API `streaming.providers.openai.apiKey` lub
    `OPENAI_API_KEY`; model `gpt-4o-transcribe`; `silenceDurationMs: 800`;
    `vadThreshold: 0.5`.

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "openai",
                streamPath: "/voice/stream",
                providers: {
                  openai: {
                    apiKey: "sk-...", // optional if OPENAI_API_KEY is set
                    model: "gpt-4o-transcribe",
                    silenceDurationMs: 800,
                    vadThreshold: 0.5,
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="xAI">
    Wartości domyślne: klucz API `streaming.providers.xai.apiKey` lub `XAI_API_KEY`;
    endpoint `wss://api.x.ai/v1/stt`; kodowanie `mulaw`; częstotliwość próbkowania `8000`;
    `endpointingMs: 800`; `interimResults: true`.

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                streamPath: "/voice/stream",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}", // optional if XAI_API_KEY is set
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## TTS dla rozmów

Voice Call używa podstawowej konfiguracji `messages.tts` do strumieniowania
mowy w rozmowach. Możesz ją nadpisać w konfiguracji pluginu z
**takim samym kształtem** — jest ona głęboko scalana z `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**Microsoft speech jest ignorowane dla rozmów głosowych.** Dźwięk telefoniczny wymaga PCM;
obecny transport Microsoft nie udostępnia telefonicznego wyjścia PCM.
</Warning>

Uwagi dotyczące zachowania:

- Starsze klucze `tts.<provider>` wewnątrz konfiguracji pluginu (`openai`, `elevenlabs`, `microsoft`, `edge`) są naprawiane przez `openclaw doctor --fix`; zatwierdzona konfiguracja powinna używać `tts.providers.<provider>`.
- Podstawowe TTS jest używane, gdy strumieniowanie mediów Twilio jest włączone; w przeciwnym razie rozmowy wracają do natywnych głosów dostawcy.
- Jeśli strumień mediów Twilio jest już aktywny, Voice Call nie wraca do TwiML `<Say>`. Jeśli telefoniczne TTS jest w tym stanie niedostępne, żądanie odtwarzania kończy się niepowodzeniem zamiast mieszać dwie ścieżki odtwarzania.
- Gdy telefoniczne TTS wraca do dostawcy pomocniczego, Voice Call loguje ostrzeżenie z łańcuchem dostawców (`from`, `to`, `attempts`) do debugowania.
- Gdy barge-in Twilio lub zamknięcie strumienia czyści oczekującą kolejkę TTS, zakolejkowane żądania odtwarzania są rozstrzygane zamiast zawieszać dzwoniących oczekujących na ukończenie odtwarzania.

### Przykłady TTS

<Tabs>
  <Tab title="Tylko podstawowe TTS">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { speakerVoice: "alloy" },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Nadpisanie na ElevenLabs (tylko rozmowy)">
```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Nadpisanie modelu OpenAI (głębokie scalanie)">
```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                speakerVoice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

## Połączenia przychodzące

Polityka połączeń przychodzących domyślnie ma wartość `disabled`. Aby włączyć połączenia przychodzące, ustaw:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` to ekran identyfikatora dzwoniącego o niskim poziomie pewności. Plugin normalizuje dostarczoną przez dostawcę wartość `From` i porównuje ją z
`allowFrom`. Weryfikacja Webhook uwierzytelnia dostarczenie przez dostawcę i
integralność ładunku, ale **nie** dowodzi własności numeru dzwoniącego PSTN/VoIP.
Traktuj `allowFrom` jako filtrowanie identyfikatora dzwoniącego, a nie silną tożsamość
dzwoniącego.
</Warning>

Automatyczne odpowiedzi używają systemu agenta. Dostosuj je za pomocą `responseModel`,
`responseSystemPrompt` i `responseTimeoutMs`.

### Routing według numeru

Użyj `numbers`, gdy jeden plugin Voice Call odbiera połączenia dla wielu numerów
telefonów, a każdy numer powinien zachowywać się jak inna linia. Na przykład jeden
numer może używać swobodnego asystenta osobistego, a inny persony biznesowej,
innego agenta odpowiedzi i innego głosu TTS.

Trasy są wybierane z dostarczonego przez dostawcę wybieranego numeru `To`. Klucze muszą być
numerami E.164. Gdy połączenie nadejdzie, Voice Call jednorazowo rozwiązuje pasującą trasę,
zapisuje dopasowaną trasę w rekordzie połączenia i ponownie używa tej efektywnej konfiguracji
dla powitania, klasycznej ścieżki automatycznej odpowiedzi, ścieżki realtime consult i
odtwarzania TTS. Jeśli żadna trasa nie pasuje, używana jest globalna konfiguracja Voice Call.
Połączenia wychodzące nie używają `numbers`; przekaż cel wychodzący, wiadomość i
sesję jawnie podczas inicjowania połączenia.

Nadpisania tras obecnie obsługują:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Wartość trasy `tts` jest głęboko scalana z globalną konfiguracją Voice Call `tts`, więc
zwykle możesz nadpisać tylko głos dostawcy:

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { speakerVoice: "alloy" },
        },
      },
    },
  },
}
```

### Kontrakt wyjścia mówionego

W przypadku automatycznych odpowiedzi Voice Call dołącza ścisły kontrakt wyjścia mówionego do
promptu systemowego:

```text
{"spoken":"..."}
```

Voice Call defensywnie wyodrębnia tekst mowy:

- Ignoruje ładunki oznaczone jako treść rozumowania/błędu.
- Parsuje bezpośredni JSON, ogrodzony JSON lub wbudowane klucze `"spoken"`.
- Wraca do zwykłego tekstu i usuwa prawdopodobne akapity wprowadzające planowania/meta.

Dzięki temu odtwarzanie mówione pozostaje skupione na tekście skierowanym do dzwoniącego i unika
wycieku tekstu planowania do dźwięku.

### Zachowanie uruchamiania konwersacji

W przypadku wychodzących połączeń `conversation` obsługa pierwszej wiadomości jest powiązana ze stanem
odtwarzania na żywo:

- Czyszczenie kolejki barge-in i automatyczna odpowiedź są wstrzymywane tylko wtedy, gdy początkowe powitanie jest aktywnie wypowiadane.
- Jeśli początkowe odtwarzanie się nie powiedzie, połączenie wraca do `listening`, a początkowa wiadomość pozostaje w kolejce do ponowienia.
- Początkowe odtwarzanie dla strumieniowania Twilio rozpoczyna się po połączeniu strumienia bez dodatkowego opóźnienia.
- Barge-in przerywa aktywne odtwarzanie i czyści zakolejkowane, ale jeszcze nieodtwarzane wpisy Twilio TTS. Wyczyszczone wpisy rozstrzygają się jako pominięte, więc logika odpowiedzi następczej może kontynuować bez czekania na dźwięk, który nigdy nie zostanie odtworzony.
- Konwersacje głosowe realtime używają własnej tury otwierającej strumienia realtime. Voice Call **nie** publikuje starszej aktualizacji TwiML `<Say>` dla tej początkowej wiadomości, więc wychodzące sesje `<Connect><Stream>` pozostają podłączone.

### Grace period rozłączenia strumienia Twilio

Gdy strumień multimediów Twilio rozłączy się, Voice Call czeka **2000 ms** przed
automatycznym zakończeniem połączenia:

- Jeśli strumień połączy się ponownie w tym oknie, automatyczne zakończenie zostanie anulowane.
- Jeśli po okresie karencji żaden strumień nie zarejestruje się ponownie, połączenie zostanie zakończone, aby zapobiec zablokowanym aktywnym połączeniom.

## Mechanizm usuwania nieaktualnych połączeń

Użyj `staleCallReaperSeconds`, aby kończyć połączenia, które nigdy nie otrzymują końcowego
webhooka (na przykład połączenia w trybie powiadamiania, które nigdy się nie kończą). Wartość domyślna
to `0` (wyłączone).

Zalecane zakresy:

- **Produkcja:** `120`–`300` sekund dla przepływów w stylu powiadomień.
- Utrzymuj tę wartość **wyższą niż `maxDurationSeconds`**, aby zwykłe połączenia mogły się zakończyć. Dobrym punktem wyjścia jest `maxDurationSeconds + 30–60` sekund.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Bezpieczeństwo Webhook

Gdy przed Gateway znajduje się proxy lub tunel, plugin
odtwarza publiczny URL na potrzeby weryfikacji podpisu. Te opcje
kontrolują, którym przekazywanym nagłówkom można ufać:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Lista dozwolonych hostów z nagłówków przekazywania.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Ufaj przekazywanym nagłówkom bez listy dozwolonych.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Ufaj przekazywanym nagłówkom tylko wtedy, gdy zdalny adres IP żądania pasuje do listy.
</ParamField>

Dodatkowe zabezpieczenia:

- **Ochrona przed powtórzeniem** webhooków jest włączona dla Twilio i Plivo. Powtórzone prawidłowe żądania webhooka są potwierdzane, ale pomijane pod kątem skutków ubocznych.
- Tury konwersacji Twilio zawierają token dla każdej tury w wywołaniach zwrotnych `<Gather>`, więc nieaktualne lub powtórzone wywołania zwrotne mowy nie mogą spełnić nowszej oczekującej tury transkrypcji.
- Nieuwierzytelnione żądania webhooka są odrzucane przed odczytem treści, gdy brakuje wymaganych przez dostawcę nagłówków podpisu.
- Webhook voice-call używa współdzielonego profilu treści przed uwierzytelnieniem (64 KB / 5 sekund) oraz limitu równoległych żądań na adres IP przed weryfikacją podpisu.

Przykład ze stabilnym hostem publicznym:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

Gdy Gateway już działa, operacyjne polecenia `voicecall` delegują
do środowiska uruchomieniowego voice-call należącego do Gateway, aby CLI nie wiązało drugiego
serwera webhooków. Jeśli Gateway jest nieosiągalny, polecenia przełączają się na
samodzielne środowisko uruchomieniowe CLI.

`latency` odczytuje `calls.jsonl` z domyślnej ścieżki przechowywania voice-call.
Użyj `--file <path>`, aby wskazać inny dziennik, oraz `--last <n>`, aby ograniczyć
analizę do ostatnich N rekordów (domyślnie 200). Dane wyjściowe obejmują p50/p90/p99
dla opóźnienia tury i czasów oczekiwania na nasłuch.

## Narzędzie agenta

Nazwa narzędzia: `voice_call`.

| Akcja           | Argumenty                                  |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Plugin voice-call jest dostarczany z pasującą umiejętnością agenta.

## Gateway RPC

| Metoda               | Argumenty                                  |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` jest prawidłowe tylko z `mode: "conversation"`. Połączenia w trybie powiadamiania
powinny używać `voicecall.dtmf` po utworzeniu połączenia, jeśli potrzebują cyfr
po połączeniu.

## Rozwiązywanie problemów

### Konfiguracja nie ujawnia webhooka

Uruchom konfigurację z tego samego środowiska, w którym działa Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Dla `twilio`, `telnyx` i `plivo` `webhook-exposure` musi być zielone. Skonfigurowany
`publicUrl` nadal kończy się niepowodzeniem, gdy wskazuje na lokalną lub prywatną przestrzeń sieciową,
ponieważ operator nie może wywołać tych adresów zwrotnie. Nie używaj
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` ani `fd00::/8` jako `publicUrl`.

Wychodzące połączenia Twilio w trybie powiadamiania wysyłają początkowy TwiML `<Say>` bezpośrednio w
żądaniu utworzenia połączenia, więc pierwsza wypowiedziana wiadomość nie zależy od pobierania przez Twilio
TwiML webhooka. Publiczny webhook jest nadal wymagany dla wywołań zwrotnych statusu,
połączeń konwersacyjnych, DTMF przed połączeniem, strumieni czasu rzeczywistego i kontroli połączenia
po połączeniu.

Użyj jednej publicznej ścieżki ujawnienia:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // or
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Po zmianie konfiguracji uruchom ponownie lub przeładuj Gateway, a następnie uruchom:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` jest suchym przebiegiem, chyba że przekażesz `--yes`.

### Dane uwierzytelniające dostawcy zawodzą

Sprawdź wybranego dostawcę i wymagane pola danych uwierzytelniających:

- Twilio: `twilio.accountSid`, `twilio.authToken` i `fromNumber` albo
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` i `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` i
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` i `fromNumber`.

Dane uwierzytelniające muszą istnieć na hoście Gateway. Edycja lokalnego profilu powłoki
nie wpływa na już działający Gateway, dopóki nie zostanie uruchomiony ponownie lub nie przeładuje
swojego środowiska.

### Połączenia się rozpoczynają, ale webhooki dostawcy nie docierają

Potwierdź, że konsola dostawcy wskazuje dokładny publiczny URL webhooka:

```text
https://voice.example.com/voice/webhook
```

Następnie sprawdź stan środowiska uruchomieniowego:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Typowe przyczyny:

- `publicUrl` wskazuje inną ścieżkę niż `serve.path`.
- URL tunelu zmienił się po uruchomieniu Gateway.
- Proxy przekazuje żądanie, ale usuwa lub przepisuje nagłówki host/proto.
- Zapora lub DNS kieruje publiczną nazwę hosta gdzie indziej niż do Gateway.
- Gateway został uruchomiony ponownie bez włączonego pluginu Voice Call.

Gdy przed Gateway znajduje się reverse proxy lub tunel, ustaw
`webhookSecurity.allowedHosts` na publiczną nazwę hosta albo użyj
`webhookSecurity.trustedProxyIPs` dla znanego adresu proxy. Używaj
`webhookSecurity.trustForwardingHeaders` tylko wtedy, gdy granica proxy jest pod
Twoją kontrolą.

### Weryfikacja podpisu kończy się niepowodzeniem

Podpisy dostawcy są sprawdzane względem publicznego URL, który OpenClaw odtwarza
z przychodzącego żądania. Jeśli podpisy zawodzą:

- Potwierdź, że URL webhooka dostawcy dokładnie pasuje do `publicUrl`, w tym
  schemat, host i ścieżka.
- W przypadku adresów URL ngrok w bezpłatnej warstwie zaktualizuj `publicUrl`, gdy zmieni się nazwa hosta tunelu.
- Upewnij się, że proxy zachowuje oryginalne nagłówki hosta i proto, albo skonfiguruj
  `webhookSecurity.allowedHosts`.
- Nie włączaj `skipSignatureVerification` poza testami lokalnymi.

### Dołączanie Google Meet przez Twilio kończy się niepowodzeniem

Google Meet używa tego pluginu do dołączania przez połączenie telefoniczne Twilio. Najpierw zweryfikuj Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Następnie jawnie zweryfikuj transport Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Jeśli Voice Call jest zielone, ale uczestnik Meet nigdy nie dołącza, sprawdź numer
telefoniczny Meet, PIN i `--dtmf-sequence`. Połączenie telefoniczne może być poprawne, gdy
spotkanie odrzuca lub ignoruje nieprawidłową sekwencję DTMF.

Google Meet uruchamia połączenie telefoniczne Twilio przez `voicecall.start` z
sekwencją DTMF przed połączeniem. Sekwencje pochodzące z PIN-u obejmują
`voiceCall.dtmfDelayMs` pluginu Google Meet jako początkowe cyfry oczekiwania Twilio. Domyślnie jest to 12 sekund,
ponieważ monity połączenia telefonicznego Meet mogą pojawić się z opóźnieniem. Następnie Voice Call przekierowuje z powrotem do
obsługi czasu rzeczywistego, zanim zostanie zażądane powitanie wprowadzające.

Użyj `openclaw logs --follow` dla śledzenia fazy na żywo. Prawidłowe dołączenie Twilio Meet
zapisuje tę kolejność w dzienniku:

- Google Meet deleguje dołączenie Twilio do Voice Call.
- Voice Call zapisuje TwiML DTMF przed połączeniem.
- Początkowy TwiML Twilio jest zużywany i serwowany przed obsługą czasu rzeczywistego.
- Voice Call serwuje TwiML czasu rzeczywistego dla połączenia Twilio.
- Google Meet żąda mowy wprowadzającej za pomocą `voicecall.speak` po opóźnieniu po DTMF.

`openclaw voicecall tail` nadal pokazuje utrwalone rekordy połączeń; jest przydatne dla
stanu połączeń i transkrypcji, ale nie każde przejście webhooka lub czasu rzeczywistego pojawia się
tam.

### Połączenie czasu rzeczywistego nie ma mowy

Potwierdź, że włączony jest tylko jeden tryb audio. `realtime.enabled` i
`streaming.enabled` nie mogą jednocześnie mieć wartości true.

Dla połączeń Twilio w czasie rzeczywistym zweryfikuj także:

- Plugin dostawcy czasu rzeczywistego jest załadowany i zarejestrowany.
- `realtime.provider` jest nieustawione lub wskazuje zarejestrowanego dostawcę.
- Klucz API dostawcy jest dostępny dla procesu Gateway.
- `openclaw logs --follow` pokazuje zaserwowany TwiML czasu rzeczywistego, uruchomiony most
  czasu rzeczywistego i zakolejkowane początkowe powitanie.

## Powiązane

- [Tryb rozmowy](/pl/nodes/talk)
- [Tekst na mowę](/pl/tools/tts)
- [Wybudzanie głosem](/pl/nodes/voicewake)
