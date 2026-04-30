---
read_when:
    - Ocena stanu bezpieczeństwa lub scenariuszy zagrożeń
    - Praca nad funkcjami bezpieczeństwa lub odpowiedziami na audyty
summary: Model zagrożeń OpenClaw odwzorowany w ramach MITRE ATLAS
title: Model zagrożeń (MITRE ATLAS)
x-i18n:
    generated_at: "2026-04-30T10:18:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: d929addb829b92d650ef6caecb267fb154f6f9f7d28be7aa87851569931f5228
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
---

# Model zagrożeń OpenClaw v1.0

## Struktura MITRE ATLAS

**Wersja:** 1.0-draft
**Ostatnia aktualizacja:** 2026-02-04
**Metodyka:** MITRE ATLAS + diagramy przepływu danych
**Struktura:** [MITRE ATLAS](https://atlas.mitre.org/) (krajobraz zagrożeń adwersarialnych dla systemów AI)

### Atrybucja struktury

Ten model zagrożeń opiera się na [MITRE ATLAS](https://atlas.mitre.org/), branżowym standardzie dokumentowania zagrożeń adwersarialnych dla systemów AI/ML. ATLAS jest utrzymywany przez [MITRE](https://www.mitre.org/) we współpracy ze społecznością bezpieczeństwa AI.

**Kluczowe zasoby ATLAS:**

- [Techniki ATLAS](https://atlas.mitre.org/techniques/)
- [Taktyki ATLAS](https://atlas.mitre.org/tactics/)
- [Studia przypadków ATLAS](https://atlas.mitre.org/studies/)
- [ATLAS GitHub](https://github.com/mitre-atlas/atlas-data)
- [Współtworzenie ATLAS](https://atlas.mitre.org/resources/contribute)

### Współtworzenie tego modelu zagrożeń

To żywy dokument utrzymywany przez społeczność OpenClaw. Zobacz [CONTRIBUTING-THREAT-MODEL.md](/pl/security/CONTRIBUTING-THREAT-MODEL), aby poznać wytyczne dotyczące współtworzenia:

- Zgłaszanie nowych zagrożeń
- Aktualizowanie istniejących zagrożeń
- Proponowanie łańcuchów ataków
- Sugerowanie środków ograniczających ryzyko

---

## 1. Wprowadzenie

### 1.1 Cel

Ten model zagrożeń dokumentuje zagrożenia adwersarialne dla platformy agentów AI OpenClaw oraz marketplace umiejętności ClawHub, używając struktury MITRE ATLAS zaprojektowanej specjalnie dla systemów AI/ML.

### 1.2 Zakres

| Komponent              | Uwzględniono | Uwagi                                            |
| ---------------------- | -------- | ------------------------------------------------ |
| Środowisko uruchomieniowe agentów OpenClaw | Tak      | Wykonywanie głównych agentów, wywołania narzędzi, sesje       |
| Gateway                | Tak      | Uwierzytelnianie, routing, integracja kanałów     |
| Integracje kanałów   | Tak      | WhatsApp, Telegram, Discord, Signal, Slack itd. |
| Marketplace ClawHub    | Tak      | Publikowanie umiejętności, moderacja, dystrybucja       |
| Serwery MCP            | Tak      | Zewnętrzni dostawcy narzędzi                          |
| Urządzenia użytkowników           | Częściowo  | Aplikacje mobilne, klienty desktopowe                     |

### 1.3 Poza zakresem

Nic nie jest jawnie wyłączone z zakresu tego modelu zagrożeń.

---

## 2. Architektura systemu

### 2.1 Granice zaufania

```
┌─────────────────────────────────────────────────────────────────┐
│                    STREFA NIEZAUFANA                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 GRANICA ZAUFANIA 1: Dostęp kanałowy                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Parowanie urządzeń (1h DM / 5m okres karencji węzła)           │   │
│  │  • Weryfikacja AllowFrom / AllowList                       │   │
│  │  • Uwierzytelnianie tokenem/hasłem/Tailscale                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 GRANICA ZAUFANIA 2: Izolacja sesji              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   SESJE AGENTÓW                          │   │
│  │  • Klucz sesji = agent:channel:peer                       │   │
│  │  • Zasady narzędzi dla każdego agenta                                │   │
│  │  • Rejestrowanie transkryptu                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 GRANICA ZAUFANIA 3: Wykonywanie narzędzi                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  PIASKOWNICA WYKONAWCZA                        │   │
│  │  • Piaskownica Docker ALBO host (exec-approvals)                │   │
│  │  • Zdalne wykonywanie Node                                  │   │
│  │  • Ochrona przed SSRF (przypinanie DNS + blokowanie IP)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 GRANICA ZAUFANIA 4: Zewnętrzna zawartość               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              POBRANE ADRESY URL / E-MAILE / WEBHOOKI             │   │
│  │  • Owijanie zawartości zewnętrznej (tagi XML)                   │   │
│  │  • Wstrzykiwanie powiadomienia o bezpieczeństwie                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 GRANICA ZAUFANIA 5: Łańcuch dostaw                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Publikowanie umiejętności (wymagane semver, SKILL.md)           │   │
│  │  • Flagi moderacji oparte na wzorcach                         │   │
│  │  • Skanowanie VirusTotal (wkrótce)                      │   │
│  │  • Weryfikacja wieku konta GitHub                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Przepływy danych

| Przepływ | Źródło  | Cel | Dane               | Ochrona           |
| ---- | ------- | ----------- | ------------------ | -------------------- |
| F1   | Kanał | Gateway     | Wiadomości użytkownika      | TLS, AllowFrom       |
| F2   | Gateway | Agent       | Przekierowane wiadomości    | Izolacja sesji    |
| F3   | Agent   | Narzędzia       | Wywołania narzędzi   | Egzekwowanie zasad   |
| F4   | Agent   | Zewnętrzne    | Żądania web_fetch | Blokowanie SSRF        |
| F5   | ClawHub | Agent       | Kod umiejętności         | Moderacja, skanowanie |
| F6   | Agent   | Kanał     | Odpowiedzi          | Filtrowanie wyjścia     |

---

## 3. Analiza zagrożeń według taktyki ATLAS

### 3.1 Rozpoznanie (AML.TA0002)

#### T-RECON-001: Wykrywanie punktów końcowych agenta

| Atrybut               | Wartość                                                                |
| ----------------------- | -------------------------------------------------------------------- |
| **Identyfikator ATLAS**            | AML.T0006 - Aktywne skanowanie                                          |
| **Opis**         | Atakujący skanuje w poszukiwaniu wystawionych punktów końcowych bramy OpenClaw                |
| **Wektor ataku**       | Skanowanie sieci, zapytania shodan, enumeracja DNS                    |
| **Dotknięte komponenty** | Gateway, wystawione punkty końcowe API                                       |
| **Obecne środki ograniczające ryzyko** | Opcja uwierzytelniania Tailscale, domyślne wiązanie z loopback                   |
| **Ryzyko rezydualne**       | Średnie - publiczne bramy są wykrywalne                                |
| **Zalecenia**     | Udokumentować bezpieczne wdrożenie, dodać ograniczanie szybkości na punktach końcowych wykrywania |

#### T-RECON-002: Sondowanie integracji kanałów

| Atrybut                 | Wartość                                                                |
| ----------------------- | ---------------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0006 - Aktywne skanowanie                                         |
| **Opis**                | Atakujący sonduje kanały wiadomości, aby zidentyfikować konta zarządzane przez AI |
| **Wektor ataku**        | Wysyłanie wiadomości testowych, obserwowanie wzorców odpowiedzi        |
| **Dotknięte komponenty** | Wszystkie integracje kanałów                                          |
| **Obecne środki ograniczające** | Brak konkretnych                                                |
| **Ryzyko szczątkowe**   | Niskie - Ograniczona wartość samego odkrycia                           |
| **Rekomendacje**        | Rozważ losową zmianę czasu odpowiedzi                                  |

---

### 3.2 Dostęp początkowy (AML.TA0004)

#### T-ACCESS-001: Przechwycenie kodu parowania

| Atrybut                 | Wartość                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0040 - Dostęp do API wnioskowania modelu AI                                                              |
| **Opis**                | Atakujący przechwytuje kod parowania w okresie karencji parowania (1 godz. dla parowania kanału DM, 5 min dla parowania Node) |
| **Wektor ataku**        | Podglądanie przez ramię, podsłuchiwanie sieci, socjotechnika                                                  |
| **Dotknięte komponenty** | System parowania urządzeń                                                                                    |
| **Obecne środki ograniczające** | Wygaśnięcie po 1 godz. (parowanie DM) / wygaśnięcie po 5 min (parowanie Node), kody wysyłane przez istniejący kanał |
| **Ryzyko szczątkowe**   | Średnie - Okres karencji możliwy do wykorzystania                                                             |
| **Rekomendacje**        | Skróć okres karencji, dodaj krok potwierdzenia                                                                |

#### T-ACCESS-002: Fałszowanie AllowFrom

| Atrybut                 | Wartość                                                                       |
| ----------------------- | ----------------------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0040 - Dostęp do API wnioskowania modelu AI                              |
| **Opis**                | Atakujący fałszuje tożsamość dozwolonego nadawcy w kanale                     |
| **Wektor ataku**        | Zależy od kanału - fałszowanie numeru telefonu, podszywanie się pod nazwę użytkownika |
| **Dotknięte komponenty** | Walidacja AllowFrom dla każdego kanału                                       |
| **Obecne środki ograniczające** | Weryfikacja tożsamości specyficzna dla kanału                         |
| **Ryzyko szczątkowe**   | Średnie - Niektóre kanały są podatne na fałszowanie                           |
| **Rekomendacje**        | Udokumentuj ryzyka specyficzne dla kanałów, dodaj weryfikację kryptograficzną tam, gdzie to możliwe |

#### T-ACCESS-003: Kradzież tokenów

| Atrybut                 | Wartość                                                     |
| ----------------------- | ----------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0040 - Dostęp do API wnioskowania modelu AI            |
| **Opis**                | Atakujący kradnie tokeny uwierzytelniające z plików konfiguracji |
| **Wektor ataku**        | Złośliwe oprogramowanie, nieautoryzowany dostęp do urządzenia, ujawnienie kopii zapasowej konfiguracji |
| **Dotknięte komponenty** | ~/.openclaw/credentials/, przechowywanie konfiguracji       |
| **Obecne środki ograniczające** | Uprawnienia plików                                  |
| **Ryzyko szczątkowe**   | Wysokie - Tokeny są przechowywane w postaci zwykłego tekstu |
| **Rekomendacje**        | Wdróż szyfrowanie tokenów w spoczynku, dodaj rotację tokenów |

---

### 3.3 Wykonanie (AML.TA0005)

#### T-EXEC-001: Bezpośrednie wstrzyknięcie promptu

| Atrybut                 | Wartość                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0051.000 - Wstrzyknięcie promptu LLM: bezpośrednie                                   |
| **Opis**                | Atakujący wysyła spreparowane prompty, aby manipulować zachowaniem agenta                 |
| **Wektor ataku**        | Wiadomości w kanale zawierające wrogie instrukcje                                         |
| **Dotknięte komponenty** | LLM agenta, wszystkie powierzchnie wejściowe                                             |
| **Obecne środki ograniczające** | Wykrywanie wzorców, opakowywanie treści zewnętrznych                            |
| **Ryzyko szczątkowe**   | Krytyczne - Tylko wykrywanie, bez blokowania; zaawansowane ataki je omijają               |
| **Rekomendacje**        | Wdróż wielowarstwową obronę, walidację wyjścia, potwierdzenie użytkownika dla działań wrażliwych |

#### T-EXEC-002: Pośrednie wstrzyknięcie promptu

| Atrybut                 | Wartość                                                     |
| ----------------------- | ----------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0051.001 - Wstrzyknięcie promptu LLM: pośrednie        |
| **Opis**                | Atakujący osadza złośliwe instrukcje w pobranej treści      |
| **Wektor ataku**        | Złośliwe URL-e, zatrute wiadomości e-mail, przejęte webhooks |
| **Dotknięte komponenty** | web_fetch, pobieranie wiadomości e-mail, zewnętrzne źródła danych |
| **Obecne środki ograniczające** | Opakowywanie treści tagami XML i informacją o bezpieczeństwie |
| **Ryzyko szczątkowe**   | Wysokie - LLM może zignorować instrukcje opakowania         |
| **Rekomendacje**        | Wdróż sanityzację treści, oddzielne konteksty wykonania     |

#### T-EXEC-003: Wstrzyknięcie argumentów narzędzia

| Atrybut                 | Wartość                                                      |
| ----------------------- | ------------------------------------------------------------ |
| **Identyfikator ATLAS** | AML.T0051.000 - Wstrzyknięcie promptu LLM: bezpośrednie      |
| **Opis**                | Atakujący manipuluje argumentami narzędzia przez wstrzyknięcie promptu |
| **Wektor ataku**        | Spreparowane prompty wpływające na wartości parametrów narzędzia |
| **Dotknięte komponenty** | Wszystkie wywołania narzędzi                                |
| **Obecne środki ograniczające** | Zatwierdzenia exec dla niebezpiecznych poleceń       |
| **Ryzyko szczątkowe**   | Wysokie - Polega na ocenie użytkownika                       |
| **Rekomendacje**        | Wdróż walidację argumentów, parametryzowane wywołania narzędzi |

#### T-EXEC-004: Obejście zatwierdzenia exec

| Atrybut                 | Wartość                                                    |
| ----------------------- | ---------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0043 - Tworzenie wrogich danych                       |
| **Opis**                | Atakujący tworzy polecenia omijające listę dozwolonych zatwierdzeń |
| **Wektor ataku**        | Zaciemnianie poleceń, wykorzystanie aliasów, manipulacja ścieżką |
| **Dotknięte komponenty** | exec-approvals.ts, lista dozwolonych poleceń              |
| **Obecne środki ograniczające** | Lista dozwolonych + tryb pytania                  |
| **Ryzyko szczątkowe**   | Wysokie - Brak sanityzacji poleceń                         |
| **Rekomendacje**        | Wdróż normalizację poleceń, rozszerz listę blokowanych      |

---

### 3.4 Utrwalenie dostępu (AML.TA0006)

#### T-PERSIST-001: Instalacja złośliwej umiejętności

| Atrybut                 | Wartość                                                                  |
| ----------------------- | ------------------------------------------------------------------------ |
| **Identyfikator ATLAS** | AML.T0010.001 - Kompromitacja łańcucha dostaw: oprogramowanie AI         |
| **Opis**                | Atakujący publikuje złośliwą umiejętność w ClawHub                       |
| **Wektor ataku**        | Utworzenie konta, opublikowanie umiejętności z ukrytym złośliwym kodem   |
| **Dotknięte komponenty** | ClawHub, ładowanie umiejętności, wykonanie agenta                       |
| **Obecne środki ograniczające** | Weryfikacja wieku konta GitHub, flagi moderacji oparte na wzorcach |
| **Ryzyko szczątkowe**   | Krytyczne - Brak sandboxingu, ograniczony przegląd                       |
| **Rekomendacje**        | Integracja z VirusTotal (w toku), sandboxing umiejętności, przegląd społecznościowy |

#### T-PERSIST-002: Zatrucie aktualizacji umiejętności

| Atrybut                 | Wartość                                                        |
| ----------------------- | -------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0010.001 - Kompromitacja łańcucha dostaw: oprogramowanie AI |
| **Opis**                | Atakujący kompromituje popularną umiejętność i wypycha złośliwą aktualizację |
| **Wektor ataku**        | Przejęcie konta, socjotechnika wobec właściciela umiejętności  |
| **Dotknięte komponenty** | Wersjonowanie ClawHub, przepływy automatycznej aktualizacji   |
| **Obecne środki ograniczające** | Odciski palca wersji                                  |
| **Ryzyko szczątkowe**   | Wysokie - Automatyczne aktualizacje mogą pobrać złośliwe wersje |
| **Rekomendacje**        | Wdróż podpisywanie aktualizacji, możliwość wycofania, przypinanie wersji |

#### T-PERSIST-003: Manipulacja konfiguracją agenta

| Atrybut                 | Wartość                                                         |
| ----------------------- | --------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0010.002 - Kompromitacja łańcucha dostaw: dane             |
| **Opis**                | Atakujący modyfikuje konfigurację agenta, aby utrzymać dostęp   |
| **Wektor ataku**        | Modyfikacja pliku konfiguracji, wstrzyknięcie ustawień          |
| **Dotknięte komponenty** | Konfiguracja agenta, zasady narzędzi                           |
| **Obecne środki ograniczające** | Uprawnienia plików                                      |
| **Ryzyko szczątkowe**   | Średnie - Wymaga dostępu lokalnego                              |
| **Rekomendacje**        | Weryfikacja integralności konfiguracji, rejestrowanie audytowe zmian konfiguracji |

---

### 3.5 Unikanie obrony (AML.TA0007)

#### T-EVADE-001: Obejście wzorców moderacji

| Atrybut                 | Wartość                                                                |
| ----------------------- | ---------------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0043 - Tworzenie wrogich danych                                   |
| **Opis**                | Atakujący tworzy treść umiejętności, aby ominąć wzorce moderacji       |
| **Wektor ataku**        | Homoglify Unicode, sztuczki z kodowaniem, dynamiczne ładowanie         |
| **Dotknięte komponenty** | ClawHub moderation.ts                                                 |
| **Obecne środki ograniczające** | FLAG_RULES oparte na wzorcach                                  |
| **Ryzyko szczątkowe**   | Wysokie - Proste wyrażenia regularne łatwo obejść                      |
| **Rekomendacje**        | Dodaj analizę behawioralną (VirusTotal Code Insight), wykrywanie oparte na AST |

#### T-EVADE-002: Ucieczka z opakowania treści

| Atrybut                 | Wartość                                                   |
| ----------------------- | --------------------------------------------------------- |
| **ATLAS ID**            | AML.T0043 - Tworzenie danych adwersarialnych              |
| **Opis**                | Atakujący tworzy treść, która wymyka się z kontekstu opakowania XML |
| **Wektor ataku**        | Manipulacja tagami, pomylenie kontekstu, nadpisanie instrukcji |
| **Dotknięte komponenty** | Opakowywanie treści zewnętrznych                         |
| **Bieżące środki zaradcze** | Tagi XML + informacja o bezpieczeństwie               |
| **Ryzyko rezydualne**   | Średnie - Nowe sposoby ucieczki są regularnie odkrywane   |
| **Rekomendacje**        | Wiele warstw opakowania, walidacja po stronie wyjścia     |

---

### 3.6 Rozpoznanie (AML.TA0008)

#### T-DISC-001: Wyliczanie narzędzi

| Atrybut                 | Wartość                                               |
| ----------------------- | ----------------------------------------------------- |
| **ATLAS ID**            | AML.T0040 - Dostęp do API inferencji modelu AI        |
| **Opis**                | Atakujący wylicza dostępne narzędzia przez promptowanie |
| **Wektor ataku**        | Zapytania w stylu „Jakie masz narzędzia?”             |
| **Dotknięte komponenty** | Rejestr narzędzi agenta                              |
| **Bieżące środki zaradcze** | Brak specyficznych                                |
| **Ryzyko rezydualne**   | Niskie - Narzędzia są zazwyczaj udokumentowane        |
| **Rekomendacje**        | Rozważyć kontrolę widoczności narzędzi                |

#### T-DISC-002: Wyodrębnianie danych sesji

| Atrybut                 | Wartość                                               |
| ----------------------- | ----------------------------------------------------- |
| **ATLAS ID**            | AML.T0040 - Dostęp do API inferencji modelu AI        |
| **Opis**                | Atakujący wyodrębnia wrażliwe dane z kontekstu sesji  |
| **Wektor ataku**        | Zapytania „O czym rozmawialiśmy?”, sondowanie kontekstu |
| **Dotknięte komponenty** | Transkrypty sesji, okno kontekstu                    |
| **Bieżące środki zaradcze** | Izolacja sesji na nadawcę                         |
| **Ryzyko rezydualne**   | Średnie - Dane w obrębie sesji są dostępne            |
| **Rekomendacje**        | Wdrożyć redakcję danych wrażliwych w kontekście       |

---

### 3.7 Zbieranie i eksfiltracja (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Kradzież danych przez web_fetch

| Atrybut                 | Wartość                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0009 - Zbieranie                                                 |
| **Opis**                | Atakujący eksfiltruje dane, instruując agenta, aby wysłał je na zewnętrzny URL |
| **Wektor ataku**        | Wstrzyknięcie promptu powodujące, że agent wysyła dane metodą POST na serwer atakującego |
| **Dotknięte komponenty** | Narzędzie web_fetch                                                   |
| **Bieżące środki zaradcze** | Blokowanie SSRF dla sieci wewnętrznych                            |
| **Ryzyko rezydualne**   | Wysokie - Zewnętrzne URL-e są dozwolone                               |
| **Rekomendacje**        | Wdrożyć listę dozwolonych URL-i, świadomość klasyfikacji danych       |

#### T-EXFIL-002: Nieautoryzowane wysyłanie wiadomości

| Atrybut                 | Wartość                                                         |
| ----------------------- | --------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0009 - Zbieranie                                           |
| **Opis**                | Atakujący powoduje, że agent wysyła wiadomości zawierające wrażliwe dane |
| **Wektor ataku**        | Wstrzyknięcie promptu powodujące wysłanie wiadomości do atakującego przez agenta |
| **Dotknięte komponenty** | Narzędzie wiadomości, integracje kanałów                       |
| **Bieżące środki zaradcze** | Bramkowanie wiadomości wychodzących                         |
| **Ryzyko rezydualne**   | Średnie - Bramkowanie może zostać obejście                      |
| **Rekomendacje**        | Wymagać wyraźnego potwierdzenia dla nowych odbiorców            |

#### T-EXFIL-003: Pozyskiwanie poświadczeń

| Atrybut                 | Wartość                                                  |
| ----------------------- | -------------------------------------------------------- |
| **ATLAS ID**            | AML.T0009 - Zbieranie                                    |
| **Opis**                | Złośliwy skill pozyskuje poświadczenia z kontekstu agenta |
| **Wektor ataku**        | Kod skilla odczytuje zmienne środowiskowe, pliki konfiguracyjne |
| **Dotknięte komponenty** | Środowisko wykonywania skilli                           |
| **Bieżące środki zaradcze** | Brak specyficznych dla skilli                        |
| **Ryzyko rezydualne**   | Krytyczne - Skills działają z uprawnieniami agenta       |
| **Rekomendacje**        | Piaskownica dla skilli, izolacja poświadczeń             |

---

### 3.8 Wpływ (AML.TA0011)

#### T-IMPACT-001: Nieautoryzowane wykonywanie poleceń

| Atrybut                 | Wartość                                             |
| ----------------------- | --------------------------------------------------- |
| **ATLAS ID**            | AML.T0031 - Osłabienie integralności modelu AI      |
| **Opis**                | Atakujący wykonuje dowolne polecenia w systemie użytkownika |
| **Wektor ataku**        | Wstrzyknięcie promptu połączone z obejściem zatwierdzania exec |
| **Dotknięte komponenty** | Narzędzie Bash, wykonywanie poleceń                |
| **Bieżące środki zaradcze** | Zatwierdzenia exec, opcja piaskownicy Docker    |
| **Ryzyko rezydualne**   | Krytyczne - Wykonywanie na hoście bez piaskownicy   |
| **Rekomendacje**        | Domyślnie używać piaskownicy, poprawić UX zatwierdzania |

#### T-IMPACT-002: Wyczerpanie zasobów (DoS)

| Atrybut                 | Wartość                                            |
| ----------------------- | -------------------------------------------------- |
| **ATLAS ID**            | AML.T0031 - Osłabienie integralności modelu AI     |
| **Opis**                | Atakujący wyczerpuje kredyty API lub zasoby obliczeniowe |
| **Wektor ataku**        | Automatyczne zalewanie wiadomościami, kosztowne wywołania narzędzi |
| **Dotknięte komponenty** | Gateway, sesje agenta, dostawca API               |
| **Bieżące środki zaradcze** | Brak                                           |
| **Ryzyko rezydualne**   | Wysokie - Brak ograniczania szybkości              |
| **Rekomendacje**        | Wdrożyć limity szybkości na nadawcę, budżety kosztów |

#### T-IMPACT-003: Szkoda reputacyjna

| Atrybut                 | Wartość                                                   |
| ----------------------- | --------------------------------------------------------- |
| **ATLAS ID**            | AML.T0031 - Osłabienie integralności modelu AI            |
| **Opis**                | Atakujący powoduje, że agent wysyła szkodliwe/obraźliwe treści |
| **Wektor ataku**        | Wstrzyknięcie promptu powodujące nieodpowiednie odpowiedzi |
| **Dotknięte komponenty** | Generowanie wyjścia, wysyłanie wiadomości kanałami       |
| **Bieżące środki zaradcze** | Polityki treści dostawcy LLM                         |
| **Ryzyko rezydualne**   | Średnie - Filtry dostawcy są niedoskonałe                 |
| **Rekomendacje**        | Warstwa filtrowania wyjścia, kontrolki użytkownika        |

---

## 4. Analiza łańcucha dostaw ClawHub

### 4.1 Bieżące kontrole bezpieczeństwa

| Kontrola             | Implementacja              | Skuteczność                                         |
| -------------------- | --------------------------- | --------------------------------------------------- |
| Wiek konta GitHub    | `requireGitHubAccountAge()` | Średnia - Podnosi poprzeczkę dla nowych atakujących |
| Sanityzacja ścieżki  | `sanitizePath()`            | Wysoka - Zapobiega przechodzeniu po ścieżkach       |
| Walidacja typu pliku | `isTextFile()`              | Średnia - Tylko pliki tekstowe, ale nadal mogą być złośliwe |
| Limity rozmiaru      | Łączny pakiet 50MB          | Wysoka - Zapobiega wyczerpaniu zasobów              |
| Wymagany SKILL.md    | Obowiązkowy plik readme     | Niska wartość bezpieczeństwa - Tylko informacyjna   |
| Moderacja wzorców    | FLAG_RULES w moderation.ts  | Niska - Łatwa do obejścia                           |
| Status moderacji     | Pole `moderationStatus`     | Średnia - Możliwy ręczny przegląd                   |

### 4.2 Wzorce flag moderacji

Bieżące wzorce w `moderation.ts`:

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

- Sprawdza tylko slug, displayName, podsumowanie, frontmatter, metadane, ścieżki plików
- Nie analizuje rzeczywistej zawartości kodu skilla
- Prosty regex łatwy do obejścia przez zaciemnianie
- Brak analizy behawioralnej

### 4.3 Planowane ulepszenia

| Ulepszenie             | Status                                | Wpływ                                                                 |
| ---------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| Integracja VirusTotal  | W toku                                | Wysoki - Analiza behawioralna Code Insight                            |
| Zgłoszenia społeczności | Częściowe (istnieje tabela `skillReports`) | Średni                                                               |
| Rejestrowanie audytu   | Częściowe (istnieje tabela `auditLogs`) | Średni                                                              |
| System odznak          | Wdrożony                              | Średni - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. Macierz ryzyka

### 5.1 Prawdopodobieństwo a wpływ

| ID zagrożenia | Prawdopodobieństwo | Wpływ     | Poziom ryzyka | Priorytet |
| ------------- | ------------------ | --------- | ------------- | --------- |
| T-EXEC-001    | Wysokie            | Krytyczny | **Krytyczne** | P0        |
| T-PERSIST-001 | Wysokie            | Krytyczny | **Krytyczne** | P0        |
| T-EXFIL-003   | Średnie            | Krytyczny | **Krytyczne** | P0        |
| T-IMPACT-001  | Średnie            | Krytyczny | **Wysokie**   | P1        |
| T-EXEC-002    | Wysokie            | Wysoki    | **Wysokie**   | P1        |
| T-EXEC-004    | Średnie            | Wysoki    | **Wysokie**   | P1        |
| T-ACCESS-003  | Średnie            | Wysoki    | **Wysokie**   | P1        |
| T-EXFIL-001   | Średnie            | Wysoki    | **Wysokie**   | P1        |
| T-IMPACT-002  | Wysokie            | Średni    | **Wysokie**   | P1        |
| T-EVADE-001   | Wysokie            | Średni    | **Średnie**   | P2        |
| T-ACCESS-001  | Niskie             | Wysoki    | **Średnie**   | P2        |
| T-ACCESS-002  | Niskie             | Wysoki    | **Średnie**   | P2        |
| T-PERSIST-002 | Niskie             | Wysoki    | **Średnie**   | P2        |

### 5.2 Krytyczne łańcuchy ataku

**Łańcuch ataku 1: Kradzież danych oparta na skillu**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Opublikowanie złośliwego skilla) → (Ominięcie moderacji) → (Pozyskanie poświadczeń)
```

**Łańcuch ataku 2: Wstrzyknięcie promptu do RCE**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Wstrzyknięcie promptu) → (Ominięcie zatwierdzenia exec) → (Wykonanie poleceń)
```

**Łańcuch ataku 3: Pośrednie wstrzyknięcie przez pobraną treść**

```
T-EXEC-002 → T-EXFIL-001 → Zewnętrzna eksfiltracja
(Zatrucie treści URL) → (Agent pobiera i wykonuje instrukcje) → (Dane wysłane do atakującego)
```

---

## 6. Podsumowanie rekomendacji

### 6.1 Natychmiastowe (P0)

| ID    | Zalecenie                                  | Dotyczy                    |
| ----- | ------------------------------------------ | -------------------------- |
| R-001 | Dokończyć integrację z VirusTotal          | T-PERSIST-001, T-EVADE-001 |
| R-002 | Wdrożyć sandboxing Skills                  | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Dodać walidację danych wyjściowych dla działań wrażliwych | T-EXEC-001, T-EXEC-002     |

### 6.2 Krótkoterminowe (P1)

| ID    | Zalecenie                                 | Dotyczy      |
| ----- | ------------------------------------------ | ------------ |
| R-004 | Wdrożyć ograniczanie częstotliwości        | T-IMPACT-002 |
| R-005 | Dodać szyfrowanie tokenów w spoczynku      | T-ACCESS-003 |
| R-006 | Ulepszyć UX zatwierdzania exec i walidację | T-EXEC-004   |
| R-007 | Wdrożyć listę dozwolonych adresów URL dla web_fetch | T-EXFIL-001  |

### 6.3 Średnioterminowe (P2)

| ID    | Zalecenie                                           | Dotyczy       |
| ----- | --------------------------------------------------- | ------------- |
| R-008 | Dodać kryptograficzną weryfikację kanału tam, gdzie to możliwe | T-ACCESS-002  |
| R-009 | Wdrożyć weryfikację integralności konfiguracji      | T-PERSIST-003 |
| R-010 | Dodać podpisywanie aktualizacji i przypinanie wersji | T-PERSIST-002 |

---

## 7. Załączniki

### 7.1 Mapowanie technik ATLAS

| ID ATLAS      | Nazwa techniki                 | Zagrożenia OpenClaw                                              |
| ------------- | ------------------------------ | ---------------------------------------------------------------- |
| AML.T0006     | Aktywne skanowanie             | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | Zbieranie                      | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | Łańcuch dostaw: oprogramowanie AI | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | Łańcuch dostaw: dane           | T-PERSIST-003                                                    |
| AML.T0031     | Osłabianie integralności modelu AI | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                         |
| AML.T0040     | Dostęp do API wnioskowania modelu AI | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Tworzenie danych adwersarialnych | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | Wstrzykiwanie poleceń LLM: bezpośrednie | T-EXEC-001, T-EXEC-003                                           |
| AML.T0051.001 | Wstrzykiwanie poleceń LLM: pośrednie | T-EXEC-002                                                       |

### 7.2 Kluczowe pliki bezpieczeństwa

| Ścieżka                            | Cel                         | Poziom ryzyka |
| ----------------------------------- | --------------------------- | ------------ |
| `src/infra/exec-approvals.ts`       | Logika zatwierdzania poleceń | **Krytyczny** |
| `src/gateway/auth.ts`               | Uwierzytelnianie Gateway     | **Krytyczny** |
| `src/infra/net/ssrf.ts`             | Ochrona przed SSRF           | **Krytyczny** |
| `src/security/external-content.ts`  | Ograniczanie wstrzykiwania poleceń | **Krytyczny** |
| `src/agents/sandbox/tool-policy.ts` | Egzekwowanie zasad narzędzi  | **Krytyczny** |
| `src/routing/resolve-route.ts`      | Izolacja sesji               | **Średni**   |

### 7.3 Glosariusz

| Termin               | Definicja                                                 |
| -------------------- | --------------------------------------------------------- |
| **ATLAS**            | Adwersarialny krajobraz zagrożeń MITRE dla systemów AI    |
| **ClawHub**          | Marketplace Skills OpenClaw                               |
| **Gateway**          | Warstwa routingu wiadomości i uwierzytelniania OpenClaw   |
| **MCP**              | Model Context Protocol - interfejs dostawcy narzędzi      |
| **Prompt Injection** | Atak, w którym złośliwe instrukcje są osadzone w danych wejściowych |
| **Skill**            | Rozszerzenie do pobrania dla agentów OpenClaw             |
| **SSRF**             | Server-Side Request Forgery                               |

---

_Ten model zagrożeń jest żywym dokumentem. Zgłaszaj problemy bezpieczeństwa na adres security@openclaw.ai_

## Powiązane

- [Formalna weryfikacja](/pl/security/formal-verification)
- [Współtworzenie modelu zagrożeń](/pl/security/CONTRIBUTING-THREAT-MODEL)
