---
read_when:
    - Chcesz przekazać ustalenia dotyczące bezpieczeństwa lub scenariusze zagrożeń
    - Przeglądanie lub aktualizowanie modelu zagrożeń
summary: Jak współtworzyć model zagrożeń OpenClaw
title: Współtworzenie modelu zagrożeń
x-i18n:
    generated_at: "2026-04-30T10:18:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75cf2b408a78fce5134d24a3f115490da2dacc4ba8a1a24415425c3e4420ca55
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

# Współtworzenie modelu zagrożeń OpenClaw

Dziękujemy za pomoc w zwiększaniu bezpieczeństwa OpenClaw. Ten model zagrożeń jest żywym dokumentem i chętnie przyjmujemy wkład od każdego - nie musisz być ekspertem od bezpieczeństwa.

## Sposoby współtworzenia

### Dodanie zagrożenia

Zauważyłeś wektor ataku lub ryzyko, którego jeszcze nie uwzględniliśmy? Otwórz zgłoszenie w [openclaw/trust](https://github.com/openclaw/trust/issues) i opisz je własnymi słowami. Nie musisz znać żadnych frameworków ani wypełniać każdego pola - po prostu opisz scenariusz.

**Warto uwzględnić (ale nie jest to wymagane):**

- Scenariusz ataku i sposób, w jaki można go wykorzystać
- Których części OpenClaw dotyczy problem (CLI, Gateway, kanały, ClawHub, serwery MCP itp.)
- Jak poważny Twoim zdaniem jest problem (niski / średni / wysoki / krytyczny)
- Linki do powiązanych badań, CVE lub przykładów z rzeczywistych przypadków

Mapowaniem ATLAS, identyfikatorami zagrożeń i oceną ryzyka zajmiemy się podczas przeglądu. Jeśli chcesz dołączyć te szczegóły, świetnie - ale nie jest to oczekiwane.

> **To miejsce służy dodawaniu informacji do modelu zagrożeń, a nie zgłaszaniu aktywnych podatności.** Jeśli znalazłeś możliwą do wykorzystania podatność, zobacz naszą [stronę Trust](https://trust.openclaw.ai), aby poznać instrukcje odpowiedzialnego ujawniania.

### Zaproponowanie środka zaradczego

Masz pomysł, jak rozwiązać istniejące zagrożenie? Otwórz zgłoszenie lub PR odnoszący się do tego zagrożenia. Przydatne środki zaradcze są konkretne i możliwe do wdrożenia - na przykład „ograniczanie szybkości do 10 wiadomości/minutę na nadawcę w Gateway” jest lepsze niż „wdrożyć ograniczanie szybkości”.

### Zaproponowanie łańcucha ataku

Łańcuchy ataku pokazują, jak wiele zagrożeń łączy się w realistyczny scenariusz ataku. Jeśli widzisz niebezpieczną kombinację, opisz kroki oraz sposób, w jaki atakujący połączyłby je ze sobą. Krótka narracja o tym, jak atak przebiega w praktyce, jest cenniejsza niż formalny szablon.

### Poprawienie lub ulepszenie istniejących treści

Literówki, doprecyzowania, nieaktualne informacje, lepsze przykłady - PR-y są mile widziane, zgłoszenie nie jest wymagane.

## Czego używamy

### MITRE ATLAS

Ten model zagrożeń jest oparty na [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), frameworku zaprojektowanym specjalnie dla zagrożeń AI/ML, takich jak wstrzykiwanie promptów, nadużywanie narzędzi i wykorzystywanie agentów. Nie musisz znać ATLAS, aby wnieść wkład - mapujemy zgłoszenia do frameworka podczas przeglądu.

### Identyfikatory zagrożeń

Każde zagrożenie otrzymuje identyfikator taki jak `T-EXEC-003`. Kategorie to:

| Kod     | Kategoria                                  |
| ------- | ------------------------------------------ |
| RECON   | Rozpoznanie - zbieranie informacji         |
| ACCESS  | Początkowy dostęp - uzyskanie wejścia      |
| EXEC    | Wykonanie - uruchamianie złośliwych działań |
| PERSIST | Trwałość - utrzymywanie dostępu            |
| EVADE   | Unikanie obrony - unikanie wykrycia        |
| DISC    | Odkrywanie - poznawanie środowiska         |
| EXFIL   | Eksfiltracja - kradzież danych             |
| IMPACT  | Wpływ - szkoda lub zakłócenie              |

Identyfikatory są przypisywane przez opiekunów podczas przeglądu. Nie musisz ich wybierać samodzielnie.

### Poziomy ryzyka

| Poziom       | Znaczenie                                                         |
| ------------ | ----------------------------------------------------------------- |
| **Krytyczny** | Pełne przejęcie systemu albo wysokie prawdopodobieństwo + krytyczny wpływ |
| **Wysoki**   | Prawdopodobne znaczące szkody albo średnie prawdopodobieństwo + krytyczny wpływ |
| **Średni**   | Umiarkowane ryzyko albo niskie prawdopodobieństwo + wysoki wpływ  |
| **Niski**    | Mało prawdopodobne i ograniczony wpływ                            |

Jeśli nie masz pewności co do poziomu ryzyka, po prostu opisz wpływ, a my go ocenimy.

## Proces przeglądu

1. **Wstępna selekcja** - Przeglądamy nowe zgłoszenia w ciągu 48 godzin
2. **Ocena** - Weryfikujemy wykonalność, przypisujemy mapowanie ATLAS i identyfikator zagrożenia, walidujemy poziom ryzyka
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
- **Ogólny czat:** kanał #security na Discord

## Uznanie

Osoby współtworzące model zagrożeń są wymieniane w podziękowaniach w modelu zagrożeń, notatkach wydania oraz galerii sław bezpieczeństwa OpenClaw za znaczący wkład.

## Powiązane

- [Model zagrożeń](/pl/security/THREAT-MODEL-ATLAS)
- [Formalna weryfikacja](/pl/security/formal-verification)
