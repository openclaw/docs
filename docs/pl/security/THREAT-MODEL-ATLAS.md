---
read_when:
    - Przeglądasz stan bezpieczeństwa lub scenariusze zagrożeń
    - Pracujesz nad funkcjami bezpieczeństwa lub odpowiedziami na audyt
summary: Model zagrożeń OpenClaw odwzorowany na framework MITRE ATLAS
title: Model zagrożeń (MITRE ATLAS)
x-i18n:
    generated_at: "2026-04-05T14:07:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05561381c73e8efe20c8b59cd717e66447ee43988018e9670161cc63e650f2bf
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 15
---

# Model zagrożeń OpenClaw v1.0

## Framework MITRE ATLAS

**Wersja:** 1.0-draft
**Ostatnia aktualizacja:** 2026-02-04
**Metodologia:** MITRE ATLAS + diagramy przepływu danych
**Framework:** [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems)

### Atrybucja frameworka

Ten model zagrożeń opiera się na [MITRE ATLAS](https://atlas.mitre.org/), standardowym w branży frameworku do dokumentowania przeciwnych zagrożeń dla systemów AI/ML. ATLAS jest utrzymywany przez [MITRE](https://www.mitre.org/) we współpracy ze społecznością bezpieczeństwa AI.

**Kluczowe zasoby ATLAS:**

- [Techniki ATLAS](https://atlas.mitre.org/techniques/)
- [Taktyki ATLAS](https://atlas.mitre.org/tactics/)
- [Studia przypadków ATLAS](https://atlas.mitre.org/studies/)
- [ATLAS GitHub](https://github.com/mitre-atlas/atlas-data)
- [Wkład do ATLAS](https://atlas.mitre.org/resources/contribute)

### Wkład do tego modelu zagrożeń

To żywy dokument utrzymywany przez społeczność OpenClaw. Zobacz [CONTRIBUTING-THREAT-MODEL.md](/security/CONTRIBUTING-THREAT-MODEL), aby poznać wytyczne dotyczące współtworzenia:

- zgłaszania nowych zagrożeń
- aktualizowania istniejących zagrożeń
- proponowania łańcuchów ataku
- sugerowania zabezpieczeń

---

## 1. Wprowadzenie

### 1.1 Cel

Ten model zagrożeń dokumentuje przeciwne zagrożenia dla platformy agentów AI OpenClaw i marketplace'u Skills ClawHub z użyciem frameworka MITRE ATLAS zaprojektowanego specjalnie dla systemów AI/ML.

### 1.2 Zakres

| Komponent              | Uwzględniony | Uwagi                                            |
| ---------------------- | ------------ | ------------------------------------------------ |
| Runtime agenta OpenClaw | Tak         | Główne wykonywanie agenta, wywołania narzędzi, sesje |
| Gateway                | Tak          | Uwierzytelnianie, routing, integracja kanałów    |
| Integracje kanałów     | Tak          | WhatsApp, Telegram, Discord, Signal, Slack itd.  |
| Marketplace ClawHub    | Tak          | Publikowanie Skills, moderacja, dystrybucja      |
| Serwery MCP            | Tak          | Zewnętrzni dostawcy narzędzi                     |
| Urządzenia użytkownika | Częściowo    | Aplikacje mobilne, klienci desktopowi            |

### 1.3 Poza zakresem

Nic nie jest jawnie wyłączone z zakresu tego modelu zagrożeń.

---

## 2. Architektura systemu

### 2.1 Granice zaufania

```
┌─────────────────────────────────────────────────────────────────┐
│                    STREFA NIEZAUFANA                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│              GRANICA ZAUFANIA 1: Dostęp kanałowy                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Parowanie urządzeń (1 h DM / 5 min okres łaski węzła) │   │
│  │  • Walidacja AllowFrom / AllowList                       │   │
│  │  • Uwierzytelnianie tokenem/hasłem/Tailscale            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│             GRANICA ZAUFANIA 2: Izolacja sesji                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   SESJE AGENTA                            │   │
│  │  • Klucz sesji = agent:channel:peer                      │   │
│  │  • Polityki narzędzi per agent                           │   │
│  │  • Logowanie transkryptów                                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│            GRANICA ZAUFANIA 3: Wykonywanie narzędzi              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 SANDBOX WYKONYWANIA                        │   │
│  │  • Sandbox Docker LUB host (exec-approvals)              │   │
│  │  • Zdalne wykonywanie Node                                │   │
│  │  • Ochrona SSRF (pinning DNS + blokowanie IP)             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│            GRANICA ZAUFANIA 4: Treści zewnętrzne                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          POBRANE URL / E-MAILE / WEBHOOKI                 │   │
│  │  • Opakowywanie treści zewnętrznych (tagi XML)            │   │
│  │  • Wstrzykiwanie powiadomień bezpieczeństwa               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          GRANICA ZAUFANIA 5: Łańcuch dostaw                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Publikowanie Skills (semver, wymagane SKILL.md)       │   │
│  │  • Flagi moderacji oparte na wzorcach                    │   │
│  │  • Skanowanie VirusTotal (wkrótce)                       │   │
│  │  • Weryfikacja wieku konta GitHub                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Przepływy danych

| Przepływ | Źródło  | Miejsce docelowe | Dane              | Ochrona              |
| -------- | ------- | ---------------- | ----------------- | -------------------- |
| F1       | Kanał   | Gateway          | Wiadomości użytkownika | TLS, AllowFrom   |
| F2       | Gateway | Agent            | Routowane wiadomości | Izolacja sesji    |
| F3       | Agent   | Narzędzia        | Wywołania narzędzi   | Egzekwowanie polityk |
| F4       | Agent   | Zewnętrzne       | żądania web_fetch   | Blokowanie SSRF    |
| F5       | ClawHub | Agent            | Kod Skills          | Moderacja, skanowanie |
| F6       | Agent   | Kanał            | Odpowiedzi          | Filtrowanie wyjścia |

---

## 3. Analiza zagrożeń według taktyki ATLAS

### 3.1 Rozpoznanie (AML.TA0002)

#### T-RECON-001: Wykrywanie endpointów agenta

| Atrybut                | Wartość                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0006 - Active Scanning                                          |
| **Opis**               | Atakujący skanuje w poszukiwaniu wystawionych endpointów gateway OpenClaw |
| **Wektor ataku**       | Skanowanie sieci, zapytania do shodan, enumeracja DNS                |
| **Dotknięte komponenty** | Gateway, wystawione endpointy API                                  |
| **Obecne zabezpieczenia** | Opcja uwierzytelniania Tailscale, domyślne bindowanie do loopback |
| **Ryzyko rezydualne**  | Średnie - Publiczne gatewaye są wykrywalne                           |
| **Rekomendacje**       | Udokumentować bezpieczne wdrożenie, dodać rate limiting na endpointach wykrywania |

#### T-RECON-002: Sondowanie integracji kanałów

| Atrybut                | Wartość                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| **ATLAS ID**           | AML.T0006 - Active Scanning                                        |
| **Opis**               | Atakujący sonduje kanały komunikacyjne, aby zidentyfikować konta zarządzane przez AI |
| **Wektor ataku**       | Wysyłanie testowych wiadomości, obserwacja wzorców odpowiedzi      |
| **Dotknięte komponenty** | Wszystkie integracje kanałów                                     |
| **Obecne zabezpieczenia** | Brak specyficznych                                               |
| **Ryzyko rezydualne**  | Niskie - Samo wykrycie ma ograniczoną wartość                      |
| **Rekomendacje**       | Rozważyć randomizację czasu odpowiedzi                             |

---

### 3.2 Dostęp początkowy (AML.TA0004)

#### T-ACCESS-001: Przechwycenie kodu parowania

| Atrybut                | Wartość                                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0040 - AI Model Inference API Access                                                                         |
| **Opis**               | Atakujący przechwytuje kod parowania w okresie łaski parowania (1 h dla parowania kanału DM, 5 min dla parowania węzła) |
| **Wektor ataku**       | Podglądanie przez ramię, sniffing sieci, inżynieria społeczna                                                     |
| **Dotknięte komponenty** | System parowania urządzeń                                                                                        |
| **Obecne zabezpieczenia** | Wygaśnięcie po 1 h (parowanie DM) / 5 min (parowanie węzła), kody wysyłane istniejącym kanałem               |
| **Ryzyko rezydualne**  | Średnie - Możliwość wykorzystania okresu łaski                                                                    |
| **Rekomendacje**       | Skrócić okres łaski, dodać krok potwierdzenia                                                                     |

#### T-ACCESS-002: Podszywanie się pod AllowFrom

| Atrybut                | Wartość                                                                          |
| ---------------------- | ------------------------------------------------------------------------------ |
| **ATLAS ID**           | AML.T0040 - AI Model Inference API Access                                      |
| **Opis**               | Atakujący podszywa się pod dozwoloną tożsamość nadawcy w kanale                |
| **Wektor ataku**       | Zależy od kanału - spoofing numeru telefonu, podszywanie się pod nazwę użytkownika |
| **Dotknięte komponenty** | Walidacja AllowFrom per kanał                                                 |
| **Obecne zabezpieczenia** | Weryfikacja tożsamości specyficzna dla kanału                                |
| **Ryzyko rezydualne**  | Średnie - Niektóre kanały są podatne na spoofing                               |
| **Rekomendacje**       | Udokumentować ryzyka specyficzne dla kanałów, dodać weryfikację kryptograficzną tam, gdzie to możliwe |

#### T-ACCESS-003: Kradzież tokenu

| Atrybut                | Wartość                                                       |
| ---------------------- | ------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0040 - AI Model Inference API Access                     |
| **Opis**               | Atakujący kradnie tokeny uwierzytelniania z plików konfiguracyjnych |
| **Wektor ataku**       | Malware, nieautoryzowany dostęp do urządzenia, ujawnienie kopii zapasowej konfiguracji |
| **Dotknięte komponenty** | ~/.openclaw/credentials/, przechowywanie konfiguracji       |
| **Obecne zabezpieczenia** | Uprawnienia plików                                          |
| **Ryzyko rezydualne**  | Wysokie - Tokeny są przechowywane jawnym tekstem              |
| **Rekomendacje**       | Wdrożyć szyfrowanie tokenów w spoczynku, dodać rotację tokenów |

---

### 3.3 Wykonanie (AML.TA0005)

#### T-EXEC-001: Bezpośredni prompt injection

| Atrybut                | Wartość                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0051.000 - LLM Prompt Injection: Direct                                                |
| **Opis**               | Atakujący wysyła spreparowane prompty, aby manipulować zachowaniem agenta                  |
| **Wektor ataku**       | Wiadomości w kanałach zawierające przeciwne instrukcje                                      |
| **Dotknięte komponenty** | LLM agenta, wszystkie powierzchnie wejściowe                                              |
| **Obecne zabezpieczenia** | Wykrywanie wzorców, opakowywanie treści zewnętrznych                                     |
| **Ryzyko rezydualne**  | Krytyczne - Tylko wykrywanie, bez blokowania; zaawansowane ataki omijają zabezpieczenia    |
| **Rekomendacje**       | Wdrożyć obronę wielowarstwową, walidację wyjścia, potwierdzenie użytkownika dla działań wrażliwych |

#### T-EXEC-002: Pośredni prompt injection

| Atrybut                | Wartość                                                       |
| ---------------------- | ------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0051.001 - LLM Prompt Injection: Indirect                |
| **Opis**               | Atakujący osadza złośliwe instrukcje w pobieranej treści      |
| **Wektor ataku**       | Złośliwe URL, zatrute e-maile, przejęte webhooki              |
| **Dotknięte komponenty** | web_fetch, ingest e-maili, zewnętrzne źródła danych         |
| **Obecne zabezpieczenia** | Opakowywanie treści tagami XML i komunikatem bezpieczeństwa |
| **Ryzyko rezydualne**  | Wysokie - LLM może zignorować instrukcje wrappera             |
| **Rekomendacje**       | Wdrożyć sanityzację treści, oddzielne konteksty wykonywania   |

#### T-EXEC-003: Wstrzyknięcie argumentów narzędzia

| Atrybut                | Wartość                                                        |
| ---------------------- | -------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0051.000 - LLM Prompt Injection: Direct                   |
| **Opis**               | Atakujący manipuluje argumentami narzędzia przez prompt injection |
| **Wektor ataku**       | Spreparowane prompty wpływające na wartości parametrów narzędzia |
| **Dotknięte komponenty** | Wszystkie wywołania narzędzi                                  |
| **Obecne zabezpieczenia** | Exec approvals dla niebezpiecznych poleceń                   |
| **Ryzyko rezydualne**  | Wysokie - Oparte na ocenie użytkownika                         |
| **Rekomendacje**       | Wdrożyć walidację argumentów, parametryzowane wywołania narzędzi |

#### T-EXEC-004: Ominięcie exec approval

| Atrybut                | Wartość                                                      |
| ---------------------- | ------------------------------------------------------------ |
| **ATLAS ID**           | AML.T0043 - Craft Adversarial Data                           |
| **Opis**               | Atakujący tworzy polecenia omijające allowlistę zatwierdzeń  |
| **Wektor ataku**       | Obfuskacja poleceń, nadużycie aliasów, manipulacja ścieżkami |
| **Dotknięte komponenty** | exec-approvals.ts, allowlista poleceń                      |
| **Obecne zabezpieczenia** | Allowlista + tryb ask                                       |
| **Ryzyko rezydualne**  | Wysokie - Brak sanityzacji poleceń                           |
| **Rekomendacje**       | Wdrożyć normalizację poleceń, rozszerzyć blocklistę          |

---

### 3.4 Trwałość (AML.TA0006)

#### T-PERSIST-001: Instalacja złośliwego Skill

| Atrybut                | Wartość                                                                    |
| ---------------------- | -------------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0010.001 - Supply Chain Compromise: AI Software                       |
| **Opis**               | Atakujący publikuje złośliwy Skill w ClawHub                               |
| **Wektor ataku**       | Utworzenie konta, publikacja Skill z ukrytym złośliwym kodem               |
| **Dotknięte komponenty** | ClawHub, ładowanie Skills, wykonywanie agenta                            |
| **Obecne zabezpieczenia** | Weryfikacja wieku konta GitHub, flagi moderacji oparte na wzorcach       |
| **Ryzyko rezydualne**  | Krytyczne - Brak sandboxingu, ograniczony przegląd                         |
| **Rekomendacje**       | Integracja z VirusTotal (w toku), sandboxing Skills, przegląd społecznościowy |

#### T-PERSIST-002: Zatrucie aktualizacji Skill

| Atrybut                | Wartość                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0010.001 - Supply Chain Compromise: AI Software             |
| **Opis**               | Atakujący przejmuje popularny Skill i wypycha złośliwą aktualizację |
| **Wektor ataku**       | Przejęcie konta, inżynieria społeczna wobec właściciela Skill    |
| **Dotknięte komponenty** | Wersjonowanie ClawHub, przepływy auto-update                    |
| **Obecne zabezpieczenia** | Fingerprinting wersji                                          |
| **Ryzyko rezydualne**  | Wysokie - Auto-update może pobrać złośliwe wersje                |
| **Rekomendacje**       | Wdrożyć podpisywanie aktualizacji, możliwość rollbacku, pinning wersji |

#### T-PERSIST-003: Manipulacja konfiguracją agenta

| Atrybut                | Wartość                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0010.002 - Supply Chain Compromise: Data                     |
| **Opis**               | Atakujący modyfikuje konfigurację agenta, aby utrzymać dostęp     |
| **Wektor ataku**       | Modyfikacja pliku konfiguracyjnego, wstrzykiwanie ustawień        |
| **Dotknięte komponenty** | Konfiguracja agenta, polityki narzędzi                          |
| **Obecne zabezpieczenia** | Uprawnienia plików                                              |
| **Ryzyko rezydualne**  | Średnie - Wymaga lokalnego dostępu                                |
| **Rekomendacje**       | Weryfikacja integralności konfiguracji, logowanie audytowe zmian konfiguracji |

---

### 3.5 Unikanie obrony (AML.TA0007)

#### T-EVADE-001: Ominięcie wzorców moderacji

| Atrybut                | Wartość                                                                    |
| ---------------------- | -------------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0043 - Craft Adversarial Data                                         |
| **Opis**               | Atakujący przygotowuje treść Skill tak, aby ominąć wzorce moderacji        |
| **Wektor ataku**       | Homoglify Unicode, sztuczki kodowania, ładowanie dynamiczne                |
| **Dotknięte komponenty** | ClawHub moderation.ts                                                     |
| **Obecne zabezpieczenia** | Oparte na wzorcach FLAG_RULES                                            |
| **Ryzyko rezydualne**  | Wysokie - Proste regexy łatwo ominąć                                       |
| **Rekomendacje**       | Dodać analizę behawioralną (VirusTotal Code Insight), wykrywanie oparte na AST |

#### T-EVADE-002: Ucieczka z wrappera treści

| Atrybut                | Wartość                                                     |
| ---------------------- | ----------------------------------------------------------- |
| **ATLAS ID**           | AML.T0043 - Craft Adversarial Data                          |
| **Opis**               | Atakujący tworzy treść, która wydostaje się z kontekstu wrappera XML |
| **Wektor ataku**       | Manipulacja tagami, mylenie kontekstu, nadpisanie instrukcji |
| **Dotknięte komponenty** | Opakowywanie treści zewnętrznych                           |
| **Obecne zabezpieczenia** | Tagi XML + komunikat bezpieczeństwa                        |
| **Ryzyko rezydualne**  | Średnie - Regularnie odkrywane są nowe metody ucieczki      |
| **Rekomendacje**       | Wiele warstw wrapperów, walidacja po stronie wyjścia        |

---

### 3.6 Odkrywanie (AML.TA0008)

#### T-DISC-001: Enumeracja narzędzi

| Atrybut                | Wartość                                                 |
| ---------------------- | ------------------------------------------------------- |
| **ATLAS ID**           | AML.T0040 - AI Model Inference API Access               |
| **Opis**               | Atakujący enumeruje dostępne narzędzia przez prompty    |
| **Wektor ataku**       | Zapytania typu „Jakie masz narzędzia?”                  |
| **Dotknięte komponenty** | Rejestr narzędzi agenta                                |
| **Obecne zabezpieczenia** | Brak specyficznych                                     |
| **Ryzyko rezydualne**  | Niskie - Narzędzia są zwykle udokumentowane             |
| **Rekomendacje**       | Rozważyć kontrolę widoczności narzędzi                  |

#### T-DISC-002: Ekstrakcja danych sesji

| Atrybut                | Wartość                                                 |
| ---------------------- | ------------------------------------------------------- |
| **ATLAS ID**           | AML.T0040 - AI Model Inference API Access               |
| **Opis**               | Atakujący wyciąga wrażliwe dane z kontekstu sesji       |
| **Wektor ataku**       | Zapytania typu „O czym rozmawialiśmy?”, sondowanie kontekstu |
| **Dotknięte komponenty** | Transkrypty sesji, okno kontekstu                      |
| **Obecne zabezpieczenia** | Izolacja sesji per nadawca                             |
| **Ryzyko rezydualne**  | Średnie - Dane wewnątrz sesji są dostępne               |
| **Rekomendacje**       | Wdrożyć redakcję danych wrażliwych w kontekście         |

---

### 3.7 Zbieranie i eksfiltracja (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Kradzież danych przez web_fetch

| Atrybut                | Wartość                                                                    |
| ---------------------- | -------------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0009 - Collection                                                     |
| **Opis**               | Atakujący eksfiltruje dane, instruując agenta, aby wysłał je pod zewnętrzny URL |
| **Wektor ataku**       | Prompt injection powodujący, że agent wykona POST z danymi na serwer atakującego |
| **Dotknięte komponenty** | Narzędzie web_fetch                                                      |
| **Obecne zabezpieczenia** | Blokowanie SSRF dla sieci wewnętrznych                                   |
| **Ryzyko rezydualne**  | Wysokie - Zewnętrzne URL są dozwolone                                      |
| **Rekomendacje**       | Wdrożyć allowlistę URL, świadomość klasyfikacji danych                    |

#### T-EXFIL-002: Nieautoryzowane wysyłanie wiadomości

| Atrybut                | Wartość                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0009 - Collection                                               |
| **Opis**               | Atakujący powoduje, że agent wysyła wiadomości zawierające wrażliwe dane |
| **Wektor ataku**       | Prompt injection powodujący, że agent wysyła wiadomość do atakującego |
| **Dotknięte komponenty** | Narzędzie wiadomości, integracje kanałów                            |
| **Obecne zabezpieczenia** | Gating wiadomości wychodzących                                      |
| **Ryzyko rezydualne**  | Średnie - Gating może zostać ominięty                                |
| **Rekomendacje**       | Wymagać jawnego potwierdzenia dla nowych odbiorców                   |

#### T-EXFIL-003: Zbieranie poświadczeń

| Atrybut                | Wartość                                                   |
| ---------------------- | --------------------------------------------------------- |
| **ATLAS ID**           | AML.T0009 - Collection                                    |
| **Opis**               | Złośliwy Skill zbiera poświadczenia z kontekstu agenta    |
| **Wektor ataku**       | Kod Skill odczytuje zmienne środowiskowe, pliki konfiguracji |
| **Dotknięte komponenty** | Środowisko wykonywania Skill                             |
| **Obecne zabezpieczenia** | Brak specyficznych dla Skills                            |
| **Ryzyko rezydualne**  | Krytyczne - Skills działają z uprawnieniami agenta        |
| **Rekomendacje**       | Sandboxing Skills, izolacja poświadczeń                   |

---

### 3.8 Wpływ (AML.TA0011)

#### T-IMPACT-001: Nieautoryzowane wykonywanie poleceń

| Atrybut                | Wartość                                                 |
| ---------------------- | ------------------------------------------------------- |
| **ATLAS ID**           | AML.T0031 - Erode AI Model Integrity                    |
| **Opis**               | Atakujący wykonuje dowolne polecenia w systemie użytkownika |
| **Wektor ataku**       | Prompt injection połączony z ominięciem exec approval   |
| **Dotknięte komponenty** | Narzędzie Bash, wykonywanie poleceń                    |
| **Obecne zabezpieczenia** | Exec approvals, opcja sandbox Docker                   |
| **Ryzyko rezydualne**  | Krytyczne - Wykonywanie na hoście bez sandboxa          |
| **Rekomendacje**       | Domyślnie używać sandboxa, poprawić UX zatwierdzania    |

#### T-IMPACT-002: Wyczerpanie zasobów (DoS)

| Atrybut                | Wartość                                               |
| ---------------------- | ----------------------------------------------------- |
| **ATLAS ID**           | AML.T0031 - Erode AI Model Integrity                  |
| **Opis**               | Atakujący wyczerpuje kredyty API lub zasoby obliczeniowe |
| **Wektor ataku**       | Zautomatyzowany flood wiadomości, kosztowne wywołania narzędzi |
| **Dotknięte komponenty** | Gateway, sesje agenta, provider API                  |
| **Obecne zabezpieczenia** | Brak                                                  |
| **Ryzyko rezydualne**  | Wysokie - Brak rate limitingu                         |
| **Rekomendacje**       | Wdrożyć limity per nadawca, budżety kosztów           |

#### T-IMPACT-003: Szkoda reputacyjna

| Atrybut                | Wartość                                                     |
| ---------------------- | ----------------------------------------------------------- |
| **ATLAS ID**           | AML.T0031 - Erode AI Model Integrity                        |
| **Opis**               | Atakujący powoduje, że agent wysyła szkodliwe/obraźliwe treści |
| **Wektor ataku**       | Prompt injection powodujący nieodpowiednie odpowiedzi       |
| **Dotknięte komponenty** | Generowanie wyjścia, wiadomości kanałowe                   |
| **Obecne zabezpieczenia** | Polityki treści providera LLM                              |
| **Ryzyko rezydualne**  | Średnie - Filtry providera są niedoskonałe                  |
| **Rekomendacje**       | Warstwa filtrowania wyjścia, kontrola użytkownika           |

---

## 4. Analiza łańcucha dostaw ClawHub

### 4.1 Obecne mechanizmy bezpieczeństwa

| Mechanizm             | Implementacja               | Skuteczność                                            |
| --------------------- | --------------------------- | ------------------------------------------------------ |
| Wiek konta GitHub     | `requireGitHubAccountAge()` | Średnia - Podnosi poprzeczkę dla nowych atakujących    |
| Sanityzacja ścieżek   | `sanitizePath()`            | Wysoka - Zapobiega path traversal                      |
| Walidacja typu pliku  | `isTextFile()`              | Średnia - Tylko pliki tekstowe, ale nadal mogą być złośliwe |
| Limity rozmiaru       | 50 MB całego bundla         | Wysoka - Zapobiega wyczerpaniu zasobów                 |
| Wymagane SKILL.md     | Obowiązkowy readme          | Niska wartość bezpieczeństwa - Tylko informacyjne      |
| Moderacja wzorców     | FLAG_RULES w moderation.ts  | Niska - Łatwe do obejścia                              |
| Status moderacji      | pole `moderationStatus`     | Średnia - Możliwy ręczny przegląd                      |

### 4.2 Wzorce flag moderacji

Obecne wzorce w `moderation.ts`:

```javascript
// Znane złe identyfikatory
/(keepcold131\/ClawdAuthenticatorTool|ClawdAuthenticatorTool)/i

// Podejrzane słowa kluczowe
/(malware|stealer|phish|phishing|keylogger)/i
/(api[-_ ]?key|token|password|private key|secret)/i
/(wallet|seed phrase|mnemonic|crypto)/i
/(discord\.gg|webhook|hooks\.slack)/i
/(curl[^\n]+\|\s*(sh|bash))/i
/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd)/i
```

**Ograniczenia:**

- Sprawdza tylko slug, displayName, summary, frontmatter, metadane i ścieżki plików
- Nie analizuje rzeczywistej zawartości kodu Skill
- Proste regexy łatwo obejść przez obfuskację
- Brak analizy behawioralnej

### 4.3 Planowane ulepszenia

| Ulepszenie             | Status                                | Wpływ                                                               |
| ---------------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Integracja z VirusTotal | W toku                               | Wysoki - Analiza behawioralna Code Insight                          |
| Zgłaszanie przez społeczność | Częściowo (`skillReports` table exists) | Średni                                                        |
| Logowanie audytowe     | Częściowo (`auditLogs` table exists)  | Średni                                                              |
| System odznak          | Wdrożony                              | Średni - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. Macierz ryzyka

### 5.1 Prawdopodobieństwo vs wpływ

| ID zagrożenia | Prawdopodobieństwo | Wpływ   | Poziom ryzyka | Priorytet |
| ------------- | ------------------ | ------- | ------------- | --------- |
| T-EXEC-001    | Wysokie            | Krytyczny | **Krytyczny** | P0      |
| T-PERSIST-001 | Wysokie            | Krytyczny | **Krytyczny** | P0      |
| T-EXFIL-003   | Średnie            | Krytyczny | **Krytyczny** | P0      |
| T-IMPACT-001  | Średnie            | Krytyczny | **Wysokie**   | P1      |
| T-EXEC-002    | Wysokie            | Wysoki    | **Wysokie**   | P1      |
| T-EXEC-004    | Średnie            | Wysoki    | **Wysokie**   | P1      |
| T-ACCESS-003  | Średnie            | Wysoki    | **Wysokie**   | P1      |
| T-EXFIL-001   | Średnie            | Wysoki    | **Wysokie**   | P1      |
| T-IMPACT-002  | Wysokie            | Średni    | **Wysokie**   | P1      |
| T-EVADE-001   | Wysokie            | Średni    | **Średnie**   | P2      |
| T-ACCESS-001  | Niskie             | Wysoki    | **Średnie**   | P2      |
| T-ACCESS-002  | Niskie             | Wysoki    | **Średnie**   | P2      |
| T-PERSIST-002 | Niskie             | Wysoki    | **Średnie**   | P2      |

### 5.2 Krytyczne łańcuchy ataku

**Łańcuch ataku 1: Kradzież danych oparta na Skill**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Publikacja złośliwego Skill) → (Ominięcie moderacji) → (Zbieranie poświadczeń)
```

**Łańcuch ataku 2: Prompt injection do RCE**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Wstrzyknięcie promptu) → (Ominięcie exec approval) → (Wykonanie poleceń)
```

**Łańcuch ataku 3: Pośrednie wstrzyknięcie przez pobraną treść**

```
T-EXEC-002 → T-EXFIL-001 → Zewnętrzna eksfiltracja
(Zatrucie treści URL) → (Agent pobiera i wykonuje instrukcje) → (Dane wysłane do atakującego)
```

---

## 6. Podsumowanie rekomendacji

### 6.1 Natychmiastowe (P0)

| ID    | Rekomendacja                              | Dotyczy                    |
| ----- | ----------------------------------------- | -------------------------- |
| R-001 | Dokończyć integrację z VirusTotal         | T-PERSIST-001, T-EVADE-001 |
| R-002 | Wdrożyć sandboxing Skills                 | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Dodać walidację wyjścia dla działań wrażliwych | T-EXEC-001, T-EXEC-002 |

### 6.2 Krótkoterminowe (P1)

| ID    | Rekomendacja                            | Dotyczy      |
| ----- | --------------------------------------- | ------------ |
| R-004 | Wdrożyć rate limiting                   | T-IMPACT-002 |
| R-005 | Dodać szyfrowanie tokenów w spoczynku   | T-ACCESS-003 |
| R-006 | Poprawić UX i walidację exec approval   | T-EXEC-004   |
| R-007 | Wdrożyć allowlistę URL dla web_fetch    | T-EXFIL-001  |

### 6.3 Średnioterminowe (P2)

| ID    | Rekomendacja                                         | Dotyczy       |
| ----- | ---------------------------------------------------- | ------------- |
| R-008 | Dodać kryptograficzną weryfikację kanałów tam, gdzie to możliwe | T-ACCESS-002 |
| R-009 | Wdrożyć weryfikację integralności konfiguracji       | T-PERSIST-003 |
| R-010 | Dodać podpisywanie aktualizacji i pinning wersji     | T-PERSIST-002 |

---

## 7. Aneksy

### 7.1 Mapowanie technik ATLAS

| ATLAS ID      | Nazwa techniki                 | Zagrożenia OpenClaw                                               |
| ------------- | ------------------------------ | ----------------------------------------------------------------- |
| AML.T0006     | Active Scanning                | T-RECON-001, T-RECON-002                                          |
| AML.T0009     | Collection                     | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                             |
| AML.T0010.001 | Supply Chain: AI Software      | T-PERSIST-001, T-PERSIST-002                                      |
| AML.T0010.002 | Supply Chain: Data             | T-PERSIST-003                                                     |
| AML.T0031     | Erode AI Model Integrity       | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                          |
| AML.T0040     | AI Model Inference API Access  | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002  |
| AML.T0043     | Craft Adversarial Data         | T-EXEC-004, T-EVADE-001, T-EVADE-002                              |
| AML.T0051.000 | LLM Prompt Injection: Direct   | T-EXEC-001, T-EXEC-003                                            |
| AML.T0051.001 | LLM Prompt Injection: Indirect | T-EXEC-002                                                        |

### 7.2 Kluczowe pliki bezpieczeństwa

| Ścieżka                             | Cel                          | Poziom ryzyka |
| ----------------------------------- | ---------------------------- | ------------- |
| `src/infra/exec-approvals.ts`       | Logika zatwierdzania poleceń | **Krytyczny** |
| `src/gateway/auth.ts`               | Uwierzytelnianie Gateway     | **Krytyczny** |
| `src/infra/net/ssrf.ts`             | Ochrona SSRF                 | **Krytyczny** |
| `src/security/external-content.ts`  | Ochrona przed prompt injection | **Krytyczny** |
| `src/agents/sandbox/tool-policy.ts` | Egzekwowanie polityk narzędzi | **Krytyczny** |
| `src/routing/resolve-route.ts`      | Izolacja sesji               | **Średni**    |

### 7.3 Słownik

| Termin               | Definicja                                              |
| -------------------- | ------------------------------------------------------ |
| **ATLAS**            | MITRE Adversarial Threat Landscape for AI Systems      |
| **ClawHub**          | Marketplace Skills w OpenClaw                          |
| **Gateway**          | Warstwa routingu wiadomości i uwierzytelniania OpenClaw |
| **MCP**              | Model Context Protocol - interfejs dostawcy narzędzi   |
| **Prompt Injection** | Atak, w którym złośliwe instrukcje są osadzone w wejściu |
| **Skill**            | Rozszerzenie do pobrania dla agentów OpenClaw          |
| **SSRF**             | Server-Side Request Forgery                            |

---

_Ten model zagrożeń jest żywym dokumentem. Zgłaszaj problemy bezpieczeństwa na security@openclaw.ai_
