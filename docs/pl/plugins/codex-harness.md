---
read_when:
    - Chcesz użyć oficjalnego środowiska testowego serwera aplikacji Codex
    - Potrzebujesz przykładów konfiguracji środowiska Codex
    - Chcesz, aby wdrożenia korzystające wyłącznie z Codex kończyły się niepowodzeniem zamiast przełączać się awaryjnie na OpenClaw
summary: Uruchamiaj tury osadzonego agenta OpenClaw za pomocą oficjalnego środowiska app-server Codex
title: Uprząż Codex
x-i18n:
    generated_at: "2026-07-16T18:49:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f27d934036ca6952ec12bbda3d275d08701a38ac9c79df37fc6040f01b529cd
    source_path: plugins/codex-harness.md
    workflow: 16
---

Oficjalny plugin `codex` uruchamia osadzone tury agenta OpenAI za pośrednictwem
app-servera Codex zamiast wbudowanego mechanizmu OpenClaw. Codex zarządza
niskopoziomową sesją agenta: natywnym wznawianiem wątków, natywną kontynuacją narzędzi,
natywną kompakcją i wykonywaniem przez app-server. OpenClaw nadal zarządza kanałami
czatu, plikami sesji, wyborem modelu, dynamicznymi narzędziami OpenClaw, zatwierdzeniami,
dostarczaniem multimediów i widoczną kopią transkrypcji.

Używaj kanonicznych odwołań do modeli OpenAI, takich jak `openai/gpt-5.6-sol`. Nie konfiguruj
starszych odwołań Codex GPT; kolejność uwierzytelniania agenta OpenAI umieść w `auth.order.openai`.
Starsze identyfikatory profili uwierzytelniania Codex i starsze wpisy kolejności uwierzytelniania Codex
są naprawiane przez `openclaw doctor --fix`.

Gdy zasady środowiska uruchomieniowego dostawcy/modelu nie są ustawione lub mają wartość `auto`, sam prefiks `openai/*`
nigdy nie wybiera tego mechanizmu. OpenAI może niejawnie wybrać Codex tylko dla
dokładnie zgodnej oficjalnej trasy HTTPS Platform Responses lub ChatGPT Responses bez
nadpisania żądania zdefiniowanego przez użytkownika. Zobacz
[Niejawne środowisko uruchomieniowe agenta OpenAI](/pl/providers/openai#implicit-agent-runtime).
Jeśli Codex przejmie uwierzytelnianie, zanim zostanie ustalone trasowanie Platform lub ChatGPT, OpenClaw
nadal wymaga, aby każda potencjalna trasa deklarowała zgodność z Codex. Samo natywne
zarządzanie uwierzytelnianiem nigdy nie omija tej kontroli trasy.

Gdy żadna piaskownica OpenClaw nie jest aktywna, OpenClaw uruchamia wątki app-servera Codex
z włączonym natywnym trybem kodu Codex (tryb wyłącznie kodu pozostaje domyślnie wyłączony), dzięki czemu
natywne możliwości obszaru roboczego i kodu pozostają dostępne wraz z dynamicznymi narzędziami OpenClaw
trasowanymi przez most `item/tool/call` app-servera. Aktywna piaskownica OpenClaw lub restrykcyjne
zasady narzędzi całkowicie wyłączają natywny tryb kodu, chyba że zostanie włączona eksperymentalna
ścieżka serwera wykonywania w piaskownicy.

Przy domyślnym `tools.exec.host: "auto"` i bez aktywnej piaskownicy OpenClaw
Codex otrzymuje również narzędzia `node_exec` i `node_process` do wykonywania poleceń na sparowanych
węzłach. Natywna powłoka pozostaje na hoście i w obszarze roboczym app-servera Codex
(lokalnie względem Gateway w domyślnym wdrożeniu stdio); `node_exec` wybiera węzeł według
nazwy lub identyfikatora i zachowuje zasady zatwierdzania węzłów OpenClaw. Jeśli skończona
lista dozwolonych środowiska uruchomieniowego wyłącza natywny tryb kodu i pozostawia turę bez
środowiska wykonywania, OpenClaw zamiast tego zachowuje dostępność swoich narzędzi `exec` i `process`
przefiltrowanych zgodnie z zasadami, przeznaczonych do bezpośredniego wykonywania poza piaskownicą.

Ta natywna funkcja Codex jest odrębna od
[trybu kodu OpenClaw](/pl/reference/code-mode), opcjonalnego środowiska uruchomieniowego QuickJS-WASI
dla ogólnych uruchomień OpenClaw, z innym formatem danych wejściowych `exec`. Szersze omówienie
podziału na model, dostawcę i środowisko uruchomieniowe znajduje się w
[Środowiskach uruchomieniowych agentów](/pl/concepts/agent-runtimes): `openai/gpt-5.6-sol` to odwołanie do modelu,
`codex` to środowisko uruchomieniowe, a Telegram, Discord, Slack lub inny
kanał to powierzchnia komunikacji.

## Wymagania

- Zainstalowany oficjalny plugin `@openclaw/codex`. Jeśli konfiguracja używa listy dozwolonych, uwzględnij `codex` w
  `plugins.allow`.
- App-server Codex w wersji `0.143.0` lub nowszej. Plugin domyślnie zarządza zgodnym
  plikiem binarnym, więc polecenie `codex` dostępne w `PATH` nie wpływa na normalne
  uruchamianie.
- Uwierzytelnianie Codex przez `openclaw models auth login --provider openai`, konto
  app-servera już obecne w katalogu domowym Codex agenta lub
  jawny profil uwierzytelniania Codex za pomocą klucza API.

Informacje o kolejności uwierzytelniania, izolacji środowiska, niestandardowych poleceniach app-servera,
wykrywaniu modeli i pełnej liście pól konfiguracji zawiera
[dokumentacja mechanizmu Codex](/pl/plugins/codex-harness-reference).

## Szybki start

Zainstaluj oficjalny plugin, a następnie zaloguj się za pomocą Codex OAuth:

```bash
openclaw plugins install @openclaw/codex
openclaw models auth login --provider openai
```

Włącz plugin `codex` i wybierz model agenta OpenAI:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Jeśli konfiguracja używa `plugins.allow`, dodaj tam również `codex`:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Po zmianie konfiguracji pluginu uruchom ponownie Gateway. Jeśli czat ma już
sesję, najpierw uruchom `/new` lub `/reset`, aby następna tura ustaliła mechanizm
na podstawie bieżącej konfiguracji.

## Współdzielenie wątków z Codex Desktop i CLI

Domyślne ustawienie `appServer.homeScope: "agent"` izoluje każdego agenta OpenClaw od
natywnego stanu Codex operatora. Aby umożliwić właścicielowi przeglądanie tych samych
natywnych wątków, które są widoczne w Codex Desktop i CLI Codex, oraz zarządzanie nimi, należy włączyć
katalog domowy Codex użytkownika:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            homeScope: "user",
          },
        },
      },
    },
  },
}
```

Tryb katalogu domowego użytkownika obsługuje lokalny zarządzany proces stdio lub współdzielony transport
przez gniazdo uniksowe. Używa `$CODEX_HOME`, jeśli jest ustawione, a w przeciwnym razie `~/.codex`, w tym
natywnego uwierzytelniania Codex, konfiguracji, pluginów i magazynu wątków z tego katalogu domowego. OpenClaw
nie wstrzykuje profilu uwierzytelniania OpenClaw do tego app-servera.

Tury właściciela uzyskują narzędzie `codex_threads`: wyświetlanie listy, wyszukiwanie, odczytywanie, rozwidlanie, zmiana nazw,
archiwizowanie i przywracanie natywnych wątków. Rozwidlenie wątku pozwala kontynuować go w
OpenClaw; rozwidlenie zostaje dołączone do bieżącej sesji OpenClaw i pozostaje
widoczne dla innych natywnych klientów Codex. Archiwizacja wymaga jawnego
potwierdzenia, że wątek jest zamknięty w innych miejscach. Gdy nadzór jest również
włączony, pola transkrypcji i modyfikacje wymagają odpowiedniego włączenia
`supervision.allowRawTranscripts` lub `supervision.allowWriteControls`.

Nie wznawiaj ani nie zapisuj tego samego wątku równocześnie za pośrednictwem niezależnych zarządzanych
App Serverów stdio. Codex koordynuje aktywnych zapisujących w ramach jednego App Servera, ale nie
między oddzielnymi procesami. Rozwidlanie jest bezpiecznym sposobem współistnienia zwykłych
sesji stdio korzystających z katalogu domowego użytkownika.

Samo `appServer.homeScope: "user"` nie steruje katalogiem floty. Wykrywanie
natywnych sesji jest włączone, gdy plugin jest aktywny; ustaw
`sessionCatalog.enabled: false`, aby usunąć je z paska bocznego OpenClaw bez
wyłączania Codex. Katalog używa oddzielnego połączenia nadzoru; bez
jawnych ustawień połączenia `appServer` połączenie to domyślnie korzysta z zarządzanego
stdio w katalogu domowym użytkownika, podczas gdy zwykły mechanizm pozostaje ograniczony do agenta. Jawne
ustawienia `appServer` są respektowane przez obie ścieżki. Ustaw `homeScope: "user"`
jawnie, jak powyżej, gdy zwykły mechanizm również ma współdzielić natywny stan.

## Nadzorowanie sesji Codex

Ten sam plugin `codex` może wyświetlać niearchiwizowane sesje Codex z komputera
Gateway i sparowanych węzłów, dla których włączono tę funkcję. Zapisana lub bezczynna sesja lokalna względem Gateway może
utworzyć czat z zablokowanym modelem, który odzwierciedla jej ograniczoną, utrwaloną historię użytkownika i asystenta.
Jego prywatne powiązanie korzysta z połączenia nadzoru na potrzeby natywnej migawki,
kanonicznej gałęzi i późniejszych tur, podczas gdy zwykłe sesje Codex pozostają
ograniczone do agenta. Pierwsze kanoniczne uruchomienie używa dokładnie modelu i dostawcy zwróconych
przez Codex dla rozwidlenia migawki. Przy późniejszych wznowieniach wybór pozostaje po stronie natywnej
konfiguracji Codex; zewnętrzny model OpenClaw i łańcuch modeli rezerwowych nigdy go nie zastępują.
Zapisane i bezczynne wiersze można zarchiwizować po jawnym potwierdzeniu, że nie istnieje inny proces wykonawczy.
Aktywne źródła nie mogą utworzyć gałęzi ani zostać zarchiwizowane; istniejący
nadzorowany czat nadal można otworzyć. Sesje na sparowanych węzłach pozostają wyłącznie metadanymi.

Informacje o konfiguracji, zasadach tworzenia gałęzi, ograniczeniach sparowanych węzłów, ujawnianiu metadanych
i rozwiązywaniu problemów zawiera [Nadzorowanie sesji Codex](/plugins/codex-supervision).

## Konfiguracja

| Potrzeba                                             | Ustawienie                                                                                       | Miejsce                            |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Włączenie mechanizmu                                | `plugins.entries.codex.enabled: true`                                                            | Konfiguracja OpenClaw              |
| Ukrycie wykrywania natywnych sesji Codex            | `plugins.entries.codex.config.sessionCatalog.enabled: false`                                     | Konfiguracja pluginu Codex         |
| Zachowanie instalacji pluginu z listy dozwolonych   | Uwzględnij `codex` w `plugins.allow`                                                               | Konfiguracja OpenClaw              |
| Zezwolenie kwalifikującym się turom OpenAI na niejawne użycie Codex | Dokładnie zgodna oficjalna trasa HTTPS Responses/ChatGPT, bez nadpisania żądania zdefiniowanego przez użytkownika, środowisko uruchomieniowe nieustawione/`auto` | Konfiguracja dostawcy/modelu OpenAI |
| Logowanie za pomocą ChatGPT/Codex OAuth             | `openclaw models auth login --provider openai`                                                   | Profil uwierzytelniania CLI        |
| Dodanie zapasowego klucza API dla uruchomień Codex  | Profil klucza API `openai:*` wymieniony po uwierzytelnianiu subskrypcji w `auth.order.openai`                 | Profil uwierzytelniania CLI + konfiguracja OpenClaw |
| Zakończenie niepowodzeniem, gdy Codex jest niedostępny | `agentRuntime.id: "codex"` dostawcy lub modelu                                                     | Konfiguracja modelu/dostawcy OpenClaw |
| Użycie bezpośredniego ruchu API OpenAI              | `agentRuntime.id: "openclaw"` dostawcy lub modelu ze standardowym uwierzytelnianiem OpenAI                          | Konfiguracja modelu/dostawcy OpenClaw |
| Dostosowanie działania app-servera                  | `plugins.entries.codex.config.appServer.*`                                                       | Konfiguracja pluginu Codex         |
| Włączenie natywnych aplikacji pluginów Codex        | `plugins.entries.codex.config.codexPlugins.*`                                                    | Konfiguracja pluginu Codex         |
| Włączenie Codex Computer Use                        | `plugins.entries.codex.config.computerUse.*`                                                     | Konfiguracja pluginu Codex         |

Preferuj `auth.order.openai`, aby najpierw używać subskrypcji, a klucza API jako rozwiązania zapasowego.
Istniejące starsze identyfikatory profili uwierzytelniania Codex i starsza kolejność uwierzytelniania Codex są
starszym stanem obsługiwanym wyłącznie przez doctor; nie zapisuj nowych starszych odwołań Codex GPT.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

W przypadku efektywnej trasy zgodnej z Codex oba powyższe profile pozostają kandydatami
dla tego samego uruchomienia Codex. Kolejność profili wybiera dane uwierzytelniające, a nie środowisko uruchomieniowe.
Zmiana kolejności uwierzytelniania nie zapewnia zgodności z Codex trasie niestandardowej, Completions, HTTP ani
trasie z nadpisanym żądaniem.

### Compaction

Nie ustawiaj `compaction.model` ani `compaction.provider` dla agentów
korzystających z Codex. Codex przeprowadza kompakcję za pomocą natywnego stanu wątku app-servera, dlatego
OpenClaw ignoruje te lokalne nadpisania modułu podsumowującego w czasie działania, a
`openclaw doctor --fix` usuwa je, gdy agent używa Codex.

Lossless nadal jest obsługiwany jako mechanizm kontekstu do składania, wczytywania i
konserwacji wokół tur Codex, konfigurowany przez
`plugins.slots.contextEngine: "lossless-claw"` i
`plugins.entries.lossless-claw.config.summaryModel`, a nie przez
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migruje
stary format `compaction.provider: "lossless-claw"` do miejsca mechanizmu
kontekstu Lossless, gdy aktywnym środowiskiem uruchomieniowym jest Codex, ale natywny Codex nadal
zarządza kompakcją. Natywny mechanizm app-servera obsługuje mechanizmy kontekstu,
które wymagają składania przed utworzeniem monitu; ogólne backendy CLI, w tym `codex-cli`,
nie zapewniają tej możliwości hosta.

W przypadku agentów korzystających z Codex polecenie `/compact` rozpoczyna natywną kompakcję
app-servera Codex w powiązanym wątku. OpenClaw nie czeka na jej zakończenie,
nie nakłada limitu czasu OpenClaw, nie uruchamia ponownie współdzielonego app-servera ani nie przełącza się awaryjnie na
mechanizm kontekstu lub publiczny moduł podsumowujący OpenAI. Jeśli powiązanie natywnego wątku Codex
nie istnieje lub jest nieaktualne, polecenie kończy się niepowodzeniem zamiast po cichu
przełączać backend kompakcji.

Pozostała część tej strony opisuje strukturę wdrożenia, trasowanie kończące się niepowodzeniem,
zasady zatwierdzania przez strażnika, natywne pluginy Codex i Computer Use. Pełne listy
opcji, wartości domyślne, wyliczenia, wykrywanie, izolację środowiska, limity czasu i
pola transportu app-servera zawiera
[dokumentacja mechanizmu Codex](/pl/plugins/codex-harness-reference).

## Weryfikacja środowiska uruchomieniowego Codex

Użyj `/status` na czacie, na którym oczekiwany jest Codex. Tura agenta OpenAI
obsługiwana przez Codex wyświetla:

```text
Środowisko uruchomieniowe: OpenAI Codex
```

Następnie sprawdź stan serwera aplikacji Codex:

```text
/codex status
/codex models
```

`/codex status` zgłasza łączność z serwerem aplikacji, konto, limity szybkości, serwery
MCP oraz Skills. `/codex models` wyświetla aktualny katalog serwera aplikacji Codex
dla uprzęży i konta. Jeśli `/status` jest zaskakujące, zobacz
[Rozwiązywanie problemów](#troubleshooting).

## Routing i wybór modelu

Oddziel odwołania do dostawców od zasad środowiska uruchomieniowego:

- Użyj `openai/gpt-*` do kanonicznego wyboru modelu OpenAI. Sam prefiks
  nigdy nie wybiera środowiska Codex.
- Gdy środowisko uruchomieniowe nie jest ustawione lub ma wartość `auto`, tylko dokładna oficjalna trasa HTTPS Platform Responses
  albo ChatGPT Responses bez jawnego nadpisania żądania może niejawnie wybrać Codex.
- Nie używaj starszych odwołań Codex GPT w konfiguracji; uruchom `openclaw doctor --fix`, aby
  naprawić starsze odwołania i nieaktualne przypięcia tras sesji.
- `agentRuntime.id: "codex"` sprawia, że Codex jest wymaganiem bez mechanizmu awaryjnego dla
  zgodnej trasy. Nie powoduje, że faktycznie używana niezgodna trasa staje się zgodna.
- `agentRuntime.id: "openclaw"` włącza dostawcę lub model do osadzonego
  środowiska uruchomieniowego OpenClaw, gdy jest to zamierzone.
- `/codex ...` steruje natywnymi konwersacjami serwera aplikacji Codex z poziomu czatu.
- ACP/acpx stanowi oddzielną ścieżkę zewnętrznej uprzęży. Używaj jej tylko wtedy, gdy użytkownik
  prosi o ACP/acpx lub adapter zewnętrznej uprzęży.

| Zamiar użytkownika                                         | Użycie                                                                                                 |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Dołączenie bieżącego czatu                                 | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| Wznowienie istniejącego wątku Codex                        | `/codex resume <thread-id>`                                                                           |
| Wyświetlenie lub filtrowanie wątków Codex                  | `/codex threads [filter]`                                                                             |
| Wyświetlenie natywnych pluginów Codex                      | `/codex plugins list`                                                                                 |
| Włączenie lub wyłączenie skonfigurowanego natywnego pluginu Codex | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Wznowienie zapisanej sesji CLI Codex jako tury sparowanego węzła | `/codex sessions --host <node> [filter]`, a następnie `/codex resume <session-id> --host <node> --bind here` |
| Wyświetlenie niezarchiwizowanych sesji Codex na różnych komputerach | Włącz nadzór Codex i otwórz **Sesje Codex**                                                  |
| Zmiana modelu, trybu szybkiego lub uprawnień powiązanego wątku | `/codex model <model>`, `/codex fast [on\|off\|status]`, `/codex permissions [default\|yolo\|status]` |
| Zatrzymanie aktywnej tury lub pokierowanie nią             | `/codex stop`, `/codex steer <text>`                                                                  |
| Odłączenie bieżącego powiązania                            | `/codex detach` (alias `/codex unbind`)                                                               |
| Wysłanie wyłącznie opinii o Codex                          | `/codex diagnostics [note]`                                                                           |
| Rozpoczęcie zadania ACP/acpx                               | Polecenia sesji ACP/acpx, a nie `/codex`                                                               |

| Przypadek użycia                                 | Konfiguracja                                                                                                 | Weryfikacja                              | Uwagi                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| Kwalifikująca się trasa OpenAI z natywnym środowiskiem Codex | Dokładna oficjalna trasa HTTPS Responses/ChatGPT bez jawnego nadpisania żądania oraz włączony plugin `codex` | `/status` wyświetla `Runtime: OpenAI Codex` | Ścieżka niejawna, gdy środowisko nie jest ustawione/ma wartość `auto` |
| Brak mechanizmu awaryjnego, jeśli Codex jest niedostępny | `agentRuntime.id: "codex"` dostawcy lub modelu                                                                | Tura kończy się niepowodzeniem zamiast użycia osadzonego mechanizmu awaryjnego | Używaj we wdrożeniach przeznaczonych wyłącznie dla Codex |
| Bezpośredni ruch z kluczem API OpenAI przez OpenClaw | `agentRuntime.id: "openclaw"` dostawcy lub modelu i standardowe uwierzytelnianie OpenAI                                      | `/status` wyświetla środowisko OpenClaw        | Używaj tylko wtedy, gdy OpenClaw jest zamierzonym wyborem |
| Starsza konfiguracja                            | starsze odwołania Codex GPT                                                                                 | `openclaw doctor --fix` przepisuje konfigurację     | Nie zapisuj nowej konfiguracji w ten sposób |
| Adapter Codex ACP/acpx                          | ACP `sessions_spawn({ runtime: "acp" })`                                                                    | Stan zadania/sesji ACP                  | Oddzielny od natywnej uprzęży Codex         |

`agents.defaults.imageModel` stosuje ten sam podział prefiksów. Użyj `openai/gpt-*`
dla standardowej trasy OpenAI, a `codex/gpt-*` tylko wtedy, gdy rozpoznawanie obrazu
powinno działać w ramach ograniczonej tury serwera aplikacji Codex. Doctor przepisuje starsze
odwołania Codex GPT na `openai/gpt-*`.

## Wzorce wdrożeń

### Podstawowe wdrożenie Codex

Użyj konfiguracji szybkiego startu dla modelu OpenAI, którego faktycznie używana oficjalna trasa
HTTPS kwalifikuje się do niejawnego wyboru Codex:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

### Wdrożenie z wieloma dostawcami

Zachowaj Claude jako domyślnego agenta i dodaj nazwanego agenta Codex:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-6",
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.6-sol",
      },
    ],
  },
}
```

Agent `main` używa swojej standardowej ścieżki dostawcy. Agent `codex` używa
serwera aplikacji Codex, dopóki jego faktycznie używana trasa OpenAI pozostaje zgodna; dodaj jawną
wartość `agentRuntime.id: "codex"` na poziomie modelu, gdy ma to być wymaganie
bez mechanizmu awaryjnego.

### Wdrożenie Codex bez mechanizmu awaryjnego

Kwalifikująca się, dokładna oficjalna trasa HTTPS OpenAI może zostać rozpoznana jako Codex, gdy
dostępny jest dołączony plugin. Dodaj jawną zasadę środowiska uruchomieniowego, aby zapisać
regułę bez mechanizmu awaryjnego:

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Gdy Codex jest wymuszony, OpenClaw wcześnie kończy działanie niepowodzeniem, jeśli faktycznie używana trasa nie jest zadeklarowana
jako zgodna z Codex, plugin jest wyłączony, serwer aplikacji jest zbyt stary albo
nie można go uruchomić.

## Zasady serwera aplikacji

Domyślnie plugin uruchamia lokalnie zarządzany przez OpenClaw plik binarny Codex z
transportem stdio. Ustaw `appServer.command` tylko w celu zamierzonego uruchomienia
innego pliku wykonywalnego. Używaj transportu WebSocket tylko wtedy, gdy serwer aplikacji
działa już w innym miejscu:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

Lokalne sesje serwera aplikacji stdio domyślnie przyjmują model zaufanego lokalnego operatora:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. Jeśli lokalne wymagania Codex nie zezwalają na ten
niejawny tryb YOLO, OpenClaw wybiera zamiast niego dozwolone uprawnienia Guardian.
Gdy dla sesji aktywna jest piaskownica OpenClaw, OpenClaw
wyłącza dla tej tury natywny Tryb kodu Codex, serwery MCP użytkownika oraz wykonywanie
pluginów opartych na aplikacjach, zamiast polegać na piaskownicy Codex po stronie hosta.
Dostęp do powłoki odbywa się zamiast tego za pośrednictwem dynamicznych narzędzi obsługiwanych przez
piaskownicę OpenClaw, takich jak `sandbox_exec` i `sandbox_process`, gdy standardowe narzędzia
exec/process są dostępne.

Użyj znormalizowanego trybu exec OpenClaw do natywnej automatycznej recenzji Codex przed
wyjściem poza piaskownicę lub przyznaniem dodatkowych uprawnień:

```json5
{
  tools: {
    exec: {
      mode: "auto",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

W przypadku sesji serwera aplikacji Codex `tools.exec.mode: "auto"` jest mapowane na zatwierdzenia
sprawdzane przez Codex Guardian: zwykle `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` oraz `sandbox: "workspace-write"`, gdy
lokalne wymagania zezwalają na te wartości. W trybie `tools.exec.mode: "auto"`
OpenClaw nie zachowuje starszych niebezpiecznych nadpisań Codex `approvalPolicy: "never"` ani
`sandbox: "danger-full-access"`; użyj `tools.exec.mode: "full"`, aby
celowo zastosować model Codex bez zatwierdzeń. Starsze ustawienie wstępne
`plugins.entries.codex.config.appServer.mode: "guardian"` nadal
działa, ale `tools.exec.mode: "auto"` jest znormalizowanym interfejsem OpenClaw.

Porównanie na poziomie trybów z zatwierdzeniami wykonywania na hoście i uprawnieniami
ACPX zawiera strona [Tryby uprawnień](/pl/tools/permission-modes). Wszystkie
pola serwera aplikacji, kolejność uwierzytelniania, izolację środowiska i zachowanie limitów czasu
opisano w [Dokumentacji uprzęży Codex](/pl/plugins/codex-harness-reference).

## Polecenia i diagnostyka

Plugin `codex` rejestruje `/codex` jako polecenie ukośnikowe na każdym kanale
obsługującym polecenia tekstowe OpenClaw.

Natywne wykonywanie i sterowanie wymaga właściciela lub klienta Gateway z uprawnieniem `operator.admin`:
wiąże lub wznawia wątki, wysyła lub zatrzymuje tury,
zmienia model, tryb szybki lub stan uprawnień, wykonuje kompaktowanie albo recenzję oraz
odłącza powiązanie. Inni autoryzowani nadawcy zachowują polecenia tylko do odczytu służące do sprawdzania
stanu, pomocy, konta, modelu, wątku, serwera MCP, Skills oraz powiązań.

Typowe formy:

- `/codex status` sprawdza łączność z serwerem aplikacji, modele, konto, limity
  szybkości, serwery MCP oraz Skills.
- `/codex models` wyświetla aktualne modele serwera aplikacji Codex.
- `/codex threads [filter]` wyświetla ostatnie wątki serwera aplikacji Codex.
- `/codex resume <thread-id>` dołącza bieżącą sesję OpenClaw do
  istniejącego wątku Codex.
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  dołącza bieżący czat.
- `/codex detach` (lub `/codex unbind`) odłącza bieżące powiązanie.
- `/codex binding` opisuje bieżące powiązanie.
- `/codex stop` zatrzymuje aktywną turę; `/codex steer <text>` nią kieruje.
- `/codex model <model>`, `/codex fast [on|off|status]` oraz
  `/codex permissions [default|yolo|status]` zmieniają stan poszczególnych konwersacji.
- `/codex compact` zleca serwerowi aplikacji Codex skompaktowanie dołączonego wątku.
- `/codex review` rozpoczyna natywną recenzję Codex dla dołączonego wątku.
- `/codex diagnostics [note]` prosi o potwierdzenie przed wysłaniem opinii o Codex dla
  dołączonego wątku.
- `/codex account` wyświetla stan konta i limitów szybkości.
- `/codex mcp` wyświetla stan serwerów MCP serwera aplikacji Codex.
- `/codex skills` wyświetla Skills serwera aplikacji Codex.
- `/codex plugins list`, `/codex plugins enable <name>` oraz
  `/codex plugins disable <name>` zarządzają skonfigurowanymi natywnymi pluginami Codex.
- `/codex computer-use [status|install]` zarządza funkcją Codex Computer Use.
- `/codex help` wyświetla pełne drzewo poleceń.

W przypadku większości zgłoszeń do pomocy technicznej zacznij od `/diagnostics [note]` w
konwersacji, w której wystąpił błąd. Spowoduje to utworzenie jednego raportu
diagnostycznego Gateway, a w przypadku sesji środowiska Codex — wyświetlenie prośby
o zgodę na wysłanie odpowiedniego pakietu opinii Codex. Model prywatności i zachowanie
na czacie grupowym opisano w sekcji
[Eksport diagnostyki](/pl/gateway/diagnostics). Użyj `/codex diagnostics [note]` tylko wtedy, gdy
potrzebne jest przesłanie opinii Codex dotyczących aktualnie dołączonego wątku bez
pełnego pakietu diagnostycznego Gateway.

### Lokalne sprawdzanie wątków Codex

Najszybszym sposobem zbadania nieprawidłowego przebiegu Codex jest często bezpośrednie
otwarcie natywnego wątku Codex:

```bash
codex resume <thread-id>
```

Identyfikator wątku można uzyskać z ukończonej odpowiedzi `/diagnostics`, `/codex binding`
lub `/codex threads [filter]`.

Mechanizm przesyłania i granice diagnostyki na poziomie środowiska uruchomieniowego opisano w sekcji
[Środowisko uruchomieniowe środowiska Codex](/pl/plugins/codex-harness-runtime#codex-feedback-upload).

### Kolejność uwierzytelniania

W domyślnym katalogu domowym przypisanym do agenta uwierzytelnianie jest wybierane w następującej kolejności:

1. Uporządkowane profile uwierzytelniania OpenAI dla agenta, najlepiej w
   `auth.order.openai`. Uruchom `openclaw doctor --fix`, aby zmigrować starsze, przestarzałe
   identyfikatory profili uwierzytelniania Codex i przestarzałą kolejność uwierzytelniania Codex.
2. Istniejące konto serwera aplikacji w katalogu domowym Codex tego agenta.
3. Tylko w przypadku lokalnych uruchomień serwera aplikacji przez stdio: `CODEX_API_KEY`, a następnie
   `OPENAI_API_KEY`, gdy konto serwera aplikacji nie istnieje, a uwierzytelnianie OpenAI
   jest nadal wymagane.

Gdy OpenClaw wykryje profil uwierzytelniania Codex oparty na subskrypcji ChatGPT,
usuwa `CODEX_API_KEY` i `OPENAI_API_KEY` z uruchomionego procesu potomnego Codex.
Dzięki temu klucze API na poziomie Gateway pozostają dostępne dla osadzania lub
bezpośrednich modeli OpenAI, a natywne operacje serwera aplikacji Codex nie są
przypadkowo rozliczane przez API. Jawne profile Codex z kluczem API oraz lokalny
mechanizm rezerwowy klucza ze środowiska dla stdio używają logowania serwera aplikacji
zamiast odziedziczonego środowiska procesu potomnego. Połączenia z serwerem aplikacji
przez WebSocket nie otrzymują rezerwowego klucza API ze środowiska Gateway; należy użyć
jawnego profilu uwierzytelniania lub własnego konta zdalnego serwera aplikacji.

Jeśli profil subskrypcji osiągnie limit użycia Codex, OpenClaw zapisuje czas
wyzerowania limitu, gdy Codex go zgłosi, i dla tego samego przebiegu Codex próbuje
użyć następnego uporządkowanego profilu uwierzytelniania. Po upływie czasu wyzerowania
profil subskrypcji ponownie staje się dostępny bez zmiany wybranego modelu
`openai/gpt-*` ani środowiska uruchomieniowego Codex.

Gdy skonfigurowane są natywne pluginy Codex, OpenClaw instaluje lub odświeża
je za pośrednictwem połączonego serwera aplikacji przed udostępnieniem wątkowi Codex
aplikacji należących do pluginów. `app/list` pozostaje źródłem prawdy o
identyfikatorach aplikacji, dostępności i metadanych, ale OpenClaw kontroluje decyzję
o włączeniu ich w poszczególnych wątkach: jeśli zasady zezwalają na wymienioną dostępną
aplikację, OpenClaw wysyła `thread/start.config.apps[appId].enabled = true`, nawet gdy `app/list`
zgłasza obecnie, że ta aplikacja jest wyłączona. Ta ścieżka nie tworzy instalacji
aplikacji dla nieznanych identyfikatorów; OpenClaw aktywuje wyłącznie pluginy z platformy
handlowej za pomocą `plugin/install`, a następnie odświeża wykaz.

### Izolacja środowiska

W przypadku lokalnych uruchomień serwera aplikacji przez stdio OpenClaw ustawia
`CODEX_HOME` na katalog przypisany do agenta, aby konfiguracja Codex, pliki
uwierzytelniania i konta, pamięć podręczna oraz dane pluginów, a także natywny stan
wątków domyślnie nie odczytywały ani nie zapisywały osobistego katalogu
`~/.codex` operatora. OpenClaw zachowuje standardową wartość procesu
`HOME`; podprocesy przebiegów Codex nadal mogą odnajdywać konfigurację
i tokeny z katalogu domowego użytkownika, a Codex może wykrywać współdzielone wpisy
`$HOME/.agents/skills` i `$HOME/.agents/plugins/marketplace.json`. W przypadku
`appServer.homeScope: "user"` OpenClaw używa zamiast tego natywnego katalogu domowego Codex
użytkownika i jego istniejącego konta bez wstrzykiwania profilu uwierzytelniania OpenClaw.

Jeśli wdrożenie wymaga dodatkowej izolacji środowiska, należy dodać te
zmienne do `appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` wpływa wyłącznie na uruchomiony proces potomny serwera aplikacji
Codex. Podczas normalizacji lokalnego uruchomienia OpenClaw usuwa z tej listy
`CODEX_HOME` i `HOME`: `CODEX_HOME` nadal wskazuje wybrany
zakres agenta lub użytkownika, a `HOME` pozostaje dziedziczone, aby podprocesy
mogły korzystać ze standardowego stanu katalogu domowego użytkownika.

### Narzędzia dynamiczne i wyszukiwanie w internecie

Narzędzia dynamiczne Codex domyślnie używają ładowania `searchable`. OpenClaw
zwykle nie udostępnia narzędzi dynamicznych, które powielają natywne operacje Codex
w obszarze roboczym: `read`, `write`, `edit`, `apply_patch`, `exec`, `process`, `update_plan`,
`tool_call`, `tool_describe`, `tool_search` i `tool_search_code`. Większość
pozostałych narzędzi integracyjnych OpenClaw, takich jak obsługa wiadomości, multimediów,
cron, przeglądarki, węzłów, Gateway i `heartbeat_respond`, jest dostępna przez
wyszukiwanie narzędzi Codex w przestrzeni nazw `openclaw`, co zmniejsza początkowy
kontekst modelu. Wyjątkiem jest rezerwowa powłoka dla ograniczonych operacji w przypadku
`exec` i `process`, gdy skończona lista dozwolonych elementów wyłącza natywny Code Mode;
nadal obowiązują listy dozwolonych elementów środowiska uruchomieniowego oraz `codexDynamicToolsExclude`.

Narzędzia oznaczone jako `catalogMode: "direct-only"`, w tym narzędzie OpenClaw
`computer`, używają zamiast tego przestrzeni nazw `openclaw_direct`. Codex
traktuje tę przestrzeń nazw jako `DirectModelOnly`, dzięki czemu narzędzia te pozostają
bezpośrednio widoczne dla modelu w zwykłych wątkach i wątkach działających wyłącznie
w trybie kodu, zamiast przechodzić przez zagnieżdżone wywołania Code Mode
`tools.*`.

Wyszukiwanie w internecie domyślnie używa hostowanego narzędzia Codex
`web_search`, gdy wyszukiwanie jest włączone i nie wybrano zarządzanego dostawcy.
Natywne wyszukiwanie hostowane i zarządzane narzędzie dynamiczne OpenClaw
`web_search` wzajemnie się wykluczają, aby zarządzane wyszukiwanie nie mogło
omijać natywnych ograniczeń domen. OpenClaw używa zarządzanego narzędzia, gdy
wyszukiwanie hostowane jest niedostępne, jawnie wyłączone lub zastąpione przez
wybranego zarządzanego dostawcę. OpenClaw utrzymuje samodzielne rozszerzenie Codex
`web.run` w stanie wyłączonym, ponieważ produkcyjny ruch serwera aplikacji
odrzuca jego definiowaną przez użytkownika przestrzeń nazw `web`.
`tools.web.search.enabled: false` wyłącza obie ścieżki, podobnie jak przebiegi wyłącznie LLM
z wyłączonymi narzędziami. Codex traktuje `"cached"` jako preferencję
i przekształca ją w bieżący dostęp zewnętrzny dla nieograniczonych operacji serwera
aplikacji. Automatyczny zarządzany mechanizm rezerwowy kończy się bezpiecznie
niepowodzeniem, gdy ustawione są natywne `allowedDomains`, aby nie można było
ominąć listy dozwolonych elementów. Trwałe zmiany obowiązujących zasad wyszukiwania
powodują zmianę powiązanego wątku Codex przed następną operacją; przejściowe
ograniczenia poszczególnych operacji używają tymczasowego ograniczonego wątku
i zachowują istniejące powiązanie na potrzeby późniejszego wznowienia.

`sessions_yield` i odpowiedzi ze źródła używające wyłącznie narzędzia wiadomości
pozostają bezpośrednie, ponieważ są to kontrakty sterowania operacją. `sessions_spawn`
pozostaje dostępne do wyszukiwania, dzięki czemu natywne `spawn_agent` Codex
pozostaje podstawową powierzchnią podagentów Codex, natomiast jawne delegowanie przez
OpenClaw lub ACP jest nadal dostępne w przestrzeni nazw narzędzi dynamicznych
`openclaw`. Instrukcje współpracy Heartbeat nakazują Codex wyszukanie
`heartbeat_respond` przed zakończeniem operacji Heartbeat, jeśli narzędzie nie jest
jeszcze załadowane.

Ustaw `codexDynamicToolsLoading: "direct"` tylko podczas łączenia z niestandardowym
serwerem aplikacji Codex, który nie może wyszukiwać odroczonych narzędzi dynamicznych,
lub podczas debugowania pełnego ładunku narzędzi.

### Pola konfiguracji

Obsługiwane pola najwyższego poziomu pluginu Codex:

| Pole                       | Wartość domyślna | Znaczenie                                                                                |
| -------------------------- | ---------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Użyj `"direct"`, aby umieścić narzędzia dynamiczne OpenClaw bezpośrednio w początkowym kontekście narzędzi Codex. |
| `codexDynamicToolsExclude` | `[]`           | Dodatkowe nazwy narzędzi dynamicznych OpenClaw pomijanych w operacjach serwera aplikacji Codex. |
| `codexPlugins`             | wyłączone       | Natywna obsługa pluginów i aplikacji Codex dla zmigrowanych, wyselekcjonowanych pluginów zainstalowanych ze źródła. |
| `sessionCatalog`           | włączone        | Wykrywanie na pasku bocznym natywnych sesji Codex na tym Gateway i kwalifikujących się sparowanych węzłach. |
| `supervision`              | wyłączone       | Dostępne dla agenta zasady transkrypcji natywnych sesji i kontroli zapisu.                |

Obsługiwane pola `appServer`:

| Pole                                         | Domyślnie                                                | Znaczenie                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` uruchamia Codex; jawne `"unix"` łączy się z lokalnym gniazdem sterującym; `"websocket"` łączy się z `url`.                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` izoluje zwykły stan środowiska testowego dla każdego agenta OpenClaw. `"user"` to jawna opcja wymagająca włączenia, która współdzieli natywne `$CODEX_HOME` lub `~/.codex`, używa natywnego uwierzytelniania i umożliwia zarządzanie wątkami wyłącznie właścicielowi. Zakres użytkownika obsługuje lokalny transport stdio lub Unix. Dla oddzielnego połączenia nadzorczego nieustawiona wartość jest rozpoznawana jako `"user"` dla stdio lub Unix oraz `"agent"` dla WebSocket.     |
| `command`                                     | zarządzany plik binarny Codex                                   | Plik wykonywalny dla transportu stdio. Należy pozostawić nieustawione, aby użyć zarządzanego pliku binarnego; ustawiać wyłącznie w celu jawnego nadpisania.                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumenty transportu stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | nieustawione                                                  | Adres URL serwera aplikacji WebSocket lub adres URL `unix://`. Jawnie podana pusta ścieżka Unix wybiera kanoniczne gniazdo sterujące w katalogu domowym użytkownika.                                                                                                                                                                                                                                                                          |
| `authToken`                                   | nieustawione                                                  | Token Bearer dla transportu WebSocket. Akceptuje ciąg literałów lub SecretInput, na przykład `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Dodatkowe nagłówki WebSocket. Wartości nagłówków akceptują ciągi literałów lub wartości SecretInput, na przykład `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Dodatkowe nazwy zmiennych środowiskowych usuwane z uruchomionego procesu serwera aplikacji stdio po utworzeniu przez OpenClaw dziedziczonego środowiska. W przypadku uruchomień lokalnych OpenClaw zachowuje wybrane `CODEX_HOME` i odziedziczone `HOME`.                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | Włącza powierzchnię narzędzi Codex ograniczoną wyłącznie do trybu kodu. Zwykłe dynamiczne narzędzia OpenClaw pozostają dostępne przez zagnieżdżone wywołania `tools.*`; narzędzia `openclaw_direct` pozostają bezpośrednio widoczne dla modelu.                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | nieustawione                                                  | Katalog główny obszaru roboczego zdalnego serwera aplikacji Codex. Po ustawieniu OpenClaw wyznacza lokalny katalog główny obszaru roboczego na podstawie rozpoznanego obszaru roboczego OpenClaw, zachowuje bieżący sufiks cwd w tym zdalnym katalogu głównym i wysyła do Codex wyłącznie końcowy cwd serwera aplikacji. Jeśli cwd znajduje się poza rozpoznanym katalogiem głównym obszaru roboczego OpenClaw, OpenClaw odmawia działania zamiast wysyłać lokalną ścieżkę Gateway do zdalnego serwera aplikacji. |
| `requestTimeoutMs`                            | `60000`                                                | Limit czasu wywołań płaszczyzny sterowania serwera aplikacji.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Okres ciszy po zaakceptowaniu tury przez Codex lub po żądaniu serwera aplikacji ograniczonym do tury, podczas którego OpenClaw oczekuje na `turn/completed`.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Zabezpieczenie bezczynności po ukończeniu i postępu używane po przekazaniu narzędzia, ukończeniu działania natywnego narzędzia, nieprzetworzonym postępie asystenta po użyciu narzędzia, ukończeniu nieprzetworzonego rozumowania lub postępie rozumowania, gdy OpenClaw oczekuje na `turn/completed`. Należy go używać w przypadku zaufanych lub wymagających obciążeń, w których synteza po użyciu narzędzia może zasadnie pozostawać bezczynna dłużej niż budżet na końcową odpowiedź asystenta.                                |
| `mode`                                        | `"yolo"`, chyba że lokalne wymagania Codex nie zezwalają na YOLO | Ustawienie wstępne wykonywania w trybie YOLO lub pod nadzorem strażnika. Lokalne wymagania stdio, które pomijają `danger-full-access`, zatwierdzanie `never` lub recenzenta `user`, powodują, że domyślnym trybem niejawnym jest strażnik.                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` lub dozwolona polityka zatwierdzania przez strażnika       | Natywna polityka zatwierdzania Codex wysyłana podczas uruchamiania, wznawiania lub tury wątku. Wartości domyślne strażnika preferują `"on-request"`, gdy jest dozwolone.                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` lub dozwolona piaskownica strażnika  | Natywny tryb piaskownicy Codex wysyłany podczas uruchamiania lub wznawiania wątku. Wartości domyślne strażnika preferują `"workspace-write"`, gdy jest dozwolone, a w przeciwnym razie `"read-only"`. Gdy piaskownica OpenClaw jest aktywna, tury `danger-full-access` używają `workspace-write` Codex z dostępem do sieci wynikającym z ustawienia ruchu wychodzącego piaskownicy OpenClaw.                                                                                     |
| `approvalsReviewer`                           | `"user"` lub dozwolony recenzent strażnika               | Należy użyć `"auto_review"`, aby umożliwić Codex ocenę natywnych monitów zatwierdzania, gdy jest to dozwolone; w przeciwnym razie `guardian_subagent` lub `user`. `guardian_subagent` pozostaje starszym aliasem.                                                                                                                                                                                                                              |
| `serviceTier`                                 | nieustawione                                                  | Opcjonalny poziom usługi serwera aplikacji Codex. `"priority"` włącza kierowanie w trybie szybkim, `"flex"` żąda przetwarzania elastycznego, `null` usuwa nadpisanie, a starsze `"fast"` jest akceptowane jako `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | wyłączone                                               | Włącza obsługę sieci przez profil uprawnień Codex dla poleceń serwera aplikacji. OpenClaw definiuje wybraną konfigurację `permissions.<profile>.network` i wybiera ją za pomocą `default_permissions` zamiast wysyłać `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Opcja podglądowa, która rejestruje środowisko Codex oparte na piaskownicy OpenClaw w obsługiwanym serwerze aplikacji Codex, dzięki czemu natywne wykonywanie Codex może działać wewnątrz aktywnej piaskownicy OpenClaw.                                                                                                                                                                                                            |

`appServer.networkProxy` jest jawne, ponieważ zmienia kontrakt piaskownicy
Codex. Po włączeniu OpenClaw ustawia również `features.network_proxy.enabled`
i `default_permissions` w konfiguracji wątku Codex, aby wygenerowany
profil uprawnień mógł uruchomić zarządzaną przez Codex obsługę sieci. Domyślnie OpenClaw
generuje odporną na kolizje nazwę profilu `openclaw-network-<fingerprint>`
na podstawie treści profilu; `profileName` należy używać tylko wtedy, gdy wymagana
jest stabilna nazwa lokalna.

```json5
{
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
}
```

Jeśli normalnym środowiskiem uruchomieniowym serwera aplikacji byłoby `danger-full-access`, włączenie
`networkProxy` używa dostępu do systemu plików w stylu obszaru roboczego dla wygenerowanego
profilu uprawnień: zarządzane przez Codex egzekwowanie zasad sieciowych odbywa się w sieci
piaskownicy, dlatego profil z pełnym dostępem nie chroniłby ruchu wychodzącego.
Wpisy domen używają `allow` lub `deny`; wpisy gniazd Unix używają wartości Codex
`allow` lub `none`.

### Limity czasu dynamicznych wywołań narzędzi

Dynamiczne wywołania narzędzi należących do OpenClaw są ograniczane niezależnie od
`appServer.requestTimeoutMs`: żądania Codex `item/tool/call` domyślnie korzystają z 90-sekundowego
mechanizmu nadzorującego OpenClaw. Dodatni argument `timeoutMs` dla poszczególnego wywołania
wydłuża lub skraca budżet tego konkretnego narzędzia, maksymalnie do 600000 ms.
Narzędzie `image_generate` używa `agents.defaults.imageGenerationModel.timeoutMs`,
gdy wywołanie narzędzia nie podaje własnego limitu czasu, a w przeciwnym razie domyślnego
120-sekundowego limitu generowania obrazów. Narzędzie analizy multimediów `image`
używa `tools.media.image.timeoutSeconds` lub własnego domyślnego 60-sekundowego limitu dla multimediów;
w przypadku analizy obrazów limit ten dotyczy samego żądania i nie jest
pomniejszany o czas wcześniejszych prac przygotowawczych. Po przekroczeniu limitu czasu OpenClaw przerywa sygnał
narzędzia, jeśli jest to obsługiwane, i zwraca do Codex odpowiedź o niepowodzeniu narzędzia dynamicznego,
aby tura mogła być kontynuowana zamiast pozostawienia sesji w stanie `processing`.
Ten mechanizm nadzorujący stanowi zewnętrzny dynamiczny budżet `item/tool/call`; limity czasu
żądań specyficzne dla dostawcy działają wewnątrz tego wywołania i zachowują własną semantykę limitów czasu.

Po przyjęciu tury przez Codex oraz po odpowiedzi OpenClaw na żądanie serwera aplikacji
ograniczone do tury mechanizm oczekuje, że Codex poczyni postęp w bieżącej turze
i ostatecznie zakończy natywną turę przez `turn/completed`. Jeśli
serwer aplikacji pozostaje bezczynny przez `appServer.turnCompletionIdleTimeoutMs`, OpenClaw
podejmuje próbę przerwania tury Codex, rejestruje diagnostyczne przekroczenie limitu czasu i
zwalnia tor sesji OpenClaw, aby kolejne wiadomości czatu nie były
kolejkowane za nieaktualną natywną turą. Większość niekońcowych powiadomień dla
tej samej tury rozbraja ten krótki mechanizm nadzorujący, ponieważ Codex potwierdził, że tura
jest nadal aktywna.

Przekazania do narzędzi używają dłuższego budżetu bezczynności po narzędziu: po zwróceniu przez OpenClaw
odpowiedzi `item/tool/call`, po zakończeniu natywnych elementów narzędzi, takich jak
`commandExecution`, po surowych zakończeniach `custom_tool_call_output`
oraz po surowym postępie asystenta po narzędziu, surowych zakończeniach
rozumowania lub postępie rozumowania. Zabezpieczenie używa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`, gdy jest skonfigurowane,
a w przeciwnym razie domyślnie pięciu minut; ten sam budżet wydłuża również
mechanizm nadzorowania postępu na czas cichego okna syntezy, zanim Codex wyemituje
następne zdarzenie bieżącej tury. Globalne powiadomienia serwera aplikacji, takie jak
aktualizacje limitów szybkości, nie resetują postępu bezczynności tury. Zakończenia rozumowania,
zakończenia komentarza `agentMessage` oraz surowy postęp rozumowania lub
asystenta przed narzędziem mogą poprzedzać automatyczną odpowiedź końcową, dlatego używają
zabezpieczenia odpowiedzi po postępie zamiast natychmiast zwalniać tor sesji.

Tylko ukończone końcowe/niebędące komentarzem elementy `agentMessage` i surowe
zakończenia asystenta przed narzędziem uzbrajają zwolnienie po wyjściu asystenta: jeśli Codex następnie
pozostaje bezczynny bez `turn/completed`, OpenClaw podejmuje próbę przerwania natywnej
tury i zwalnia tor sesji. Jeśli inny mechanizm nadzoru tury wygra ten wyścig
o zwolnienie, OpenClaw nadal przyjmuje ukończony końcowy element asystenta, gdy żadne
natywne żądanie, element ani zakończenie narzędzia dynamicznego nie pozostaje aktywne, a
zwolnienie po wyjściu asystenta nadal należy do ostatniego ukończonego elementu i
nie nastąpiło późniejsze ukończenie elementu. Pozwala to zachować odpowiedź końcową po
ukończonej pracy narzędzia bez ponownego odtwarzania tury. Częściowe delty asystenta,
nieaktualne wcześniejsze odpowiedzi i puste późniejsze zakończenia nie spełniają warunków.

Bezpieczne do ponownego odtworzenia awarie serwera aplikacji stdio, w tym przekroczenia limitu
bezczynności ukończenia tury bez dowodów działania asystenta, narzędzia, aktywnego elementu
lub skutków ubocznych, są ponawiane raz w ramach nowej próby serwera aplikacji. Niebezpieczne
przekroczenia limitu nadal wycofują zablokowanego klienta serwera aplikacji i zwalniają tor
sesji OpenClaw; usuwają też nieaktualne powiązanie natywnego wątku zamiast automatycznego
ponownego odtwarzania. Przekroczenia limitu mechanizmu nadzoru ukończenia wyświetlają tekst
limitu czasu specyficzny dla Codex: przypadki bezpieczne do ponownego odtworzenia informują,
że odpowiedź może być niepełna, natomiast przypadki niebezpieczne polecają zweryfikować
bieżący stan przed ponowieniem. Publiczna diagnostyka limitu czasu zawiera pola strukturalne,
takie jak metoda ostatniego powiadomienia serwera aplikacji, identyfikator/typ/rola elementu
surowej odpowiedzi asystenta, liczby aktywnych żądań/elementów i stan uzbrojonego mechanizmu
nadzoru; gdy ostatnim powiadomieniem jest element surowej odpowiedzi asystenta, zawiera również
ograniczony podgląd tekstu asystenta. Nie zawiera surowej treści monitu ani narzędzia.

### Lokalne nadpisania środowiska testowego

- `OPENCLAW_CODEX_APP_SERVER_BIN` pomija zarządzany plik binarny, gdy
  `appServer.command` nie jest ustawione.
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` zostało usunięte. Zamiast niego należy użyć
`plugins.entries.codex.config.appServer.mode: "guardian"` albo
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowych testów lokalnych. Konfiguracja
jest preferowana w przypadku powtarzalnych wdrożeń, ponieważ zachowuje zachowanie pluginu
w tym samym zweryfikowanym pliku co pozostała konfiguracja mechanizmu Codex.

## Natywne pluginy Codex

Obsługa natywnych pluginów Codex korzysta z własnych możliwości aplikacji i pluginów
serwera aplikacji Codex w tym samym wątku Codex co tura mechanizmu OpenClaw. OpenClaw
nie przekształca pluginów Codex w syntetyczne dynamiczne narzędzia OpenClaw
`codex_plugin_*`.

`codexPlugins` wpływa tylko na sesje wybierające natywny mechanizm Codex.
Nie ma wpływu na uruchomienia wbudowanego mechanizmu, zwykłe uruchomienia dostawcy OpenAI, powiązania
konwersacji ACP ani inne mechanizmy.

Minimalna zmigrowana konfiguracja:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

Konfiguracja aplikacji wątku jest obliczana, gdy OpenClaw ustanawia sesję mechanizmu
Codex lub zastępuje nieaktualne powiązanie wątku Codex; nie jest obliczana ponownie przy
każdej turze. Po zmianie `codexPlugins` należy użyć `/new`, `/reset` lub ponownie uruchomić
Gateway, aby przyszłe sesje mechanizmu Codex rozpoczynały się ze zaktualizowanym
zestawem aplikacji.

Informacje o kwalifikowaniu do migracji, spisie aplikacji, zasadach działań destrukcyjnych,
pozyskiwaniu danych od użytkownika i diagnostyce natywnych pluginów zawiera strona
[Natywne pluginy Codex](/pl/plugins/codex-native-plugins).

Dostęp do aplikacji i pluginów po stronie OpenAI jest kontrolowany przez zalogowane
konto Codex, a w przypadku obszarów roboczych Business i Enterprise/Edu również przez
ustawienia aplikacji obszaru roboczego. Ogólne informacje OpenAI o koncie i ustawieniach
obszaru roboczego zawiera strona
[Korzystanie z Codex w ramach planu ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Computer Use

Computer Use ma własny przewodnik konfiguracji:
[Codex Computer Use](/pl/plugins/codex-computer-use).

W skrócie: OpenClaw nie dostarcza aplikacji do sterowania pulpitem ani samodzielnie nie wykonuje
działań na pulpicie. Przygotowuje serwer aplikacji Codex, sprawdza dostępność serwera MCP
`computer-use`, a następnie pozwala Codex obsługiwać natywne
wywołania narzędzi MCP podczas tur w trybie Codex.

## Granice środowiska uruchomieniowego

Mechanizm Codex zmienia wyłącznie niskopoziomowy, osadzony moduł wykonawczy agenta.

- Dynamiczne narzędzia OpenClaw są obsługiwane. Codex zleca OpenClaw wykonanie
  tych narzędzi, więc OpenClaw pozostaje w ścieżce wykonania.
- Natywne narzędzia powłoki, poprawek, MCP i aplikacji Codex należą do Codex.
  OpenClaw może obserwować lub blokować wybrane zdarzenia natywne za pomocą
  obsługiwanego przekaźnika, ale nie przepisuje argumentów natywnych narzędzi.
- Codex odpowiada za natywne Compaction. OpenClaw przechowuje kopię transkrypcji na potrzeby
  historii kanału, wyszukiwania, `/new`, `/reset` oraz przyszłej zmiany modelu lub
  mechanizmu, ale nie zastępuje Compaction Codex podsumowywaniem OpenClaw ani
  silnika kontekstu.
- Generowanie i analiza multimediów, TTS, zatwierdzenia oraz wyjście narzędzia
  wiadomości nadal korzystają z odpowiednich ustawień dostawcy/modelu OpenClaw.
- `tool_result_persist` dotyczy wyników narzędzi transkrypcji należących do OpenClaw,
  a nie natywnych rekordów wyników narzędzi Codex.

Informacje o warstwach haków, obsługiwanych powierzchniach V1, natywnej obsłudze uprawnień,
sterowaniu kolejką, mechanizmach przesyłania opinii Codex i szczegółach Compaction zawiera strona
[Środowisko uruchomieniowe mechanizmu Codex](/pl/plugins/codex-harness-runtime).

## Rozwiązywanie problemów

**Codex nie jest widoczny jako zwykły dostawca `/model`:** jest to oczekiwane w nowych
konfiguracjach. Należy wybrać model `openai/gpt-*`, włączyć
`plugins.entries.codex.enabled` i sprawdzić, czy `plugins.allow` nie wyklucza
`codex`.

**OpenClaw używa wbudowanego mechanizmu zamiast Codex:** należy potwierdzić, że obowiązująca
trasa jest dokładną oficjalną trasą HTTPS Platform Responses lub ChatGPT Responses,
nie ma utworzonego nadpisania żądania oraz że plugin Codex jest zainstalowany i
włączony. Sam prefiks `openai/gpt-*` nie wystarcza. Aby uzyskać ścisłe potwierdzenie podczas
testowania, należy ustawić `agentRuntime.id: "codex"` dostawcy lub modelu; wymuszony Codex zgłasza
błąd zamiast przechodzić na rozwiązanie zapasowe, gdy trasa lub mechanizm są niezgodne.

**Środowisko uruchomieniowe OpenAI Codex przechodzi na ścieżkę klucza API:** należy zebrać
zanonimizowany fragment dziennika Gateway pokazujący model, środowisko uruchomieniowe, wybranego dostawcę
i błąd. Współpracowników, których dotyczy problem, należy poprosić o uruchomienie tego polecenia
tylko do odczytu na hoście OpenClaw:

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

Przydatne fragmenty zwykle zawierają `openai/gpt-5.6-sol` lub `openai/gpt-5.6-luna`,
`Runtime: OpenAI Codex`, `agentRuntime.id` lub `harnessRuntime`,
`candidateProvider: "openai"` oraz wynik `401`, `Incorrect API key` lub
`No API key`. Poprawione uruchomienie powinno pokazywać ścieżkę OAuth OpenAI
zamiast zwykłego błędu klucza API OpenAI.

**Pozostała konfiguracja odwołań do starszych modeli Codex:** należy uruchomić `openclaw doctor --fix`.
Doctor przepisuje starsze odwołania do modeli na `openai/*`, usuwa nieaktualne przypięcia
środowiska uruchomieniowego sesji i całego agenta oraz zachowuje istniejące nadpisania profilu uwierzytelniania.

**Serwer aplikacji jest odrzucany:** należy użyć serwera aplikacji Codex `0.143.0` lub nowszego.
Wersje przedpremierowe o tym samym numerze lub wersje z przyrostkiem kompilacji, takie jak
`0.143.0-alpha.2` lub `0.143.0+custom`, są odrzucane, ponieważ OpenClaw sprawdza
stabilny minimalny poziom protokołu `0.143.0`.

**`/codex status` nie może się połączyć:** sprawdź, czy Plugin `codex`
jest włączony, czy `plugins.allow` go uwzględnia, gdy skonfigurowano listę
dozwolonych elementów, oraz czy niestandardowe `appServer.command`, `url`, `authToken` lub
nagłówki są prawidłowe.

**Wykrywanie modeli działa wolno:** zmniejsz wartość
`plugins.entries.codex.config.discovery.timeoutMs` lub wyłącz wykrywanie.
Zobacz [Dokumentacja uprzęży Codex](/pl/plugins/codex-harness-reference#model-discovery).

**Transport WebSocket natychmiast przestaje działać:** sprawdź `appServer.url`,
`authToken`, nagłówki oraz czy zdalny serwer aplikacji używa tej samej wersji
protokołu serwera aplikacji Codex.

**Natywne narzędzia powłoki lub łatek są blokowane komunikatem `Native hook relay
unavailable`:** wątek Codex nadal próbuje używać
identyfikatora natywnego przekaźnika hooków, który nie jest już zarejestrowany
w OpenClaw. Jest to problem z transportem natywnych hooków Codex, a nie awaria
backendu ACP, dostawcy, GitHub ani polecenia powłoki. Rozpocznij nową sesję
w czacie, którego dotyczy problem, za pomocą `/new` lub `/reset`,
a następnie ponów nieszkodliwe polecenie. Jeśli zadziała ono raz, ale następne
wywołanie natywnego narzędzia ponownie się nie powiedzie, traktuj `/new`
wyłącznie jako tymczasowe obejście: skopiuj prompt do nowej sesji po ponownym
uruchomieniu serwera aplikacji Codex lub Gateway OpenClaw, aby stare wątki
zostały usunięte, a rejestracje natywnych hooków utworzone ponownie.

**Wywołania narzędzi Codex tworzą zbyt wiele krótkotrwałych procesów hooków:** ustaw
`plugins.entries.codex.config.appServer.loopDetectionPreToolUseRelay: false`
i ponownie uruchom Gateway. Wyłącza to jedynie podproces Codex `PreToolUse`
używany do wykrywania pętli OpenClaw oraz jego znacznik braku zasad. Wymagane
`before_tool_call` i przekaźniki zasad zaufanych narzędzi pozostają włączone.

**Model inny niż Codex używa wbudowanej uprzęży:** jest to oczekiwane, chyba że
zasady środowiska uruchomieniowego dostawcy lub modelu kierują go do innej
uprzęży. Zwykłe odwołania do dostawców innych niż OpenAI pozostają na swojej
standardowej ścieżce dostawcy w trybie `auto`.

**Computer Use jest zainstalowane, ale narzędzia nie działają:** sprawdź
`/codex computer-use status` w nowej sesji. Jeśli narzędzie zgłasza
`Native hook relay unavailable`, zastosuj opisaną wyżej procedurę odzyskiwania natywnego przekaźnika hooków.
Zobacz [Codex Computer Use](/pl/plugins/codex-computer-use#troubleshooting).

## Powiązane

- [Dokumentacja uprzęży Codex](/pl/plugins/codex-harness-reference)
- [Środowisko uruchomieniowe uprzęży Codex](/pl/plugins/codex-harness-runtime)
- [Nadzór Codex](/plugins/codex-supervision)
- [Natywne pluginy Codex](/pl/plugins/codex-native-plugins)
- [Codex Computer Use](/pl/plugins/codex-computer-use)
- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Dostawca OpenAI](/pl/providers/openai)
- [Pomoc dotycząca OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Pluginy uprzęży agentów](/pl/plugins/sdk-agent-harness)
- [Hooki Pluginów](/pl/plugins/hooks)
- [Eksport diagnostyki](/pl/gateway/diagnostics)
- [Stan](/pl/cli/status)
- [Testowanie](/pl/help/testing-live#live-codex-app-server-harness-smoke)
