---
read_when:
    - Chcesz wykonać wychodzące połączenie głosowe z OpenClaw
    - Konfigurujesz lub rozwijasz Plugin połączeń głosowych
    - Potrzebujesz komunikacji głosowej w czasie rzeczywistym lub strumieniowej transkrypcji w telefonii
sidebarTitle: Voice call
summary: Wykonuj wychodzące i odbieraj przychodzące połączenia głosowe za pośrednictwem Twilio, Telnyx lub Plivo, z opcjonalną obsługą głosu w czasie rzeczywistym oraz transkrypcją strumieniową
title: Plugin połączeń głosowych
x-i18n:
    generated_at: "2026-05-01T10:01:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6334e5418e0fb530fc5d372ee1ada06ba987ce86bbf70746ee4ffe4c3ed4844e
    source_path: plugins/voice-call.md
    workflow: 16
---

Połączenia głosowe dla OpenClaw za pośrednictwem plugin. Obsługuje powiadomienia wychodzące,
wieloturowe konwersacje, głos realtime full-duplex, streaming
transkrypcji oraz połączenia przychodzące z zasadami listy dozwolonych.

**Obecni dostawcy:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (dev/bez sieci).

<Note>
Plugin Voice Call działa **wewnątrz procesu Gateway**. Jeśli używasz
zdalnego Gateway, zainstaluj i skonfiguruj plugin na maszynie uruchamiającej
Gateway, a następnie zrestartuj Gateway, aby go załadować.
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
      <Tab title="Z lokalnego folderu (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Jeśli npm zgłasza pakiet należący do OpenClaw jako przestarzały, ta wersja pakietu
    pochodzi ze starszej zewnętrznej linii pakietów; użyj aktualnego spakowanego buildu
    OpenClaw albo ścieżki do lokalnego folderu, dopóki nowszy pakiet npm nie zostanie opublikowany.

    Następnie zrestartuj Gateway, aby plugin został załadowany.

  </Step>
  <Step title="Skonfiguruj dostawcę i Webhook">
    Ustaw konfigurację w `plugins.entries.voice-call.config` (pełny kształt znajdziesz
    poniżej w sekcji [Konfiguracja](#configuration)). Minimum to:
    `provider`, poświadczenia dostawcy, `fromNumber` oraz publicznie
    osiągalny URL Webhook.
  </Step>
  <Step title="Zweryfikuj konfigurację">
    ```bash
    openclaw voicecall setup
    ```

    Domyślne wyjście jest czytelne w logach czatu i terminalach. Sprawdza
    włączenie plugin, poświadczenia dostawcy, ekspozycję Webhook oraz to, czy
    aktywny jest tylko jeden tryb audio (`streaming` albo `realtime`). Użyj
    `--json` dla skryptów.

  </Step>
  <Step title="Test dymny">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Oba polecenia domyślnie wykonują przebiegi próbne. Dodaj `--yes`, aby faktycznie
    wykonać krótkie wychodzące połączenie z powiadomieniem:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
W przypadku Twilio, Telnyx i Plivo konfiguracja musi prowadzić do **publicznego URL Webhook**.
Jeśli `publicUrl`, URL tunelu, URL Tailscale albo awaryjna ekspozycja `serve`
prowadzi do loopback lub przestrzeni sieci prywatnej, konfiguracja zakończy się błędem zamiast
uruchamiać dostawcę, który nie może odbierać Webhook od operatorów.
</Warning>

## Konfiguracja

Jeśli `enabled: true`, ale wybranemu dostawcy brakuje poświadczeń,
uruchamianie Gateway zapisuje ostrzeżenie o niepełnej konfiguracji z brakującymi kluczami i
pomija uruchomienie środowiska wykonawczego. Polecenia, wywołania RPC i narzędzia agenta nadal
zwracają dokładną brakującą konfigurację dostawcy podczas użycia.

<Note>
Poświadczenia voice-call akceptują SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` oraz `plugins.entries.voice-call.config.tts.providers.*.apiKey` są rozwiązywane przez standardową powierzchnię SecretRef; zobacz [powierzchnię poświadczeń SecretRef](/pl/reference/secretref-credential-surface).
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
  <Accordion title="Uwagi dotyczące ekspozycji i zabezpieczeń dostawców">
    - Twilio, Telnyx i Plivo wymagają **publicznie osiągalnego** URL Webhook.
    - `mock` to lokalny dostawca dev (bez wywołań sieciowych).
    - Telnyx wymaga `telnyx.publicKey` (albo `TELNYX_PUBLIC_KEY`), chyba że `skipSignatureVerification` ma wartość true.
    - `skipSignatureVerification` służy wyłącznie do testów lokalnych.
    - W darmowej warstwie ngrok ustaw `publicUrl` na dokładny URL ngrok; weryfikacja podpisu jest zawsze wymuszana.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` dopuszcza Webhook Twilio z nieprawidłowymi podpisami **tylko** wtedy, gdy `tunnel.provider="ngrok"` i `serve.bind` jest loopback (lokalny agent ngrok). Tylko lokalny dev.
    - URL-e darmowej warstwy ngrok mogą się zmieniać albo dodawać stronę pośrednią; jeśli `publicUrl` się rozjedzie, podpisy Twilio zawiodą. Produkcja: preferuj stabilną domenę albo lejek Tailscale.

  </Accordion>
  <Accordion title="Limity połączeń streaming">
    - `streaming.preStartTimeoutMs` zamyka gniazda, które nigdy nie wysyłają prawidłowej ramki `start`.
    - `streaming.maxPendingConnections` ogranicza łączną liczbę nieuwierzytelnionych gniazd przed startem.
    - `streaming.maxPendingConnectionsPerIp` ogranicza nieuwierzytelnione gniazda przed startem na źródłowy adres IP.
    - `streaming.maxConnections` ogranicza łączną liczbę otwartych gniazd strumienia mediów (oczekujące + aktywne).

  </Accordion>
  <Accordion title="Migracje starszej konfiguracji">
    Starsze konfiguracje używające `provider: "log"`, `twilio.from` albo starszych
    kluczy OpenAI `streaming.*` są przepisywane przez `openclaw doctor --fix`.
    Awaryjna kompatybilność runtime nadal na razie akceptuje stare klucze voice-call, ale
    ścieżką przepisywania jest `openclaw doctor --fix`, a warstwa zgodności jest
    tymczasowa.

    Automatycznie migrowane klucze streaming:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Konwersacje głosowe realtime

`realtime` wybiera dostawcę głosu realtime full-duplex dla audio połączenia
na żywo. Jest oddzielne od `streaming`, które tylko przekazuje audio do
dostawców transkrypcji realtime.

<Warning>
`realtime.enabled` nie można łączyć z `streaming.enabled`. Wybierz jeden
tryb audio na połączenie.
</Warning>

Obecne zachowanie runtime:

- `realtime.enabled` jest obsługiwane dla Twilio Media Streams.
- `realtime.provider` jest opcjonalne. Jeśli nie jest ustawione, Voice Call używa pierwszego zarejestrowanego dostawcy głosu realtime.
- Dołączani dostawcy głosu realtime: Google Gemini Live (`google`) i OpenAI (`openai`), rejestrowani przez ich plugin dostawców.
- Surowa konfiguracja należąca do dostawcy znajduje się w `realtime.providers.<providerId>`.
- Voice Call domyślnie udostępnia współdzielone narzędzie realtime `openclaw_agent_consult`. Model realtime może je wywołać, gdy rozmówca prosi o głębsze rozumowanie, aktualne informacje albo zwykłe narzędzia OpenClaw.
- `realtime.fastContext.enabled` jest domyślnie wyłączone. Po włączeniu Voice Call najpierw przeszukuje zindeksowany kontekst pamięci/sesji dla pytania konsultacyjnego i zwraca te fragmenty do modelu realtime w czasie `realtime.fastContext.timeoutMs`, zanim przejdzie awaryjnie do pełnego agenta konsultacyjnego tylko wtedy, gdy `realtime.fastContext.fallbackToConsult` ma wartość true.
- Jeśli `realtime.provider` wskazuje niezarejestrowanego dostawcę albo żaden dostawca głosu realtime nie jest w ogóle zarejestrowany, Voice Call zapisuje ostrzeżenie i pomija media realtime zamiast powodować błąd całego plugin.
- Klucze sesji konsultacyjnej ponownie używają istniejącej sesji głosowej, gdy jest dostępna, a następnie przechodzą awaryjnie do numeru telefonu dzwoniącego/odbiorcy, aby kolejne wywołania konsultacyjne zachowywały kontekst podczas połączenia.

### Zasada narzędzi

`realtime.toolPolicy` kontroluje przebieg konsultacji:

| Zasada           | Zachowanie                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Udostępnia narzędzie konsultacji i ogranicza zwykłego agenta do `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` oraz `memory_get`. |
| `owner`          | Udostępnia narzędzie konsultacji i pozwala zwykłemu agentowi używać normalnej zasady narzędzi agenta.                                                      |
| `none`           | Nie udostępnia narzędzia konsultacji. Niestandardowe `realtime.tools` nadal są przekazywane do dostawcy realtime.                               |

### Przykłady dostawców realtime

<Tabs>
  <Tab title="Google Gemini Live">
    Domyślnie: klucz API z `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` albo `GOOGLE_GENERATIVE_AI_API_KEY`; model
    `gemini-2.5-flash-native-audio-preview-12-2025`; głos `Kore`.

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
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    voice: "Kore",
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

## Transkrypcja streaming

`streaming` wybiera dostawcę transkrypcji realtime dla audio połączenia na żywo.

Obecne zachowanie runtime:

- `streaming.provider` jest opcjonalne. Jeśli nie jest ustawione, Voice Call używa pierwszego zarejestrowanego dostawcy transkrypcji w czasie rzeczywistym.
- Wbudowani dostawcy transkrypcji w czasie rzeczywistym: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) i xAI (`xai`), rejestrowani przez ich Pluginy dostawców.
- Surowa konfiguracja należąca do dostawcy znajduje się w `streaming.providers.<providerId>`.
- Po tym, jak Twilio wyśle zaakceptowany komunikat `start` strumienia, Voice Call natychmiast rejestruje strumień, kolejkowuje przychodzące media przez dostawcę transkrypcji, gdy dostawca się łączy, i uruchamia początkowe powitanie dopiero po przygotowaniu transkrypcji w czasie rzeczywistym.
- Jeśli `streaming.provider` wskazuje niezarejestrowanego dostawcę albo żaden nie jest zarejestrowany, Voice Call zapisuje ostrzeżenie w logach i pomija strumieniowanie mediów zamiast powodować awarię całego Pluginu.

### Przykłady dostawców strumieniowania

<Tabs>
  <Tab title="OpenAI">
    Domyślne: klucz API `streaming.providers.openai.apiKey` albo
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
    Domyślne: klucz API `streaming.providers.xai.apiKey` albo `XAI_API_KEY`;
    punkt końcowy `wss://api.x.ai/v1/stt`; kodowanie `mulaw`; częstotliwość próbkowania `8000`;
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

## TTS dla połączeń

Voice Call używa podstawowej konfiguracji `messages.tts` do strumieniowania
mowy podczas połączeń. Możesz ją nadpisać w konfiguracji Pluginu w
**tym samym kształcie** — jest głęboko scalana z `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**Microsoft speech jest ignorowane dla połączeń głosowych.** Dźwięk telefoniczny wymaga PCM;
bieżący transport Microsoft nie udostępnia wyjścia telefonicznego PCM.
</Warning>

Uwagi dotyczące działania:

- Starsze klucze `tts.<provider>` w konfiguracji Pluginu (`openai`, `elevenlabs`, `microsoft`, `edge`) są naprawiane przez `openclaw doctor --fix`; zatwierdzona konfiguracja powinna używać `tts.providers.<provider>`.
- Podstawowe TTS jest używane, gdy strumieniowanie mediów Twilio jest włączone; w przeciwnym razie połączenia wracają do natywnych głosów dostawcy.
- Jeśli strumień mediów Twilio jest już aktywny, Voice Call nie wraca do TwiML `<Say>`. Jeśli TTS telefoniczne jest w tym stanie niedostępne, żądanie odtwarzania kończy się niepowodzeniem zamiast mieszać dwie ścieżki odtwarzania.
- Gdy TTS telefoniczne wraca do dostawcy zapasowego, Voice Call zapisuje ostrzeżenie z łańcuchem dostawców (`from`, `to`, `attempts`) na potrzeby debugowania.
- Gdy barge-in Twilio albo zamknięcie strumienia czyści oczekującą kolejkę TTS, zakolejkowane żądania odtwarzania zostają rozstrzygnięte zamiast pozostawiać dzwoniących w oczekiwaniu na zakończenie odtwarzania.

### Przykłady TTS

<Tabs>
  <Tab title="Core TTS only">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Override to ElevenLabs (calls only)">
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
                voiceId: "pMsXgVXv3BLzUgSXRplE",
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
  <Tab title="OpenAI model override (deep-merge)">
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
                voice: "marin",
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

Polityka połączeń przychodzących ma domyślnie wartość `disabled`. Aby włączyć połączenia przychodzące, ustaw:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` to ekranowanie identyfikatora dzwoniącego o niskiej pewności. Plugin
normalizuje wartość `From` dostarczoną przez dostawcę i porównuje ją z
`allowFrom`. Weryfikacja Webhook uwierzytelnia dostarczenie przez dostawcę i
integralność ładunku, ale **nie** dowodzi własności numeru dzwoniącego
PSTN/VoIP. Traktuj `allowFrom` jako filtrowanie identyfikatora dzwoniącego, a nie silną
tożsamość dzwoniącego.
</Warning>

Automatyczne odpowiedzi używają systemu agentów. Dostosuj je za pomocą `responseModel`,
`responseSystemPrompt` i `responseTimeoutMs`.

### Kontrakt wypowiedzi głosowej

Dla automatycznych odpowiedzi Voice Call dołącza do monitu systemowego ścisły kontrakt wypowiedzi głosowej:

```text
{"spoken":"..."}
```

Voice Call defensywnie wyodrębnia tekst mowy:

- Ignoruje ładunki oznaczone jako treść rozumowania/błędu.
- Parsuje bezpośredni JSON, JSON w bloku kodu albo klucze `"spoken"` w wierszu.
- Wraca do zwykłego tekstu i usuwa prawdopodobne akapity wprowadzające związane z planowaniem/metadanymi.

Dzięki temu odtwarzanie mowy skupia się na tekście przeznaczonym dla dzwoniącego i unika
ujawniania tekstu planowania w dźwięku.

### Zachowanie uruchamiania rozmowy

Dla wychodzących połączeń `conversation` obsługa pierwszej wiadomości jest powiązana ze stanem odtwarzania na żywo:

- Czyszczenie kolejki po barge-in i automatyczna odpowiedź są wstrzymywane tylko wtedy, gdy początkowe powitanie jest aktywnie wypowiadane.
- Jeśli początkowe odtwarzanie się nie powiedzie, połączenie wraca do stanu `listening`, a początkowa wiadomość pozostaje w kolejce do ponowienia.
- Początkowe odtwarzanie dla strumieniowania Twilio zaczyna się przy połączeniu strumienia bez dodatkowego opóźnienia.
- Barge-in przerywa aktywne odtwarzanie i czyści zakolejkowane, ale jeszcze nieodtwarzane wpisy TTS Twilio. Wyczyszczone wpisy są rozstrzygane jako pominięte, więc logika kolejnej odpowiedzi może działać dalej bez czekania na dźwięk, który nigdy nie zostanie odtworzony.
- Rozmowy głosowe w czasie rzeczywistym używają własnej tury otwierającej strumienia w czasie rzeczywistym. Voice Call **nie** wysyła starszej aktualizacji TwiML `<Say>` dla tej początkowej wiadomości, więc wychodzące sesje `<Connect><Stream>` pozostają podłączone.

### Okres karencji rozłączenia strumienia Twilio

Gdy strumień mediów Twilio zostanie rozłączony, Voice Call czeka **2000 ms** przed
automatycznym zakończeniem połączenia:

- Jeśli strumień połączy się ponownie w tym oknie, automatyczne zakończenie zostanie anulowane.
- Jeśli po okresie karencji żaden strumień nie zarejestruje się ponownie, połączenie zostanie zakończone, aby zapobiec zablokowanym aktywnym połączeniom.

## Usuwanie nieaktualnych połączeń

Użyj `staleCallReaperSeconds`, aby kończyć połączenia, które nigdy nie otrzymują końcowego
Webhook (na przykład połączenia w trybie powiadomień, które nigdy się nie kończą). Wartość domyślna
to `0` (wyłączone).

Zalecane zakresy:

- **Produkcja:** `120`–`300` sekund dla przepływów typu powiadomienia.
- Utrzymuj tę wartość **wyższą niż `maxDurationSeconds`**, aby zwykłe połączenia mogły się zakończyć. Dobrym punktem startowym jest `maxDurationSeconds + 30–60` sekund.

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

Gdy przed Gateway znajduje się proxy lub tunel, Plugin
rekonstruuje publiczny URL do weryfikacji podpisu. Te opcje
kontrolują, którym przekazanym nagłówkom można ufać:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Lista dozwolonych hostów z nagłówków przekazywania.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Ufaj przekazanym nagłówkom bez listy dozwolonych.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Ufaj przekazanym nagłówkom tylko wtedy, gdy zdalny adres IP żądania pasuje do listy.
</ParamField>

Dodatkowe zabezpieczenia:

- **Ochrona przed powtórzeniem** Webhook jest włączona dla Twilio i Plivo. Powtórzone prawidłowe żądania Webhook są potwierdzane, ale pomijane pod kątem skutków ubocznych.
- Tury rozmowy Twilio zawierają token dla każdej tury w wywołaniach zwrotnych `<Gather>`, więc przestarzałe/powtórzone wywołania zwrotne mowy nie mogą spełnić nowszej oczekującej tury transkrypcji.
- Nieuwierzytelnione żądania Webhook są odrzucane przed odczytami treści, gdy brakuje wymaganych przez dostawcę nagłówków podpisu.
- Webhook voice-call używa współdzielonego profilu treści przed uwierzytelnieniem (64 KB / 5 sekund) oraz limitu równoległych żądań dla adresu IP przed weryfikacją podpisu.

Przykład ze stabilnym publicznym hostem:

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
do środowiska wykonawczego voice-call należącego do Gateway, więc CLI nie wiąże drugiego
serwera Webhook. Jeśli żaden Gateway nie jest osiągalny, polecenia wracają do
samodzielnego środowiska wykonawczego CLI.

`latency` odczytuje `calls.jsonl` z domyślnej ścieżki przechowywania voice-call.
Użyj `--file <path>`, aby wskazać inny log, oraz `--last <n>`, aby ograniczyć
analizę do ostatnich N rekordów (domyślnie 200). Wynik zawiera p50/p90/p99
dla opóźnienia tury i czasów oczekiwania na nasłuchiwanie.

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

To repozytorium dostarcza pasujący dokument Skills pod `skills/voice-call/SKILL.md`.

## Gateway RPC

| Metoda               | Argumenty                                  |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` jest prawidłowe tylko z `mode: "conversation"`. Połączenia w trybie powiadomień
powinny używać `voicecall.dtmf` po utworzeniu połączenia, jeśli potrzebują cyfr
po połączeniu.

## Rozwiązywanie problemów

### Konfiguracja nie udostępnia Webhook

Uruchom konfigurację z tego samego środowiska, w którym działa Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Dla `twilio`, `telnyx` i `plivo` parametr `webhook-exposure` musi być zielony. Skonfigurowany `publicUrl` nadal zakończy się niepowodzeniem, jeśli wskazuje na lokalną lub prywatną przestrzeń sieciową, ponieważ operator nie może wywołać tych adresów zwrotnie. Nie używaj `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` ani `fd00::/8` jako `publicUrl`.

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

Po zmianie konfiguracji zrestartuj lub przeładuj Gateway, a następnie uruchom:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` jest przebiegiem próbnym, chyba że przekażesz `--yes`.

### Dane uwierzytelniające dostawcy kończą się niepowodzeniem

Sprawdź wybranego dostawcę i wymagane pola danych uwierzytelniających:

- Twilio: `twilio.accountSid`, `twilio.authToken` oraz `fromNumber` albo
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` i `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` oraz
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` oraz `fromNumber`.

Dane uwierzytelniające muszą istnieć na hoście Gateway. Edycja lokalnego profilu powłoki nie wpływa na już działający Gateway, dopóki nie zostanie on zrestartowany lub nie przeładuje swojego środowiska.

### Połączenia się rozpoczynają, ale webhooks dostawcy nie docierają

Upewnij się, że konsola dostawcy wskazuje dokładny publiczny URL webhooka:

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
- Zapora lub DNS kieruje publiczną nazwę hosta w inne miejsce niż Gateway.
- Gateway został zrestartowany bez włączonego Plugin Voice Call.

Gdy przed Gateway znajduje się odwrotne proxy lub tunel, ustaw `webhookSecurity.allowedHosts` na publiczną nazwę hosta albo użyj `webhookSecurity.trustedProxyIPs` dla znanego adresu proxy. Używaj `webhookSecurity.trustForwardingHeaders` tylko wtedy, gdy granica proxy jest pod Twoją kontrolą.

### Weryfikacja podpisu kończy się niepowodzeniem

Podpisy dostawcy są sprawdzane względem publicznego URL, który OpenClaw odtwarza z przychodzącego żądania. Jeśli podpisy zawodzą:

- Upewnij się, że URL webhooka dostawcy dokładnie odpowiada `publicUrl`, łącznie ze schematem, hostem i ścieżką.
- Dla URL-i ngrok w darmowym planie zaktualizuj `publicUrl`, gdy zmieni się nazwa hosta tunelu.
- Upewnij się, że proxy zachowuje oryginalne nagłówki host i proto, albo skonfiguruj `webhookSecurity.allowedHosts`.
- Nie włączaj `skipSignatureVerification` poza lokalnym testowaniem.

### Dołączenia Google Meet przez Twilio kończą się niepowodzeniem

Google Meet używa tego pluginu do dołączania przez połączenie telefoniczne Twilio. Najpierw zweryfikuj Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Następnie jawnie zweryfikuj transport Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Jeśli Voice Call jest zielony, ale uczestnik Meet nigdy nie dołącza, sprawdź numer połączenia telefonicznego Meet, PIN oraz `--dtmf-sequence`. Połączenie telefoniczne może być sprawne, podczas gdy spotkanie odrzuca lub ignoruje nieprawidłową sekwencję DTMF.

Google Meet przekazuje sekwencję DTMF Meet i tekst wprowadzenia do `voicecall.start`. W przypadku połączeń Twilio Voice Call najpierw udostępnia DTMF TwiML, przekierowuje z powrotem do webhooka, a potem otwiera strumień multimediów w czasie rzeczywistym, aby zapisane wprowadzenie zostało wygenerowane po dołączeniu uczestnika telefonicznego do spotkania.

Użyj `openclaw logs --follow`, aby śledzić fazę na żywo. Poprawne dołączenie Twilio Meet zapisuje zdarzenia w tej kolejności:

- Google Meet deleguje dołączenie Twilio do Voice Call.
- Voice Call zapisuje DTMF TwiML przed połączeniem.
- Początkowy TwiML Twilio zostaje użyty i udostępniony przed obsługą w czasie rzeczywistym.
- Voice Call udostępnia TwiML w czasie rzeczywistym dla połączenia Twilio.
- Most w czasie rzeczywistym uruchamia się z początkowym powitaniem w kolejce.

`openclaw voicecall tail` nadal pokazuje utrwalone rekordy połączeń; jest przydatne do stanu połączenia i transkrypcji, ale nie każde przejście webhooka lub czasu rzeczywistego pojawia się tam.

### Połączenie w czasie rzeczywistym nie ma mowy

Upewnij się, że włączony jest tylko jeden tryb audio. `realtime.enabled` i `streaming.enabled` nie mogą jednocześnie mieć wartości true.

Dla połączeń Twilio w czasie rzeczywistym sprawdź także:

- Plugin dostawcy czasu rzeczywistego jest załadowany i zarejestrowany.
- `realtime.provider` jest nieustawiony albo wskazuje zarejestrowanego dostawcę.
- Klucz API dostawcy jest dostępny dla procesu Gateway.
- `openclaw logs --follow` pokazuje udostępnienie TwiML w czasie rzeczywistym, uruchomienie mostu w czasie rzeczywistym oraz dodanie początkowego powitania do kolejki.

## Powiązane

- [Tryb rozmowy](/pl/nodes/talk)
- [Zamiana tekstu na mowę](/pl/tools/tts)
- [Wybudzanie głosem](/pl/nodes/voicewake)
