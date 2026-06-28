---
read_when:
    - Przegląd stanu bezpieczeństwa lub scenariuszy zagrożeń
    - Praca nad funkcjami zabezpieczeń lub odpowiedziami na audyty
summary: Model zagrożeń OpenClaw odwzorowany na strukturę MITRE ATLAS
title: Model zagrożeń (MITRE ATLAS)
x-i18n:
    generated_at: "2026-05-06T18:00:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7371231e9795cd899d727b87dfba7a5cae963f1fd1e50226e3fbb7488ef7381
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## Struktura MITRE ATLAS

**Wersja:** 1.0-draft
**Ostatnia aktualizacja:** 2026-02-04
**Metodologia:** MITRE ATLAS + diagramy przepływu danych
**Struktura:** [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems)

### Atrybucja struktury

Ten model zagrożeń opiera się na [MITRE ATLAS](https://atlas.mitre.org/), branżowym standardzie dokumentowania zagrożeń adwersarialnych wobec systemów AI/ML. ATLAS jest utrzymywany przez [MITRE](https://www.mitre.org/) we współpracy ze społecznością bezpieczeństwa AI.

**Kluczowe zasoby ATLAS:**

- [Techniki ATLAS](https://atlas.mitre.org/techniques/)
- [Taktyki ATLAS](https://atlas.mitre.org/tactics/)
- [Studia przypadków ATLAS](https://atlas.mitre.org/studies/)
- [ATLAS GitHub](https://github.com/mitre-atlas/atlas-data)
- [Wkład w ATLAS](https://atlas.mitre.org/resources/contribute)

### Wkład w ten model zagrożeń

To żywy dokument utrzymywany przez społeczność OpenClaw. Zobacz [CONTRIBUTING-THREAT-MODEL.md](/pl/security/CONTRIBUTING-THREAT-MODEL), aby uzyskać wytyczne dotyczące wkładu:

- Zgłaszanie nowych zagrożeń
- Aktualizowanie istniejących zagrożeń
- Proponowanie łańcuchów ataku
- Sugerowanie mitygacji

---

## 1. Wprowadzenie

### 1.1 Cel

Ten model zagrożeń dokumentuje zagrożenia adwersarialne wobec platformy agentów AI OpenClaw i marketplace Skills ClawHub, używając struktury MITRE ATLAS zaprojektowanej specjalnie dla systemów AI/ML.

### 1.2 Zakres

| Komponent              | Uwzględniono | Uwagi                                            |
| ---------------------- | -------- | ------------------------------------------------ |
| Runtime agenta OpenClaw | Tak      | Wykonywanie agenta rdzenia, wywołania narzędzi, sesje       |
| Gateway                | Tak      | Uwierzytelnianie, routowanie, integracja kanałów     |
| Integracje kanałów   | Tak      | WhatsApp, Telegram, Discord, Signal, Slack itd. |
| Marketplace ClawHub    | Tak      | Publikowanie Skills, moderacja, dystrybucja       |
| Serwery MCP            | Tak      | Zewnętrzni dostawcy narzędzi                          |
| Urządzenia użytkowników           | Częściowo  | Aplikacje mobilne, klienci desktopowi                     |

### 1.3 Poza zakresem

Nic nie jest wyraźnie poza zakresem tego modelu zagrożeń.

---

## 2. Architektura systemu

### 2.1 Granice zaufania

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNTRUSTED ZONE                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 1: Channel Access                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Device Pairing (1h DM / 5m node grace period)           │   │
│  │  • AllowFrom / AllowList validation                       │   │
│  │  • Token/Password/Tailscale auth                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 2: Session Isolation              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   AGENT SESSIONS                          │   │
│  │  • Session key = agent:channel:peer                       │   │
│  │  • Tool policies per agent                                │   │
│  │  • Transcript logging                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 3: Tool Execution                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  EXECUTION SANDBOX                        │   │
│  │  • Docker sandbox OR Host (exec-approvals)                │   │
│  │  • Node remote execution                                  │   │
│  │  • SSRF protection (DNS pinning + IP blocking)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 4: External Content               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              FETCHED URLs / EMAILS / WEBHOOKS             │   │
│  │  • External content wrapping (XML tags)                   │   │
│  │  • Security notice injection                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 5: Supply Chain                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Skill publishing (semver, SKILL.md required)           │   │
│  │  • Pattern-based moderation flags                         │   │
│  │  • VirusTotal scanning (coming soon)                      │   │
│  │  • GitHub account age verification                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Przepływy danych

| Przepływ | Źródło  | Miejsce docelowe | Dane               | Ochrona           |
| ---- | ------- | ----------- | ------------------ | -------------------- |
| F1   | Kanał | Gateway     | Wiadomości użytkownika      | TLS, AllowFrom       |
| F2   | Gateway | Agent       | Routowane wiadomości    | Izolacja sesji    |
| F3   | Agent   | Narzędzia       | Wywołania narzędzi   | Egzekwowanie zasad   |
| F4   | Agent   | Zewnętrzne    | żądania web_fetch | Blokowanie SSRF        |
| F5   | ClawHub | Agent       | Kod Skills         | Moderacja, skanowanie |
| F6   | Agent   | Kanał     | Odpowiedzi          | Filtrowanie danych wyjściowych     |

---

## 3. Analiza zagrożeń według taktyki ATLAS

### 3.1 Rozpoznanie (AML.TA0002)

#### T-RECON-001: Wykrywanie punktów końcowych agenta

| Atrybut               | Wartość                                                                |
| ----------------------- | -------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0006 - Aktywne skanowanie                                          |
| **Opis**         | Atakujący skanuje w poszukiwaniu wystawionych punktów końcowych Gateway OpenClaw                |
| **Wektor ataku**       | Skanowanie sieci, zapytania Shodan, enumeracja DNS                    |
| **Dotknięte komponenty** | Gateway, wystawione punkty końcowe API                                       |
| **Obecne mitygacje** | Opcja uwierzytelniania Tailscale, domyślne wiązanie z loopback                   |
| **Ryzyko rezydualne**       | Średnie - publiczne Gateway są możliwe do wykrycia                                |
| **Rekomendacje**     | Udokumentować bezpieczne wdrożenie, dodać ograniczanie liczby żądań na punktach końcowych wykrywania |

#### T-RECON-002: Sondowanie integracji kanałów

| Atrybut                 | Wartość                                                            |
| ----------------------- | ------------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0006 - Aktywne skanowanie                                     |
| **Opis**                | Atakujący sonduje kanały komunikatorów, aby zidentyfikować konta zarządzane przez AI |
| **Wektor ataku**        | Wysyłanie wiadomości testowych, obserwowanie wzorców odpowiedzi    |
| **Komponenty dotknięte problemem** | Wszystkie integracje kanałów                                      |
| **Obecne zabezpieczenia** | Brak specyficznych                                                 |
| **Ryzyko rezydualne**   | Niskie - Ograniczona wartość samego wykrycia                       |
| **Zalecenia**           | Rozważyć losowe zróżnicowanie czasu odpowiedzi                     |

---

### 3.2 Dostęp początkowy (AML.TA0004)

#### T-ACCESS-001: Przechwycenie kodu parowania

| Atrybut                 | Wartość                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0040 - Dostęp do API wnioskowania modelu AI                                                              |
| **Opis**                | Atakujący przechwytuje kod parowania w okresie karencji parowania (1h dla parowania kanału DM, 5m dla parowania node) |
| **Wektor ataku**        | Podglądanie przez ramię, sniffing sieci, inżynieria społeczna                                                 |
| **Komponenty dotknięte problemem** | System parowania urządzeń                                                                                     |
| **Obecne zabezpieczenia** | Wygaśnięcie po 1h (parowanie DM) / wygaśnięcie po 5m (parowanie node), kody wysyłane przez istniejący kanał |
| **Ryzyko rezydualne**   | Średnie - Okres karencji możliwy do wykorzystania                                                             |
| **Zalecenia**           | Skrócić okres karencji, dodać krok potwierdzenia                                                              |

#### T-ACCESS-002: Podszywanie się pod AllowFrom

| Atrybut                 | Wartość                                                                       |
| ----------------------- | ----------------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0040 - Dostęp do API wnioskowania modelu AI                              |
| **Opis**                | Atakujący podszywa się pod dozwoloną tożsamość nadawcy w kanale               |
| **Wektor ataku**        | Zależy od kanału - spoofing numeru telefonu, podszywanie się pod nazwę użytkownika |
| **Komponenty dotknięte problemem** | Walidacja AllowFrom dla poszczególnych kanałów                                |
| **Obecne zabezpieczenia** | Weryfikacja tożsamości specyficzna dla kanału                                 |
| **Ryzyko rezydualne**   | Średnie - Niektóre kanały są podatne na spoofing                              |
| **Zalecenia**           | Udokumentować ryzyka specyficzne dla kanałów, dodać weryfikację kryptograficzną tam, gdzie to możliwe |

#### T-ACCESS-003: Kradzież tokenów

| Atrybut                 | Wartość                                                     |
| ----------------------- | ----------------------------------------------------------- |
| **ATLAS ID**            | AML.T0040 - Dostęp do API wnioskowania modelu AI            |
| **Opis**                | Atakujący kradnie tokeny uwierzytelniające z plików konfiguracji |
| **Wektor ataku**        | Malware, nieautoryzowany dostęp do urządzenia, ujawnienie kopii zapasowej konfiguracji |
| **Komponenty dotknięte problemem** | ~/.openclaw/credentials/, przechowywanie konfiguracji        |
| **Obecne zabezpieczenia** | Uprawnienia plików                                          |
| **Ryzyko rezydualne**   | Wysokie - Tokeny przechowywane w postaci zwykłego tekstu    |
| **Zalecenia**           | Wdrożyć szyfrowanie tokenów w spoczynku, dodać rotację tokenów |

---

### 3.3 Wykonanie (AML.TA0005)

#### T-EXEC-001: Bezpośrednia injekcja promptu

| Atrybut                 | Wartość                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0051.000 - Injekcja promptu LLM: bezpośrednia                                        |
| **Opis**                | Atakujący wysyła spreparowane prompty, aby manipulować zachowaniem agenta                 |
| **Wektor ataku**        | Wiadomości kanału zawierające instrukcje adwersarialne                                    |
| **Komponenty dotknięte problemem** | LLM agenta, wszystkie powierzchnie wejściowe                                              |
| **Obecne zabezpieczenia** | Wykrywanie wzorców, opakowywanie treści zewnętrznych                                      |
| **Ryzyko rezydualne**   | Krytyczne - Tylko wykrywanie, bez blokowania; zaawansowane ataki omijają zabezpieczenia   |
| **Zalecenia**           | Wdrożyć wielowarstwową obronę, walidację wyników, potwierdzenie użytkownika dla działań wrażliwych |

#### T-EXEC-002: Pośrednia injekcja promptu

| Atrybut                 | Wartość                                                     |
| ----------------------- | ----------------------------------------------------------- |
| **ATLAS ID**            | AML.T0051.001 - Injekcja promptu LLM: pośrednia             |
| **Opis**                | Atakujący osadza złośliwe instrukcje w pobranej treści      |
| **Wektor ataku**        | Złośliwe URL-e, zatrute wiadomości e-mail, przejęte Webhooki |
| **Komponenty dotknięte problemem** | web_fetch, ingestia e-maili, zewnętrzne źródła danych       |
| **Obecne zabezpieczenia** | Opakowywanie treści tagami XML i komunikatem bezpieczeństwa |
| **Ryzyko rezydualne**   | Wysokie - LLM może zignorować instrukcje opakowania         |
| **Zalecenia**           | Wdrożyć sanityzację treści, oddzielne konteksty wykonania   |

#### T-EXEC-003: Injekcja argumentów narzędzi

| Atrybut                 | Wartość                                                      |
| ----------------------- | ------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0051.000 - Injekcja promptu LLM: bezpośrednia           |
| **Opis**                | Atakujący manipuluje argumentami narzędzi przez injekcję promptu |
| **Wektor ataku**        | Spreparowane prompty wpływające na wartości parametrów narzędzi |
| **Komponenty dotknięte problemem** | Wszystkie wywołania narzędzi                                |
| **Obecne zabezpieczenia** | Zatwierdzenia exec dla niebezpiecznych poleceń               |
| **Ryzyko rezydualne**   | Wysokie - Polega na osądzie użytkownika                      |
| **Zalecenia**           | Wdrożyć walidację argumentów, sparametryzowane wywołania narzędzi |

#### T-EXEC-004: Obejście zatwierdzenia exec

| Atrybut                 | Wartość                                                    |
| ----------------------- | ---------------------------------------------------------- |
| **ATLAS ID**            | AML.T0043 - Tworzenie danych adwersarialnych               |
| **Opis**                | Atakujący tworzy polecenia, które omijają allowlistę zatwierdzania |
| **Wektor ataku**        | Zaciemnianie poleceń, wykorzystanie aliasów, manipulacja ścieżką |
| **Komponenty dotknięte problemem** | exec-approvals.ts, allowlista poleceń                       |
| **Obecne zabezpieczenia** | Allowlista + tryb pytania                                  |
| **Ryzyko rezydualne**   | Wysokie - Brak sanityzacji poleceń                         |
| **Zalecenia**           | Wdrożyć normalizację poleceń, rozszerzyć blocklistę        |

---

### 3.4 Trwałość (AML.TA0006)

#### T-PERSIST-001: Instalacja złośliwego skill

| Atrybut                 | Wartość                                                                  |
| ----------------------- | ------------------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0010.001 - Naruszenie łańcucha dostaw: oprogramowanie AI           |
| **Opis**                | Atakujący publikuje złośliwy skill w ClawHub                             |
| **Wektor ataku**        | Utworzenie konta, opublikowanie skill z ukrytym złośliwym kodem          |
| **Komponenty dotknięte problemem** | ClawHub, ładowanie skill, wykonywanie agenta                             |
| **Obecne zabezpieczenia** | Weryfikacja wieku konta GitHub, flagi moderacji oparte na wzorcach       |
| **Ryzyko rezydualne**   | Krytyczne - Brak sandboxingu, ograniczony przegląd                       |
| **Zalecenia**           | Integracja z VirusTotal (w toku), sandboxing skill, przegląd społeczności |

#### T-PERSIST-002: Zatruwanie aktualizacji skill

| Atrybut                 | Wartość                                                        |
| ----------------------- | -------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0010.001 - Naruszenie łańcucha dostaw: oprogramowanie AI |
| **Opis**                | Atakujący przejmuje popularny skill i wypycha złośliwą aktualizację |
| **Wektor ataku**        | Przejęcie konta, inżynieria społeczna wobec właściciela skill |
| **Komponenty dotknięte problemem** | Wersjonowanie ClawHub, przepływy automatycznej aktualizacji    |
| **Obecne zabezpieczenia** | Fingerprinting wersji                                          |
| **Ryzyko rezydualne**   | Wysokie - Automatyczne aktualizacje mogą pobrać złośliwe wersje |
| **Zalecenia**           | Wdrożyć podpisywanie aktualizacji, możliwość wycofania, przypinanie wersji |

#### T-PERSIST-003: Manipulowanie konfiguracją agenta

| Atrybut                 | Wartość                                                         |
| ----------------------- | --------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0010.002 - Naruszenie łańcucha dostaw: dane                |
| **Opis**                | Atakujący modyfikuje konfigurację agenta, aby utrzymać dostęp   |
| **Wektor ataku**        | Modyfikacja pliku konfiguracji, injekcja ustawień               |
| **Komponenty dotknięte problemem** | Konfiguracja agenta, polityki narzędzi                         |
| **Obecne zabezpieczenia** | Uprawnienia plików                                              |
| **Ryzyko rezydualne**   | Średnie - Wymaga lokalnego dostępu                              |
| **Zalecenia**           | Weryfikacja integralności konfiguracji, rejestrowanie audytowe zmian konfiguracji |

---

### 3.5 Unikanie obrony (AML.TA0007)

#### T-EVADE-001: Obejście wzorców moderacji

| Atrybut                 | Wartość                                                                |
| ----------------------- | ---------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0043 - Tworzenie danych adwersarialnych                           |
| **Opis**                | Atakujący tworzy treść skill tak, aby ominąć wzorce moderacji           |
| **Wektor ataku**        | Homoglify Unicode, sztuczki kodowania, dynamiczne ładowanie             |
| **Komponenty dotknięte problemem** | ClawHub moderation.ts                                                  |
| **Obecne zabezpieczenia** | Oparte na wzorcach FLAG_RULES                                          |
| **Ryzyko rezydualne**   | Wysokie - Proste regex łatwo obejść                                    |
| **Zalecenia**           | Dodać analizę behawioralną (VirusTotal Code Insight), wykrywanie oparte na AST |

#### T-EVADE-002: Ucieczka z opakowania treści

| Atrybut                 | Wartość                                                   |
| ----------------------- | --------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0043 - Tworzenie danych adversarialnych              |
| **Opis**                | Atakujący tworzy treść, która ucieka z kontekstu opakowania XML |
| **Wektor ataku**        | Manipulacja tagami, pomylenie kontekstu, nadpisanie instrukcji |
| **Dotknięte komponenty** | Opakowywanie treści zewnętrznej                          |
| **Obecne mitigacje**    | Tagi XML + komunikat bezpieczeństwa                       |
| **Ryzyko rezydualne**   | Średnie - Regularnie odkrywane są nowe ucieczki           |
| **Rekomendacje**        | Wiele warstw opakowania, walidacja po stronie wyjścia     |

---

### 3.6 Odkrywanie (AML.TA0008)

#### T-DISC-001: Enumeracja narzędzi

| Atrybut                 | Wartość                                               |
| ----------------------- | ----------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0040 - Dostęp do API wnioskowania modelu AI      |
| **Opis**                | Atakujący enumeruje dostępne narzędzia przez promptowanie |
| **Wektor ataku**        | Zapytania w stylu „Jakie masz narzędzia?”             |
| **Dotknięte komponenty** | Rejestr narzędzi agenta                               |
| **Obecne mitigacje**    | Brak specyficznych                                    |
| **Ryzyko rezydualne**   | Niskie - Narzędzia są zwykle udokumentowane           |
| **Rekomendacje**        | Rozważyć mechanizmy kontroli widoczności narzędzi     |

#### T-DISC-002: Ekstrakcja danych sesji

| Atrybut                 | Wartość                                               |
| ----------------------- | ----------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0040 - Dostęp do API wnioskowania modelu AI      |
| **Opis**                | Atakujący ekstrahuje wrażliwe dane z kontekstu sesji  |
| **Wektor ataku**        | Zapytania „O czym rozmawialiśmy?”, sondowanie kontekstu |
| **Dotknięte komponenty** | Transkrypty sesji, okno kontekstu                     |
| **Obecne mitigacje**    | Izolacja sesji per nadawca                            |
| **Ryzyko rezydualne**   | Średnie - Dane w ramach sesji są dostępne             |
| **Rekomendacje**        | Wdrożyć redakcję wrażliwych danych w kontekście       |

---

### 3.7 Zbieranie i eksfiltracja (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Kradzież danych przez web_fetch

| Atrybut                 | Wartość                                                                 |
| ----------------------- | ----------------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0009 - Zbieranie                                                   |
| **Opis**                | Atakujący eksfiltruje dane, instruując agenta, aby wysłał je na zewnętrzny URL |
| **Wektor ataku**        | Wstrzyknięcie promptu powodujące, że agent wysyła dane POST na serwer atakującego |
| **Dotknięte komponenty** | Narzędzie web_fetch                                                     |
| **Obecne mitigacje**    | Blokowanie SSRF dla sieci wewnętrznych                                  |
| **Ryzyko rezydualne**   | Wysokie - Zewnętrzne URL-e są dozwolone                                 |
| **Rekomendacje**        | Wdrożyć listę dozwolonych URL-i, świadomość klasyfikacji danych         |

#### T-EXFIL-002: Nieautoryzowane wysyłanie wiadomości

| Atrybut                 | Wartość                                                            |
| ----------------------- | ------------------------------------------------------------------ |
| **Identyfikator ATLAS** | AML.T0009 - Zbieranie                                              |
| **Opis**                | Atakujący powoduje, że agent wysyła wiadomości zawierające wrażliwe dane |
| **Wektor ataku**        | Wstrzyknięcie promptu powodujące, że agent wysyła wiadomość do atakującego |
| **Dotknięte komponenty** | Narzędzie wiadomości, integracje kanałów                           |
| **Obecne mitigacje**    | Bramkowanie wiadomości wychodzących                                |
| **Ryzyko rezydualne**   | Średnie - Bramkowanie może zostać ominięte                         |
| **Rekomendacje**        | Wymagać jawnego potwierdzenia dla nowych odbiorców                 |

#### T-EXFIL-003: Pozyskiwanie poświadczeń

| Atrybut                 | Wartość                                                  |
| ----------------------- | -------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0009 - Zbieranie                                    |
| **Opis**                | Złośliwy skill pozyskuje poświadczenia z kontekstu agenta |
| **Wektor ataku**        | Kod skill odczytuje zmienne środowiskowe, pliki konfiguracyjne |
| **Dotknięte komponenty** | Środowisko wykonywania skill                             |
| **Obecne mitigacje**    | Brak specyficznych dla skills                            |
| **Ryzyko rezydualne**   | Krytyczne - Skills działają z uprawnieniami agenta       |
| **Rekomendacje**        | Sandboxing skill, izolacja poświadczeń                   |

---

### 3.8 Wpływ (AML.TA0011)

#### T-IMPACT-001: Nieautoryzowane wykonywanie poleceń

| Atrybut                 | Wartość                                             |
| ----------------------- | --------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0031 - Erozja integralności modelu AI          |
| **Opis**                | Atakujący wykonuje dowolne polecenia w systemie użytkownika |
| **Wektor ataku**        | Wstrzyknięcie promptu połączone z obejściem zatwierdzania exec |
| **Dotknięte komponenty** | Narzędzie Bash, wykonywanie poleceń                 |
| **Obecne mitigacje**    | Zatwierdzenia exec, opcja sandboxa Docker           |
| **Ryzyko rezydualne**   | Krytyczne - Wykonywanie na hoście bez sandboxa      |
| **Rekomendacje**        | Domyślnie używać sandboxa, ulepszyć UX zatwierdzania |

#### T-IMPACT-002: Wyczerpanie zasobów (DoS)

| Atrybut                 | Wartość                                            |
| ----------------------- | -------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0031 - Erozja integralności modelu AI         |
| **Opis**                | Atakujący wyczerpuje kredyty API lub zasoby obliczeniowe |
| **Wektor ataku**        | Zautomatyzowane zalewanie wiadomościami, kosztowne wywołania narzędzi |
| **Dotknięte komponenty** | Gateway, sesje agentów, dostawca API               |
| **Obecne mitigacje**    | Brak                                               |
| **Ryzyko rezydualne**   | Wysokie - Brak limitowania szybkości               |
| **Rekomendacje**        | Wdrożyć limity szybkości per nadawca, budżety kosztów |

#### T-IMPACT-003: Szkoda reputacyjna

| Atrybut                 | Wartość                                                 |
| ----------------------- | ------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0031 - Erozja integralności modelu AI              |
| **Opis**                | Atakujący powoduje, że agent wysyła szkodliwe/obraźliwe treści |
| **Wektor ataku**        | Wstrzyknięcie promptu powodujące nieodpowiednie odpowiedzi |
| **Dotknięte komponenty** | Generowanie wyjścia, wiadomości kanałów                 |
| **Obecne mitigacje**    | Polityki treści dostawcy LLM                            |
| **Ryzyko rezydualne**   | Średnie - Filtry dostawcy są niedoskonałe               |
| **Rekomendacje**        | Warstwa filtrowania wyjścia, kontrolki użytkownika      |

---

## 4. Analiza łańcucha dostaw ClawHub

### 4.1 Obecne mechanizmy kontroli bezpieczeństwa

| Kontrola             | Implementacja              | Skuteczność                                           |
| -------------------- | -------------------------- | ----------------------------------------------------- |
| Wiek konta GitHub    | `requireGitHubAccountAge()` | Średnia - Podnosi próg dla nowych atakujących         |
| Sanityzacja ścieżki  | `sanitizePath()`           | Wysoka - Zapobiega przechodzeniu ścieżek              |
| Walidacja typu pliku | `isTextFile()`             | Średnia - Tylko pliki tekstowe, ale nadal mogą być złośliwe |
| Limity rozmiaru      | Łączny pakiet 50 MB         | Wysoka - Zapobiega wyczerpaniu zasobów                |
| Wymagany SKILL.md    | Obowiązkowy plik readme     | Niska wartość bezpieczeństwa - Tylko informacyjny     |
| Moderacja wzorców    | FLAG_RULES w moderation.ts | Niska - Łatwe do obejścia                             |
| Status moderacji     | Pole `moderationStatus`    | Średnia - Możliwa ręczna weryfikacja                  |

### 4.2 Wzorce flag moderacyjnych

Obecne wzorce w `moderation.ts`:

```javascript
// Known-bad identifiers
/(keepcold131\/ClawdAuthenticatorTool|ClawdAuthenticatorTool)/i

// Suspicious keywords
/(malware|stealer|phish|phishing|keylogger)/i
/(api[-_ ]?key|token|password|private key|secret)/i
/(wallet|seed phrase|mnemonic|crypto)/i
/(discord\.gg|webhook|hooks\.slack)/i
/(curl[^\n]+\|\s*(sh|bash))/i
/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd)/i
```

**Ograniczenia:**

- Sprawdza tylko slug, displayName, summary, frontmatter, metadane i ścieżki plików
- Nie analizuje rzeczywistej treści kodu skill
- Proste wyrażenia regularne łatwo obejść przez zaciemnianie
- Brak analizy behawioralnej

### 4.3 Planowane ulepszenia

| Ulepszenie             | Status                                | Wpływ                                                                 |
| ---------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| Integracja VirusTotal  | W toku                                | Wysoki - Analiza behawioralna Code Insight                            |
| Zgłaszanie społecznościowe | Częściowe (istnieje tabela `skillReports`) | Średni                                                               |
| Rejestrowanie audytowe | Częściowe (istnieje tabela `auditLogs`) | Średni                                                              |
| System odznak          | Wdrożony                              | Średni - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. Macierz ryzyka

### 5.1 Prawdopodobieństwo a wpływ

| Identyfikator zagrożenia | Prawdopodobieństwo | Wpływ    | Poziom ryzyka | Priorytet |
| ------------- | ---------- | -------- | ------------ | -------- |
| T-EXEC-001    | Wysokie    | Krytyczny | **Krytyczne** | P0       |
| T-PERSIST-001 | Wysokie    | Krytyczny | **Krytyczne** | P0       |
| T-EXFIL-003   | Średnie    | Krytyczny | **Krytyczne** | P0       |
| T-IMPACT-001  | Średnie    | Krytyczny | **Wysokie**   | P1       |
| T-EXEC-002    | Wysokie    | Wysoki   | **Wysokie**   | P1       |
| T-EXEC-004    | Średnie    | Wysoki   | **Wysokie**   | P1       |
| T-ACCESS-003  | Średnie    | Wysoki   | **Wysokie**   | P1       |
| T-EXFIL-001   | Średnie    | Wysoki   | **Wysokie**   | P1       |
| T-IMPACT-002  | Wysokie    | Średni   | **Wysokie**   | P1       |
| T-EVADE-001   | Wysokie    | Średni   | **Średnie**   | P2       |
| T-ACCESS-001  | Niskie     | Wysoki   | **Średnie**   | P2       |
| T-ACCESS-002  | Niskie     | Wysoki   | **Średnie**   | P2       |
| T-PERSIST-002 | Niskie     | Wysoki   | **Średnie**   | P2       |

### 5.2 Krytyczne ścieżki łańcuchów ataku

**Łańcuch ataku 1: Kradzież danych oparta na skill**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Publish malicious skill) → (Evade moderation) → (Harvest credentials)
```

**Łańcuch ataku 2: Wstrzyknięcie promptu do RCE**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Inject prompt) → (Bypass exec approval) → (Execute commands)
```

**Łańcuch ataku 3: Pośrednie wstrzyknięcie przez pobraną treść**

```
T-EXEC-002 → T-EXFIL-001 → External exfiltration
(Poison URL content) → (Agent fetches & follows instructions) → (Data sent to attacker)
```

---

## 6. Podsumowanie rekomendacji

### 6.1 Natychmiastowe (P0)

| ID    | Zalecenie                                   | Dotyczy                    |
| ----- | ------------------------------------------- | -------------------------- |
| R-001 | Ukończyć integrację z VirusTotal            | T-PERSIST-001, T-EVADE-001 |
| R-002 | Wdrożyć izolację umiejętności w piaskownicy | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Dodać walidację danych wyjściowych dla działań wrażliwych | T-EXEC-001, T-EXEC-002     |

### 6.2 Krótkoterminowe (P1)

| ID    | Zalecenie                                | Dotyczy      |
| ----- | ---------------------------------------- | ------------ |
| R-004 | Wdrożyć ograniczanie częstotliwości      | T-IMPACT-002 |
| R-005 | Dodać szyfrowanie tokenów w spoczynku    | T-ACCESS-003 |
| R-006 | Ulepszyć UX zatwierdzania exec i walidację | T-EXEC-004   |
| R-007 | Wdrożyć listę dozwolonych adresów URL dla web_fetch | T-EXFIL-001  |

### 6.3 Średnioterminowe (P2)

| ID    | Zalecenie                                            | Dotyczy       |
| ----- | ---------------------------------------------------- | ------------- |
| R-008 | Dodać kryptograficzną weryfikację kanałów tam, gdzie to możliwe | T-ACCESS-002  |
| R-009 | Wdrożyć weryfikację integralności konfiguracji       | T-PERSIST-003 |
| R-010 | Dodać podpisywanie aktualizacji i przypinanie wersji | T-PERSIST-002 |

---

## 7. Załączniki

### 7.1 Mapowanie technik ATLAS

| ID ATLAS      | Nazwa techniki                 | Zagrożenia OpenClaw                                             |
| ------------- | ------------------------------ | ---------------------------------------------------------------- |
| AML.T0006     | Aktywne skanowanie             | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | Zbieranie danych               | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | Łańcuch dostaw: oprogramowanie AI | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | Łańcuch dostaw: dane           | T-PERSIST-003                                                    |
| AML.T0031     | Osłabianie integralności modelu AI | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                         |
| AML.T0040     | Dostęp do API wnioskowania modelu AI | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Tworzenie danych adwersarialnych | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | Wstrzyknięcie promptu LLM: bezpośrednie | T-EXEC-001, T-EXEC-003                                           |
| AML.T0051.001 | Wstrzyknięcie promptu LLM: pośrednie | T-EXEC-002                                                       |

### 7.2 Kluczowe pliki bezpieczeństwa

| Ścieżka                             | Cel                         | Poziom ryzyka |
| ----------------------------------- | --------------------------- | ------------ |
| `src/infra/exec-approvals.ts`       | Logika zatwierdzania poleceń | **Krytyczny** |
| `src/gateway/auth.ts`               | Uwierzytelnianie Gateway    | **Krytyczny** |
| `src/infra/net/ssrf.ts`             | Ochrona przed SSRF          | **Krytyczny** |
| `src/security/external-content.ts`  | Ograniczanie wstrzyknięć promptu | **Krytyczny** |
| `src/agents/sandbox/tool-policy.ts` | Egzekwowanie zasad narzędzi | **Krytyczny** |
| `src/routing/resolve-route.ts`      | Izolacja sesji              | **Średni**   |

### 7.3 Słownik

| Termin               | Definicja                                                 |
| -------------------- | --------------------------------------------------------- |
| **ATLAS**            | Adwersarialny krajobraz zagrożeń MITRE dla systemów AI    |
| **ClawHub**          | Rynek umiejętności OpenClaw                               |
| **Gateway**          | Warstwa routingu wiadomości i uwierzytelniania OpenClaw   |
| **MCP**              | Model Context Protocol - interfejs dostawcy narzędzi      |
| **Prompt Injection** | Atak, w którym złośliwe instrukcje są osadzone w danych wejściowych |
| **Skill**            | Pobieralne rozszerzenie dla agentów OpenClaw              |
| **SSRF**             | Fałszowanie żądań po stronie serwera                      |

---

_Ten model zagrożeń jest żywym dokumentem. Zgłaszaj problemy z bezpieczeństwem na adres security@openclaw.ai_

## Powiązane

- [Formalna weryfikacja](/pl/security/formal-verification)
- [Wkład w model zagrożeń](/pl/security/CONTRIBUTING-THREAT-MODEL)
