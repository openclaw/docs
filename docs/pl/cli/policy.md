---
read_when:
    - Chcesz sprawdzić ustawienia OpenClaw pod kątem utworzonego pliku policy.jsonc
    - Chcesz, aby wyniki kontroli zasad pojawiały się w lintowaniu doctor
    - Potrzebujesz skrótu poświadczenia zasad jako dowodu audytowego
summary: Dokumentacja CLI dla testów zgodności `openclaw policy`
title: Zasady
x-i18n:
    generated_at: "2026-07-12T14:55:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 280f9ed1e741786f85dfed978690eb18a03c8fbde20e0d01e31a9d215ae0a128
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

Polecenie `openclaw policy` jest udostępniane przez dołączoną wtyczkę Policy. Stanowi
warstwę zgodności klasy korporacyjnej nad istniejącymi ustawieniami OpenClaw, a nie
drugi system konfiguracji. Wymagania definiuje się w pliku `policy.jsonc`; OpenClaw
traktuje aktywny obszar roboczy jako materiał dowodowy; Policy zgłasza odchylenia za
pośrednictwem `doctor --lint`. Policy nie wymusza wywołań narzędzi ani nie modyfikuje
zachowania środowiska wykonawczego podczas obsługi żądania oraz nie poświadcza
magazynów danych uwierzytelniających poszczególnych agentów, takich jak
`auth-profiles.json`.

Policy sprawdza skonfigurowane kanały, serwery MCP, dostawców modeli, zabezpieczenia
sieci przed SSRF, dostęp przychodzący i dostęp do kanałów, ekspozycję Gateway oraz
zasady dotyczące poleceń węzłów, dostęp agentów do obszaru roboczego, zabezpieczenia
piaskownicy, zasady obsługi danych, stan dostawców sekretów i profili
uwierzytelniania oraz metadane nadzorowanych narzędzi (`TOOLS.md`). Należy go używać,
gdy obszar roboczy wymaga trwałej, możliwej do sprawdzenia deklaracji, takiej jak
„Telegram nie może być włączony” lub „nadzorowane narzędzia muszą deklarować
metadane ryzyka i właściciela”. Jeśli potrzebne jest wyłącznie zachowanie lokalne,
bez poświadczania ani wykrywania odchyleń, wystarczy zwykła konfiguracja.

## Szybki start

```bash
openclaw plugins enable policy
```

Wtyczka pozostaje włączona nawet wtedy, gdy brakuje pliku `policy.jsonc`, dzięki
czemu doctor może zgłosić brakujący artefakt zamiast po cichu pomijać kontrole.

Plik `policy.jsonc` należy utworzyć ręcznie; nie jest generowany na podstawie
bieżących ustawień. Każda sekcja najwyższego poziomu jest przestrzenią nazw reguł:
kontrola jest uruchamiana tylko wtedy, gdy znajduje się w niej konkretna reguła
(nieobsługiwane sekcje lub klucze powodują błąd `policy/policy-jsonc-invalid`,
zamiast być po cichu ignorowane). Minimalny przykład obejmujący wszystkie
obsługiwane sekcje:

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
    "nodes": {
      "denyCommands": ["system.run"],
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

Uwagi przekrojowe, które nie wynikają bezpośrednio z poniższych tabel reguł:

- Pominięcie `gateway.bind` przy jednoczesnym zakazaniu powiązań innych niż
  local loopback oznacza akceptację wartości domyślnej środowiska wykonawczego;
  aby zapewnić ścisłą zgodność, ustaw `gateway.bind: "loopback"`.
- W przypadku agenta z dostępem tylko do odczytu ustaw `mode` piaskownicy na
  `all` lub `non-main` w odpowiednich ustawieniach domyślnych albo ustawieniach
  agenta, a `workspaceAccess` na `none` lub `ro`. Brak trybu piaskownicy lub
  ustawienie go na `off` nie spełnia zasad dostępu tylko do odczytu.
- `agents.workspace.denyTools` przyjmuje wartości `exec`, `process`, `write`,
  `edit`, `apply_patch`. Grupy blokowania narzędzi w konfiguracji: `group:fs`
  (modyfikowanie plików) i `group:runtime` (powłoka/procesy) spełniają
  równoważne wymagania.
- Kontrole zatwierdzania wykonywania odczytują aktywny artefakt
  `exec-approvals.json` tylko wtedy, gdy istnieje reguła `execApprovals`;
  brakujący lub nieprawidłowy artefakt stanowi niemożliwy do zaobserwowania
  materiał dowodowy, a nie domniemane zaliczenie kontroli.
- Materiał dowodowy dotyczący sekretów i profili uwierzytelniania rejestruje
  wyłącznie stan dostawcy lub źródła oraz metadane SecretRef, nigdy wartości
  nieprzetworzone. Policy nie odczytuje ani nie poświadcza magazynów danych
  uwierzytelniających poszczególnych agentów, takich jak `auth-profiles.json`.
- Materiał dowodowy dotyczący obsługi danych obejmuje wyłącznie stan na poziomie
  konfiguracji (tryb redagowania, przełącznik przechwytywania telemetrii, tryb
  utrzymania sesji, ustawienie indeksowania transkrypcji). Nie sprawdza logów,
  eksportów telemetrii, transkrypcji ani plików pamięci, a poprawny wynik nie
  dowodzi, że nie zawierają one danych osobowych ani sekretów.

### Dokumentacja reguł Policy

Każda poniższa reguła jest opcjonalna; kontrola jest uruchamiana tylko wtedy,
gdy reguła jest obecna. Obserwowany stan pochodzi z istniejącej konfiguracji
OpenClaw lub metadanych obszaru roboczego.

#### Nakładki o ograniczonym zakresie

Użyj `scopes.<scopeName>`, gdy określeni agenci lub kanały wymagają
bardziej rygorystycznych zasad niż bazowe zasady najwyższego poziomu. Nazwa
zakresu jest tylko etykietą; dopasowywanie odbywa się przy użyciu selektora
wewnątrz zakresu. Nakładki są addytywne: reguła globalna nadal jest
uruchamiana, a reguła zakresowa może dodać własne ustalenie na podstawie tego
samego materiału dowodowego.

| Selektor     | Obsługiwane sekcje                                                             | Kiedy używać                                                       |
| ------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | Gdy co najmniej jeden agent środowiska wykonawczego wymaga bardziej rygorystycznych reguł. |
| `channelIds` | `ingress.channels`                                                             | Gdy co najmniej jeden kanał wymaga bardziej rygorystycznych reguł dostępu przychodzącego. |

Jeśli wpis `agentIds` nie występuje w `agents.list[]`, OpenClaw ocenia regułę
zakresową względem odziedziczonego globalnego lub domyślnego stanu dla tego
identyfikatora agenta środowiska wykonawczego, zamiast ją pomijać.

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

Ten sam agent może występować w wielu zakresach, jeśli każdy zakres nadzoruje
inne pole, jak w powyższym przykładzie. Powtórzone pole zakresowe dotyczące
tego samego agenta musi być równie lub bardziej restrykcyjne; słabsza,
powielona deklaracja jest odrzucana (listy dozwolonych wartości muszą być
podzbiorami, listy zabronionych wartości — nadzbiorami, a wymagane wartości
logiczne są stałe).

Reguły stanu kontenerów (`sandbox.containers.*`) są sprawdzane wyłącznie
względem materiału dowodowego, który może udostępnić backend piaskownicy
dopasowanego agenta. Jeśli backend nie może obserwować włączonej dla niego
reguły, Policy zgłasza `policy/sandbox-container-posture-unobservable` zamiast
zaliczyć kontrolę; reguły kontenerów należy ograniczyć do grup agentów, które
korzystają z backendu zdolnego je udostępnić.

Reguła najwyższego poziomu `ingress.session.requireDmScope` pozostaje globalna;
`session.dmScope` nie stanowi materiału dowodowego, który można przypisać do
kanału, dlatego nie można ograniczyć jej za pomocą `channelIds`.

Każdy zakres obecny w `policy.jsonc` musi być prawidłowy i możliwy do
wyegzekwowania.

#### Kanały

| Pole zasad                            | Obserwowany stan                         | Kiedy używać                                                        |
| ------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| `channels.denyRules[].when.provider`  | Dostawca i stan włączenia `channels.*`   | Aby zabronić skonfigurowanych kanałów dostawcy takiego jak `telegram`. |
| `channels.denyRules[].reason`         | Kontekst komunikatu ustalenia i wskazówki naprawczej | Aby wyjaśnić, dlaczego dostawca jest zabroniony.                    |

#### Serwery MCP

| Pole zasad          | Obserwowany stan       | Kiedy używać                                                        |
| ------------------- | ---------------------- | ------------------------------------------------------------------- |
| `mcp.servers.allow` | Identyfikatory `mcp.servers.*` | Aby wymagać, by każdy skonfigurowany serwer MCP znajdował się na liście dozwolonych. |
| `mcp.servers.deny`  | Identyfikatory `mcp.servers.*` | Aby zabronić określonych identyfikatorów skonfigurowanych serwerów MCP. |

#### Dostawcy modeli

| Pole zasad               | Obserwowany stan                                        | Kiedy używać                                                                    |
| ------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `models.providers.allow` | Identyfikatory `models.providers.*` i odwołania do wybranych modeli | Aby wymagać, by skonfigurowani dostawcy i odwołania do wybranych modeli korzystały z zatwierdzonych dostawców. |
| `models.providers.deny`  | Identyfikatory `models.providers.*` i odwołania do wybranych modeli | Aby zabronić skonfigurowanych dostawców i odwołań do wybranych modeli według identyfikatora dostawcy. |

#### Sieć

| Pole zasad                     | Obserwowany stan                         | Kiedy używać                                                        |
| ------------------------------ | ---------------------------------------- | ------------------------------------------------------------------- |
| `network.privateNetwork.allow` | Mechanizmy obejścia ochrony SSRF w sieci prywatnej | Ustaw na `false`, aby wymagać, by dostęp do sieci prywatnej pozostał wyłączony. |

#### Dostęp przychodzący i dostęp do kanałów

| Pole zasad                               | Obserwowany stan                                               | Zastosowanie                                                        |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------- |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | Wymagaj zatwierdzonego zakresu izolacji wiadomości bezpośrednich.   |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` i starsze pola zasad kanałów DM           | Zezwalaj tylko na zatwierdzone zasady kanałów wiadomości bezpośrednich. |
| `ingress.channels.denyOpenGroups`         | Zasady ruchu przychodzącego dla kanału, konta i grupy           | Odrzucaj otwarty ruch przychodzący grup dla skonfigurowanych kanałów i kont. |
| `ingress.channels.requireMentionInGroups` | Konfiguracja bramki wzmianek dla kanału, konta, grupy, gildii i poziomów zagnieżdżonych | Wymagaj bramek wzmianek, gdy ruch przychodzący grup jest otwarty lub uzależniony od wzmianki. |

#### Gateway

| Pole zasad                              | Obserwowany stan                               | Zastosowanie                                                                         |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | Ustaw na `false`, aby wymagać powiązania Gateway z local loopback.                   |
| `gateway.exposure.allowTailscaleFunnel` | Stan udostępniania Gateway przez Tailscale serve/funnel | Ustaw na `false`, aby zabronić ekspozycji przez Tailscale Funnel.                    |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | Ustaw na `true`, aby odrzucać wyłączone uwierzytelnianie Gateway.                    |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | Ustaw na `true`, aby wymagać jawnej konfiguracji limitu częstotliwości uwierzytelniania. |
| `gateway.controlUi.allowInsecure`       | Niezabezpieczone przełączniki uwierzytelniania, urządzenia i pochodzenia interfejsu sterowania | Ustaw na `false`, aby zabronić niezabezpieczonych przełączników ekspozycji interfejsu sterowania. |
| `gateway.remote.allow`                  | Tryb i konfiguracja zdalnego Gateway           | Ustaw na `false`, aby zabronić trybu zdalnego Gateway.                               |
| `gateway.http.denyEndpoints`            | Punkty końcowe interfejsu HTTP API Gateway     | Zabroń identyfikatorów punktów końcowych, takich jak `chatCompletions` lub `responses`. |
| `gateway.http.requireUrlAllowlists`     | Dane wejściowe pobierania adresów URL przez Gateway HTTP | Ustaw na `true`, aby wymagać list dozwolonych adresów URL dla danych wejściowych pobierania adresów URL. |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                   | Wymagaj, aby dokładne identyfikatory poleceń węzła, takie jak `system.run`, były zabronione w konfiguracji OpenClaw. |

`gateway.nodes.denyCommands` jest dokładną, uwzględniającą wielkość liter regułą
nadzbioru zakazów. Użyj jej, gdy zasady muszą wykazywać, że uprzywilejowane
polecenia węzła są jawnie zabronione przez konfigurację OpenClaw. Wdrożenie,
które celowo zezwala na uprzywilejowane polecenie węzła, powinno po przeglądzie
zaktualizować `policy.jsonc`, zamiast polegać wyłącznie na
`gateway.nodes.allowCommands`.

#### Obszar roboczy agenta

| Pole zasad                      | Obserwowany stan                                                                      | Zastosowanie                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` i `agents.list[].sandbox.workspaceAccess`   | Zezwalaj tylko na takie wartości dostępu do obszaru roboczego piaskownicy jak `none` lub `ro`. |
| `agents.workspace.denyTools`     | Globalna i indywidualna konfiguracja zakazu narzędzi dla agentów                      | Wymagaj zakazania narzędzi modyfikujących (`exec`, `process`, `write`, `edit`, `apply_patch`). |

#### Stan piaskownicy

| Pole zasad                                           | Obserwowany stan                                         | Zastosowanie                                                        |
| ----------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` i tryb poszczególnych agentów | Zezwalaj tylko na zatwierdzone tryby piaskownicy, takie jak `all` lub `non-main`. |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` i mechanizm poszczególnych agentów | Zezwalaj tylko na zatwierdzone mechanizmy piaskownicy, takie jak `docker`. |
| `sandbox.containers.denyHostNetwork`                  | Tryb sieci piaskownicy lub przeglądarki opartej na kontenerze | Zabroń trybu sieci hosta.                                           |
| `sandbox.containers.denyContainerNamespaceJoin`       | Tryb sieci piaskownicy lub przeglądarki opartej na kontenerze | Zabroń dołączania do przestrzeni nazw sieci innego kontenera.       |
| `sandbox.containers.requireReadOnlyMounts`            | Tryb montowania piaskownicy lub przeglądarki opartej na kontenerze | Wymagaj montowania tylko do odczytu.                                |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Cele montowania piaskownicy lub przeglądarki opartej na kontenerze | Zabroń montowania gniazd środowiska uruchomieniowego kontenerów.    |
| `sandbox.containers.denyUnconfinedProfiles`           | Stan profilu zabezpieczeń kontenera                     | Zabroń nieograniczonych profili zabezpieczeń kontenera.             |
| `sandbox.browser.requireCdpSourceRange`               | Zakres źródłowy CDP przeglądarki w piaskownicy          | Wymagaj, aby ekspozycja CDP przeglądarki określała zakres źródłowy. |

Zasady traktują brak `sandbox.mode` jako jego niejawne ustawienie domyślne `off`,
dlatego `sandbox.requireMode` zgłasza nową lub nieskonfigurowaną piaskownicę jako
nienależącą do listy dozwolonych, takiej jak `["all"]`.

#### Obsługa danych

| Pole zasad                                         | Obserwowany stan                                                                     | Zastosowanie                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | Ustaw na `true`, aby odrzucać `logging.redactSensitive: "off"`.         |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | Ustaw na `true`, aby odrzucać przechwytywanie treści przez telemetrię.  |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | Ustaw na `true`, aby wymagać efektywnego trybu utrzymania sesji `enforce`. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` i `agents.*.memorySearch.experimental.sessionMemory`   | Ustaw na `true`, aby odrzucać indeksowanie transkrypcji sesji w pamięci. |

#### Sekrety

| Pole zasad                       | Obserwowany stan                                         | Zastosowanie                                                             |
| --------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------ |
| `secrets.requireManagedProviders` | Odwołania SecretRef w konfiguracji i deklaracje `secrets.providers.*` | Ustaw na `true`, aby wymagać, by odwołania SecretRef wskazywały zadeklarowanych dostawców. |
| `secrets.denySources`             | Źródła dostawców sekretów i źródła SecretRef             | Zabroń źródeł, takich jak `exec`, `file` lub inna skonfigurowana nazwa źródła. |
| `secrets.allowInsecureProviders`  | Flagi niezabezpieczonego stanu dostawcy sekretów         | Ustaw na `false`, aby odrzucać dostawców, którzy włączają niezabezpieczony stan. |

#### Zatwierdzenia wykonywania

Kontrole zatwierdzeń wykonywania odczytują artefakt środowiska uruchomieniowego
`exec-approvals.json`: domyślnie `~/.openclaw/exec-approvals.json` lub
`$OPENCLAW_STATE_DIR/exec-approvals.json`, gdy ustawiono `OPENCLAW_STATE_DIR`.
Reguły stanu w `execApprovals.defaults.*` lub `execApprovals.agents.*` wymagają
dowodu w postaci możliwego do odczytania artefaktu; brakujący lub nieprawidłowy
artefakt jest zgłaszany jako dowód niemożliwy do zaobserwowania, zamiast
uzyskiwać akceptację na zasadzie najlepszej próby. Gdy artefakt jest możliwy do
odczytania, pominięte pola dziedziczą wartości domyślne środowiska
uruchomieniowego: brak `defaults.security` oznacza `full`, a brak zabezpieczeń
agenta powoduje odziedziczenie tej wartości domyślnej. Dowód obejmuje
`defaults`, `agents.*`, `agents.*.allowlist[].pattern`, opcjonalne `argPattern`,
efektywny stan `autoAllowSkills` oraz źródło wpisu — nigdy ścieżkę ani token
gniazda, `commandText`, `lastUsedCommand`, rozpoznane ścieżki ani znaczniki czasu.

| Pole zasad                                 | Obserwowany stan                                                                       | Zastosowanie                                                                             |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | Aktywna ścieżka środowiska uruchomieniowego `exec-approvals.json`                      | Ustaw na `true`, aby wymagać istnienia i poprawnego przetworzenia artefaktu zatwierdzeń. |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`, domyślnie `full`                                                  | Zezwalaj tylko na zatwierdzone domyślne tryby zabezpieczeń zatwierdzania.                |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`, dziedziczące wartości domyślne                                    | Zezwalaj tylko na zatwierdzone efektywne tryby zabezpieczeń zatwierdzania dla poszczególnych agentów. |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` i `agents.*.autoAllowSkills`, dziedziczące wartości domyślne środowiska uruchomieniowego | Ustaw na `false`, aby wymagać ścisłych ręcznych list dozwolonych bez niejawnego zatwierdzania CLI Skills. |
| `execApprovals.agents.allowlist.expected`   | Zbiorcze wzorce `agents.*.allowlist[]` i opcjonalne wpisy argPattern                   | Wymagaj, aby lista dozwolonych zatwierdzeń odpowiadała zatwierdzonemu zestawowi wzorców. |

Przykład: wymagaj artefaktu zatwierdzeń, zabroń liberalnych wartości domyślnych
i zezwalaj tylko na zatwierdzony stan zatwierdzania wykonywania dla wybranych
agentów.

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Tryby zabezpieczeń: "deny", "allowlist" lub "full".
      // To ustawienie domyślne zezwala wyłącznie na restrykcyjny tryb "deny".
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Wybrani agenci mogą używać zweryfikowanego trybu "allowlist", ale nie "full".
          "allowSecurity": ["allowlist"],
          // false oznacza, że interfejsy CLI Skills muszą znajdować się na zweryfikowanej liście dozwolonych
          // zamiast uzyskiwać niejawne zatwierdzenie przez autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Prosty wpis: dokładny zweryfikowany wzorzec pliku wykonywalnego bez argPattern.
              "travel-hub",
              // Ograniczony wpis: wzorzec wraz ze zweryfikowanym wyrażeniem regularnym argumentów.
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

| Pole polityki                   | Obserwowany stan                              | Kiedy używać                                                                                |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | Metadane dostawcy i trybu `auth.profiles.*`  | Wymagaj w profilach uwierzytelniania konfiguracji kluczy metadanych, takich jak `provider` i `mode`. |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | Zezwalaj tylko na obsługiwane tryby profili uwierzytelniania, takie jak `api_key`, `aws-sdk`, `oauth` lub `token`. |

#### Metadane narzędzi

| Pole polityki           | Obserwowany stan                    | Kiedy używać                                                                                     |
| ----------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | Zarządzane deklaracje w `TOOLS.md`  | Wymagaj, aby zarządzane narzędzia deklarowały klucze metadanych, takie jak `risk`, `sensitivity` lub `owner`. |

#### Tryb narzędzi

| Pole polityki                    | Obserwowany stan                                              | Kiedy używać                                                                                                 |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` i `agents.list[].tools.profile`             | Zezwalaj tylko na identyfikatory profili narzędzi, takie jak `minimal`, `messaging` lub `coding`.         |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` i nadpisania `tools.fs` poszczególnych agentów | Ustaw na `true`, aby wymagać ograniczenia narzędzi systemu plików wyłącznie do obszaru roboczego.          |
| `tools.exec.allowSecurity`      | `tools.exec.security` i zabezpieczenia wykonywania poszczególnych agentów | Zezwalaj tylko na tryby zabezpieczeń wykonywania, takie jak `deny` lub `allowlist`.                        |
| `tools.exec.requireAsk`         | `tools.exec.ask` i tryb pytania o wykonanie poszczególnych agentów | Wymagaj trybu zatwierdzania, takiego jak `always`.                                                        |
| `tools.exec.allowHosts`         | `tools.exec.host` i routing hosta wykonywania poszczególnych agentów | Zezwalaj tylko na tryby routingu hosta wykonywania, takie jak `sandbox`.                                  |
| `tools.elevated.allow`          | `tools.elevated.enabled` i tryb podwyższonych uprawnień poszczególnych agentów | Ustaw na `false`, aby wymagać, by tryb narzędzi z podwyższonymi uprawnieniami pozostał wyłączony.          |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` i `tools.alsoAllow` poszczególnych agentów | Wymagaj dokładnych wpisów `alsoAllow` oraz zgłaszaj brakujące lub nieoczekiwane dodatkowe uprawnienia narzędzi. |
| `tools.denyTools`               | `tools.deny` i `agents.list[].tools.deny`                   | Wymagaj, aby skonfigurowane listy blokowanych narzędzi zawierały identyfikatory narzędzi lub grupy, takie jak `group:runtime` i `group:fs`. |

## Uruchamianie kontroli

Podczas tworzenia uruchamiaj kontrole ograniczone do polityki:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

Polecenie `policy check` uruchamia wyłącznie zestaw kontroli polityki i generuje materiał dowodowy, ustalenia oraz skróty poświadczenia. Te same ustalenia pojawiają się również w wyniku polecenia `openclaw doctor --lint`, gdy Plugin Policy jest włączony.

Porównaj plik polityki operatora z utworzoną konfiguracją bazową:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

Polecenie `policy compare` sprawdza składnię pliku polityki względem składni pliku polityki; nie sprawdza stanu środowiska uruchomieniowego, materiału dowodowego, danych uwierzytelniających ani sekretów. Używa tych samych metadanych reguł, które zarządzają nakładkami zakresowymi: listy dozwolonych muszą pozostać takie same lub węższe, listy blokowanych muszą pozostać takie same lub szersze, wymagane wartości logiczne muszą zachować swoją wartość, uporządkowane ciągi mogą przesuwać się wyłącznie w kierunku bardziej restrykcyjnego końca skonfigurowanej kolejności, a dokładne listy muszą być zgodne. Konfiguracja bazowa może być polityką utworzoną przez organizację; sprawdzana polityka może dodawać bardziej restrykcyjne wartości lub dodatkowe reguły. Reguła najwyższego poziomu w sprawdzanej polityce może spełniać zakresową regułę bazową, jeśli jest równie restrykcyjna lub bardziej restrykcyjna. Nazwy zakresów nie muszą być zgodne między plikami; porównanie jest kluczowane według selektora (`agentIds`/`channelIds`) i pola.

Pomyślne porównanie (`--json`):

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

Pomyślny wynik `policy check --json` zawiera stabilne skróty, które operator lub system nadzorujący może zapisać:

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

| Ustawienie                  | Przeznaczenie                                                               |
| -------------------------- | --------------------------------------------------------------------------- |
| `enabled`                  | Włącz kontrole polityki, nawet zanim plik `policy.jsonc` zacznie istnieć.   |
| `workspaceRepairs`         | Zezwól poleceniu `doctor --fix` na edytowanie ustawień obszaru roboczego zarządzanych przez politykę. |
| `expectedHash`             | Opcjonalna blokada skrótem zatwierdzonego artefaktu polityki.               |
| `expectedAttestationHash`  | Opcjonalna blokada skrótem ostatniej zaakceptowanej, pomyślnej kontroli polityki. |
| `path`                     | Lokalizacja artefaktu polityki względem obszaru roboczego.                  |

Ustaw `plugins.entries.policy.config.enabled` na `false`, aby wyłączyć kontrole polityki dla obszaru roboczego, pozostawiając Plugin zainstalowany.

## Akceptowanie stanu polityki

Przykładowy wynik JSON:

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
        "ref": "openai/gpt-5.6-sol",
        "provider": "openai",
        "model": "gpt-5.6-sol",
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

`attestation.policy.hash` identyfikuje utworzony artefakt reguł. Pole `evidence` rejestruje obserwowany stan OpenClaw użyty przez kontrole, a `workspace.hash` identyfikuje ten ładunek materiału dowodowego. `findingsHash` identyfikuje dokładny zestaw ustaleń. `checkedAt` rejestruje czas uruchomienia kontroli. `attestationHash` identyfikuje stabilne oświadczenie (skrót polityki, skrót materiału dowodowego, skrót ustaleń oraz stan pomyślny/niepomyślny) i celowo wyklucza `checkedAt`, dzięki czemu ten sam stan polityki zawsze generuje ten sam skrót poświadczenia. Te cztery wartości razem tworzą krotkę audytową pojedynczej kontroli polityki.

Jeśli Gateway lub system nadzorujący używa polityki do blokowania, zatwierdzania lub opisywania działania środowiska uruchomieniowego, powinien zapisać skrót poświadczenia z ostatniej pomyślnej kontroli. Pole `checkedAt` pozostaje w wyniku JSON na potrzeby dzienników audytu, ale nie jest częścią stabilnego skrótu.

Cykl akceptowania stanu polityki:

1. Utwórz lub zweryfikuj `policy.jsonc`.
2. Uruchom `openclaw policy check --json`.
3. Jeśli kontrola zakończy się pomyślnie, zapisz `attestation.policy.hash` jako `expectedHash`.
4. Zapisz `attestation.attestationHash` jako `expectedAttestationHash`.
5. Ponownie uruchom `openclaw doctor --lint` w CI lub bramkach wydania.

Jeśli reguły zasad zmieniono celowo, zaktualizuj oba akceptowane skróty na
podstawie czystego sprawdzenia. Jeśli zmieniają się tylko ustawienia obszaru roboczego
(zasady pozostają bez zmian), zwykle zmienia się tylko `expectedAttestationHash`.

Włączenie lub uaktualnienie reguł `agents.workspace` dodaje dowody `agentWorkspace`
do skrótu obszaru roboczego i skrótu atestacji; po włączeniu przejrzyj nowe dowody i
odśwież akceptowane skróty atestacji. Włączenie lub uaktualnienie reguł stanu
narzędzi dodaje dowody `toolPosture` w ten sam sposób.

Polecenie `openclaw policy watch` ponownie uruchamia sprawdzenie i zgłasza, gdy bieżące dowody
przestają odpowiadać wartości `expectedAttestationHash`:

```bash
openclaw policy watch --json
```

Użyj `--once` w CI lub skryptach wymagających pojedynczej oceny rozbieżności. Bez
`--once` polecenie domyślnie odpytuje co dwie sekundy; użyj `--interval-ms`, aby zmienić
interwał.

## Ustalenia

| Identyfikator sprawdzenia                                 | Ustalenie                                                                                          |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | Zasady są włączone, ale brakuje pliku `policy.jsonc`.                                               |
| `policy/policy-jsonc-invalid`                            | Nie można przeanalizować zasad lub zawierają one nieprawidłowo sformułowane wpisy reguł.            |
| `policy/policy-hash-mismatch`                            | Zasady nie odpowiadają skonfigurowanej wartości `expectedHash`.                                     |
| `policy/attestation-hash-mismatch`                       | Bieżące dowody zasad nie odpowiadają już zaakceptowanej atestacji.                                  |
| `policy/policy-conformance-invalid`                      | Bazowy lub sprawdzany plik zasad ma nieprawidłową składnię porównania.                              |
| `policy/policy-conformance-missing`                      | W sprawdzanym pliku zasad brakuje reguły wymaganej przez bazowy plik zasad.                         |
| `policy/policy-conformance-weaker`                       | Wartość w sprawdzanym pliku zasad jest mniej restrykcyjna niż w bazowym pliku zasad.                |
| `policy/channels-denied-provider`                        | Włączony kanał odpowiada regule odmowy kanału.                                                      |
| `policy/mcp-denied-server`                               | Skonfigurowany serwer MCP jest zabroniony przez zasady.                                             |
| `policy/mcp-unapproved-server`                           | Skonfigurowany serwer MCP nie znajduje się na liście dozwolonych.                                  |
| `policy/models-denied-provider`                          | Skonfigurowany dostawca modelu lub odwołanie do modelu używa zabronionego dostawcy.                 |
| `policy/models-unapproved-provider`                      | Skonfigurowany dostawca modelu lub odwołanie do modelu nie znajduje się na liście dozwolonych.      |
| `policy/network-private-access-enabled`                  | Mechanizm obejścia zabezpieczeń SSRF dla sieci prywatnej jest włączony, mimo że zasady go zabraniają. |
| `policy/ingress-dm-policy-unapproved`                    | Zasady wiadomości prywatnych kanału nie znajdują się na liście dozwolonych przez zasady.            |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` nie odpowiada zakresowi izolacji wiadomości prywatnych wymaganemu przez zasady.   |
| `policy/ingress-open-groups-denied`                      | Zasady grup kanału mają wartość `open`, mimo że zasady zabraniają otwartego ruchu przychodzącego grup. |
| `policy/ingress-group-mention-required`                  | Wpis kanału lub grupy wyłącza bramki wzmianek, mimo że zasady ich wymagają.                          |
| `policy/gateway-non-loopback-bind`                       | Stan powiązania Gateway zezwala na ekspozycję poza local loopback, mimo że zasady jej zabraniają.   |
| `policy/gateway-auth-disabled`                           | Uwierzytelnianie Gateway jest wyłączone, mimo że zasady go wymagają.                                |
| `policy/gateway-rate-limit-missing`                      | Stan ograniczania częstotliwości uwierzytelniania Gateway nie jest jawnie określony, mimo że zasady tego wymagają. |
| `policy/gateway-control-ui-insecure`                     | Włączone są przełączniki niezabezpieczonej ekspozycji interfejsu sterowania Gateway.                |
| `policy/gateway-tailscale-funnel`                        | Ekspozycja Gateway przez Tailscale Funnel jest włączona, mimo że zasady jej zabraniają.             |
| `policy/gateway-remote-enabled`                          | Tryb zdalny Gateway jest aktywny, mimo że zasady go zabraniają.                                     |
| `policy/gateway-http-endpoint-enabled`                   | Punkt końcowy HTTP API Gateway jest włączony, mimo że zasady go zabraniają.                         |
| `policy/gateway-http-url-fetch-unrestricted`             | Dane wejściowe pobierania adresów URL przez HTTP Gateway nie mają wymaganej listy dozwolonych adresów URL. |
| `policy/gateway-node-command-denied`                     | Polecenie Node zabronione przez zasady nie jest zabronione w konfiguracji OpenClaw.                 |
| `policy/agents-workspace-access-denied`                  | Tryb piaskownicy agenta lub dostęp do obszaru roboczego nie znajduje się na liście dozwolonych przez zasady. |
| `policy/agents-tool-not-denied`                          | Konfiguracja agenta lub konfiguracja domyślna nie zabrania narzędzia, którego zablokowania wymagają zasady. |
| `policy/tools-profile-unapproved`                        | Skonfigurowany globalny lub przypisany do agenta profil narzędzi nie znajduje się na liście dozwolonych. |
| `policy/tools-fs-workspace-only-required`                | Narzędzia systemu plików nie są skonfigurowane do obsługi wyłącznie ścieżek obszaru roboczego.      |
| `policy/tools-exec-security-unapproved`                  | Tryb zabezpieczeń wykonywania nie znajduje się na liście dozwolonych przez zasady.                  |
| `policy/tools-exec-ask-unapproved`                       | Tryb pytania przed wykonaniem nie znajduje się na liście dozwolonych przez zasady.                  |
| `policy/tools-exec-host-unapproved`                      | Trasowanie wykonywania do hosta nie znajduje się na liście dozwolonych przez zasady.                |
| `policy/tools-elevated-enabled`                          | Tryb narzędzi z podwyższonymi uprawnieniami jest włączony, mimo że zasady go zabraniają.            |
| `policy/tools-also-allow-missing`                        | W skonfigurowanej liście `alsoAllow` brakuje wpisu wymaganego przez zasady.                          |
| `policy/tools-also-allow-unexpected`                     | Skonfigurowana lista `alsoAllow` zawiera wpis, którego zasady nie przewidują.                        |
| `policy/tools-required-deny-missing`                     | Globalna lub przypisana do agenta lista zabronionych narzędzi nie zawiera wymaganego zabronionego narzędzia. |
| `policy/sandbox-mode-unapproved`                         | Tryb piaskownicy nie znajduje się na liście dozwolonych przez zasady.                               |
| `policy/sandbox-backend-unapproved`                      | Mechanizm zaplecza piaskownicy nie znajduje się na liście dozwolonych przez zasady.                 |
| `policy/sandbox-container-posture-unobservable`          | Reguła stanu kontenera jest włączona dla mechanizmu zaplecza, który nie może go obserwować.         |
| `policy/sandbox-container-host-network-denied`           | Piaskownica lub przeglądarka oparta na kontenerze używa trybu sieci hosta.                           |
| `policy/sandbox-container-namespace-join-denied`         | Piaskownica lub przeglądarka oparta na kontenerze dołącza do przestrzeni nazw innego kontenera.     |
| `policy/sandbox-container-mount-mode-required`           | Montowanie piaskownicy lub przeglądarki opartej na kontenerze nie jest tylko do odczytu.            |
| `policy/sandbox-container-runtime-socket-mount`          | Montowanie piaskownicy lub przeglądarki opartej na kontenerze udostępnia gniazdo środowiska wykonawczego kontenera. |
| `policy/sandbox-container-unconfined-profile`            | Profil piaskownicy kontenera jest nieograniczony, mimo że zasady tego zabraniają.                   |
| `policy/sandbox-browser-cdp-source-range-missing`        | Brakuje zakresu źródłowego CDP przeglądarki w piaskownicy, mimo że zasady go wymagają.               |
| `policy/data-handling-redaction-disabled`                | Redagowanie poufnych danych w dziennikach jest wyłączone, mimo że zasady go wymagają.               |
| `policy/data-handling-telemetry-content-capture`         | Przechwytywanie treści telemetrycznych jest włączone, mimo że zasady go zabraniają.                 |
| `policy/data-handling-session-retention-not-enforced`    | Obsługa okresu przechowywania sesji nie jest wymuszana, mimo że zasady tego wymagają.               |
| `policy/data-handling-session-transcript-memory-enabled` | Indeksowanie pamięci transkrypcji sesji jest włączone, mimo że zasady go zabraniają.                 |
| `policy/secrets-unmanaged-provider`                      | Wartość SecretRef w konfiguracji odwołuje się do dostawcy niezadeklarowanego w `secrets.providers`. |
| `policy/secrets-denied-provider-source`                  | Dostawca sekretów w konfiguracji lub SecretRef używa źródła zabronionego przez zasady.              |
| `policy/secrets-insecure-provider`                       | Dostawca sekretów wybiera niezabezpieczony stan, mimo że zasady go zabraniają.                      |
| `policy/auth-profile-invalid-metadata`                   | W profilu uwierzytelniania konfiguracji brakuje prawidłowych metadanych dostawcy lub trybu.         |
| `policy/auth-profile-unapproved-mode`                    | Tryb profilu uwierzytelniania konfiguracji nie znajduje się na liście dozwolonych przez zasady.     |
| `policy/exec-approvals-missing`                          | Zasady wymagają pliku `exec-approvals.json`, ale brakuje tego artefaktu.                            |
| `policy/exec-approvals-invalid`                          | Nie można przeanalizować skonfigurowanego artefaktu zatwierdzeń wykonywania.                        |
| `policy/exec-approvals-default-security-unapproved`      | Domyślne ustawienia zatwierdzania wykonywania używają trybu zabezpieczeń spoza listy dozwolonych przez zasady. |
| `policy/exec-approvals-agent-security-unapproved`        | Efektywny tryb zabezpieczeń zatwierdzania wykonywania dla agenta nie znajduje się na liście dozwolonych. |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Agent zatwierdzający wykonanie niejawnie automatycznie zezwala na interfejsy CLI Skills, mimo że zasady tego zabraniają. |
| `policy/exec-approvals-allowlist-missing`                | Na liście dozwolonych zatwierdzeń brakuje wzorca wymaganego przez zasady.                           |
| `policy/exec-approvals-allowlist-unexpected`             | Lista dozwolonych zatwierdzeń zawiera wzorzec, którego zasady nie przewidują.                        |
| `policy/tools-missing-risk-level`                        | W deklaracji nadzorowanego narzędzia brakuje metadanych ryzyka.                                    |
| `policy/tools-unknown-risk-level`                        | Deklaracja nadzorowanego narzędzia używa nieznanej wartości ryzyka.                                |
| `policy/tools-missing-sensitivity-token`                 | W deklaracji nadzorowanego narzędzia brakuje metadanych wrażliwości.                               |
| `policy/tools-missing-owner`                             | W deklaracji nadzorowanego narzędzia brakuje metadanych właściciela.                               |
| `policy/tools-unknown-sensitivity-token`                 | Deklaracja nadzorowanego narzędzia używa nieznanej wartości wrażliwości.                            |

Ustalenie może zawierać zarówno pole `target` (zaobserwowany element obszaru roboczego, który
nie jest zgodny), jak i `requirement` (zdefiniowaną regułę, która spowodowała utworzenie ustalenia).
Obecnie oba są ciągami adresowymi `oc://`, ale nazwy pól opisują rolę w zasadach,
a nie format adresu.

Przykładowe ustalenia:

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

```json
{
  "checkId": "policy/gateway-node-command-denied",
  "severity": "error",
  "message": "Gateway node command 'system.run' is denied by policy but not denied by OpenClaw config.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "Add 'system.run' to gateway.nodes.denyCommands or update policy after review."
}
```

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

`doctor --lint` i `policy check` działają tylko do odczytu.

`doctor --fix` edytuje ustawienia przestrzeni roboczej zarządzane przez zasady tylko wtedy, gdy opcja
`workspaceRepairs` jest jawnie włączona; w przeciwnym razie kontrole zgłaszają, co
zostałoby naprawione, i pozostawiają ustawienia bez zmian.

W tej wersji naprawa może wyłączać kanały zabronione przez `channels.denyRules` oraz
stosować wymienione poniżej automatyczne naprawy zawężające. Włącz opcję `workspaceRepairs`
dopiero po sprawdzeniu pliku zasad, ponieważ prawidłowa reguła może zmienić
konfigurację przestrzeni roboczej:

- ustawić `tools.elevated.enabled=false`, gdy zasady globalne zabraniają narzędzi z podwyższonymi uprawnieniami
- dodać brakujące identyfikatory narzędzi, których użycie musi być zabronione, do `tools.deny` lub
  `agents.list[].tools.deny`, gdy zasady wymagają zablokowania tych narzędzi
- ustawić niezabezpieczone przełączniki `gateway.controlUi.*` na `false`
- ustawić `gateway.mode=local`, gdy zasady zabraniają zdalnego trybu Gateway
- ustawić zgłoszone ścieżki `gateway.http.endpoints.*.enabled` na `false`, gdy zasady
  zabraniają punktów końcowych HTTP API Gateway
- ustawić zgłoszone ścieżki przychodzącego ruchu kanału `groupPolicy` na `allowlist`, gdy zasady
  zabraniają otwartego przychodzącego ruchu grupowego
- ustawić zgłoszone ścieżki przychodzącego ruchu kanału `requireMention` na `true`, gdy zasady
  wymagają wzmianek w grupach
- ustawić `logging.redactSensitive=tools`, gdy zasady wymagają redagowania
  poufnych danych w dziennikach
- ustawić `diagnostics.otel.captureContent=false` albo
  `diagnostics.otel.captureContent.enabled=false` dla ustawień przechwytywania telemetrii
  w postaci obiektu, gdy zasady zabraniają przechwytywania treści telemetrii

Naprawy narzędzi z podwyższonymi uprawnieniami o ograniczonym zakresie są obsługiwane wyłącznie w trybie wykrywania. Naprawy obsługi danych o ograniczonym zakresie są
również pomijane, gdy znalezisko zgłasza współdzieloną konfigurację dzienników lub telemetrii,
ponieważ zmiana współdzielonego ustawienia wpłynęłaby na więcej elementów niż tylko cel zasad
o ograniczonym zakresie.

Naprawy wymaganych blokad o ograniczonym zakresie są pomijane, gdy znalezisko zgłasza odziedziczone główne
`tools.deny`, ponieważ dodanie wymaganego narzędzia do głównej konfiguracji wpłynęłoby
na więcej elementów niż tylko cel zasad o ograniczonym zakresie. Lokalne dla agenta naprawy wymaganych blokad mogą aktualizować
zgłoszoną ścieżkę `agents.list[].tools.deny`.

Naprawy przychodzącego ruchu kanału o ograniczonym zakresie są pomijane, gdy znalezisko zgłasza odziedziczone
`channels.defaults.*`, ponieważ zmiana współdzielonej wartości domyślnej kanału wpłynęłaby
na więcej elementów niż tylko cel zasad o ograniczonym zakresie. Znaleziska listy dozwolonych adresów pobierania URL przez HTTP Gateway
wymagają ręcznej naprawy, ponieważ automatyczna naprawa nie może wybrać prawidłowych wartości
listy dozwolonych adresów URL punktu końcowego.

Znaleziska dotyczące powiązania Gateway i poleceń Node nadal wymagają sprawdzenia. Gdy
`policy/gateway-non-loopback-bind` lub `policy/gateway-node-command-denied`
można przypisać do ścieżki konfiguracji, `doctor --fix` zgłasza proponowaną zmianę
`gateway.bind` lub `gateway.nodes.denyCommands` jako pominięty podgląd
wskazówek. Nie stosuje tej zmiany, a znalezisko nie jest uznawane za
naprawione, dopóki operator nie sprawdzi i nie zaktualizuje konfiguracji lub zasad.

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

| Polecenie        | `0`                                                    | `1`                                                                 | `2`                          |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------------- |
| `policy check`   | Brak znalezisk na poziomie progowym.                   | Co najmniej jedno znalezisko osiągnęło poziom progowy.              | Błąd argumentu lub działania. |
| `policy compare` | Plik zasad jest co najmniej tak restrykcyjny jak poziom bazowy. | Plik zasad jest nieprawidłowy, nie istnieje lub jest mniej restrykcyjny niż reguły bazowe. | Błąd argumentu lub działania. |
| `policy watch`   | Brak znalezisk, a zaakceptowany skrót jest aktualny.   | Istnieją znaleziska lub zaakceptowane poświadczenie jest nieaktualne. | Błąd argumentu lub działania. |

## Powiązane

- [Tryb lint narzędzia Doctor](/pl/cli/doctor#lint-mode)
- [CLI ścieżek](/pl/cli/path)
