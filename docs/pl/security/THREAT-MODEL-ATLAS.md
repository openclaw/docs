---
read_when:
    - Przegląd stanu zabezpieczeń lub scenariuszy zagrożeń
    - Praca nad funkcjami bezpieczeństwa lub odpowiedziami na audyty
summary: Model zagrożeń OpenClaw zmapowany na framework MITRE ATLAS
title: Model zagrożeń (MITRE ATLAS)
x-i18n:
    generated_at: "2026-07-12T15:40:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c88ffdef850bd2afaf835baab2555304c914a0be1df6b6b9109e0f55d1448392
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
---

**Wersja:** 1.0-draft | **Ramy:** [MITRE ATLAS](https://atlas.mitre.org/) (krajobraz zagrożeń adwersaryjnych dla systemów AI) + diagramy przepływu danych

Ten model zagrożeń dokumentuje zagrożenia adwersaryjne dla platformy agentów AI OpenClaw oraz marketplace’u umiejętności ClawHub. Jest to żywy dokument utrzymywany przez społeczność OpenClaw. Informacje o zgłaszaniu nowych zagrożeń, proponowaniu łańcuchów ataków i sugerowaniu środków zaradczych zawiera sekcja [Współtworzenie modelu zagrożeń](/pl/security/CONTRIBUTING-THREAT-MODEL).

**Kluczowe zasoby ATLAS:** [Techniki](https://atlas.mitre.org/techniques/) | [Taktyki](https://atlas.mitre.org/tactics/) | [Studia przypadków](https://atlas.mitre.org/studies/) | [ATLAS GitHub](https://github.com/mitre-atlas/atlas-data) | [Współtworzenie ATLAS](https://atlas.mitre.org/resources/contribute)

---

## 1. Zakres

| Komponent                     | Uwzględniono | Uwagi                                                   |
| ----------------------------- | ------------ | ------------------------------------------------------- |
| Środowisko wykonawcze agenta OpenClaw | Tak          | Podstawowe wykonywanie agenta, wywołania narzędzi, sesje |
| Gateway                       | Tak          | Uwierzytelnianie, routing, integracja kanałów            |
| Integracje kanałów            | Tak          | WhatsApp, Telegram, Discord, Signal, Slack itd.          |
| Marketplace ClawHub           | Tak          | Publikowanie, moderowanie i dystrybucja umiejętności     |
| Serwery MCP                    | Tak          | Zewnętrzni dostawcy narzędzi                             |
| Urządzenia użytkowników       | Częściowo    | Aplikacje mobilne, klienty komputerowe                   |

Zgłoszenia poza zakresem i wzorce wyników fałszywie dodatnich (publiczna ekspozycja w internecie, łańcuchy obejmujące wyłącznie wstrzyknięcie polecenia bez obejścia granicy, wzajemnie niezaufani operatorzy współdzielący jeden host Gateway i inne) wymieniono w pliku [`SECURITY.md`](https://github.com/openclaw/openclaw/blob/main/SECURITY.md); to ten plik, a nie niniejsza strona, stanowi aktualne źródło prawdy dotyczące zakresu zgłaszania podatności.

## 2. Architektura systemu

### 2.1 Granice zaufania

```text
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
│  │  • Device pairing (1h DM pairing / 5m node pairing TTL)   │   │
│  │  • AllowFrom / allowlist validation                       │   │
│  │  • Token / password / Tailscale auth                      │   │
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
│  │  • Docker sandbox (default) or host (exec approvals)      │   │
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
│  │  • External content wrapping (random-boundary XML tags)   │   │
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
│  │  • Static pattern + AST-adjacent moderation scanning      │   │
│  │  • LLM-based agentic risk review + VirusTotal scanning    │   │
│  │  • GitHub account age verification (14 days)              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Przepływy danych

| Przepływ | Źródło  | Miejsce docelowe | Dane                    | Zabezpieczenie                  |
| -------- | ------- | ---------------- | ----------------------- | ------------------------------- |
| F1       | Kanał   | Gateway          | Wiadomości użytkowników | TLS, `AllowFrom`                |
| F2       | Gateway | Agent            | Kierowane wiadomości    | Izolacja sesji                  |
| F3       | Agent   | Narzędzia        | Wywołania narzędzi      | Egzekwowanie zasad              |
| F4       | Agent   | Zasoby zewnętrzne | Żądania `web_fetch`     | Blokowanie SSRF                 |
| F5       | ClawHub | Agent            | Kod umiejętności        | Moderowanie, skanowanie         |
| F6       | Agent   | Kanał            | Odpowiedzi               | Filtrowanie danych wyjściowych  |

---

## 3. Analiza zagrożeń według taktyk ATLAS

### 3.1 Rozpoznanie (AML.TA0002)

#### T-RECON-001: Wykrywanie punktów końcowych agenta

| Atrybut                    | Wartość                                                                        |
| -------------------------- | ------------------------------------------------------------------------------ |
| **Identyfikator ATLAS**    | AML.T0006 — aktywne skanowanie                                                 |
| **Opis**                   | Atakujący skanuje w poszukiwaniu ujawnionych punktów końcowych Gateway OpenClaw |
| **Wektor ataku**           | Skanowanie sieci, zapytania Shodan, enumeracja DNS                             |
| **Komponenty objęte atakiem** | Gateway, ujawnione punkty końcowe API                                       |
| **Obecne środki zaradcze** | Opcjonalne uwierzytelnianie Tailscale, domyślne powiązanie z local loopback    |
| **Ryzyko rezydualne**      | Średnie — publiczne instancje Gateway można wykryć                             |
| **Zalecenia**              | Udokumentować bezpieczne wdrożenie, dodać ograniczanie liczby żądań dla punktów końcowych służących do wykrywania |

#### T-RECON-002: Sondowanie integracji kanałów

| Atrybut                    | Wartość                                                                      |
| -------------------------- | ---------------------------------------------------------------------------- |
| **Identyfikator ATLAS**    | AML.T0006 — aktywne skanowanie                                               |
| **Opis**                   | Atakujący sonduje kanały komunikacyjne, aby zidentyfikować konta zarządzane przez AI |
| **Wektor ataku**           | Wysyłanie wiadomości testowych, obserwowanie wzorców odpowiedzi              |
| **Komponenty objęte atakiem** | Wszystkie integracje kanałów                                              |
| **Obecne środki zaradcze** | Brak konkretnych środków                                                     |
| **Ryzyko rezydualne**      | Niskie — samo wykrycie ma ograniczoną wartość                                |
| **Zalecenia**              | Rozważyć losowe zróżnicowanie czasu odpowiedzi                              |

---

### 3.2 Uzyskanie początkowego dostępu (AML.TA0004)

#### T-ACCESS-001: Przechwycenie kodu parowania

| Atrybut                 | Wartość                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0040 - Dostęp do interfejsu API wnioskowania modelu AI                                                   |
| **Opis**                | Atakujący przechwytuje kod parowania w oknie parowania (1 godz. dla DM/parowania ogólnego, 5 min dla parowania Node) |
| **Wektor ataku**        | Podglądanie przez ramię, podsłuchiwanie sieci, inżynieria społeczna                                           |
| **Komponenty narażone** | System parowania urządzeń                                                                                    |
| **Obecne zabezpieczenia** | TTL wynoszący 1 godz. (DM/parowanie ogólne) i 5 min (parowanie Node); kody wysyłane istniejącym kanałem      |
| **Ryzyko rezydualne**   | Średnie — okno parowania można wykorzystać                                                                   |
| **Zalecenia**           | Skrócić okno parowania, dodać krok potwierdzenia                                                              |

#### T-ACCESS-002: Podszywanie się pod AllowFrom

| Atrybut                 | Wartość                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0040 - Dostęp do interfejsu API wnioskowania modelu AI                             |
| **Opis**                | Atakujący podszywa się pod tożsamość dozwolonego nadawcy w kanale                       |
| **Wektor ataku**        | Zależny od kanału — fałszowanie numeru telefonu, podszywanie się pod nazwę użytkownika   |
| **Komponenty narażone** | Walidacja AllowFrom dla poszczególnych kanałów                                           |
| **Obecne zabezpieczenia** | Weryfikacja tożsamości specyficzna dla kanału                                          |
| **Ryzyko rezydualne**   | Średnie — niektóre kanały pozostają podatne na podszywanie się                           |
| **Zalecenia**           | Udokumentować zagrożenia specyficzne dla kanałów i, tam gdzie to możliwe, dodać weryfikację kryptograficzną |

#### T-ACCESS-003: Kradzież tokenów

| Atrybut                 | Wartość                                                                      |
| ----------------------- | ---------------------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0040 - Dostęp do interfejsu API wnioskowania modelu AI                  |
| **Opis**                | Atakujący wykrada tokeny uwierzytelniające z plików konfiguracji/poświadczeń |
| **Wektor ataku**        | Złośliwe oprogramowanie, nieautoryzowany dostęp do urządzenia, ujawnienie kopii zapasowej konfiguracji |
| **Komponenty narażone** | Magazyn poświadczeń kanałów/dostawców, magazyn konfiguracji                  |
| **Obecne zabezpieczenia** | Uprawnienia plików                                                         |
| **Ryzyko rezydualne**   | Wysokie — tokeny są przechowywane na dysku w postaci zwykłego tekstu         |
| **Zalecenia**           | Wdrożyć szyfrowanie przechowywanych tokenów i dodać rotację tokenów          |

---

### 3.3 Wykonanie (AML.TA0005)

#### T-EXEC-001: Bezpośrednie wstrzyknięcie promptu

| Atrybut                 | Wartość                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0051.000 - Wstrzyknięcie promptu LLM: bezpośrednie                                                                                                       |
| **Opis**                | Atakujący wysyła spreparowane prompty w celu manipulowania zachowaniem agenta                                                                                  |
| **Wektor ataku**        | Wiadomości w kanałach zawierające wrogie instrukcje                                                                                                           |
| **Komponenty narażone** | LLM agenta, wszystkie powierzchnie wejściowe                                                                                                                  |
| **Obecne zabezpieczenia** | Wykrywanie wzorców, opakowywanie treści zewnętrznych; traktowane jako wykraczające poza zakres zgłoszeń podatności, jeśli nie dochodzi do obejścia granicy zabezpieczeń (zob. `SECURITY.md`) |
| **Ryzyko rezydualne**   | Krytyczne — tylko wykrywanie, bez blokowania; zaawansowane ataki omijają zabezpieczenia                                                                         |
| **Zalecenia**           | Dodać walidację danych wyjściowych i potwierdzenie użytkownika dla wrażliwych działań jako kolejną warstwę istniejącego mechanizmu wykrywania                    |

#### T-EXEC-002: Pośrednie wstrzyknięcie promptu

| Atrybut                 | Wartość                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0051.001 - Wstrzyknięcie promptu LLM: pośrednie                                                                                  |
| **Opis**                | Atakujący osadza złośliwe instrukcje w pobranej treści                                                                                |
| **Wektor ataku**        | Złośliwe adresy URL, zatrute wiadomości e-mail, przejęte webhooki                                                                     |
| **Komponenty narażone** | `web_fetch`, przetwarzanie wiadomości e-mail, zewnętrzne źródła danych                                                                |
| **Obecne zabezpieczenia** | Opakowywanie treści znacznikami w stylu XML z losowymi granicami, normalizacja homoglifów/tokenów specjalnych oraz ostrzeżenie dotyczące bezpieczeństwa |
| **Ryzyko rezydualne**   | Wysokie — LLM może nadal ignorować instrukcje zawarte w opakowaniu                                                                    |
| **Zalecenia**           | Oddzielne konteksty wykonania dla opakowanej treści                                                                                   |

#### T-EXEC-003: Wstrzyknięcie argumentów narzędzia

| Atrybut                 | Wartość                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0051.000 - Wstrzyknięcie promptu LLM: bezpośrednie               |
| **Opis**                | Atakujący manipuluje argumentami narzędzia poprzez wstrzyknięcie promptu |
| **Wektor ataku**        | Spreparowane prompty wpływające na wartości parametrów narzędzia      |
| **Komponenty narażone** | Wszystkie wywołania narzędzi                                          |
| **Obecne zabezpieczenia** | Zatwierdzanie wykonania niebezpiecznych poleceń                      |
| **Ryzyko rezydualne**   | Wysokie — zabezpieczenie zależy od oceny użytkownika                   |
| **Zalecenia**           | Walidacja argumentów, parametryzowane wywołania narzędzi               |

#### T-EXEC-004: Obejście zatwierdzania wykonania

| Atrybut                 | Wartość                                                                                                                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0043 - Tworzenie wrogich danych                                                                                                                                                                      |
| **Opis**                | Atakujący tworzy polecenia omijające listę dozwolonych poleceń wymagających zatwierdzenia                                                                                                                 |
| **Wektor ataku**        | Zaciemnianie poleceń, wykorzystywanie aliasów, manipulowanie ścieżkami                                                                                                                                    |
| **Komponenty narażone** | `src/infra/exec-approvals*.ts`, lista dozwolonych poleceń                                                                                                                                                 |
| **Obecne zabezpieczenia** | Lista dozwolonych poleceń i tryb pytania oraz normalizacja poleceń (usuwanie opakowania dyspozytora, wykrywanie ewaluacji wbudowanej, analiza łańcuchów poleceń powłoki)                                  |
| **Ryzyko rezydualne**   | Wysokie — normalizacja ogranicza możliwość obejścia przez zaciemnianie, ale jej nie eliminuje; ustalenia dotyczące wyłącznie zgodności między ścieżkami wykonania są traktowane jako utwardzanie zabezpieczeń, a nie podatności (zob. `SECURITY.md`) |
| **Zalecenia**           | Nadal rozszerzać zakres normalizacji poleceń o nowe techniki zaciemniania                                                                                                                                |

---

### 3.4 Utrzymanie dostępu (AML.TA0006)

#### T-PERSIST-001: Instalacja złośliwej Skills

| Atrybut                 | Wartość                                                                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0010.001 - Naruszenie łańcucha dostaw: oprogramowanie AI                                                                       |
| **Opis**                | Atakujący publikuje złośliwą Skills w ClawHub                                                                                       |
| **Wektor ataku**        | Utworzenie konta i opublikowanie Skills z ukrytym złośliwym kodem                                                                   |
| **Komponenty narażone** | ClawHub, ładowanie Skills, wykonywanie przez agenta                                                                                  |
| **Obecne zabezpieczenia** | Weryfikacja wieku konta GitHub, statyczne skanowanie wzorców i struktur zbliżonych do AST, oparta na LLM agentowa ocena ryzyka, skanowanie VirusTotal |
| **Ryzyko rezydualne**   | Wysokie — istnieją warstwy wykrywania, ale Skills nadal działają z uprawnieniami agenta i bez izolacji środowiska wykonawczego       |
| **Zalecenia**           | Izolacja środowiska wykonywania Skills, rozszerzona weryfikacja społecznościowa                                                      |

#### T-PERSIST-002: Zatrucie aktualizacji Skills

| Atrybut                 | Wartość                                                                         |
| ----------------------- | ------------------------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0010.001 - Naruszenie łańcucha dostaw: oprogramowanie AI                   |
| **Opis**                | Atakujący przejmuje popularną Skills i publikuje złośliwą aktualizację          |
| **Wektor ataku**        | Przejęcie konta, socjotechnika wymierzona we właściciela Skills                 |
| **Komponenty narażone** | Wersjonowanie ClawHub, procesy automatycznej aktualizacji                       |
| **Obecne zabezpieczenia** | Identyfikacja odcisku wersji, ponowne uruchamianie moderacji/skanowania dla nowych wersji |
| **Ryzyko rezydualne**   | Wysokie — automatyczne aktualizacje mogą pobrać złośliwe wersje przed zakończeniem weryfikacji |
| **Zalecenia**           | Podpisywanie aktualizacji, możliwość wycofania wersji, przypinanie wersji       |

#### T-PERSIST-003: Manipulowanie konfiguracją agenta

| Atrybut                 | Wartość                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0010.002 - Naruszenie łańcucha dostaw: dane                                                |
| **Opis**                | Atakujący modyfikuje konfigurację agenta, aby utrzymać dostęp                                   |
| **Wektor ataku**        | Modyfikacja pliku konfiguracyjnego, wstrzyknięcie ustawień                                      |
| **Komponenty podatne**  | Konfiguracja agenta, zasady narzędzi                                                            |
| **Obecne zabezpieczenia** | Uprawnienia plików                                                                            |
| **Ryzyko rezydualne**   | Średnie — wymaga dostępu lokalnego                                                              |
| **Zalecenia**           | Weryfikacja integralności konfiguracji, rejestrowanie audytowe zmian konfiguracji                |

---

### 3.5 Unikanie zabezpieczeń (AML.TA0007)

#### T-EVADE-001: Obejście wzorców moderacji

| Atrybut                 | Wartość                                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0043 - Tworzenie danych adwersarialnych                                                             |
| **Opis**                | Atakujący tworzy zawartość Skills w celu ominięcia kontroli moderacyjnych ClawHub                         |
| **Wektor ataku**        | Homoglify Unicode, sztuczki z kodowaniem, dynamiczne ładowanie                                           |
| **Komponenty podatne**  | Potok moderacji i skanowania ClawHub                                                                     |
| **Obecne zabezpieczenia** | Statyczne reguły wzorców, skanowanie kodu z uwzględnieniem AST, przegląd ryzyka agentowego przez LLM, VirusTotal |
| **Ryzyko rezydualne**   | Średnie — nowe metody zaciemniania mogą nadal omijać wielowarstwowe heurystyki                            |
| **Zalecenia**           | Dalsze rozszerzanie korpusu wzorców i zachowań w miarę wykrywania nowych metod obchodzenia zabezpieczeń  |

#### T-EVADE-002: Wydostanie się z opakowania treści

| Atrybut                 | Wartość                                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0043 - Tworzenie danych adwersarialnych                                                                                     |
| **Opis**                | Atakujący tworzy treść, która wydostaje się z kontekstu opakowania treści zewnętrznej                                            |
| **Wektor ataku**        | Manipulowanie znacznikami, dezorientacja kontekstowa, nadpisanie instrukcji                                                      |
| **Komponenty podatne**  | Opakowywanie treści zewnętrznej                                                                                                  |
| **Obecne zabezpieczenia** | Znaczniki w stylu XML z losowymi granicami i ostrzeżenie dotyczące bezpieczeństwa oraz wykrywanie podszywania się pod znaczniki za pomocą homoglifów i wariantów białych znaków |
| **Ryzyko rezydualne**   | Średnie — nowe metody wydostawania się są regularnie odkrywane                                                                   |
| **Zalecenia**           | Walidacja danych wyjściowych oprócz opakowywania danych wejściowych                                                              |

---

### 3.6 Rozpoznanie (AML.TA0008)

#### T-DISC-001: Wyliczanie narzędzi

| Atrybut                 | Wartość                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0040 - Dostęp do interfejsu API wnioskowania modelu AI           |
| **Opis**                | Atakujący wylicza dostępne narzędzia za pomocą poleceń dla modelu      |
| **Wektor ataku**        | Zapytania w rodzaju „Jakie masz narzędzia?”                            |
| **Komponenty podatne**  | Rejestr narzędzi agenta                                               |
| **Obecne zabezpieczenia** | Brak konkretnych                                                    |
| **Ryzyko rezydualnee**  | Niskie — narzędzia są zazwyczaj udokumentowane                        |
| **Zalecenia**           | Rozważenie mechanizmów kontroli widoczności narzędzi                   |

#### T-DISC-002: Pozyskiwanie danych sesji

| Atrybut                 | Wartość                                                                 |
| ----------------------- | ----------------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0040 - Dostęp do interfejsu API wnioskowania modelu AI             |
| **Opis**                | Atakujący pozyskuje dane wrażliwe z kontekstu sesji                      |
| **Wektor ataku**        | Zapytania w rodzaju „O czym rozmawialiśmy?”, sondowanie kontekstu        |
| **Komponenty podatne**  | Transkrypcje sesji, okno kontekstu                                       |
| **Obecne zabezpieczenia** | Izolacja sesji według nadawcy (klucz `agent:channel:peer`)             |
| **Ryzyko rezydualne**   | Średnie — dane w obrębie sesji są z założenia dostępne                   |
| **Zalecenia**           | Redagowanie danych wrażliwych w kontekście                               |

---

### 3.7 Gromadzenie i eksfiltracja (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Kradzież danych za pomocą web_fetch

| Atrybut                 | Wartość                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0009 - Gromadzenie                                                                         |
| **Opis**                | Atakujący eksfiltruje dane, instruując agenta, aby wysłał je pod zewnętrzny adres URL            |
| **Wektor ataku**        | Wstrzyknięcie polecenia powodujące wysłanie danych metodą POST przez agenta na serwer atakującego |
| **Komponenty podatne**  | Narzędzie `web_fetch`                                                                           |
| **Obecne zabezpieczenia** | Blokowanie SSRF dla sieci wewnętrznych/prywatnych (przypinanie DNS i blokowanie adresów IP)     |
| **Ryzyko rezydualne**   | Wysokie — dowolne zewnętrzne adresy URL pozostają dozwolone                                     |
| **Zalecenia**           | Lista dozwolonych adresów URL, uwzględnianie klasyfikacji danych                                 |

#### T-EXFIL-002: Nieautoryzowane wysyłanie wiadomości

| Atrybut                 | Wartość                                                                           |
| ----------------------- | --------------------------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0009 - Gromadzenie                                                           |
| **Opis**                | Atakujący powoduje wysyłanie przez agenta wiadomości zawierających dane wrażliwe   |
| **Wektor ataku**        | Wstrzyknięcie polecenia powodujące wysłanie przez agenta wiadomości do atakującego |
| **Komponenty podatne**  | Narzędzie wiadomości, integracje kanałów                                           |
| **Obecne zabezpieczenia** | Kontrola wysyłania wiadomości wychodzących                                       |
| **Ryzyko rezydualne**   | Średnie — kontrola może zostać ominięta                                            |
| **Zalecenia**           | Jawne potwierdzenie w przypadku nowych odbiorców                                   |

#### T-EXFIL-003: Wykradanie danych uwierzytelniających

| Atrybut                 | Wartość                                                                                                                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0009 - Gromadzenie                                                                                                                                                                      |
| **Opis**                | Złośliwe Skills wykradają dane uwierzytelniające z kontekstu agenta                                                                                                                          |
| **Wektor ataku**        | Kod Skills odczytuje zmienne środowiskowe i pliki konfiguracyjne                                                                                                                             |
| **Komponenty podatne**  | Środowisko wykonywania Skills                                                                                                                                                                |
| **Obecne zabezpieczenia** | Skanowanie przez ClawHub pod kątem wzorców danych uwierzytelniających (sekrety zakodowane na stałe, dostęp do zmiennych środowiskowych z danymi uwierzytelniającymi połączony z wysyłaniem przez sieć); brak izolacji wykonania Skills w czasie działania |
| **Ryzyko rezydualne**   | Krytyczne — Skills działają z uprawnieniami agenta                                                                                                                                           |
| **Zalecenia**           | Izolacja wykonania Skills, izolacja danych uwierzytelniających                                                                                                                                |

---

### 3.8 Skutki (AML.TA0011)

#### T-IMPACT-001: Nieautoryzowane wykonywanie poleceń

| Atrybut                 | Wartość                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0031 - Naruszenie integralności modelu AI                                                                            |
| **Opis**                | Atakujący wykonuje dowolne polecenia w systemie użytkownika                                                                |
| **Wektor ataku**        | Wstrzyknięcie polecenia połączone z obejściem zatwierdzania wykonania                                                      |
| **Komponenty podatne**  | Narzędzie Bash, wykonywanie poleceń                                                                                        |
| **Obecne zabezpieczenia** | Zatwierdzanie wykonania, opcja piaskownicy Docker (domyślny backend środowiska wykonawczego)                              |
| **Ryzyko rezydualne**   | Krytyczne — wykonywanie na hoście jest możliwe, gdy piaskownica jest wyłączona                                             |
| **Zalecenia**           | Ulepszenie interfejsu zatwierdzania; wdrożenia z wyłączoną piaskownicą pozostają świadomym wyborem operatora, co jest odpowiednio udokumentowane |

#### T-IMPACT-002: Wyczerpanie zasobów (DoS)

| Atrybut                 | Wartość                                                     |
| ----------------------- | ----------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0031 - Naruszenie integralności modelu AI              |
| **Opis**                | Atakujący wyczerpuje środki API lub zasoby obliczeniowe      |
| **Wektor ataku**        | Automatyczne zalewanie wiadomościami, kosztowne wywołania narzędzi |
| **Komponenty podatne**  | Gateway, sesje agenta, dostawca API                         |
| **Obecne zabezpieczenia** | Brak                                                      |
| **Ryzyko rezydualne**   | Wysokie — brak ograniczania częstotliwości według nadawcy    |
| **Zalecenia**           | Limity częstotliwości według nadawcy, budżety kosztów        |

#### T-IMPACT-003: Szkody wizerunkowe

| Atrybut                 | Wartość                                                                 |
| ----------------------- | ----------------------------------------------------------------------- |
| **Identyfikator ATLAS** | AML.T0031 - Naruszenie integralności modelu AI                          |
| **Opis**                | Atakujący powoduje wysyłanie przez agenta szkodliwych/obraźliwych treści |
| **Wektor ataku**        | Wstrzyknięcie polecenia powodujące nieodpowiednie odpowiedzi             |
| **Komponenty podatne**  | Generowanie danych wyjściowych, wysyłanie wiadomości w kanałach          |
| **Obecne zabezpieczenia** | Zasady dostawcy LLM dotyczące treści                                  |
| **Ryzyko rezydualne**   | Średnie — filtry dostawcy nie są doskonałe                               |
| **Zalecenia**           | Warstwa filtrowania danych wyjściowych, mechanizmy kontroli użytkownika   |

---

## 4. Analiza łańcucha dostaw ClawHub

### 4.1 Obecne mechanizmy bezpieczeństwa

| Mechanizm kontrolny              | Implementacja                                                                          | Skuteczność                                                                    |
| -------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Wiek konta GitHub                 | `requireGitHubAccountAge()` (minimum 14 dni)                                           | Średnia — podnosi próg wejścia dla nowych atakujących                          |
| Sanityzacja ścieżek               | `sanitizePath()`                                                                       | Wysoka — zapobiega przechodzeniu poza dozwoloną ścieżkę                        |
| Walidacja typu pliku              | `isTextFile()`                                                                         | Średnia — skanowane są tylko pliki tekstowe, ale nadal można to wykorzystać    |
| Limity rozmiaru                   | Łącznie 50 MB na pakiet (`MAX_PUBLISH_TOTAL_BYTES`)                                    | Wysoka — zapobiega wyczerpaniu zasobów                                         |
| Wymagany plik SKILL.md            | Obowiązkowy plik readme przy publikacji                                                | Niska wartość dla bezpieczeństwa — wyłącznie informacyjna                      |
| Skanowanie statyczne i zbliżone do AST | Mechanizm wzorców obejmujący wykonywanie poleceń, eksfiltrację, pozyskiwanie danych uwierzytelniających, zaciemnianie kodu i inne zagrożenia | Średnio wysoka — obejmuje wiele znanych wzorców nadużyć, ale nadal opiera się na wzorcach |
| Agentowy przegląd ryzyka oparty na LLM | Werdykt podczas publikacji oparty na monicie bezpieczeństwa                           | Średnio wysoka — wykrywa zachowania pomijane przez wzorce statyczne            |
| Skanowanie VirusTotal             | Podłączone do procesów publikacji i ponownego skanowania Skills oraz wydań pakietów; wymaga klucza API operatora | Wysoka po włączeniu — wykrywanie przez silniki statyczne                       |
| Status moderacji                  | Pole `moderationStatus`                                                               | Średnia — umożliwia ręczny przegląd                                             |

### 4.2 Ograniczenia moderacji

Skanowanie statyczne ClawHub bezpośrednio analizuje zawartość kodu Skills (nie tylko identyfikator, metadane i frontmatter), uwzględniając niebezpieczne wywołania wykonawcze, dynamiczne wykonywanie kodu, pozyskiwanie danych uwierzytelniających, wzorce eksfiltracji, zaciemnione ładunki i inne zagrożenia. Znane luki:

- Wykrywanie oparte na wzorcach nadal można ominąć za pomocą wystarczająco nowatorskich technik zaciemniania.
- Przegląd oparty na LLM i skanowanie VirusTotal zależą od włączenia kluczy API oraz konfiguracji po stronie operatora.
- Po zainstalowaniu żadna piaskownica wykonawcza nie izoluje Skills od uprawnień samego agenta.

### 4.3 Odznaki

Skills i pakiety otrzymują odznaki nadawane przez moderatorów: `highlighted`, `official`, `deprecated`, `redactionApproved` (tylko Skills). Zgłoszenia społeczności (`skillReports`) i dzienniki audytowe (`auditLogs`) wspierają procesy moderacji.

---

## 5. Macierz ryzyka

### 5.1 Prawdopodobieństwo a wpływ

| Identyfikator zagrożenia | Prawdopodobieństwo | Wpływ       | Poziom ryzyka   | Priorytet |
| ------------------------ | ------------------ | ----------- | ---------------- | --------- |
| T-EXEC-001               | Wysokie            | Krytyczny   | **Krytyczny**    | P0        |
| T-PERSIST-001            | Wysokie            | Krytyczny   | **Krytyczny**    | P0        |
| T-EXFIL-003              | Średnie            | Krytyczny   | **Krytyczny**    | P0        |
| T-IMPACT-001             | Średnie            | Krytyczny   | **Wysoki**       | P1        |
| T-EXEC-002               | Wysokie            | Wysoki      | **Wysoki**       | P1        |
| T-EXEC-004               | Średnie            | Wysoki      | **Wysoki**       | P1        |
| T-ACCESS-003             | Średnie            | Wysoki      | **Wysoki**       | P1        |
| T-EXFIL-001              | Średnie            | Wysoki      | **Wysoki**       | P1        |
| T-IMPACT-002             | Wysokie            | Średni      | **Wysoki**       | P1        |
| T-EVADE-001              | Wysokie            | Średni      | **Średni**       | P2        |
| T-ACCESS-001             | Niskie             | Wysoki      | **Średni**       | P2        |
| T-ACCESS-002             | Niskie             | Wysoki      | **Średni**       | P2        |
| T-PERSIST-002            | Niskie             | Wysoki      | **Średni**       | P2        |

### 5.2 Łańcuchy ataków na ścieżce krytycznej

**Łańcuch 1: Kradzież danych za pośrednictwem Skills**

```text
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Opublikowanie złośliwego Skills) → (Ominięcie moderacji) → (Pozyskanie danych uwierzytelniających)
```

**Łańcuch 2: Od wstrzyknięcia monitu do zdalnego wykonania kodu**

```text
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Wstrzyknięcie monitu) → (Ominięcie zatwierdzania wykonania) → (Wykonanie poleceń)
```

**Łańcuch 3: Pośrednie wstrzyknięcie za pośrednictwem pobranej zawartości**

```text
T-EXEC-002 → T-EXFIL-001 → Eksfiltracja zewnętrzna
(Zatrucie zawartości adresu URL) → (Agent pobiera zawartość i wykonuje instrukcje) → (Dane zostają wysłane atakującemu)
```

---

## 6. Podsumowanie zaleceń

### 6.1 Natychmiastowe (P0)

| ID    | Zalecenie                                                   | Dotyczy                    |
| ----- | ----------------------------------------------------------- | -------------------------- |
| R-002 | Wdrożenie wykonywania Skills w piaskownicy                  | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Dodanie walidacji danych wyjściowych dla wrażliwych działań | T-EXEC-001, T-EXEC-002     |

### 6.2 Krótkoterminowe (P1)

| ID    | Zalecenie                                                                        | Dotyczy      |
| ----- | -------------------------------------------------------------------------------- | ------------ |
| R-004 | Wdrożenie ograniczania częstotliwości osobno dla każdego nadawcy                 | T-IMPACT-002 |
| R-005 | Dodanie szyfrowania tokenów przechowywanych w spoczynku                          | T-ACCESS-003 |
| R-006 | Usprawnienie obsługi zatwierdzania wykonania i dalsze rozszerzanie normalizacji poleceń | T-EXEC-004   |
| R-007 | Wdrożenie listy dozwolonych adresów URL dla `web_fetch`                         | T-EXFIL-001  |

### 6.3 Średnioterminowe (P2)

| ID    | Zalecenie                                                          | Dotyczy       |
| ----- | ------------------------------------------------------------------ | ------------- |
| R-008 | Dodanie kryptograficznej weryfikacji kanału tam, gdzie to możliwe  | T-ACCESS-002  |
| R-009 | Wdrożenie weryfikacji integralności konfiguracji                   | T-PERSIST-003 |
| R-010 | Dodanie podpisywania aktualizacji i przypinania wersji             | T-PERSIST-002 |

---

## 7. Dodatki

### 7.1 Mapowanie technik ATLAS

| ID ATLAS      | Nazwa techniki                              | Zagrożenia OpenClaw                                                |
| ------------- | ------------------------------------------- | ------------------------------------------------------------------ |
| AML.T0006     | Aktywne skanowanie                          | T-RECON-001, T-RECON-002                                           |
| AML.T0009     | Gromadzenie                                 | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                              |
| AML.T0010.001 | Łańcuch dostaw: oprogramowanie AI           | T-PERSIST-001, T-PERSIST-002                                       |
| AML.T0010.002 | Łańcuch dostaw: dane                        | T-PERSIST-003                                                      |
| AML.T0031     | Naruszenie integralności modelu AI          | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                           |
| AML.T0040     | Dostęp do API wnioskowania modelu AI        | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002   |
| AML.T0043     | Tworzenie danych adwersarialnych            | T-EXEC-004, T-EVADE-001, T-EVADE-002                               |
| AML.T0051.000 | Wstrzyknięcie monitu LLM: bezpośrednie      | T-EXEC-001, T-EXEC-003                                             |
| AML.T0051.001 | Wstrzyknięcie monitu LLM: pośrednie         | T-EXEC-002                                                         |

### 7.2 Kluczowe pliki bezpieczeństwa

| Ścieżka                            | Przeznaczenie                                      | Poziom ryzyka |
| ---------------------------------- | -------------------------------------------------- | ------------- |
| `src/infra/exec-approvals.ts`       | Logika zatwierdzania poleceń                       | **Krytyczny** |
| `src/gateway/auth.ts`               | Uwierzytelnianie Gateway                           | **Krytyczny** |
| `src/infra/net/ssrf.ts`             | Ochrona przed SSRF                                 | **Krytyczny** |
| `src/security/external-content.ts`  | Ograniczanie ryzyka wstrzyknięcia monitu           | **Krytyczny** |
| `src/agents/sandbox/tool-policy.ts` | Zasady zezwalania na narzędzia i odmawiania dostępu w piaskownicy | **Krytyczny** |
| `src/routing/resolve-route.ts`      | Izolacja sesji / trasowanie                        | **Średni**    |

### 7.3 Glosariusz

| Termin                    | Definicja                                                          |
| ------------------------- | ------------------------------------------------------------------ |
| **ATLAS**                 | Krajobraz zagrożeń adwersarialnych dla systemów AI według MITRE    |
| **ClawHub**               | Rynek Skills dla OpenClaw                                          |
| **Gateway**               | Warstwa trasowania wiadomości i uwierzytelniania w OpenClaw        |
| **MCP**                   | Model Context Protocol — interfejs dostawcy narzędzi                |
| **Wstrzyknięcie monitu**  | Atak polegający na osadzeniu złośliwych instrukcji w danych wejściowych |
| **Skills**                | Rozszerzenie do pobrania dla agentów OpenClaw                      |
| **SSRF**                  | Fałszowanie żądań po stronie serwera                               |

---

_Ten model zagrożeń jest stale aktualizowanym dokumentem. Problemy z bezpieczeństwem zgłaszaj na adres `security@openclaw.ai` lub zapoznaj się ze [stroną zaufania](https://trust.openclaw.ai)._

## Powiązane materiały

- [Współtworzenie modelu zagrożeń](/pl/security/CONTRIBUTING-THREAT-MODEL)
- [Reagowanie na incydenty](/pl/security/incident-response)
- [Serwer proxy sieci](/pl/security/network-proxy)
- [Weryfikacja formalna](/pl/security/formal-verification)
