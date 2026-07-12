---
read_when:
    - Chcesz wykonać wychodzące połączenie głosowe z OpenClaw
    - Konfigurujesz lub rozwijasz plugin połączeń głosowych
    - Potrzebujesz głosu w czasie rzeczywistym lub strumieniowej transkrypcji w telefonii
sidebarTitle: Voice call
summary: Wykonuj wychodzące i odbieraj przychodzące połączenia głosowe za pośrednictwem Twilio, Telnyx lub Plivo, z opcjonalną obsługą głosu w czasie rzeczywistym i strumieniową transkrypcją
title: Plugin połączeń głosowych
x-i18n:
    generated_at: "2026-07-12T15:27:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed6fb5c7e08666e14a0280115eb8f501543ec0bb48cbe5169278b273791ebc8b
    source_path: plugins/voice-call.md
    workflow: 16
---

Połączenia głosowe dla OpenClaw za pośrednictwem pluginu: powiadomienia wychodzące, wieloturowe
konwersacje, dwukierunkowa transmisja głosu w czasie rzeczywistym, transkrypcja strumieniowa oraz
połączenia przychodzące z zasadami listy dozwolonych.

**Dostawcy:** `mock` (środowisko deweloperskie, bez sieci), `plivo` (Voice API + przekazywanie XML +
rozpoznawanie mowy GetInput), `telnyx` (Call Control v2), `twilio` (Programmable Voice +
Media Streams).

<Note>
Plugin Voice Call działa **wewnątrz procesu Gateway**. Jeśli używasz
zdalnego Gateway, zainstaluj i skonfiguruj plugin na maszynie, na której działa
Gateway, a następnie uruchom ponownie Gateway, aby go załadować.
</Note>

## Szybki start

<Steps>
  <Step title="Zainstaluj plugin">
    <Tabs>
      <Tab title="Z npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="Z folderu lokalnego (środowisko deweloperskie)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Użyj samej nazwy pakietu, aby korzystać z bieżącego znacznika wydania. Przypnij konkretną
    wersję tylko wtedy, gdy potrzebujesz powtarzalnej instalacji. Następnie uruchom ponownie Gateway,
    aby plugin został załadowany.

  </Step>
  <Step title="Skonfiguruj dostawcę i Webhook">
    Ustaw konfigurację w `plugins.entries.voice-call.config` (zobacz sekcję
    [Konfiguracja](#configuration) poniżej). Wymagane minimum: `provider`, dane
    uwierzytelniające dostawcy, `fromNumber` oraz publicznie dostępny adres URL Webhooka.
  </Step>
  <Step title="Zweryfikuj konfigurację">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    Sprawdza włączenie pluginu, dane uwierzytelniające dostawcy, udostępnienie Webhooka oraz
    czy aktywny jest tylko jeden tryb dźwięku (`streaming` albo `realtime`).

  </Step>
  <Step title="Przeprowadź test dymny">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Domyślnie oba polecenia wykonują przebieg próbny. Dodaj `--yes`, aby nawiązać krótkie
    wychodzące połączenie z powiadomieniem:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
W przypadku Twilio, Telnyx i Plivo konfiguracja musi prowadzić do **publicznego adresu URL Webhooka**.
Jeśli `publicUrl`, adres URL tunelu, adres URL Tailscale lub zapasowy adres usługi
wskazuje na local loopback albo prywatną przestrzeń sieciową, konfiguracja kończy się błędem zamiast
uruchamiać dostawcę, który nie może odbierać Webhooków operatora.
</Warning>

## Konfiguracja

Jeśli ustawiono `enabled: true`, ale dla wybranego dostawcy brakuje danych uwierzytelniających, podczas
uruchamiania Gateway w dzienniku pojawia się ostrzeżenie o niekompletnej konfiguracji z nazwami brakujących kluczy,
a środowisko wykonawcze nie zostaje uruchomione. Polecenia, wywołania RPC i narzędzia agenta nadal zwracają
dokładną informację o brakującej konfiguracji, gdy są używane.

<Note>
Dane uwierzytelniające połączeń głosowych obsługują SecretRefs. Wartości `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` i `plugins.entries.voice-call.config.tts.providers.*.apiKey` są rozwiązywane przez standardowy mechanizm SecretRef; zobacz [obsługę danych uwierzytelniających SecretRef](/pl/reference/secretref-credential-surface).
</Note>

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // lub "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // lub TWILIO_FROM_NUMBER dla Twilio
          toNumber: "+15550005678",
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, w czym mogę pomóc?",
              responseSystemPrompt: "Jesteś zwięzłym specjalistą od kart baseballowych.",
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
            // region: "ie1", // opcjonalnie: us1 | ie1 | au1; domyślnie us1
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Klucz publiczny Webhooka Telnyx z Mission Control Portal
            // (Base64; można go również ustawić za pomocą TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },
          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Serwer Webhooka
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Zabezpieczenia Webhooka (zalecane w przypadku tuneli/serwerów proxy)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Udostępnienie publiczne (wybierz jedną opcję)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* zobacz Transkrypcja strumieniowa */ },
          realtime: { enabled: false /* zobacz Konwersacje głosowe w czasie rzeczywistym */ },
        },
      },
    },
  },
}
```

### Opis konfiguracji

Klucze najwyższego poziomu w `plugins.entries.voice-call.config`, których nie pokazano powyżej:

| Klucz                           | Wartość domyślna | Uwagi                                                                                             |
| ------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------- |
| `enabled`                       | `false`          | Główny przełącznik włączania i wyłączania.                                                        |
| `inboundPolicy`                 | `"disabled"`     | `disabled` \| `allowlist` \| `pairing` \| `open`. Zobacz [Połączenia przychodzące](#inbound-calls). |
| `allowFrom`                     | `[]`             | Lista dozwolonych numerów E.164 dla `inboundPolicy: "allowlist"`.                                 |
| `maxDurationSeconds`            | `300`            | Bezwzględny limit czasu trwania pojedynczego połączenia, egzekwowany niezależnie od stanu odebrania. |
| `staleCallReaperSeconds`        | `120`            | Zobacz [Usuwanie nieaktualnych połączeń](#stale-call-reaper). Wartość `0` wyłącza tę funkcję.      |
| `silenceTimeoutMs`              | `800`            | Wykrywanie ciszy kończącej wypowiedź w klasycznym przepływie (innym niż realtime).                 |
| `transcriptTimeoutMs`           | `180000`         | Maksymalny czas oczekiwania na transkrypcję rozmówcy przed przerwaniem tury.                       |
| `ringTimeoutMs`                 | `30000`          | Limit czasu dzwonienia dla połączeń wychodzących.                                                 |
| `maxConcurrentCalls`            | `1`              | Połączenia wychodzące przekraczające ten limit są odrzucane.                                      |
| `outbound.notifyHangupDelaySec` | `3`              | Liczba sekund oczekiwania po TTS przed automatycznym rozłączeniem w trybie powiadomienia.          |
| `skipSignatureVerification`     | `false`          | Wyłącznie do testów lokalnych; nigdy nie włączaj w środowisku produkcyjnym.                        |
| `store`                         | nie ustawiono    | Zastępuje domyślną ścieżkę dziennika połączeń `~/.openclaw/voice-calls`.                           |
| `agentId`                       | `"main"`         | Agent używany do generowania odpowiedzi i przechowywania sesji.                                   |
| `responseModel`                 | nie ustawiono    | Zastępuje domyślny model klasycznych odpowiedzi (innych niż realtime).                             |
| `responseSystemPrompt`          | generowany       | Niestandardowy prompt systemowy dla klasycznych odpowiedzi.                                       |
| `responseTimeoutMs`             | `30000`          | Limit czasu generowania klasycznej odpowiedzi (ms).                                               |

Twilio domyślnie używa punktu końcowego REST US1. Aby przetwarzać połączenia w obsługiwanym
regionie poza USA, ustaw `twilio.region` na `ie1` lub `au1` i użyj danych uwierzytelniających z
tego regionu. Zobacz
[przewodnik Twilio dotyczący interfejsu REST API poza USA](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region).

<AccordionGroup>
  <Accordion title="Uwagi dotyczące udostępniania i zabezpieczeń dostawców">
    - Twilio, Telnyx i Plivo wymagają **publicznie dostępnego** adresu URL Webhooka.
    - `mock` jest lokalnym dostawcą deweloperskim (bez połączeń sieciowych).
    - Telnyx wymaga `telnyx.publicKey` (lub `TELNYX_PUBLIC_KEY`), chyba że `skipSignatureVerification` ma wartość true.
    - `skipSignatureVerification` służy wyłącznie do testów lokalnych.
    - W bezpłatnym planie ngrok ustaw `publicUrl` na dokładny adres URL ngrok; weryfikacja podpisu jest zawsze wymuszana.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` zezwala na Webhooki Twilio z nieprawidłowymi podpisami **tylko** wtedy, gdy `tunnel.provider="ngrok"`, a `serve.bind` wskazuje local loopback (lokalny agent ngrok). Wyłącznie do lokalnego środowiska deweloperskiego.
    - Adresy URL bezpłatnego planu ngrok mogą się zmieniać lub dodawać stronę pośrednią; jeśli `publicUrl` się zmieni, podpisy Twilio przestaną być prawidłowe. W środowisku produkcyjnym użyj stabilnej domeny lub tunelu Tailscale.

  </Accordion>
  <Accordion title="Limity połączeń strumieniowych">
    - `streaming.preStartTimeoutMs` (domyślnie `5000`) zamyka gniazda, które nigdy nie wysyłają prawidłowej ramki `start`.
    - `streaming.maxPendingConnections` (domyślnie `32`) ogranicza łączną liczbę nieuwierzytelnionych gniazd przed rozpoczęciem transmisji.
    - `streaming.maxPendingConnectionsPerIp` (domyślnie `4`) ogranicza liczbę nieuwierzytelnionych gniazd przed rozpoczęciem transmisji dla jednego źródłowego adresu IP.
    - `streaming.maxConnections` (domyślnie `128`) ogranicza liczbę wszystkich otwartych gniazd strumieni multimedialnych (oczekujących i aktywnych).

  </Accordion>
  <Accordion title="Migracje starszej konfiguracji">
    Analiza konfiguracji automatycznie normalizuje poniższe starsze klucze i rejestruje
    ostrzeżenie z nazwą ścieżki zastępczej; warstwa zgodności zostanie usunięta w przyszłym
    wydaniu (`2026.6.0`), dlatego uruchom `openclaw doctor --fix`, aby przepisać zatwierdzoną
    konfigurację do postaci kanonicznej:

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - Usunięto `realtime.agentContext.includeSystemPrompt` (kontekst realtime używa teraz wygenerowanego promptu agenta)

  </Accordion>
</AccordionGroup>

## Zakres sesji

Domyślnie Voice Call używa `sessionScope: "per-phone"`, dzięki czemu kolejne połączenia od
tego samego rozmówcy zachowują pamięć konwersacji. Ustaw `sessionScope: "per-call"`, gdy
każde połączenie operatora powinno rozpoczynać się ze świeżym kontekstem, na przykład w przypadku recepcji,
rezerwacji, IVR lub mostów Google Meet, w których ten sam numer telefonu może
reprezentować różne spotkania.

Voice Call przechowuje wygenerowane klucze sesji w skonfigurowanej przestrzeni nazw agenta
(`agent:<agentId>:voice:*`). Jawne surowe klucze integracji są rozwiązywane w
tej samej przestrzeni nazw: kanoniczny klucz `agent:<configuredAgentId>:*` zachowuje tego
właściciela i uwzględnia aliasowanie `session.mainKey`/zakresu globalnego rdzenia; obce lub
nieprawidłowe dane wejściowe `agent:*` są ograniczane jako nieprzezroczysty klucz w ramach skonfigurowanego
agenta; `global` i `unknown` pozostają globalnymi wartościami specjalnymi.

## Konwersacje głosowe w czasie rzeczywistym

`realtime` wybiera dostawcę dwukierunkowej transmisji głosu w czasie rzeczywistym dla dźwięku połączenia na żywo.
Jest to mechanizm niezależny od `streaming`, który jedynie przekazuje dźwięk do dostawców
transkrypcji w czasie rzeczywistym.

<Warning>
Nie można łączyć `realtime.enabled` z `streaming.enabled`. Wybierz jeden
tryb dźwięku dla każdego połączenia.
</Warning>

Bieżące działanie środowiska wykonawczego:

- `realtime.enabled` jest obsługiwane w Twilio i Telnyx.
- `realtime.provider` jest opcjonalne. Jeśli nie jest ustawione, Voice Call używa pierwszego zarejestrowanego dostawcy głosu w czasie rzeczywistym.
- Wbudowani dostawcy głosu w czasie rzeczywistym: Google Gemini Live (`google`) i OpenAI (`openai`), rejestrowani przez ich Pluginy dostawców.
- Surowa konfiguracja należąca do dostawcy znajduje się w `realtime.providers.<providerId>`.
- Voice Call domyślnie udostępnia współdzielone narzędzie czasu rzeczywistego `openclaw_agent_consult`. Model czasu rzeczywistego może je wywołać, gdy rozmówca prosi o bardziej dogłębne rozumowanie, aktualne informacje lub zwykłe narzędzia OpenClaw.
- `realtime.consultPolicy` opcjonalnie dodaje wskazówki określające, kiedy model czasu rzeczywistego powinien wywołać `openclaw_agent_consult`.
- `realtime.agentContext.enabled` jest domyślnie wyłączone. Po włączeniu Voice Call podczas konfigurowania sesji wprowadza do instrukcji dostawcy czasu rzeczywistego ograniczony zestaw informacji o tożsamości agenta oraz wybranych plikach przestrzeni roboczej.
- `realtime.fastContext.enabled` jest domyślnie wyłączone. Po włączeniu Voice Call najpierw przeszukuje zaindeksowaną pamięć i kontekst sesji pod kątem pytania konsultacyjnego oraz zwraca znalezione fragmenty modelowi czasu rzeczywistego w czasie określonym przez `realtime.fastContext.timeoutMs`, a następnie przechodzi do pełnej konsultacji z agentem tylko wtedy, gdy `realtime.fastContext.fallbackToConsult` ma wartość `true`.
- Jeśli `realtime.provider` wskazuje niezarejestrowanego dostawcę albo nie zarejestrowano żadnego dostawcy głosu w czasie rzeczywistym, Voice Call zapisuje ostrzeżenie w dzienniku i pomija multimedia czasu rzeczywistego zamiast powodować błąd całego Pluginu.
- Gdy `realtime.enabled` ma wartość `true`, `inboundPolicy` nie może mieć wartości `"disabled"`; `validateProviderConfig` odrzuca taką kombinację.
- Klucze sesji konsultacyjnych ponownie wykorzystują zapisaną sesję połączenia, jeśli jest dostępna, a w przeciwnym razie korzystają ze skonfigurowanego `sessionScope` (domyślnie `per-phone` lub `per-call` w przypadku izolowanych połączeń).

### Zasady używania narzędzi

`realtime.toolPolicy` steruje przebiegiem konsultacji:

| Zasada           | Zachowanie                                                                                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Udostępnia narzędzie konsultacyjne i ogranicza zwykłego agenta do `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` oraz `memory_get`.                 |
| `owner`          | Udostępnia narzędzie konsultacyjne i pozwala zwykłemu agentowi korzystać ze standardowych zasad używania narzędzi agenta.                                         |
| `none`           | Nie udostępnia narzędzia konsultacyjnego. Niestandardowe narzędzia `realtime.tools` nadal są przekazywane do dostawcy czasu rzeczywistego.                          |

`realtime.consultPolicy` steruje wyłącznie instrukcjami modelu czasu rzeczywistego:

| Zasada        | Wskazówki                                                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `auto`        | Zachowuje domyślny prompt i pozwala dostawcy decydować, kiedy wywołać narzędzie konsultacyjne.                              |
| `substantive` | Bezpośrednio odpowiada na proste kwestie konwersacyjne, a przed podaniem faktów lub użyciem pamięci, narzędzi albo kontekstu przeprowadza konsultację. |
| `always`      | Przeprowadza konsultację przed każdą merytoryczną odpowiedzią.                                                             |

### Kontekst głosowy agenta

Włącz `realtime.agentContext`, gdy most głosowy powinien brzmieć jak
skonfigurowany agent OpenClaw bez ponoszenia kosztu pełnego cyklu konsultacji
z agentem przy zwykłych wypowiedziach. Kapsuła kontekstu jest dodawana raz
podczas tworzenia sesji czasu rzeczywistego, więc nie zwiększa opóźnienia
każdej wypowiedzi. Wywołania `openclaw_agent_consult` nadal uruchamiają pełnego
agenta OpenClaw i powinny być używane do pracy z narzędziami, uzyskiwania
aktualnych informacji, wyszukiwania w pamięci lub odczytywania stanu przestrzeni roboczej.

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

### Przykłady dostawców czasu rzeczywistego

<Tabs>
  <Tab title="Google Gemini Live">
    Wartości domyślne: klucz API z `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` lub `GOOGLE_API_KEY`; model
    `gemini-3.1-flash-live-preview`; głos `Kore`. Opcje `sessionResumption`
    i `contextWindowCompression` są domyślnie włączone w przypadku dłuższych
    połączeń z możliwością ponownego nawiązania. Użyj `silenceDurationMs`,
    `startSensitivity` i `endSensitivity`, aby dostosować szybsze przejmowanie
    kolejki wypowiedzi w dźwięku telefonicznym.

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
                instructions: "Mów zwięźle. Wywołaj openclaw_agent_consult przed użyciem bardziej zaawansowanych narzędzi.",
                toolPolicy: "safe-read-only",
                consultPolicy: "substantive",
                consultThinkingLevel: "low",
                consultFastMode: true,
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-3.1-flash-live-preview",
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

Opcje głosu w czasie rzeczywistym właściwe dla poszczególnych dostawców
opisano na stronach [Dostawca Google](/pl/providers/google) i
[Dostawca OpenAI](/pl/providers/openai).

## Transkrypcja strumieniowa

`streaming` wybiera dostawcę transkrypcji w czasie rzeczywistym dla dźwięku
połączenia na żywo.

Bieżące zachowanie środowiska uruchomieniowego:

- `streaming.provider` jest opcjonalne. Jeśli nie jest ustawione, Voice Call używa pierwszego zarejestrowanego dostawcy transkrypcji w czasie rzeczywistym.
- Wbudowani dostawcy transkrypcji w czasie rzeczywistym: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) i xAI (`xai`), rejestrowani przez ich Pluginy dostawców.
- Surowa konfiguracja należąca do dostawcy znajduje się w `streaming.providers.<providerId>`.
- Gdy Twilio wyśle zaakceptowaną wiadomość `start` strumienia, Voice Call natychmiast rejestruje strumień, kolejkuje przychodzące multimedia za pośrednictwem dostawcy transkrypcji podczas nawiązywania przez niego połączenia i rozpoczyna powitanie początkowe dopiero po przygotowaniu transkrypcji w czasie rzeczywistym.
- Jeśli `streaming.provider` wskazuje niezarejestrowanego dostawcę albo nie zarejestrowano żadnego dostawcy, Voice Call zapisuje ostrzeżenie w dzienniku i pomija strumieniowanie multimediów zamiast powodować błąd całego Pluginu.

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
                    apiKey: "sk-...", // opcjonalne, jeśli ustawiono OPENAI_API_KEY
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
    Wartości domyślne: klucz API `streaming.providers.xai.apiKey` lub
    `XAI_API_KEY` (jeśli żaden z nich nie jest ustawiony, używany jest profil
    uwierzytelniania OAuth xAI); punkt końcowy `wss://api.x.ai/v1/stt`;
    kodowanie `mulaw`; częstotliwość próbkowania `8000`;
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
                    apiKey: "${XAI_API_KEY}", // opcjonalne, jeśli ustawiono XAI_API_KEY
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

## TTS dla połączeń

Voice Call używa podstawowej konfiguracji `messages.tts` do strumieniowego
odtwarzania mowy podczas połączeń. Można ją zastąpić w konfiguracji Pluginu
przy użyciu **tej samej struktury** — zostanie ona głęboko scalona
z `messages.tts`.

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
**Synteza mowy firmy Microsoft jest ignorowana w przypadku połączeń głosowych.**
Synteza telefoniczna wymaga dostawcy implementującego dane wyjściowe
przeznaczone dla telefonii; dostawca syntezy mowy Microsoft ich nie
implementuje, dlatego jest pomijany podczas połączeń, a zamiast niego
sprawdzani są inni dostawcy w łańcuchu rezerwowym.
</Warning>

Uwagi dotyczące zachowania:

- Starsze klucze `tts.<provider>` w konfiguracji Pluginu (`openai`, `elevenlabs`, `microsoft`, `edge`) są naprawiane przez `openclaw doctor --fix`; zatwierdzona konfiguracja powinna używać `tts.providers.<provider>`.
- Podstawowy mechanizm TTS jest używany, gdy włączone jest strumieniowanie multimediów Twilio; w przeciwnym razie połączenia korzystają z głosów natywnych dla dostawcy.
- Jeśli strumień multimediów Twilio jest już aktywny, Voice Call nie przechodzi awaryjnie do TwiML `<Say>`. Jeśli w tym stanie telefoniczny TTS jest niedostępny, żądanie odtwarzania kończy się niepowodzeniem zamiast łączyć dwie ścieżki odtwarzania.
- Gdy telefoniczny TTS przechodzi awaryjnie do dostawcy zapasowego, Voice Call zapisuje w dzienniku ostrzeżenie zawierające łańcuch dostawców (`from`, `to`, `attempts`) na potrzeby debugowania.
- Gdy funkcja przerywania wypowiedzi Twilio lub zamknięcie strumienia czyści oczekującą kolejkę TTS, zakolejkowane żądania odtwarzania zostają rozstrzygnięte zamiast powodować zawieszenie rozmówców oczekujących na zakończenie odtwarzania.

### Przykłady TTS

<Tabs>
  <Tab title="Tylko podstawowy TTS">
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
  <Tab title="Zastąpienie przez ElevenLabs (tylko połączenia)">
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
  <Tab title="Zastąpienie modelu OpenAI (głębokie scalanie)">
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

Domyślną zasadą dla połączeń przychodzących jest `disabled`. Aby włączyć
połączenia przychodzące, ustaw:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Cześć! Jak mogę pomóc?",
}
```

<Warning>
`inboundPolicy: "allowlist"` to mechanizm weryfikacji identyfikatora dzwoniącego o niskim poziomie wiarygodności. Plugin
normalizuje wartość `From` dostarczoną przez dostawcę i porównuje ją z `allowFrom`.
Weryfikacja Webhooka uwierzytelnia dostarczenie przez dostawcę i integralność ładunku,
ale **nie** potwierdza własności numeru dzwoniącego PSTN/VoIP. Traktuj
`allowFrom` jako filtrowanie identyfikatora dzwoniącego, a nie silne potwierdzenie jego tożsamości.
</Warning>

Automatyczne odpowiedzi korzystają z systemu agenta. Dostosuj je za pomocą `responseModel`,
`responseSystemPrompt` i `responseTimeoutMs`.

### Trasowanie według numeru

Użyj `numbers`, gdy jeden Plugin Voice Call odbiera połączenia kierowane na wiele numerów
telefonu, a każdy numer powinien działać jak osobna linia. Na przykład
jeden numer może korzystać ze swobodnego asystenta osobistego, a inny z persony
biznesowej, innego agenta odpowiedzi i innego głosu TTS.

Trasy są wybierane na podstawie wybranego numeru `To` dostarczonego przez dostawcę. Klucze muszą
być numerami w formacie E.164. Gdy przychodzi połączenie, Voice Call jednokrotnie rozpoznaje
pasującą trasę, zapisuje ją w rekordzie połączenia i ponownie wykorzystuje
wynikową konfigurację dla powitania, klasycznej ścieżki automatycznej odpowiedzi, ścieżki konsultacji
w czasie rzeczywistym oraz odtwarzania TTS. Jeśli żadna trasa nie pasuje, używana jest globalna
konfiguracja Voice Call. Połączenia wychodzące nie używają `numbers`; podczas inicjowania
połączenia jawnie przekaż docelowy numer, wiadomość i sesję.

Nadpisania tras obsługują obecnie:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Wartość `tts` trasy jest głęboko scalana z globalną konfiguracją `tts` Voice Call, dlatego
zwykle wystarczy nadpisać tylko głos dostawcy:

```json5
{
  inboundGreeting: "Witamy na głównej linii.",
  responseSystemPrompt: "Jesteś domyślnym asystentem głosowym.",
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, w czym mogę pomóc?",
      responseSystemPrompt: "Jesteś zwięzłym specjalistą od kart baseballowych.",
      tts: {
        providers: {
          openai: { speakerVoice: "alloy" },
        },
      },
    },
  },
}
```

### Kontrakt wypowiedzi głosowej

W przypadku automatycznych odpowiedzi Voice Call dołącza do komunikatu systemowego ścisły kontrakt wypowiedzi głosowej,
który wymaga odpowiedzi JSON `{"spoken":"..."}`. Voice Call
odpornie wyodrębnia tekst mowy:

- Ignoruje ładunki oznaczone jako treść rozumowania lub błędu.
- Analizuje bezpośredni JSON, JSON w bloku kodu lub osadzone klucze `"spoken"`.
- W razie niepowodzenia używa zwykłego tekstu i usuwa prawdopodobne początkowe akapity dotyczące planowania lub metadanych.

Dzięki temu odtwarzana wypowiedź skupia się na tekście przeznaczonym dla dzwoniącego i zapobiega
przedostawaniu się treści planowania do dźwięku.

### Zachowanie podczas rozpoczynania konwersacji

W przypadku wychodzących połączeń `conversation` obsługa pierwszej wiadomości jest powiązana ze stanem
odtwarzania na żywo:

- Czyszczenie kolejki przy przerwaniu wypowiedzi i automatyczna odpowiedź są wstrzymywane tylko wtedy, gdy początkowe powitanie jest aktywnie wypowiadane.
- Jeśli początkowe odtwarzanie się nie powiedzie, połączenie wraca do stanu `listening`, a początkowa wiadomość pozostaje w kolejce do ponowienia.
- Początkowe odtwarzanie dla strumieniowania Twilio rozpoczyna się po połączeniu strumienia bez dodatkowego opóźnienia.
- Przerwanie wypowiedzi zatrzymuje aktywne odtwarzanie i usuwa z kolejki wpisy TTS Twilio, których odtwarzanie jeszcze się nie rozpoczęło. Usunięte wpisy są rozstrzygane jako pominięte, dzięki czemu logika kolejnej odpowiedzi może działać dalej bez oczekiwania na dźwięk, który nigdy nie zostanie odtworzony.
- Rozmowy głosowe w czasie rzeczywistym używają własnej tury otwierającej strumienia czasu rzeczywistego. Voice Call **nie** wysyła starszej aktualizacji TwiML `<Say>` dla tej początkowej wiadomości, dzięki czemu wychodzące sesje `<Connect><Stream>` pozostają połączone.

### Okres karencji po rozłączeniu strumienia Twilio

Gdy strumień multimediów Twilio zostanie rozłączony, Voice Call czeka **2000 ms** przed
automatycznym zakończeniem połączenia:

- Jeśli strumień połączy się ponownie w tym czasie, automatyczne zakończenie zostanie anulowane.
- Jeśli po okresie karencji żaden strumień nie zarejestruje się ponownie, połączenie zostanie zakończone, aby zapobiec pozostawieniu zablokowanych aktywnych połączeń.

## Mechanizm usuwania nieaktualnych połączeń

Użyj `staleCallReaperSeconds` (domyślnie **120**), aby kończyć połączenia, które nigdy nie zostały
odebrane i nigdy nie osiągnęły stanu aktywnej rozmowy, na przykład połączenia w trybie powiadomienia,
dla których dostawca nigdy nie dostarcza końcowego Webhooka. Ustaw wartość `0`, aby
wyłączyć tę funkcję.

Mechanizm działa co 30 sekund i kończy tylko połączenia, które nie mają
znacznika czasu `answeredAt` oraz nie są już w stanie końcowym ani aktywnym
(`speaking`/`listening`), dzięki czemu odebrane rozmowy nigdy nie są usuwane
przez ten licznik czasu; `maxDurationSeconds` (domyślnie 300) to osobny limit,
który kończy odebrane połączenia trwające zbyt długo.

W przepływach powiadomień, w których operatorzy mogą wolno dostarczać Webhooki
dzwonienia lub odebrania, zwiększ `staleCallReaperSeconds` ponad wartość domyślną, aby normalne,
lecz wolne połączenia nie były kończone przedwcześnie; `120`–`300` sekund to rozsądny zakres
produkcyjny.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 120,
        },
      },
    },
  },
}
```

## Bezpieczeństwo Webhooka

Gdy przed Gatewayem znajduje się serwer proxy lub tunel, Plugin rekonstruuje
publiczny adres URL na potrzeby weryfikacji podpisu. Poniższe opcje określają, które
przekazane nagłówki są zaufane:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Lista dozwolonych hostów z przekazanych nagłówków.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Ufaj przekazanym nagłówkom bez listy dozwolonych.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Ufaj przekazanym nagłówkom tylko wtedy, gdy zdalny adres IP żądania znajduje się na liście.
</ParamField>

Dodatkowe zabezpieczenia:

- **Ochrona przed ponownym odtworzeniem** Webhooka jest włączona dla Twilio, Telnyx i Plivo. Ponownie odtworzone prawidłowe żądania Webhooka są potwierdzane, ale ich skutki uboczne są pomijane.
- Tury konwersacji Twilio zawierają token przypisany do tury w wywołaniach zwrotnych `<Gather>`, dzięki czemu nieaktualne lub ponownie odtworzone wywołania zwrotne mowy nie mogą zrealizować nowszej oczekującej tury transkrypcji.
- Nieuwierzytelnione żądania Webhooka są odrzucane przed odczytaniem treści, jeśli brakuje wymaganych przez dostawcę nagłówków podpisu.
- Webhook voice-call używa współdzielonego profilu odczytu treści przed uwierzytelnieniem (maksymalnie 64 KB treści, limit czasu odczytu 5 sekund) oraz limitu trwających żądań dla każdego klucza (domyślnie 8 równoczesnych żądań na klucz) przed weryfikacją podpisu.

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

Gdy Gateway jest już uruchomiony, operacyjne polecenia `voicecall`
przekazują wykonanie do środowiska uruchomieniowego voice-call zarządzanego przez Gateway, dzięki czemu CLI nie wiąże
drugiego serwera Webhooka. Jeśli Gateway jest nieosiągalny, polecenia przełączają się na
samodzielne środowisko uruchomieniowe CLI.

`latency` odczytuje `calls.jsonl` z domyślnej ścieżki przechowywania voice-call. Użyj
`--file <path>`, aby wskazać inny dziennik, oraz `--last <n>`, aby ograniczyć
analizę do ostatnich N rekordów (domyślnie 200). Dane wyjściowe obejmują wartości minimalne, maksymalne i średnie,
p50 oraz p95 dla opóźnienia tury i czasu oczekiwania na nasłuchiwanie.

## Narzędzie agenta

Nazwa narzędzia: `voice_call`.

| Działanie        | Argumenty                                  |
| ---------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Plugin voice-call zawiera odpowiadającą mu Skills agenta.

## RPC Gatewaya

| Metoda                      | Argumenty                                                        | Uwagi                                                                     |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | Jeśli pominięto `to`, używa konfiguracji `toNumber`.                       |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | Działa tak samo jak `initiate`, ale akceptuje również `dtmfSequence` przed połączeniem. |
| `voicecall.continue`        | `callId`, `message`                                              | Blokuje do zakończenia tury; zwraca transkrypcję.                          |
| `voicecall.continue.start`  | `callId`, `message`                                              | Wariant asynchroniczny: natychmiast zwraca `operationId`.                  |
| `voicecall.continue.result` | `operationId`                                                    | Odpytuje oczekującą operację `voicecall.continue.start` o jej wynik.       |
| `voicecall.speak`           | `callId`, `message`                                              | Wypowiada komunikat bez oczekiwania; używa mostu czasu rzeczywistego, gdy `realtime.enabled`. |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                           |
| `voicecall.end`             | `callId`                                                         |                                                                           |
| `voicecall.status`          | `callId?`                                                        | Pomiń `callId`, aby wyświetlić wszystkie aktywne połączenia.               |

`dtmfSequence` jest prawidłowe tylko z `mode: "conversation"`; połączenia w trybie powiadomienia,
które wymagają cyfr po nawiązaniu połączenia, powinny używać `voicecall.dtmf` po utworzeniu połączenia.

## Rozwiązywanie problemów

### Konfiguracja ekspozycji Webhooka kończy się niepowodzeniem

Uruchom konfigurację w tym samym środowisku, w którym działa Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Dla `twilio`, `telnyx` i `plivo` stan `webhook-exposure` musi być prawidłowy. Skonfigurowany
`publicUrl` nadal powoduje błąd, jeśli wskazuje na lokalną lub prywatną
przestrzeń sieciową, ponieważ operator nie może wywołać zwrotnie takich adresów.
Nie używaj `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`–`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, `fd00::/8` ani innych zakresów NAT
klasy operatorskiej jako `publicUrl`.

Wychodzące połączenia Twilio w trybie powiadomienia wysyłają początkowy TwiML `<Say>` bezpośrednio
w żądaniu utworzenia połączenia, więc pierwsza wypowiadana wiadomość nie zależy od
pobrania TwiML Webhooka przez Twilio. Publiczny Webhook jest nadal wymagany dla wywołań zwrotnych
stanu, połączeń konwersacyjnych, DTMF przed połączeniem, strumieni czasu rzeczywistego oraz
sterowania połączeniem po jego nawiązaniu.

Użyj jednej publicznej ścieżki ekspozycji:

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

`voicecall smoke` wykonuje próbę bez wprowadzania zmian, chyba że przekażesz `--yes`.

### Poświadczenia dostawcy są nieprawidłowe

Sprawdź wybranego dostawcę i wymagane pola poświadczeń:

- Twilio: `twilio.accountSid`, `twilio.authToken` i `fromNumber` albo
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` i `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` i
  `fromNumber` albo `TELNYX_API_KEY`, `TELNYX_CONNECTION_ID` i
  `TELNYX_PUBLIC_KEY`.
- Plivo: `plivo.authId`, `plivo.authToken` i `fromNumber` albo
  `PLIVO_AUTH_ID` i `PLIVO_AUTH_TOKEN`.

Poświadczenia muszą znajdować się na hoście Gateway. Edycja lokalnego profilu powłoki
nie wpływa na już uruchomiony Gateway, dopóki nie zostanie on ponownie uruchomiony lub nie przeładuje
swojego środowiska.

### Połączenia są inicjowane, ale webhooki dostawcy nie docierają

Potwierdź, że konsola dostawcy wskazuje dokładny publiczny adres URL webhooka:

```text
https://voice.example.com/voice/webhook
```

Następnie sprawdź stan środowiska wykonawczego:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Typowe przyczyny:

- `publicUrl` wskazuje inną ścieżkę niż `serve.path`.
- Adres URL tunelu zmienił się po uruchomieniu Gateway.
- Serwer proxy przekazuje żądanie, ale usuwa lub przepisuje nagłówki hosta/protokołu.
- Zapora sieciowa lub DNS kieruje publiczną nazwę hosta w inne miejsce niż Gateway.
- Gateway został ponownie uruchomiony bez włączonego pluginu połączeń głosowych.

Gdy przed Gateway znajduje się zwrotny serwer proxy lub tunel, ustaw
`webhookSecurity.allowedHosts` na publiczną nazwę hosta albo użyj
`webhookSecurity.trustedProxyIPs` dla znanego adresu serwera proxy. Używaj
`webhookSecurity.trustForwardingHeaders` tylko wtedy, gdy granica serwera proxy
znajduje się pod Twoją kontrolą.

### Weryfikacja podpisu kończy się niepowodzeniem

Podpisy dostawcy są sprawdzane względem publicznego adresu URL, który OpenClaw rekonstruuje
na podstawie przychodzącego żądania. Jeśli weryfikacja podpisów się nie powiedzie:

- Potwierdź, że adres URL webhooka dostawcy dokładnie odpowiada `publicUrl`, włącznie ze schematem, hostem i ścieżką.
- W przypadku adresów URL bezpłatnego planu ngrok aktualizuj `publicUrl`, gdy zmieni się nazwa hosta tunelu.
- Upewnij się, że serwer proxy zachowuje oryginalne nagłówki hosta i protokołu, albo skonfiguruj `webhookSecurity.allowedHosts`.
- Nie włączaj `skipSignatureVerification` poza testami lokalnymi.

### Dołączanie do Google Meet przez Twilio kończy się niepowodzeniem

Google Meet używa tego pluginu do dołączania przez połączenia telefoniczne Twilio. Najpierw zweryfikuj połączenia
głosowe:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Następnie jawnie zweryfikuj transport Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Jeśli połączenia głosowe działają prawidłowo, ale uczestnik nigdy nie dołącza do Meet, sprawdź
numer dostępowy Meet, kod PIN i `--dtmf-sequence`. Połączenie telefoniczne może działać
prawidłowo, podczas gdy spotkanie odrzuca lub ignoruje nieprawidłową sekwencję DTMF.

Google Meet rozpoczyna telefoniczny etap Twilio przez `voicecall.start` z sekwencją
DTMF wykonywaną przed połączeniem. Sekwencje wyprowadzone z kodu PIN zawierają
`voiceCall.dtmfDelayMs` pluginu Google Meet (domyślnie **12000 ms**) jako początkowe
cyfry oczekiwania Twilio, ponieważ monity telefonicznego dostępu do Meet mogą pojawić się z opóźnieniem. Następnie połączenia głosowe
przekierowują z powrotem do obsługi w czasie rzeczywistym przed zażądaniem powitania wprowadzającego.

Użyj `openclaw logs --follow`, aby śledzić fazy na żywo. Prawidłowe dołączenie do Meet
przez Twilio rejestruje zdarzenia w następującej kolejności:

- Google Meet deleguje dołączanie przez Twilio do połączeń głosowych.
- Połączenia głosowe zapisują TwiML DTMF wykonywane przed połączeniem.
- Początkowy TwiML Twilio zostaje użyty i udostępniony przed obsługą w czasie rzeczywistym.
- Połączenia głosowe udostępniają TwiML czasu rzeczywistego dla połączenia Twilio.
- Google Meet żąda odtworzenia mowy wprowadzającej za pomocą `voicecall.speak` po opóźnieniu następującym po DTMF.

`openclaw voicecall tail` nadal pokazuje utrwalone rekordy połączeń; jest przydatne do sprawdzania
stanu połączeń i transkrypcji, ale nie każde przejście webhooka lub obsługi w czasie rzeczywistym
jest tam widoczne.

### W połączeniu w czasie rzeczywistym nie ma mowy

Potwierdź, że włączony jest tylko jeden tryb audio: `realtime.enabled` i
`streaming.enabled` nie mogą być jednocześnie ustawione na true.

W przypadku połączeń Twilio/Telnyx w czasie rzeczywistym sprawdź również:

- Plugin dostawcy obsługi w czasie rzeczywistym jest załadowany i zarejestrowany.
- `realtime.provider` nie jest ustawione albo wskazuje zarejestrowanego dostawcę.
- Klucz API dostawcy jest dostępny dla procesu Gateway.
- `openclaw logs --follow` pokazuje udostępnienie TwiML czasu rzeczywistego, uruchomienie mostu czasu rzeczywistego i dodanie początkowego powitania do kolejki.

## Powiązane

- [Tryb rozmowy](/pl/nodes/talk)
- [Synteza mowy](/pl/tools/tts)
- [Aktywacja głosowa](/pl/nodes/voicewake)
