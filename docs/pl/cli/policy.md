---
read_when:
    - Chcesz sprawdzić ustawienia OpenClaw względem przygotowanego pliku policy.jsonc
    - Chcesz ustaleń dotyczących zasad w doctor lint
    - Potrzebujesz skrótu atestacji zasad jako dowodu audytowego
summary: Dokumentacja referencyjna CLI dla kontroli zgodności `openclaw policy`
title: Zasady
x-i18n:
    generated_at: "2026-06-27T17:22:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5af65bb34aeed72bbb348a56195d65152dce1e8d0e7236da8d8681e56c9b32f4
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` jest dostarczane przez dołączany Plugin Policy. Policy jest
warstwą zgodności korporacyjnej nałożoną na istniejące ustawienia OpenClaw. Nie dodaje
drugiego systemu konfiguracji. `policy.jsonc` definiuje autorskie wymagania,
OpenClaw obserwuje aktywny obszar roboczy jako dowód, a kontrole kondycji polityk
zgłaszają dryf przez `doctor --lint`. Ostatecznym sygnałem zgodności jest czyste
uruchomienie `doctor --lint`; polityka wnosi ustalenia do tej współdzielonej powierzchni lintowania
zamiast tworzyć osobną bramkę kondycji.

Policy obecnie zarządza skonfigurowanymi kanałami, serwerami MCP, dostawcami modeli,
postawą sieciową SSRF, postawą dostępu przychodzącego/kanałowego, postawą ekspozycji Gateway, postawą obszaru roboczego agentów,
postawą obsługi danych, postawą dostawcy sekretów/profilu uwierzytelniania konfiguracji OpenClaw oraz zarządzanymi
deklaracjami narzędzi. Na przykład dział IT lub operator obszaru roboczego może odnotować, że Telegram
nie jest zatwierdzonym dostawcą kanału, ograniczyć serwery MCP i odwołania do modeli do
zatwierdzonych wpisów, wymagać, aby dostęp fetch/przeglądarkowy do sieci prywatnej pozostał
wyłączony, wymagać, aby izolacja sesji wiadomości bezpośrednich i postawa wejścia kanału
pozostawały w zweryfikowanych granicach, wymagać, aby wiązanie/uwierzytelnianie/ekspozycja HTTP Gateway pozostawały w zweryfikowanych
granicach, wymagać, aby dostęp agenta do obszaru roboczego i odmowy narzędzi pozostawały w zweryfikowanej
postawie, wymagać, aby SecretRefs konfiguracji OpenClaw używały zarządzanych dostawców, wymagać, aby
profile uwierzytelniania konfiguracji zawierały metadane dostawcy/trybu, wymagać, aby zarządzane narzędzia
zawierały metadane ryzyka i wrażliwości, wymagać redakcji wrażliwego logowania, zabronić
przechwytywania treści telemetrycznych, wymagać konserwacji retencji sesji, zabronić indeksowania pamięci
transkryptów sesji, a następnie używać `doctor --lint` jako współdzielonej
bramki zgodności.

Używaj polityki, gdy obszar roboczy potrzebuje trwałego oświadczenia, takiego jak „te kanały
nie mogą być włączone” albo „zarządzane narzędzia muszą deklarować metadane zatwierdzenia”, oraz
powtarzalnego sposobu udowodnienia, że OpenClaw nadal spełnia to oświadczenie. Używaj
samej zwykłej konfiguracji i dokumentacji obszaru roboczego, gdy potrzebujesz wyłącznie lokalnego zachowania i
nie potrzebujesz ustaleń polityki ani danych wyjściowych poświadczenia.

## Szybki start

Włącz dołączany Plugin Policy przed pierwszym użyciem:

```bash
openclaw plugins enable policy
```

Gdy polityka jest włączona, doctor może ładować kontrole kondycji polityki bez aktywowania
dowolnych pluginów. Plugin pozostaje włączony, jeśli brakuje `policy.jsonc`, aby
doctor mógł zgłosić brakujący artefakt.

Polityka jest tworzona autorsko, a nie generowana z bieżących ustawień użytkownika. Minimalna
polityka dla kanałów, serwerów MCP, dostawców modeli, postawy sieciowej, dostępu przychodzącego/kanałowego, ekspozycji Gateway,
postawy obszaru roboczego agentów, skonfigurowanej postawy środowiska uruchomieniowego piaskownicy, postawy obsługi danych
OpenClaw, postawy dostawcy sekretów/profilu uwierzytelniania konfiguracji, postawy pliku zatwierdzeń exec
i metadanych narzędzi wygląda tak:

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "Telegram is not approved for this workspace.",
      },
    ],
  },
  "mcp": {
    "servers": {
      "allow": ["docs"],
      "deny": ["untrusted"],
    },
  },
  "models": {
    "providers": {
      "allow": ["openai", "anthropic"],
      "deny": ["openrouter"],
    },
  },
  "network": {
    "privateNetwork": {
      "allow": false,
    },
  },
  "ingress": {
    "session": {
      "requireDmScope": "per-channel-peer",
    },
    "channels": {
      "allowDmPolicies": ["pairing", "allowlist", "disabled"],
      "denyOpenGroups": true,
      "requireMentionInGroups": true,
    },
  },
  "gateway": {
    "exposure": {
      "allowNonLoopbackBind": false,
      "allowTailscaleFunnel": false,
    },
    "auth": {
      "requireAuth": true,
      "requireExplicitRateLimit": true,
    },
    "controlUi": {
      "allowInsecure": false,
    },
    "remote": {
      "allow": false,
    },
    "http": {
      "denyEndpoints": ["chatCompletions", "responses"],
      "requireUrlAllowlists": true,
    },
  },
  "agents": {
    "workspace": {
      "allowedAccess": ["none", "ro"],
      "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
    },
  },
  "dataHandling": {
    "sensitiveLogging": {
      "requireRedaction": true,
    },
    "telemetry": {
      "denyContentCapture": true,
    },
    "retention": {
      "requireSessionMaintenance": true,
    },
    "memory": {
      "denySessionTranscriptIndexing": true,
    },
  },
  "secrets": {
    "requireManagedProviders": true,
    "denySources": ["exec"],
    "allowInsecureProviders": false,
  },
  "auth": {
    "profiles": {
      "requireMetadata": ["provider", "mode"],
      "allowModes": ["api_key", "token"],
    },
  },
  "execApprovals": {
    "requireFile": true,
    "defaults": { "allowSecurity": ["deny"] },
    "agents": {
      "allowSecurity": ["deny", "allowlist"],
      "allowAutoAllowSkills": false,
      "allowlist": { "expected": ["deploy", "status"] },
    },
  },
  "tools": {
    "requireMetadata": ["risk", "sensitivity", "owner"],
    "profiles": {
      "allow": ["messaging", "minimal"],
    },
    "fs": {
      "requireWorkspaceOnly": true,
    },
    "exec": {
      "allowSecurity": ["deny", "allowlist"],
      "requireAsk": ["always"],
      "allowHosts": ["sandbox"],
    },
    "elevated": {
      "allow": false,
    },
    "denyTools": ["group:runtime", "group:fs"],
  },
}
```

Reguły są źródłem prawdy. Blok kategorii jest tylko przestrzenią nazw; kontrole uruchamiają się,
gdy obecna jest konkretna reguła. OpenClaw odczytuje bieżące ustawienia `channels.*`,
`mcp.servers.*`, `models.providers.*`, wybrane odwołania modeli agentów, ustawienia sieciowe SSRF,
zakres sesji wiadomości bezpośrednich, politykę DM kanału, politykę grup kanału,
bramki wzmianek kanału/grupy, postawę wiązania/uwierzytelniania/Control UI/Tailscale/remote/HTTP
Gateway, postawę dostępu agenta konfiguracji OpenClaw do obszaru roboczego piaskownicy i odmów narzędzi,
postawę konfiguracji obsługi danych, pochodzenie dostawcy sekretów
konfiguracji i SecretRef, metadane profilu uwierzytelniania konfiguracji, skonfigurowaną
globalną/per-agentową postawę narzędzi oraz deklaracje `TOOLS.md` jako dowód, a następnie
zgłasza zaobserwowany stan, który nie jest zgodny. Jeśli polityka zabrania wiązań Gateway innych niż loopback,
pomiń `gateway.bind` tylko wtedy, gdy
chcesz zweryfikować domyślne ustawienie środowiska uruchomieniowego; ustaw `gateway.bind=loopback` dla
ścisłej zgodności konfiguracji. Dla postawy agenta tylko do odczytu skonfiguruj tryb piaskownicy
w odpowiednich ustawieniach domyślnych lub agencie i ustaw `workspaceAccess` na `none` albo
`ro`; pominięty tryb piaskownicy albo `off` nie spełnia polityki tylko do odczytu/bez zapisu.
`agents.workspace.denyTools` obsługuje `exec`, `process`, `write`,
`edit` i `apply_patch`; konfiguracja OpenClaw `group:fs` obejmuje narzędzia mutacji plików,
a `group:runtime` obejmuje narzędzia powłoki/procesów. Polityka postawy narzędzi obserwuje
`tools.profile`, `tools.allow`, `tools.alsoAllow`, `tools.deny`,
`tools.fs.workspaceOnly`, `tools.exec.security`, `tools.exec.ask`,
`tools.exec.host`, `tools.elevated.enabled` oraz te same per-agentowe
nadpisania `agents.list[].tools.*`. Polityka zatwierdzeń exec odczytuje nazwany
artefakt produktu `exec-approvals.json` tylko wtedy, gdy obecna jest reguła `execApprovals`;
dowody rejestrują ustawienia domyślne, postawę per-agentową i wzorce listy dozwolonych
bez tokenów gniazd ani tekstu ostatnio użytego polecenia. Polityka nie wymusza wywołań narzędzi
w czasie wykonywania. Dowody sekretów rejestrują
postawę dostawcy/źródła i metadane SecretRef, nigdy surowe wartości sekretów. Polityka
nie odczytuje ani nie poświadcza per-agentowych magazynów poświadczeń, takich jak `auth-profiles.json`;
te magazyny pozostają własnością istniejących przepływów uwierzytelniania i poświadczeń.
Dowody obsługi danych są wyłącznie postawą na poziomie konfiguracji: sprawdzają skonfigurowany
tryb redakcji, przełączniki przechwytywania treści telemetrycznych, tryb konserwacji sesji i
ustawienia indeksowania pamięci transkryptów sesji. Nie sprawdzają surowych logów,
eksportów telemetrycznych, zawartości transkryptów, plików pamięci ani nie dowodzą, że nie istnieją dane osobowe
lub sekrety.

### Odniesienie do reguł polityki

Każde pole polityki poniżej jest opcjonalne. Kontrola uruchamia się tylko wtedy, gdy pasująca reguła jest
obecna w `policy.jsonc`. Zaobserwowany stan to istniejąca konfiguracja OpenClaw lub
metadane obszaru roboczego; polityka zgłasza dryf, ale nie przepisuje zachowania środowiska uruchomieniowego,
chyba że ścieżka naprawy jest wyraźnie dostępna i włączona.
Pliki polityki są ścisłe: nieobsługiwane sekcje lub klucze reguł są zgłaszane jako
`policy/policy-jsonc-invalid` zamiast być ignorowane.

Nakładki polityki utrzymują szerokie reguły najwyższego poziomu jako globalne, a następnie pozwalają nazwanym blokom zakresu
dodawać bardziej rygorystyczne normalne sekcje polityki dla jawnych selektorów. Nazwa zakresu jest
wyłącznie opisowym koszykiem; dopasowanie używa wartości selektora wewnątrz zakresu.
Nakładka jest addytywna: globalne twierdzenia nadal działają, a twierdzenie zakresowe może emitować
własne ustalenie wobec tej samej zaobserwowanej konfiguracji.

#### Nakładki zakresowe

Użyj `scopes.<scopeName>`, gdy jeden zestaw agentów lub kanałów potrzebuje bardziej rygorystycznej
polityki niż punkt odniesienia najwyższego poziomu. Sekcje zakresowane do agentów używają `agentIds`, co
obsługuje `tools.*`, `agents.workspace.*`, `sandbox.*`, `dataHandling.memory.*`
i `execApprovals.*`. Zakresowane do kanałów
wejście przychodzące używa `channelIds`, co obsługuje `ingress.channels.*`. Nieobsługiwane
sekcje są odrzucane zamiast ignorowane. Jeśli wpis `agentIds` nie jest
obecny w `agents.list[]`, OpenClaw ocenia regułę zakresową wobec odziedziczonej
globalnej/domyślnej postawy dla tego identyfikatora agenta środowiska uruchomieniowego.

```jsonc
{
  "tools": {
    "exec": {
      "allowHosts": ["sandbox", "node"],
    },
  },
  "sandbox": {
    "requireMode": ["all", "non-main"],
  },
  "scopes": {
    "release-workspace": {
      "agentIds": ["release-agent", "review-agent"],
      "agents": {
        "workspace": {
          "allowedAccess": ["none", "ro"],
        },
      },
    },
    "release-lockdown": {
      "agentIds": ["release-agent"],
      "tools": {
        "exec": {
          "allowHosts": ["sandbox"],
          "allowSecurity": ["deny", "allowlist"],
          "requireAsk": ["always"],
        },
        "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
      },
      "sandbox": {
        "requireMode": ["all"],
        "allowBackends": ["docker"],
      },
      "dataHandling": {
        "memory": {
          "denySessionTranscriptIndexing": true,
        },
      },
    },
    "shell-sandbox": {
      "agentIds": ["shell-agent"],
      "sandbox": {
        "allowBackends": ["openshell"],
        "containers": {
          "requireReadOnlyMounts": false,
        },
      },
    },
    "telegram-ingress": {
      "channelIds": ["telegram"],
      "ingress": {
        "channels": {
          "allowDmPolicies": ["pairing"],
          "denyOpenGroups": true,
          "requireMentionInGroups": true,
        },
      },
    },
  },
}
```

Ten sam agent może pojawić się w wielu zakresach, gdy każdy zakres zarządza innymi
polami, jak pokazano powyżej. Powtórzone pole zakresowe dla tego samego agenta musi być
tak samo lub bardziej restrykcyjne zgodnie z metadanymi polityki; słabsze zduplikowane
twierdzenia są odrzucane. Metadane rygoru traktują listy dozwolonych jako podzbiory,
listy zabronionych jako nadzbiory, a wymagane wartości logiczne jako stałe wymagania.

Polityka postawy kontenera jest oceniana tylko wobec dowodów, które OpenClaw może
zaobserwować dla dopasowanego agenta. Jeśli włączona reguła `sandbox.containers.*` ma zastosowanie
do agenta, którego backend piaskownicy nie może ujawnić tego pola, polityka zgłasza
`policy/sandbox-container-posture-unobservable` zamiast traktować twierdzenie jako
spełnione. Używaj osobnych zakresów `agentIds` dla grup agentów, które używają różnych
backendów piaskownicy, i pozostaw nieobsługiwane reguły kontenerów nieustawione lub fałszywe dla
grup, w których tych pól nie można zaobserwować.

Najwyższego poziomu `ingress.session.requireDmScope` pozostaje globalne, ponieważ
`session.dmScope` nie jest dowodem przypisywalnym do kanału.

| Selektor     | Obsługiwane sekcje                                                                 | Użyj, gdy                                               |
| ------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory` i `execApprovals`    | Co najmniej jeden agent wykonawczy wymaga surowszych reguł. |
| `channelIds` | `ingress.channels`                                                                 | Co najmniej jeden kanał wymaga surowszych reguł ruchu przychodzącego. |

Każdy zakres obecny w `policy.jsonc` musi być prawidłowy i możliwy do egzekwowania.

#### Kanały

| Pole polityki                        | Obserwowany stan                         | Użyj, gdy                                                       |
| ------------------------------------ | ---------------------------------------- | --------------------------------------------------------------- |
| `channels.denyRules[].when.provider` | Dostawca `channels.*` i stan włączenia   | Odmów skonfigurowanym kanałom od dostawcy, takiego jak `telegram`. |
| `channels.denyRules[].reason`        | Komunikat ustalenia i kontekst podpowiedzi naprawy | Wyjaśnij, dlaczego dostawca jest odrzucany.                     |

#### Serwery MCP

| Pole polityki       | Obserwowany stan  | Użyj, gdy                                                   |
| ------------------- | ----------------- | ----------------------------------------------------------- |
| `mcp.servers.allow` | Identyfikatory `mcp.servers.*` | Wymagaj, aby każdy skonfigurowany serwer MCP znajdował się na liście dozwolonych. |
| `mcp.servers.deny`  | Identyfikatory `mcp.servers.*` | Odmów określonym skonfigurowanym identyfikatorom serwerów MCP. |

#### Dostawcy modeli

| Pole polityki            | Obserwowany stan                                      | Użyj, gdy                                                                      |
| ------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| `models.providers.allow` | Identyfikatory `models.providers.*` i wybrane odwołania do modeli | Wymagaj, aby skonfigurowani dostawcy i wybrane odwołania do modeli używały zatwierdzonych dostawców. |
| `models.providers.deny`  | Identyfikatory `models.providers.*` i wybrane odwołania do modeli | Odmów skonfigurowanym dostawcom i wybranym odwołaniom do modeli według identyfikatora dostawcy. |

#### Sieć

| Pole polityki                  | Obserwowany stan                         | Użyj, gdy                                                             |
| ------------------------------ | ---------------------------------------- | -------------------------------------------------------------------- |
| `network.privateNetwork.allow` | Wyjątki ucieczki SSRF dla sieci prywatnej | Ustaw na `false`, aby wymagać, by dostęp do sieci prywatnej pozostał wyłączony. |

#### Ruch przychodzący i dostęp do kanałów

| Pole polityki                             | Obserwowany stan                                                | Użyj, gdy                                                              |
| ----------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------- |
| `ingress.session.requireDmScope`          | `session.dmScope`                                               | Wymagaj sprawdzonego zakresu izolacji wiadomości bezpośrednich.       |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` i starsze pola polityki DM kanału         | Zezwalaj tylko na sprawdzone polityki kanałów wiadomości bezpośrednich. |
| `ingress.channels.denyOpenGroups`         | Polityka ruchu przychodzącego kanału, konta i grupy             | Odmawiaj otwartego ruchu przychodzącego grup dla skonfigurowanych kanałów i kont. |
| `ingress.channels.requireMentionInGroups` | Konfiguracja bramek wzmianki dla kanału, konta, grupy, gildii i zagnieżdżonych ustawień | Wymagaj bramek wzmianki, gdy ruch przychodzący grupy jest otwarty lub bramkowany wzmianką. |

#### Gateway

| Pole polityki                           | Obserwowany stan                                  | Użyj, gdy                                                     |
| --------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------- |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                    | Ustaw na `false`, aby wymagać powiązania Gateway z pętlą zwrotną. |
| `gateway.exposure.allowTailscaleFunnel` | Postura Tailscale serve/funnel dla Gateway        | Ustaw na `false`, aby odmówić ekspozycji Tailscale Funnel.    |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                               | Ustaw na `true`, aby odrzucać wyłączone uwierzytelnianie Gateway. |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                          | Ustaw na `true`, aby wymagać jawnej konfiguracji limitu szybkości uwierzytelniania. |
| `gateway.controlUi.allowInsecure`       | Niebezpieczne przełączniki uwierzytelniania/urządzenia/źródła Control UI | Ustaw na `false`, aby odmówić niebezpiecznym przełącznikom ekspozycji Control UI. |
| `gateway.remote.allow`                  | Tryb/konfiguracja zdalnego Gateway                | Ustaw na `false`, aby odmówić zdalnego trybu Gateway.         |
| `gateway.http.denyEndpoints`            | Punkty końcowe API HTTP Gateway                   | Odmów identyfikatorom punktów końcowych, takim jak `chatCompletions` lub `responses`. |
| `gateway.http.requireUrlAllowlists`     | Dane wejściowe pobierania URL przez Gateway HTTP  | Ustaw na `true`, aby wymagać list dozwolonych URL dla danych wejściowych pobierania URL. |

#### Obszar roboczy agenta

| Pole polityki                    | Obserwowany stan                                                                      | Użyj, gdy                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` i `agents.list[].sandbox.workspaceAccess`   | Zezwalaj tylko na wartości dostępu sandbox do obszaru roboczego, takie jak `none` lub `ro`.                         |
| `agents.workspace.denyTools`     | Globalna i per-agentowa konfiguracja odmowy narzędzi                                  | Wymagaj odmowy narzędzi mutacji obszaru roboczego/środowiska wykonawczego, takich jak `exec`, `process`, `write`, `edit` lub `apply_patch`. |

#### Postura sandbox

| Pole polityki                                         | Obserwowany stan                                         | Użyj, gdy                                                       |
| ----------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` i tryb per agenta         | Zezwalaj tylko na sprawdzone tryby sandbox, takie jak `all` lub `non-main`. |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` i backend per agenta   | Zezwalaj tylko na sprawdzone backendy sandbox, takie jak `docker`. |
| `sandbox.containers.denyHostNetwork`                  | Tryb sieci sandbox/przeglądarki opartej na kontenerze    | Odmawiaj trybu sieci hosta.                                    |
| `sandbox.containers.denyContainerNamespaceJoin`       | Tryb sieci sandbox/przeglądarki opartej na kontenerze    | Odmawiaj dołączania do przestrzeni nazw sieci innego kontenera. |
| `sandbox.containers.requireReadOnlyMounts`            | Tryb montowania sandbox/przeglądarki opartej na kontenerze | Wymagaj, aby montowania były tylko do odczytu.                  |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Cele montowania sandbox/przeglądarki opartej na kontenerze | Odmawiaj montowań gniazd środowiska wykonawczego kontenerów.   |
| `sandbox.containers.denyUnconfinedProfiles`           | Postura profilu zabezpieczeń kontenera                   | Odmawiaj nieograniczonych profili zabezpieczeń kontenerów.     |
| `sandbox.browser.requireCdpSourceRange`               | Zakres źródłowy CDP przeglądarki sandbox                 | Wymagaj, aby ekspozycja CDP przeglądarki deklarowała zakres źródłowy. |

Polityka traktuje brakujące `sandbox.mode` jako niejawne ustawienie domyślne `off`, więc
`sandbox.requireMode` zgłasza świeży lub nieskonfigurowany sandbox jako znajdujący się poza
listą dozwolonych, taką jak `["all"]`.

#### Obsługa danych

| Pole polityki                                       | Obserwowany stan                                                                     | Użyj, gdy                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | Ustaw na `true`, aby odrzucić `logging.redactSensitive: "off"`.        |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | Ustaw na `true`, aby odrzucać przechwytywanie treści telemetrii.       |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | Ustaw na `true`, aby wymagać efektywnego trybu utrzymania sesji `enforce`. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` i `agents.*.memorySearch.experimental.sessionMemory`   | Ustaw na `true`, aby odrzucać indeksowanie transkryptów sesji w pamięci. |

#### Sekrety

| Pole polityki                     | Obserwowany stan                                           | Użyj, gdy                                                                |
| --------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | Config SecretRefs i deklaracje `secrets.providers.*`       | Ustaw na `true`, aby wymagać, by SecretRefs wskazywały zadeklarowanych dostawców. |
| `secrets.denySources`             | Źródła dostawców sekretów i źródła SecretRef               | Odmawiaj źródłom, takim jak `exec`, `file` lub inna skonfigurowana nazwa źródła. |
| `secrets.allowInsecureProviders`  | Flagi niebezpiecznej postury dostawcy sekretów             | Ustaw na `false`, aby odrzucać dostawców, którzy wybierają niebezpieczną posturę. |

#### Zatwierdzenia exec

Polityka zatwierdzeń exec obserwuje aktywny artefakt środowiska wykonawczego `exec-approvals.json`.
Domyślnie jest to `~/.openclaw/exec-approvals.json`; gdy ustawiono
`OPENCLAW_STATE_DIR`, Policy odczytuje
`$OPENCLAW_STATE_DIR/exec-approvals.json`. Rzeczywiste reguły postury, takie jak
`execApprovals.defaults.*` lub `execApprovals.agents.*`, wymagają czytelnych dowodów
artefaktu; brakujący lub nieprawidłowy artefakt jest zgłaszany jako nieobserwowalny dowód,
zamiast stawać się najlepszym możliwym zaliczeniem wobec syntetycznych domyślnych ustawień środowiska wykonawczego. Gdy
artefakt jest czytelny, pominięte pola zatwierdzeń dziedziczą domyślne ustawienia środowiska wykonawczego: brakujące
`defaults.security` ma wartość `full`, a brakujące zabezpieczenia agenta dziedziczą tę
wartość domyślną. Dowody obejmują `defaults`, `agents.*` i
`agents.*.allowlist[].pattern` oraz opcjonalne `argPattern`, efektywną
posturę `autoAllowSkills` i źródło wpisu. Nie obejmują ścieżki/tokena
gniazda, `commandText`, `lastUsedCommand`, rozpoznanych ścieżek ani znaczników czasu.

| Pole polityki                              | Zaobserwowany stan                                                                   | Użyj, gdy                                                                                     |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | Ścieżka aktywnego runtime `exec-approvals.json`                                      | Ustaw na `true`, aby wymagać istnienia i poprawnego parsowania artefaktu zatwierdzeń. |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`, z wartością domyślną `full`                                    | Zezwalaj tylko na zatwierdzone domyślne tryby zabezpieczeń zatwierdzeń.                |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`, dziedziczące wartości domyślne                                 | Zezwalaj tylko na zatwierdzone efektywne tryby zabezpieczeń zatwierdzeń dla agentów.   |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` i `agents.*.autoAllowSkills`, dziedziczące wartości domyślne runtime | Ustaw na `false`, aby wymagać ścisłych ręcznych list dozwolonych bez niejawnego zatwierdzania CLI Skills. |
| `execApprovals.agents.allowlist.expected`   | Zagregowany wzorzec `agents.*.allowlist[]` i opcjonalne wpisy argPattern             | Wymagaj, aby lista dozwolonych zatwierdzeń odpowiadała przejrzanemu zestawowi wzorców. |

Na przykład wymagaj artefaktu zatwierdzeń, odmawiaj permisywnych wartości domyślnych i
zezwalaj tylko na przejrzaną postawę zatwierdzeń exec dla wybranych agentów:

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Security modes: "deny", "allowlist", or "full".
      // This default permits only the locked-down deny posture.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Selected agents may use reviewed allowlist posture, but not "full".
          "allowSecurity": ["allowlist"],
          // false means skill CLIs must appear in the reviewed allowlist instead of
          // being implicitly approved by autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Simple entry: exact reviewed executable pattern with no argPattern.
              "travel-hub",
              // Constrained entry: pattern plus reviewed argument regex.
              { "pattern": "calendar-cli", "argPattern": "^sync\\b" },
              "/bin/date",
            ],
          },
        },
      },
    },
  },
}
```

#### Profile uwierzytelniania

| Pole polityki                 | Zaobserwowany stan                        | Użyj, gdy                                                                                   |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | Metadane dostawcy i trybu `auth.profiles.*` | Wymagaj kluczy metadanych, takich jak `provider` i `mode`, w profilach uwierzytelniania konfiguracji. |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                    | Zezwalaj tylko na obsługiwane tryby profili uwierzytelniania, takie jak `api_key`, `aws-sdk`, `oauth` lub `token`. |

#### Metadane narzędzi

| Pole polityki        | Zaobserwowany stan              | Użyj, gdy                                                                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | Zarządzane deklaracje `TOOLS.md` | Wymagaj, aby zarządzane narzędzia deklarowały klucze metadanych, takie jak `risk`, `sensitivity` lub `owner`. |

#### Postawa narzędzi

| Pole polityki                 | Zaobserwowany stan                                           | Użyj, gdy                                                                                                 |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` i `agents.list[].tools.profile`             | Zezwalaj tylko na identyfikatory profili narzędzi, takie jak `minimal`, `messaging` lub `coding`.       |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` i nadpisania `tools.fs` dla agentów | Ustaw na `true`, aby wymagać postawy narzędzi systemu plików ograniczonej tylko do obszaru roboczego.   |
| `tools.exec.allowSecurity`      | `tools.exec.security` i zabezpieczenia exec dla agentów      | Zezwalaj tylko na tryby zabezpieczeń exec, takie jak `deny` lub `allowlist`.                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` i tryb pytania exec dla agentów             | Wymagaj postawy zatwierdzania, takiej jak `always`.                                                     |
| `tools.exec.allowHosts`         | `tools.exec.host` i routing hostów exec dla agentów          | Zezwalaj tylko na tryby routingu hostów exec, takie jak `sandbox`.                                      |
| `tools.elevated.allow`          | `tools.elevated.enabled` i postawa podwyższonych uprawnień dla agentów | Ustaw na `false`, aby wymagać, by tryb narzędzi z podwyższonymi uprawnieniami pozostał wyłączony.       |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` i `tools.alsoAllow` dla agentów            | Wymagaj dokładnych wpisów `alsoAllow` i zgłaszaj brakujące lub nieoczekiwane dodatkowe uprawnienia narzędzi. |
| `tools.denyTools`               | `tools.deny` i `agents.list[].tools.deny`                    | Wymagaj, aby skonfigurowane listy odmów narzędzi zawierały identyfikatory narzędzi lub grupy, takie jak `group:runtime` i `group:fs`. |

Uruchamiaj sprawdzenia wyłącznie polityki podczas tworzenia:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` uruchamia tylko zestaw sprawdzeń polityki i emituje dowody, ustalenia oraz
skróty atestacyjne. Te same ustalenia pojawiają się również w `openclaw doctor --lint`,
gdy Plugin Policy jest włączony.

Porównaj plik polityki operatora z utworzonym plikiem polityki bazowej:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` porównuje składnię pliku polityki ze składnią pliku polityki. Nie
sprawdza stanu runtime OpenClaw, dowodów, poświadczeń ani sekretów. Polecenie
używa tych samych metadanych reguł polityki, które zarządzają nakładkami zakresów: listy dozwolonych muszą
pozostać równe lub węższe, listy odmów muszą pozostać równe lub szersze, wymagane wartości logiczne
muszą zachować swoją wymaganą wartość, uporządkowane ciągi muszą przesuwać się tylko w stronę bardziej
restrykcyjnego końca skonfigurowanego porządku, a dokładne listy muszą być zgodne.

Plik bazowy może być polityką utworzoną przez organizację. Sprawdzana polityka może
używać bardziej restrykcyjnych wartości lub dodawać dodatkowe reguły polityki. Sprawdzana reguła najwyższego poziomu może także
spełniać regułę bazową zakresu, gdy jest równie lub bardziej restrykcyjna, ponieważ
polityka najwyższego poziomu stosuje się szeroko. Nazwy zakresów nie muszą być zgodne; porównanie
zakresów jest kluczowane według wartości selektora, takiej jak `agentIds` lub `channelIds`, oraz według
sprawdzanego pola polityki.

Przykładowe czyste wyjście JSON porównania zgłasza tylko stan porównania plików polityki:

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

Przykładowe czyste wyjście `policy check --json` zawiera stabilne skróty, które mogą być
zarejestrowane przez operatora lub nadzorcę:

```json
{
  "ok": true,
  "attestation": {
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": []
}
```

## Konfigurowanie polityki

Konfiguracja polityki znajduje się w `plugins.entries.policy.config`.

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "enabled": true,
        "config": {
          "enabled": true,
          "path": "policy.jsonc",
          "workspaceRepairs": false,
          "expectedHash": "sha256:...",
          "expectedAttestationHash": "sha256:...",
        },
      },
    },
  },
}
```

| Ustawienie                | Cel                                                             |
| ------------------------- | --------------------------------------------------------------- |
| `enabled`                 | Włącz sprawdzenia polityki nawet przed istnieniem `policy.jsonc`. |
| `workspaceRepairs`        | Zezwól `doctor --fix` na edycję ustawień obszaru roboczego zarządzanych przez politykę. |
| `expectedHash`            | Opcjonalna blokada skrótu dla zatwierdzonego artefaktu polityki. |
| `expectedAttestationHash` | Opcjonalna blokada skrótu dla ostatniego zaakceptowanego czystego sprawdzenia polityki. |
| `path`                    | Lokalizacja artefaktu polityki względna wobec obszaru roboczego. |

Ustaw `plugins.entries.policy.config.enabled` na `false`, aby wyłączyć sprawdzenia polityki
dla obszaru roboczego, pozostawiając Plugin zainstalowany.

Wymagania dotyczące metadanych narzędzi są tworzone w `policy.jsonc` za pomocą
`tools.requireMetadata`, na przykład `["risk", "sensitivity", "owner"]`.

## Akceptowanie stanu polityki

Przykładowe wyjście JSON:

```json
{
  "ok": true,
  "attestation": {
    "checkedAt": "2026-05-10T20:00:00.000Z",
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "evidence": {
    "channels": [
      {
        "id": "telegram",
        "provider": "telegram",
        "source": "oc://openclaw.config/channels/telegram",
        "enabled": false
      }
    ],
    "mcpServers": [
      {
        "id": "docs",
        "transport": "stdio",
        "source": "oc://openclaw.config/mcp/servers/docs",
        "command": "npx"
      }
    ],
    "modelProviders": [
      {
        "id": "openai",
        "source": "oc://openclaw.config/models/providers/openai"
      }
    ],
    "modelRefs": [
      {
        "ref": "openai/gpt-5.5",
        "provider": "openai",
        "model": "gpt-5.5",
        "source": "oc://openclaw.config/agents/defaults/model"
      }
    ],
    "network": [
      {
        "id": "browser-private-network",
        "source": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
        "value": false
      }
    ],
    "gatewayExposure": [
      {
        "id": "gateway-bind",
        "kind": "bind",
        "source": "oc://openclaw.config/gateway/bind",
        "value": "loopback",
        "nonLoopback": false,
        "explicit": true
      }
    ],
    "agentWorkspace": [
      {
        "id": "agents-defaults-workspace-access",
        "kind": "workspaceAccess",
        "source": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
        "scope": "defaults",
        "value": "ro",
        "sandboxMode": "all",
        "sandboxModeSource": "oc://openclaw.config/agents/defaults/sandbox/mode",
        "sandboxEnabled": true,
        "explicit": true
      },
      {
        "id": "agents-defaults-tool-exec",
        "kind": "toolDeny",
        "source": "oc://openclaw.config/tools/deny",
        "scope": "defaults",
        "tool": "exec",
        "denied": true,
        "explicit": true
      }
    ],
    "secrets": [
      {
        "id": "vault",
        "kind": "provider",
        "source": "oc://openclaw.config/secrets/providers/vault",
        "providerSource": "env"
      },
      {
        "id": "oc://openclaw.config/models/providers/openai/apiKey",
        "kind": "input",
        "source": "oc://openclaw.config/models/providers/openai/apiKey",
        "provenance": "secretRef",
        "refSource": "env",
        "refProvider": "vault"
      }
    ],
    "authProfiles": [
      {
        "id": "github",
        "source": "oc://openclaw.config/auth/profiles/github",
        "validMetadata": true,
        "provider": "github",
        "mode": "token"
      }
    ],
    "tools": [
      {
        "id": "deploy",
        "source": "oc://TOOLS.md/tools/deploy",
        "line": 12,
        "risk": "critical",
        "sensitivity": "restricted",
        "capabilities": ["IRREVERSIBLE_EXTERNAL"]
      }
    ]
  },
  "checksRun": 30,
  "checksSkipped": 0,
  "findings": []
}
```

Hash zasad identyfikuje utworzony artefakt reguł. Blok dowodów
rejestruje zaobserwowany stan OpenClaw użyty przez sprawdzenia zasad. Wartość
`workspace.hash` identyfikuje ten ładunek dowodowy dla sprawdzanego zakresu.
Hash ustaleń identyfikuje dokładny zestaw ustaleń zwrócony przez sprawdzenie.
`checkedAt` rejestruje, kiedy uruchomiono ocenę. Hash poświadczenia identyfikuje
stabilne twierdzenie: hash zasad, hash dowodów, hash ustaleń oraz to, czy
wynik był czysty. Celowo nie obejmuje `checkedAt`, więc ten sam stan zasad
tworzy to samo poświadczenie w kolejnych sprawdzeniach. Razem tworzą one
krotkę audytową dla tego sprawdzenia zasad.

Jeśli późniejszy Gateway lub nadzorca używa zasad do blokowania, zatwierdzania
albo opatrywania adnotacją działania w czasie wykonywania, powinien zarejestrować
hash poświadczenia z ostatniego czystego sprawdzenia zasad. `checkedAt` pozostaje
w wyjściu JSON dla dzienników audytu, ale nie jest częścią stabilnego hasha
poświadczenia.

Użyj tego cyklu życia podczas akceptowania stanu zasad:

1. Utwórz lub przejrzyj `policy.jsonc`.
2. Uruchom `openclaw policy check --json`.
3. Jeśli wynik jest czysty, zarejestruj `attestation.policy.hash` jako `expectedHash`.
4. Zarejestruj `attestation.attestationHash` jako `expectedAttestationHash`.
5. Uruchom ponownie `openclaw doctor --lint` w CI lub bramkach wydania.

Jeśli reguły zasad zmieniają się celowo, zaktualizuj oba zaakceptowane hashe
na podstawie czystego sprawdzenia. Jeśli ustawienia przestrzeni roboczej zmieniają
się celowo, ale zasady pozostają takie same, zwykle zmienia się tylko
`expectedAttestationHash`.

Włączenie lub uaktualnienie reguł `agents.workspace` dodaje dowody `agentWorkspace`
do hasha przestrzeni roboczej i hasha poświadczenia. Operatorzy powinni przejrzeć
nowe dowody i odświeżyć zaakceptowane hashe poświadczeń po włączeniu tych reguł.
Włączenie lub uaktualnienie reguł profilu zabezpieczeń narzędzi dodaje dowody
`toolPosture` w ten sam sposób.

`openclaw policy watch` wielokrotnie uruchamia to samo sprawdzenie i zgłasza,
kiedy bieżące dowody przestają odpowiadać `expectedAttestationHash`:

```bash
openclaw policy watch --json
```

Użyj `--once` w CI lub skryptach, które potrzebują tylko jednej oceny dryfu. Bez
`--once` polecenie domyślnie odpytuje co dwie sekundy; użyj `--interval-ms`, aby
wybrać inny interwał.

## Ustalenia

Zasady obecnie weryfikują:

| Identyfikator kontroli                                  | Ustalenie                                                                         |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | Polityka jest włączona, ale brakuje `policy.jsonc`.                               |
| `policy/policy-jsonc-invalid`                            | Nie można sparsować polityki albo zawiera ona nieprawidłowe wpisy reguł.          |
| `policy/policy-hash-mismatch`                            | Polityka nie pasuje do skonfigurowanego `expectedHash`.                           |
| `policy/attestation-hash-mismatch`                       | Bieżące dowody polityki nie pasują już do zaakceptowanego poświadczenia.          |
| `policy/policy-conformance-invalid`                      | Plik polityki bazowej lub sprawdzanej ma nieprawidłową składnię porównania.       |
| `policy/policy-conformance-missing`                      | W sprawdzanym pliku polityki brakuje reguły wymaganej przez bazowy plik polityki. |
| `policy/policy-conformance-weaker`                       | Sprawdzany plik polityki ma słabszą wartość niż bazowy plik polityki.             |
| `policy/channels-denied-provider`                        | Włączony kanał pasuje do reguły blokowania kanału.                                |
| `policy/mcp-denied-server`                               | Skonfigurowany serwer MCP jest zablokowany przez politykę.                        |
| `policy/mcp-unapproved-server`                           | Skonfigurowany serwer MCP jest poza listą dozwolonych.                            |
| `policy/models-denied-provider`                          | Skonfigurowany dostawca modelu lub odwołanie do modelu używa zablokowanego dostawcy. |
| `policy/models-unapproved-provider`                      | Skonfigurowany dostawca modelu lub odwołanie do modelu jest poza listą dozwolonych. |
| `policy/network-private-access-enabled`                  | Włączono awaryjne obejście SSRF dla sieci prywatnej, choć polityka tego zabrania. |
| `policy/ingress-dm-policy-unapproved`                    | Polityka DM kanału jest poza listą dozwolonych polityki.                          |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` nie pasuje do wymaganego przez politykę zakresu izolacji DM.    |
| `policy/ingress-open-groups-denied`                      | Polityka grup kanału ma wartość `open`, choć polityka zabrania otwartego ruchu przychodzącego grup. |
| `policy/ingress-group-mention-required`                  | Wpis kanału lub grupy wyłącza bramki wzmianek, choć polityka ich wymaga.          |
| `policy/gateway-non-loopback-bind`                       | Postawa wiązania Gateway zezwala na ekspozycję inną niż local loopback, choć polityka tego zabrania. |
| `policy/gateway-auth-disabled`                           | Uwierzytelnianie Gateway jest wyłączone, choć polityka wymaga uwierzytelniania.   |
| `policy/gateway-rate-limit-missing`                      | Postawa limitowania tempa uwierzytelniania Gateway nie jest jawna, choć polityka tego wymaga. |
| `policy/gateway-control-ui-insecure`                     | Włączone są przełączniki niezabezpieczonej ekspozycji Gateway Control UI.         |
| `policy/gateway-tailscale-funnel`                        | Ekspozycja Gateway Tailscale Funnel jest włączona, choć polityka jej zabrania.    |
| `policy/gateway-remote-enabled`                          | Tryb zdalny Gateway jest aktywny, choć polityka tego zabrania.                    |
| `policy/gateway-http-endpoint-enabled`                   | Punkt końcowy HTTP API Gateway jest włączony, choć polityka go blokuje.           |
| `policy/gateway-http-url-fetch-unrestricted`             | Dane wejściowe pobierania URL przez HTTP Gateway nie mają wymaganej listy dozwolonych URL-i. |
| `policy/agents-workspace-access-denied`                  | Tryb piaskownicy agenta lub dostęp do obszaru roboczego jest poza listą dozwolonych polityki. |
| `policy/agents-tool-not-denied`                          | Agent lub domyślna konfiguracja nie blokuje narzędzia wymaganego przez politykę.  |
| `policy/tools-profile-unapproved`                        | Skonfigurowany globalny lub agentowy profil narzędzi jest poza listą dozwolonych. |
| `policy/tools-fs-workspace-only-required`                | Narzędzia systemu plików nie są skonfigurowane z postawą ścieżek ograniczoną tylko do obszaru roboczego. |
| `policy/tools-exec-security-unapproved`                  | Tryb zabezpieczeń exec jest poza listą dozwolonych polityki.                      |
| `policy/tools-exec-ask-unapproved`                       | Tryb pytania exec jest poza listą dozwolonych polityki.                           |
| `policy/tools-exec-host-unapproved`                      | Routing hosta exec jest poza listą dozwolonych polityki.                          |
| `policy/tools-elevated-enabled`                          | Tryb podwyższonych uprawnień narzędzi jest włączony, choć polityka go zabrania.   |
| `policy/tools-also-allow-missing`                        | W skonfigurowanej liście `alsoAllow` brakuje wpisu wymaganego przez politykę.     |
| `policy/tools-also-allow-unexpected`                     | Skonfigurowana lista `alsoAllow` zawiera wpis nieoczekiwany przez politykę.       |
| `policy/tools-required-deny-missing`                     | Globalna lub agentowa lista blokowania narzędzi nie zawiera wymaganego blokowanego narzędzia. |
| `policy/sandbox-mode-unapproved`                         | Tryb piaskownicy jest poza listą dozwolonych polityki.                            |
| `policy/sandbox-backend-unapproved`                      | Backend piaskownicy jest poza listą dozwolonych polityki.                         |
| `policy/sandbox-container-posture-unobservable`          | Reguła postawy kontenera jest włączona dla backendu, który nie może jej obserwować. |
| `policy/sandbox-container-host-network-denied`           | Piaskownica lub przeglądarka oparta na kontenerze używa trybu sieci hosta.        |
| `policy/sandbox-container-namespace-join-denied`         | Piaskownica lub przeglądarka oparta na kontenerze dołącza do przestrzeni nazw innego kontenera. |
| `policy/sandbox-container-mount-mode-required`           | Montowanie piaskownicy lub przeglądarki opartej na kontenerze nie jest tylko do odczytu. |
| `policy/sandbox-container-runtime-socket-mount`          | Montowanie piaskownicy lub przeglądarki opartej na kontenerze ujawnia gniazdo środowiska uruchomieniowego kontenera. |
| `policy/sandbox-container-unconfined-profile`            | Profil piaskownicy kontenera jest nieograniczony, choć polityka tego zabrania.    |
| `policy/sandbox-browser-cdp-source-range-missing`        | Brakuje zakresu źródłowego CDP przeglądarki piaskownicy, choć polityka go wymaga. |
| `policy/data-handling-redaction-disabled`                | Redagowanie wrażliwych danych w logach jest wyłączone, choć polityka go wymaga.   |
| `policy/data-handling-telemetry-content-capture`         | Przechwytywanie treści telemetrycznych jest włączone, choć polityka go zabrania.  |
| `policy/data-handling-session-retention-not-enforced`    | Utrzymanie retencji sesji nie jest egzekwowane, choć polityka tego wymaga.         |
| `policy/data-handling-session-transcript-memory-enabled` | Indeksowanie pamięci transkryptów sesji jest włączone, choć polityka go zabrania. |
| `policy/secrets-unmanaged-provider`                      | Config SecretRef odwołuje się do dostawcy niezadeklarowanego w `secrets.providers`. |
| `policy/secrets-denied-provider-source`                  | Dostawca sekretów konfiguracji lub SecretRef używa źródła zablokowanego przez politykę. |
| `policy/secrets-insecure-provider`                       | Dostawca sekretów wybiera niezabezpieczoną postawę, choć polityka jej zabrania.   |
| `policy/auth-profile-invalid-metadata`                   | Profil uwierzytelniania konfiguracji nie ma prawidłowych metadanych dostawcy lub trybu. |
| `policy/auth-profile-unapproved-mode`                    | Tryb profilu uwierzytelniania konfiguracji jest poza listą dozwolonych polityki.  |
| `policy/exec-approvals-missing`                          | Polityka wymaga `exec-approvals.json`, ale brakuje tego artefaktu.                |
| `policy/exec-approvals-invalid`                          | Nie można sparsować skonfigurowanego artefaktu zatwierdzeń exec.                  |
| `policy/exec-approvals-default-security-unapproved`      | Domyślne zatwierdzenia exec używają trybu zabezpieczeń spoza listy dozwolonych polityki. |
| `policy/exec-approvals-agent-security-unapproved`        | Efektywny agentowy tryb zabezpieczeń zatwierdzeń exec jest poza listą dozwolonych. |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Agent zatwierdzeń exec niejawnie automatycznie zezwala na CLI Skills, choć polityka tego zabrania. |
| `policy/exec-approvals-allowlist-missing`                | Na liście dozwolonych zatwierdzeń brakuje wzorca wymaganego przez politykę.       |
| `policy/exec-approvals-allowlist-unexpected`             | Lista dozwolonych zatwierdzeń zawiera wzorzec nieoczekiwany przez politykę.       |
| `policy/tools-missing-risk-level`                        | Zarządzanej deklaracji narzędzia brakuje metadanych ryzyka.                       |
| `policy/tools-unknown-risk-level`                        | Zarządzana deklaracja narzędzia używa nieznanej wartości ryzyka.                  |
| `policy/tools-missing-sensitivity-token`                 | Zarządzanej deklaracji narzędzia brakuje metadanych wrażliwości.                  |
| `policy/tools-missing-owner`                             | Zarządzanej deklaracji narzędzia brakuje metadanych właściciela.                  |
| `policy/tools-unknown-sensitivity-token`                 | Zarządzana deklaracja narzędzia używa nieznanej wartości wrażliwości.             |

Ustalenia polityki mogą zawierać zarówno `target`, jak i `requirement`. `target` to
zaobserwowany element obszaru roboczego, który nie jest zgodny. `requirement` to autorska
reguła polityki, która spowodowała powstanie ustalenia. Obie wartości są obecnie adresami, zwykle
ścieżkami `oc://`, ale nazwy pól opisują ich rolę w polityce, a nie
format adresu.

Przykładowe ustalenie JSON:

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "Channel 'telegram' uses denied provider 'telegram'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "Telegram is not approved for this workspace."
}
```

Przykładowe ustalenie narzędzia:

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "TOOLS.md tool 'deploy' has no explicit risk classification.",
  "source": "policy",
  "path": "TOOLS.md",
  "line": 12,
  "ocPath": "oc://TOOLS.md/tools/deploy",
  "target": "oc://TOOLS.md/tools/deploy",
  "requirement": "oc://policy.jsonc/tools/requireMetadata"
}
```

Przykładowe ustalenie MCP:

```json
{
  "checkId": "policy/mcp-unapproved-server",
  "severity": "error",
  "message": "MCP server 'remote' is not in the policy allowlist.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

Przykładowe ustalenie dostawcy modelu:

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "Model ref 'anthropic/claude-sonnet-4.7' uses unapproved provider 'anthropic'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "target": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "requirement": "oc://policy.jsonc/models/providers/allow"
}
```

Przykładowe ustalenie sieci:

```json
{
  "checkId": "policy/network-private-access-enabled",
  "severity": "error",
  "message": "Network setting 'browser-private-network' allows private-network access.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

Przykładowe wykrycie ekspozycji Gateway:

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "Gateway bind setting 'gateway-bind' permits non-loopback exposure.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/bind",
  "target": "oc://openclaw.config/gateway/bind",
  "requirement": "oc://policy.jsonc/gateway/exposure/allowNonLoopbackBind"
}
```

Przykładowe wykrycie obszaru roboczego agenta:

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "agents.defaults sandbox workspaceAccess 'rw' is not allowed by policy.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## Naprawa

`doctor --lint` i `policy check` są tylko do odczytu.

`doctor --fix` edytuje ustawienia obszaru roboczego zarządzane przez politykę tylko wtedy, gdy
`workspaceRepairs` jest jawnie włączone. Bez tej zgody kontrole polityki
zgłaszają, co by naprawiły, i pozostawiają ustawienia bez zmian.

W tej wersji naprawa może wyłączyć kanały, które są włączone w konfiguracji OpenClaw,
ale zablokowane przez `channels.denyRules`. Włącz `workspaceRepairs` dopiero po
sprawdzeniu pliku polityki, ponieważ poprawna reguła odmowy może wyłączyć
skonfigurowany kanał:

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "config": {
          "workspaceRepairs": true,
        },
      },
    },
  },
}
```

## Kody wyjścia

| Polecenie        | `0`                                                          | `1`                                                                    | `2`                                  |
| ---------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------ |
| `policy check`   | Brak ustaleń na progu.                                       | Co najmniej jedno ustalenie osiągnęło próg.                            | Błąd argumentu lub działania.        |
| `policy compare` | Plik polityki jest co najmniej tak restrykcyjny jak baseline. | Plik polityki jest nieprawidłowy, brakujący lub słabszy niż reguły baseline. | Błąd argumentu lub działania.        |
| `policy watch`   | Brak ustaleń, a zaakceptowany hash jest aktualny.            | Istnieją ustalenia lub zaakceptowane poświadczenie jest nieaktualne.   | Błąd argumentu lub działania.        |

## Powiązane

- [Tryb lint Doctor](/pl/cli/doctor#lint-mode)
- [CLI ścieżki](/pl/cli/path)
