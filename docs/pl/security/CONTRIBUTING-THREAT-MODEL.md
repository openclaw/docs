---
read_when:
    - Chcesz zgłosić ustalenia dotyczące bezpieczeństwa lub scenariusze zagrożeń
    - Przeglądanie lub aktualizowanie modelu zagrożeń
summary: Jak współtworzyć model zagrożeń OpenClaw
title: Współtworzenie modelu zagrożeń
x-i18n:
    generated_at: "2026-05-06T18:00:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: a23ca088d7893180a83c02d6971bbf1c32affa724e43019fd40276eaadc52278
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Dziękujemy za pomoc w zwiększaniu bezpieczeństwa OpenClaw. Ten model zagrożeń jest żywym dokumentem i chętnie przyjmujemy wkład od każdego - nie musisz być ekspertem od bezpieczeństwa.

## Sposoby wnoszenia wkładu

### Dodaj zagrożenie

Zauważyłeś wektor ataku lub ryzyko, którego nie opisaliśmy? Otwórz zgłoszenie w [openclaw/trust](https://github.com/openclaw/trust/issues) i opisz je własnymi słowami. Nie musisz znać żadnych frameworków ani wypełniać każdego pola - po prostu opisz scenariusz.

**Warto uwzględnić (ale nie jest to wymagane):**

- Scenariusz ataku i sposób, w jaki można go wykorzystać
- Które części OpenClaw są dotknięte (CLI, Gateway, kanały, ClawHub, serwery MCP itd.)
- Jak poważne według Ciebie jest zagrożenie (niskie / średnie / wysokie / krytyczne)
- Linki do powiązanych badań, CVE lub przykładów z rzeczywistych wdrożeń

Mapowaniem ATLAS, identyfikatorami zagrożeń i oceną ryzyka zajmiemy się podczas przeglądu. Jeśli chcesz uwzględnić te szczegóły, świetnie - ale nie jest to oczekiwane.

> **To miejsce służy do dodawania informacji do modelu zagrożeń, a nie do zgłaszania aktywnych podatności.** Jeśli znalazłeś podatność możliwą do wykorzystania, zobacz naszą [stronę Trust](https://trust.openclaw.ai), aby poznać instrukcje odpowiedzialnego ujawniania.

### Zaproponuj mitygację

Masz pomysł, jak rozwiązać istniejące zagrożenie? Otwórz zgłoszenie lub PR odnoszące się do tego zagrożenia. Przydatne mitygacje są konkretne i możliwe do wdrożenia - na przykład „ograniczanie liczby wiadomości per nadawca do 10 wiadomości/minutę na Gateway” jest lepsze niż „wdrożyć ograniczanie liczby żądań”.

### Zaproponuj łańcuch ataku

Łańcuchy ataku pokazują, jak wiele zagrożeń łączy się w realistyczny scenariusz ataku. Jeśli widzisz niebezpieczną kombinację, opisz kroki i sposób, w jaki atakujący połączyłby je w łańcuch. Krótka narracja pokazująca, jak atak przebiega w praktyce, jest bardziej wartościowa niż formalny szablon.

### Popraw lub ulepsz istniejącą treść

Literówki, doprecyzowania, nieaktualne informacje, lepsze przykłady - PR-y są mile widziane, zgłoszenie nie jest potrzebne.

## Czego używamy

### Framework MITRE ATLAS

Ten model zagrożeń jest oparty na [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), frameworku zaprojektowanym specjalnie dla zagrożeń AI/ML, takich jak wstrzykiwanie promptów, nadużywanie narzędzi i wykorzystywanie agentów. Nie musisz znać ATLAS, aby wnieść wkład - mapujemy zgłoszenia do frameworku podczas przeglądu.

### Identyfikatory zagrożeń

Każde zagrożenie otrzymuje identyfikator, taki jak `T-EXEC-003`. Kategorie to:

| Kod     | Kategoria                                  |
| ------- | ------------------------------------------ |
| RECON   | Rozpoznanie - zbieranie informacji         |
| ACCESS  | Dostęp początkowy - uzyskiwanie wejścia    |
| EXEC    | Wykonanie - uruchamianie złośliwych działań |
| PERSIST | Utrwalenie - utrzymywanie dostępu          |
| EVADE   | Omijanie obrony - unikanie wykrycia        |
| DISC    | Odkrywanie - poznawanie środowiska         |
| EXFIL   | Eksfiltracja - wykradanie danych           |
| IMPACT  | Wpływ - szkody lub zakłócenia              |

Identyfikatory są przypisywane przez opiekunów podczas przeglądu. Nie musisz wybierać żadnego.

### Poziomy ryzyka

| Poziom       | Znaczenie                                                        |
| ------------ | ---------------------------------------------------------------- |
| **Krytyczny** | Pełne przejęcie systemu albo wysokie prawdopodobieństwo + krytyczny wpływ |
| **Wysoki**   | Prawdopodobne znaczące szkody albo średnie prawdopodobieństwo + krytyczny wpływ |
| **Średni**   | Umiarkowane ryzyko albo niskie prawdopodobieństwo + wysoki wpływ |
| **Niski**    | Mało prawdopodobne i ograniczony wpływ                           |

Jeśli nie masz pewności co do poziomu ryzyka, po prostu opisz wpływ, a my go ocenimy.

## Proces przeglądu

1. **Triage** - Przeglądamy nowe zgłoszenia w ciągu 48 godzin
2. **Ocena** - Weryfikujemy wykonalność, przypisujemy mapowanie ATLAS i identyfikator zagrożenia, potwierdzamy poziom ryzyka
3. **Dokumentacja** - Upewniamy się, że wszystko jest sformatowane i kompletne
4. **Scalenie** - Dodanie do modelu zagrożeń i wizualizacji

## Zasoby

- [Witryna ATLAS](https://atlas.mitre.org/)
- [Techniki ATLAS](https://atlas.mitre.org/techniques/)
- [Studia przypadków ATLAS](https://atlas.mitre.org/studies/)
- [Model zagrożeń OpenClaw](/pl/security/THREAT-MODEL-ATLAS)

## Kontakt

- **Podatności bezpieczeństwa:** Zobacz naszą [stronę Trust](https://trust.openclaw.ai), aby poznać instrukcje zgłaszania
- **Pytania dotyczące modelu zagrożeń:** Otwórz zgłoszenie w [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Czat ogólny:** kanał #security na Discord

## Uznanie

Autorzy wkładu w model zagrożeń są wymieniani w podziękowaniach modelu zagrożeń, informacjach o wydaniu oraz w galerii zasłużonych dla bezpieczeństwa OpenClaw za znaczący wkład.

## Powiązane

- [Model zagrożeń](/pl/security/THREAT-MODEL-ATLAS)
- [Weryfikacja formalna](/pl/security/formal-verification)
