---
read_when:
    - Przegląd stanu bezpieczeństwa lub scenariuszy zagrożeń
    - Praca nad funkcjami bezpieczeństwa lub odpowiedziami na audyt
summary: Model zagrożeń OpenClaw odwzorowany na framework MITRE ATLAS
title: Model zagrożeń (MITRE ATLAS)
x-i18n:
    generated_at: "2026-04-24T09:33:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: e628bf60015a76d3015a7aab7b51649bdcfd2e99db148368e580839db16d2342
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

Ten model zagrożeń jest zbudowany na [MITRE ATLAS](https://atlas.mitre.org/), branżowym standardzie dokumentowania przeciwnikowych zagrożeń dla systemów AI/ML. ATLAS jest utrzymywany przez [MITRE](https://www.mitre.org/) we współpracy ze społecznością bezpieczeństwa AI.

**Kluczowe zasoby ATLAS:**

- [Techniki ATLAS](https://atlas.mitre.org/techniques/)
- [Taktyki ATLAS](https://atlas.mitre.org/tactics/)
- [Studia przypadków ATLAS](https://atlas.mitre.org/studies/)
- [GitHub ATLAS](https://github.com/mitre-atlas/atlas-data)
- [Współtworzenie ATLAS](https://atlas.mitre.org/resources/contribute)

### Współtworzenie tego modelu zagrożeń

To żywy dokument utrzymywany przez społeczność OpenClaw. Zobacz [CONTRIBUTING-THREAT-MODEL.md](/pl/security/CONTRIBUTING-THREAT-MODEL), aby poznać wskazówki dotyczące współtworzenia:

- Zgłaszanie nowych zagrożeń
- Aktualizowanie istniejących zagrożeń
- Proponowanie łańcuchów ataku
- Sugerowanie mitigacji

---

## 1. Wprowadzenie

### 1.1 Cel

Ten model zagrożeń dokumentuje przeciwnikowe zagrożenia dla platformy agentów AI OpenClaw oraz marketplace Skills ClawHub z użyciem frameworka MITRE ATLAS zaprojektowanego specjalnie dla systemów AI/ML.

### 1.2 Zakres

| Komponent               | Ujęty | Uwagi                                             |
| ----------------------- | ----- | ------------------------------------------------- |
| Runtime agenta OpenClaw | Tak   | Wykonanie rdzenia agenta, wywołania narzędzi, sesje |
| Gateway                 | Tak   | Uwierzytelnianie, routing, integracja kanałów     |
| Integracje kanałów      | Tak   | WhatsApp, Telegram, Discord, Signal, Slack itd.   |
| Marketplace ClawHub     | Tak   | Publikowanie Skills, moderacja, dystrybucja       |
| Serwery MCP             | Tak   | Zewnętrzni providerzy narzędzi                    |
| Urządzenia użytkownika  | Częściowo | Aplikacje mobilne, klienci desktopowi          |

### 1.3 Poza zakresem

Nic nie jest jawnie poza zakresem tego modelu zagrożeń.

---

## 2. Architektura systemu

### 2.1 Granice zaufania

```
┌─────────────────────────────────────────────────────────────────┐
│                  STREFA NIEUFNA                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│              GRANICA ZAUFANIA 1: Dostęp do kanału               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                       GATEWAY                             │   │
│  │  • Parowanie urządzeń (okres karencji 1 h DM / 5 min node) │   │
│  │  • Walidacja AllowFrom / AllowList                        │   │
│  │  • Auth tokenem/hasłem/Tailscale                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│             GRANICA ZAUFANIA 2: Izolacja sesji                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    SESJE AGENTA                           │   │
│  │  • Klucz sesji = agent:channel:peer                      │   │
│  │  • Polityki narzędzi per agent                           │   │
│  │  • Logowanie transkryptów                                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│            GRANICA ZAUFANIA 3: Wykonanie narzędzi               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 SANDBOX WYKONAWCZY                        │   │
│  │  • Docker sandbox LUB host (exec-approvals)              │   │
│  │  • Zdalne wykonanie na Node                              │   │
│  │  • Ochrona SSRF (pinning DNS + blokowanie IP)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          GRANICA ZAUFANIA 4: Treść zewnętrzna                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          POBRANE URL-E / E-MAILE / WEBHOOKI               │   │
│  │  • Opakowywanie treści zewnętrznej (tagi XML)             │   │
│  │  • Wstrzykiwanie komunikatu bezpieczeństwa                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         GRANICA ZAUFANIA 5: Łańcuch dostaw                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                       CLAWHUB                             │   │
│  │  • Publikowanie Skills (semver, wymagane SKILL.md)       │   │
│  │  • Flagi moderacji oparte na wzorcach                    │   │
│  │  • Skanowanie VirusTotal (wkrótce)                       │   │
│  │  • Weryfikacja wieku konta GitHub                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Przepływy danych

| Przepływ | Źródło  | Cel         | Dane                | Ochrona              |
| -------- | ------- | ----------- | ------------------- | -------------------- |
| F1       | Kanał   | Gateway     | Wiadomości użytkownika | TLS, AllowFrom     |
| F2       | Gateway | Agent       | Routowane wiadomości | Izolacja sesji      |
| F3       | Agent   | Narzędzia   | Wywołania narzędzi  | Egzekwowanie polityki |
| F4       | Agent   | Zewnętrzne  | Żądania web_fetch   | Blokowanie SSRF     |
| F5       | ClawHub | Agent       | Kod Skill           | Moderacja, skanowanie |
| F6       | Agent   | Kanał       | Odpowiedzi          | Filtrowanie wyjścia |

---

## 3. Analiza zagrożeń według taktyk ATLAS

### 3.1 Rozpoznanie (AML.TA0002)

#### T-RECON-001: Odkrywanie punktów końcowych agenta

| Atrybut                | Wartość                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0006 - Active Scanning                                          |
| **Opis**               | Atakujący skanuje w poszukiwaniu wystawionych punktów końcowych gateway OpenClaw |
| **Wektor ataku**       | Skanowanie sieci, zapytania do Shodan, enumeracja DNS                |
| **Dotknięte komponenty** | Gateway, wystawione punkty końcowe API                            |
| **Aktualne mitigacje** | Opcja auth Tailscale, domyślny bind do loopback                      |
| **Ryzyko resztkowe**   | Średnie — publiczne gateway można wykryć                             |
| **Zalecenia**          | Udokumentować bezpieczne wdrożenie, dodać rate limiting na punktach końcowych wykrywania |

#### T-RECON-002: Sondowanie integracji kanałów

| Atrybut                | Wartość                                                             |
| ---------------------- | ------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0006 - Active Scanning                                         |
| **Opis**               | Atakujący sonduje kanały wiadomości, aby zidentyfikować konta zarządzane przez AI |
| **Wektor ataku**       | Wysyłanie wiadomości testowych, obserwowanie wzorców odpowiedzi     |
| **Dotknięte komponenty** | Wszystkie integracje kanałów                                      |
| **Aktualne mitigacje** | Brak specyficznych                                                  |
| **Ryzyko resztkowe**   | Niskie — samo wykrycie ma ograniczoną wartość                       |
| **Zalecenia**          | Rozważyć randomizację czasu odpowiedzi                              |

---

### 3.2 Dostęp początkowy (AML.TA0004)

#### T-ACCESS-001: Przechwycenie kodu parowania

| Atrybut                | Wartość                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0040 - AI Model Inference API Access                                                                     |
| **Opis**               | Atakujący przechwytuje kod parowania podczas okresu karencji parowania (1 h dla parowania kanału DM, 5 min dla parowania node) |
| **Wektor ataku**       | Podglądanie przez ramię, sniffing sieciowy, socjotechnika                                                     |
| **Dotknięte komponenty** | System parowania urządzeń                                                                                   |
| **Aktualne mitigacje** | Wygaśnięcie po 1 h (parowanie DM) / 5 min (parowanie node), kody wysyłane przez istniejący kanał             |
| **Ryzyko resztkowe**   | Średnie — okres karencji można wykorzystać                                                                    |
| **Zalecenia**          | Skrócić okres karencji, dodać krok potwierdzenia                                                              |

#### T-ACCESS-002: Podszywanie się pod AllowFrom

| Atrybut                | Wartość                                                                       |
| ---------------------- | ----------------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0040 - AI Model Inference API Access                                     |
| **Opis**               | Atakujący podszywa się pod dozwoloną tożsamość nadawcy w kanale               |
| **Wektor ataku**       | Zależy od kanału — spoofing numeru telefonu, podszywanie się pod nazwę użytkownika |
| **Dotknięte komponenty** | Walidacja AllowFrom per kanał                                                |
| **Aktualne mitigacje** | Weryfikacja tożsamości specyficzna dla kanału                                 |
| **Ryzyko resztkowe**   | Średnie — niektóre kanały są podatne na spoofing                              |
| **Zalecenia**          | Udokumentować ryzyka specyficzne dla kanałów, dodać weryfikację kryptograficzną tam, gdzie to możliwe |

#### T-ACCESS-003: Kradzież tokenu

| Atrybut                | Wartość                                                      |
| ---------------------- | ------------------------------------------------------------ |
| **ATLAS ID**           | AML.T0040 - AI Model Inference API Access                    |
| **Opis**               | Atakujący kradnie tokeny uwierzytelniania z plików konfiguracji |
| **Wektor ataku**       | Malware, nieautoryzowany dostęp do urządzenia, ekspozycja kopii zapasowych konfiguracji |
| **Dotknięte komponenty** | `~/.openclaw/credentials/`, magazyn konfiguracji           |
| **Aktualne mitigacje** | Uprawnienia do plików                                        |
| **Ryzyko resztkowe**   | Wysokie — tokeny przechowywane w plaintext                   |
| **Zalecenia**          | Wdrożyć szyfrowanie tokenów w spoczynku, dodać rotację tokenów |

---

### 3.3 Wykonanie (AML.TA0005)

#### T-EXEC-001: Bezpośrednie prompt injection

| Atrybut                | Wartość                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0051.000 - LLM Prompt Injection: Direct                                                |
| **Opis**               | Atakujący wysyła spreparowane prompty, aby manipulować zachowaniem agenta                  |
| **Wektor ataku**       | Wiadomości w kanałach zawierające antagonistyczne instrukcje                               |
| **Dotknięte komponenty** | Agent LLM, wszystkie powierzchnie wejściowe                                               |
| **Aktualne mitigacje** | Wykrywanie wzorców, opakowywanie treści zewnętrznej                                         |
| **Ryzyko resztkowe**   | Krytyczne — tylko wykrywanie, bez blokowania; zaawansowane ataki omijają zabezpieczenia    |
| **Zalecenia**          | Wdrożyć wielowarstwową obronę, walidację wyjścia, potwierdzenie użytkownika dla działań wrażliwych |

#### T-EXEC-002: Pośrednie prompt injection

| Atrybut                | Wartość                                                       |
| ---------------------- | ------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0051.001 - LLM Prompt Injection: Indirect                |
| **Opis**               | Atakujący osadza złośliwe instrukcje w pobranej treści        |
| **Wektor ataku**       | Złośliwe URL-e, zatrute e-maile, skompromitowane Webhooki     |
| **Dotknięte komponenty** | `web_fetch`, ingest maili, zewnętrzne źródła danych         |
| **Aktualne mitigacje** | Opakowywanie treści tagami XML i komunikatem bezpieczeństwa   |
| **Ryzyko resztkowe**   | Wysokie — LLM może zignorować instrukcje wrappera             |
| **Zalecenia**          | Wdrożyć sanityzację treści, oddzielne konteksty wykonania     |

#### T-EXEC-003: Wstrzyknięcie argumentów narzędzi

| Atrybut                | Wartość                                                        |
| ---------------------- | -------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0051.000 - LLM Prompt Injection: Direct                   |
| **Opis**               | Atakujący manipuluje argumentami narzędzi przez prompt injection |
| **Wektor ataku**       | Spreparowane prompty wpływające na wartości parametrów narzędzi |
| **Dotknięte komponenty** | Wszystkie wywołania narzędzi                                  |
| **Aktualne mitigacje** | Zatwierdzenia exec dla niebezpiecznych poleceń                 |
| **Ryzyko resztkowe**   | Wysokie — opiera się na ocenie użytkownika                     |
| **Zalecenia**          | Wdrożyć walidację argumentów, parametryzowane wywołania narzędzi |

#### T-EXEC-004: Obejście zatwierdzeń exec

| Atrybut                | Wartość                                                      |
| ---------------------- | ------------------------------------------------------------ |
| **ATLAS ID**           | AML.T0043 - Craft Adversarial Data                           |
| **Opis**               | Atakujący tworzy polecenia, które omijają allowlistę zatwierdzeń |
| **Wektor ataku**       | Obfuskacja poleceń, wykorzystanie aliasów, manipulacja ścieżką |
| **Dotknięte komponenty** | `exec-approvals.ts`, allowlista poleceń                    |
| **Aktualne mitigacje** | Allowlista + tryb ask                                        |
| **Ryzyko resztkowe**   | Wysokie — brak sanityzacji poleceń                           |
| **Zalecenia**          | Wdrożyć normalizację poleceń, rozszerzyć blocklistę          |

---

### 3.4 Trwałość (AML.TA0006)

#### T-PERSIST-001: Instalacja złośliwej Skill

| Atrybut                | Wartość                                                                     |
| ---------------------- | --------------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0010.001 - Supply Chain Compromise: AI Software                        |
| **Opis**               | Atakujący publikuje złośliwą Skill na ClawHub                               |
| **Wektor ataku**       | Założenie konta, publikacja Skill z ukrytym złośliwym kodem                 |
| **Dotknięte komponenty** | ClawHub, ładowanie Skills, wykonanie agenta                               |
| **Aktualne mitigacje** | Weryfikacja wieku konta GitHub, flagi moderacji oparte na wzorcach          |
| **Ryzyko resztkowe**   | Krytyczne — brak sandboxingu, ograniczona weryfikacja                       |
| **Zalecenia**          | Integracja VirusTotal (w toku), sandboxing Skills, przegląd społecznościowy |

#### T-PERSIST-002: Zatrucie aktualizacji Skill

| Atrybut                | Wartość                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0010.001 - Supply Chain Compromise: AI Software              |
| **Opis**               | Atakujący kompromituje popularną Skill i wypycha złośliwą aktualizację |
| **Wektor ataku**       | Kompromitacja konta, socjotechnika wobec właściciela Skill        |
| **Dotknięte komponenty** | Wersjonowanie ClawHub, przepływy auto-update                    |
| **Aktualne mitigacje** | Odcisk palca wersji                                               |
| **Ryzyko resztkowe**   | Wysokie — auto-update może pobierać złośliwe wersje              |
| **Zalecenia**          | Wdrożyć podpisywanie aktualizacji, możliwość rollbacku, przypinanie wersji |

#### T-PERSIST-003: Manipulacja konfiguracją agenta

| Atrybut                | Wartość                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| **ATLAS ID**           | AML.T0010.002 - Supply Chain Compromise: Data                      |
| **Opis**               | Atakujący modyfikuje konfigurację agenta, aby utrzymać dostęp      |
| **Wektor ataku**       | Modyfikacja pliku konfiguracji, wstrzyknięcie ustawień             |
| **Dotknięte komponenty** | Konfiguracja agenta, polityki narzędzi                           |
| **Aktualne mitigacje** | Uprawnienia do plików                                              |
| **Ryzyko resztkowe**   | Średnie — wymaga lokalnego dostępu                                 |
| **Zalecenia**          | Weryfikacja integralności konfiguracji, logowanie audytowe zmian konfiguracji |

---

### 3.5 Unikanie obrony (AML.TA0007)

#### T-EVADE-001: Obejście wzorców moderacji

| Atrybut                | Wartość                                                                   |
| ---------------------- | ------------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0043 - Craft Adversarial Data                                        |
| **Opis**               | Atakujący tworzy zawartość Skill tak, aby ominąć wzorce moderacji         |
| **Wektor ataku**       | Unicode homoglyphs, sztuczki kodowania, ładowanie dynamiczne              |
| **Dotknięte komponenty** | `moderation.ts` w ClawHub                                               |
| **Aktualne mitigacje** | Oparte na wzorcach `FLAG_RULES`                                           |
| **Ryzyko resztkowe**   | Wysokie — proste regexy można łatwo obejść                                |
| **Zalecenia**          | Dodać analizę behawioralną (VirusTotal Code Insight), wykrywanie oparte na AST |

#### T-EVADE-002: Ucieczka z wrappera treści

| Atrybut                | Wartość                                                      |
| ---------------------- | ------------------------------------------------------------ |
| **ATLAS ID**           | AML.T0043 - Craft Adversarial Data                           |
| **Opis**               | Atakujący tworzy treść, która ucieka z kontekstu wrappera XML |
| **Wektor ataku**       | Manipulacja tagami, mylenie kontekstu, nadpisanie instrukcji |
| **Dotknięte komponenty** | Opakowywanie treści zewnętrznej                            |
| **Aktualne mitigacje** | Tagi XML + komunikat bezpieczeństwa                          |
| **Ryzyko resztkowe**   | Średnie — regularnie odkrywane są nowe obejścia              |
| **Zalecenia**          | Wiele warstw wrapperów, walidacja po stronie wyjścia         |

---

### 3.6 Odkrywanie (AML.TA0008)

#### T-DISC-001: Enumeracja narzędzi

| Atrybut                | Wartość                                                |
| ---------------------- | ------------------------------------------------------ |
| **ATLAS ID**           | AML.T0040 - AI Model Inference API Access              |
| **Opis**               | Atakujący enumeruje dostępne narzędzia przez prompting |
| **Wektor ataku**       | Zapytania w stylu „Jakie masz narzędzia?”              |
| **Dotknięte komponenty** | Rejestr narzędzi agenta                              |
| **Aktualne mitigacje** | Brak specyficznych                                     |
| **Ryzyko resztkowe**   | Niskie — narzędzia są zwykle udokumentowane            |
| **Zalecenia**          | Rozważyć kontrolę widoczności narzędzi                 |

#### T-DISC-002: Ekstrakcja danych sesji

| Atrybut                | Wartość                                                  |
| ---------------------- | -------------------------------------------------------- |
| **ATLAS ID**           | AML.T0040 - AI Model Inference API Access                |
| **Opis**               | Atakujący wyciąga wrażliwe dane z kontekstu sesji        |
| **Wektor ataku**       | Zapytania typu „O czym rozmawialiśmy?”, sondowanie kontekstu |
| **Dotknięte komponenty** | Transkrypty sesji, okno kontekstowe                    |
| **Aktualne mitigacje** | Izolacja sesji per nadawca                               |
| **Ryzyko resztkowe**   | Średnie — dane wewnątrz sesji są dostępne                |
| **Zalecenia**          | Wdrożyć redakcję danych wrażliwych w kontekście          |

---

### 3.7 Zbieranie i eksfiltracja (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Kradzież danych przez `web_fetch`

| Atrybut                | Wartość                                                                  |
| ---------------------- | ------------------------------------------------------------------------ |
| **ATLAS ID**           | AML.T0009 - Collection                                                   |
| **Opis**               | Atakujący eksfiltruje dane, instruując agenta, aby wysłał je pod zewnętrzny URL |
| **Wektor ataku**       | Prompt injection powodujący, że agent wykona POST z danymi do serwera atakującego |
| **Dotknięte komponenty** | Narzędzie `web_fetch`                                                  |
| **Aktualne mitigacje** | Blokowanie SSRF dla sieci wewnętrznych                                   |
| **Ryzyko resztkowe**   | Wysokie — zewnętrzne URL-e są dozwolone                                  |
| **Zalecenia**          | Wdrożyć allowlistę URL-i, świadomość klasyfikacji danych                 |

#### T-EXFIL-002: Nieautoryzowane wysyłanie wiadomości

| Atrybut                | Wartość                                                             |
| ---------------------- | ------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0009 - Collection                                              |
| **Opis**               | Atakujący powoduje, że agent wysyła wiadomości zawierające wrażliwe dane |
| **Wektor ataku**       | Prompt injection powodujący, że agent wyśle wiadomość do atakującego |
| **Dotknięte komponenty** | Narzędzie wiadomości, integracje kanałów                          |
| **Aktualne mitigacje** | Bramkowanie wiadomości wychodzących                                 |
| **Ryzyko resztkowe**   | Średnie — bramkowanie może zostać ominięte                          |
| **Zalecenia**          | Wymagać jawnego potwierdzenia dla nowych odbiorców                  |

#### T-EXFIL-003: Zbieranie poświadczeń

| Atrybut                | Wartość                                                     |
| ---------------------- | ----------------------------------------------------------- |
| **ATLAS ID**           | AML.T0009 - Collection                                      |
| **Opis**               | Złośliwa Skill zbiera poświadczenia z kontekstu agenta      |
| **Wektor ataku**       | Kod Skill odczytuje zmienne środowiskowe, pliki konfiguracji |
| **Dotknięte komponenty** | Środowisko wykonania Skill                                |
| **Aktualne mitigacje** | Brak specyficznych dla Skills                               |
| **Ryzyko resztkowe**   | Krytyczne — Skills działają z uprawnieniami agenta          |
| **Zalecenia**          | Sandboxing Skills, izolacja poświadczeń                     |

---

### 3.8 Wpływ (AML.TA0011)

#### T-IMPACT-001: Nieautoryzowane wykonanie poleceń

| Atrybut                | Wartość                                                |
| ---------------------- | ------------------------------------------------------ |
| **ATLAS ID**           | AML.T0031 - Erode AI Model Integrity                   |
| **Opis**               | Atakujący wykonuje dowolne polecenia w systemie użytkownika |
| **Wektor ataku**       | Prompt injection połączone z obejściem zatwierdzeń exec |
| **Dotknięte komponenty** | Narzędzie bash, wykonanie poleceń                    |
| **Aktualne mitigacje** | Zatwierdzenia exec, opcja Docker sandbox               |
| **Ryzyko resztkowe**   | Krytyczne — wykonanie na hoście bez sandboxa           |
| **Zalecenia**          | Domyślnie używać sandboxa, poprawić UX zatwierdzeń     |

#### T-IMPACT-002: Wyczerpanie zasobów (DoS)

| Atrybut                | Wartość                                               |
| ---------------------- | ----------------------------------------------------- |
| **ATLAS ID**           | AML.T0031 - Erode AI Model Integrity                  |
| **Opis**               | Atakujący wyczerpuje kredyty API lub zasoby obliczeniowe |
| **Wektor ataku**       | Automatyczne zalewanie wiadomościami, kosztowne wywołania narzędzi |
| **Dotknięte komponenty** | Gateway, sesje agenta, provider API                 |
| **Aktualne mitigacje** | Brak                                                  |
| **Ryzyko resztkowe**   | Wysokie — brak rate limiting                          |
| **Zalecenia**          | Wdrożyć limity szybkości per nadawca, budżety kosztowe |

#### T-IMPACT-003: Szkoda reputacyjna

| Atrybut                | Wartość                                                    |
| ---------------------- | ---------------------------------------------------------- |
| **ATLAS ID**           | AML.T0031 - Erode AI Model Integrity                       |
| **Opis**               | Atakujący powoduje, że agent wysyła szkodliwą/obraźliwą treść |
| **Wektor ataku**       | Prompt injection powodujący nieodpowiednie odpowiedzi      |
| **Dotknięte komponenty** | Generowanie wyjścia, wiadomości kanałowe                 |
| **Aktualne mitigacje** | Polityki treści providerów LLM                             |
| **Ryzyko resztkowe**   | Średnie — filtry providera są niedoskonałe                 |
| **Zalecenia**          | Warstwa filtrowania wyjścia, kontrolki użytkownika         |

---

## 4. Analiza łańcucha dostaw ClawHub

### 4.1 Obecne kontrolki bezpieczeństwa

| Kontrolka            | Implementacja               | Skuteczność                                             |
| -------------------- | --------------------------- | ------------------------------------------------------- |
| Wiek konta GitHub    | `requireGitHubAccountAge()` | Średnia — podnosi próg dla nowych atakujących           |
| Sanityzacja ścieżek  | `sanitizePath()`            | Wysoka — zapobiega traversalom ścieżek                  |
| Walidacja typu pliku | `isTextFile()`              | Średnia — tylko pliki tekstowe, ale nadal mogą być złośliwe |
| Limity rozmiaru      | Łącznie 50 MB na bundle     | Wysoka — zapobiega wyczerpaniu zasobów                  |
| Wymagane `SKILL.md`  | Obowiązkowy readme          | Niska wartość bezpieczeństwa — tylko informacyjne       |
| Moderacja wzorców    | `FLAG_RULES` w `moderation.ts` | Niska — łatwa do obejścia                            |
| Status moderacji     | Pole `moderationStatus`     | Średnia — możliwy ręczny przegląd                       |

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

- Sprawdza tylko slug, displayName, summary, frontmatter, metadata, ścieżki plików
- Nie analizuje faktycznej zawartości kodu Skill
- Proste regexy łatwo obejść przez obfuskację
- Brak analizy behawioralnej

### 4.3 Planowane usprawnienia

| Usprawnienie           | Status                                 | Wpływ                                                                   |
| ---------------------- | -------------------------------------- | ----------------------------------------------------------------------- |
| Integracja VirusTotal  | W toku                                 | Wysoki — analiza behawioralna Code Insight                              |
| Zgłaszanie społeczności | Częściowo (`skillReports` table exists) | Średni                                                                |
| Logowanie audytowe     | Częściowo (`auditLogs` table exists)   | Średni                                                                  |
| System odznak          | Wdrożony                               | Średni — `highlighted`, `official`, `deprecated`, `redactionApproved`  |

---

## 5. Macierz ryzyka

### 5.1 Prawdopodobieństwo vs wpływ

| Threat ID     | Prawdopodobieństwo | Wpływ    | Poziom ryzyka | Priorytet |
| ------------- | ------------------ | -------- | ------------- | --------- |
| T-EXEC-001    | Wysokie            | Krytyczny | **Krytyczne** | P0        |
| T-PERSIST-001 | Wysokie            | Krytyczny | **Krytyczne** | P0        |
| T-EXFIL-003   | Średnie            | Krytyczny | **Krytyczne** | P0        |
| T-IMPACT-001  | Średnie            | Krytyczny | **Wysokie**   | P1        |
| T-EXEC-002    | Wysokie            | Wysoki   | **Wysokie**   | P1        |
| T-EXEC-004    | Średnie            | Wysoki   | **Wysokie**   | P1        |
| T-ACCESS-003  | Średnie            | Wysoki   | **Wysokie**   | P1        |
| T-EXFIL-001   | Średnie            | Wysoki   | **Wysokie**   | P1        |
| T-IMPACT-002  | Wysokie            | Średni   | **Wysokie**   | P1        |
| T-EVADE-001   | Wysokie            | Średni   | **Średnie**   | P2        |
| T-ACCESS-001  | Niskie             | Wysoki   | **Średnie**   | P2        |
| T-ACCESS-002  | Niskie             | Wysoki   | **Średnie**   | P2        |
| T-PERSIST-002 | Niskie             | Wysoki   | **Średnie**   | P2        |

### 5.2 Krytyczne łańcuchy ataku

**Łańcuch ataku 1: Kradzież danych oparta na Skill**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Publikacja złośliwej Skill) → (Ominięcie moderacji) → (Zbieranie poświadczeń)
```

**Łańcuch ataku 2: Prompt injection do RCE**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Wstrzyknięcie promptu) → (Ominięcie zatwierdzeń exec) → (Wykonanie poleceń)
```

**Łańcuch ataku 3: Pośrednie wstrzyknięcie przez pobraną treść**

```
T-EXEC-002 → T-EXFIL-001 → Zewnętrzna eksfiltracja
(Zatrucie treści URL) → (Agent pobiera i wykonuje instrukcje) → (Dane wysłane do atakującego)
```

---

## 6. Podsumowanie zaleceń

### 6.1 Natychmiastowe (P0)

| ID    | Zalecenie                                      | Dotyczy                    |
| ----- | ---------------------------------------------- | -------------------------- |
| R-001 | Dokończyć integrację VirusTotal                | T-PERSIST-001, T-EVADE-001 |
| R-002 | Wdrożyć sandboxing Skills                      | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Dodać walidację wyjścia dla działań wrażliwych | T-EXEC-001, T-EXEC-002     |

### 6.2 Krótkoterminowe (P1)

| ID    | Zalecenie                                    | Dotyczy      |
| ----- | -------------------------------------------- | ------------ |
| R-004 | Wdrożyć rate limiting                        | T-IMPACT-002 |
| R-005 | Dodać szyfrowanie tokenów w spoczynku        | T-ACCESS-003 |
| R-006 | Poprawić UX i walidację zatwierdzeń exec     | T-EXEC-004   |
| R-007 | Wdrożyć allowlistę URL-i dla `web_fetch`     | T-EXFIL-001  |

### 6.3 Średnioterminowe (P2)

| ID    | Zalecenie                                              | Dotyczy       |
| ----- | ------------------------------------------------------ | ------------- |
| R-008 | Dodać kryptograficzną weryfikację kanałów tam, gdzie to możliwe | T-ACCESS-002  |
| R-009 | Wdrożyć weryfikację integralności konfiguracji         | T-PERSIST-003 |
| R-010 | Dodać podpisywanie aktualizacji i przypinanie wersji   | T-PERSIST-002 |

---

## 7. Aneksy

### 7.1 Mapowanie technik ATLAS

| ATLAS ID      | Nazwa techniki                 | Zagrożenia OpenClaw                                                |
| ------------- | ------------------------------ | ------------------------------------------------------------------ |
| AML.T0006     | Active Scanning                | T-RECON-001, T-RECON-002                                           |
| AML.T0009     | Collection                     | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                              |
| AML.T0010.001 | Supply Chain: AI Software      | T-PERSIST-001, T-PERSIST-002                                       |
| AML.T0010.002 | Supply Chain: Data             | T-PERSIST-003                                                      |
| AML.T0031     | Erode AI Model Integrity       | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                           |
| AML.T0040     | AI Model Inference API Access  | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002   |
| AML.T0043     | Craft Adversarial Data         | T-EXEC-004, T-EVADE-001, T-EVADE-002                               |
| AML.T0051.000 | LLM Prompt Injection: Direct   | T-EXEC-001, T-EXEC-003                                             |
| AML.T0051.001 | LLM Prompt Injection: Indirect | T-EXEC-002                                                         |

### 7.2 Kluczowe pliki bezpieczeństwa

| Ścieżka                            | Cel                         | Poziom ryzyka |
| ---------------------------------- | --------------------------- | ------------- |
| `src/infra/exec-approvals.ts`      | Logika zatwierdzania poleceń | **Krytyczny** |
| `src/gateway/auth.ts`              | Uwierzytelnianie Gateway    | **Krytyczny** |
| `src/infra/net/ssrf.ts`            | Ochrona SSRF               | **Krytyczny** |
| `src/security/external-content.ts` | Mitigacja prompt injection | **Krytyczny** |
| `src/agents/sandbox/tool-policy.ts` | Egzekwowanie polityki narzędzi | **Krytyczny** |
| `src/routing/resolve-route.ts`     | Izolacja sesji             | **Średni**    |

### 7.3 Słownik

| Termin               | Definicja                                                |
| -------------------- | -------------------------------------------------------- |
| **ATLAS**            | MITRE Adversarial Threat Landscape for AI Systems        |
| **ClawHub**          | Marketplace Skills OpenClaw                              |
| **Gateway**          | Warstwa routingu wiadomości i uwierzytelniania OpenClaw  |
| **MCP**              | Model Context Protocol - interfejs providera narzędzi    |
| **Prompt Injection** | Atak, w którym złośliwe instrukcje są osadzane w wejściu |
| **Skill**            | Pobieralne rozszerzenie dla agentów OpenClaw             |
| **SSRF**             | Server-Side Request Forgery                              |

---

_Ten model zagrożeń jest żywym dokumentem. Problemy bezpieczeństwa zgłaszaj na security@openclaw.ai_

## Powiązane

- [Formalna weryfikacja](/pl/security/formal-verification)
- [Współtworzenie modelu zagrożeń](/pl/security/CONTRIBUTING-THREAT-MODEL)
