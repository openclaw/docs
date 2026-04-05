---
read_when:
    - Chcesz zgłosić ustalenia związane z bezpieczeństwem lub scenariusze zagrożeń
    - Przeglądasz lub aktualizujesz model zagrożeń
summary: Jak wnosić wkład do modelu zagrożeń OpenClaw
title: Wnoszenie wkładu do modelu zagrożeń
x-i18n:
    generated_at: "2026-04-05T14:05:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9cd212d456571a25da63031588d3b584bdfc119e2096b528b97a3f7ec5e4b3db
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 15
---

# Wnoszenie wkładu do modelu zagrożeń OpenClaw

Dziękujemy za pomoc w zwiększaniu bezpieczeństwa OpenClaw. Ten model zagrożeń jest żywym dokumentem i chętnie przyjmujemy wkład od każdego — nie musisz być ekspertem ds. bezpieczeństwa.

## Sposoby wnoszenia wkładu

### Dodaj zagrożenie

Zauważyłeś wektor ataku lub ryzyko, którego jeszcze nie opisaliśmy? Otwórz issue w [openclaw/trust](https://github.com/openclaw/trust/issues) i opisz je własnymi słowami. Nie musisz znać żadnych frameworków ani wypełniać każdego pola — po prostu opisz scenariusz.

**Warto dołączyć (ale nie jest to wymagane):**

- Scenariusz ataku i sposób, w jaki mógłby zostać wykorzystany
- Które części OpenClaw są dotknięte problemem (CLI, gateway, kanały, ClawHub, serwery MCP itd.)
- Jak poważny Twoim zdaniem jest problem (niski / średni / wysoki / krytyczny)
- Linki do powiązanych badań, CVE lub przykładów z rzeczywistego świata

Podczas przeglądu zajmiemy się mapowaniem ATLAS, identyfikatorami zagrożeń i oceną ryzyka. Jeśli chcesz uwzględnić te szczegóły, świetnie — ale nie jest to oczekiwane.

> **To służy do dodawania wpisów do modelu zagrożeń, a nie do zgłaszania aktywnych podatności.** Jeśli znalazłeś podatność możliwą do wykorzystania, zobacz naszą [stronę Trust](https://trust.openclaw.ai), aby uzyskać instrukcje odpowiedzialnego ujawniania.

### Zasugeruj środek zaradczy

Masz pomysł, jak poradzić sobie z istniejącym zagrożeniem? Otwórz issue lub PR z odwołaniem do tego zagrożenia. Przydatne środki zaradcze są konkretne i możliwe do wdrożenia — na przykład „ograniczanie liczby wiadomości do 10/minutę na nadawcę w gateway” jest lepsze niż „wdrożyć rate limiting”.

### Zaproponuj łańcuch ataku

Łańcuchy ataku pokazują, jak wiele zagrożeń łączy się w realistyczny scenariusz ataku. Jeśli widzisz niebezpieczne połączenie, opisz kolejne kroki i sposób, w jaki atakujący mógłby je połączyć. Krótka narracja o tym, jak atak przebiega w praktyce, jest bardziej wartościowa niż formalny szablon.

### Popraw lub ulepsz istniejącą treść

Literówki, doprecyzowania, nieaktualne informacje, lepsze przykłady — PR mile widziane, issue nie jest potrzebne.

## Czego używamy

### MITRE ATLAS

Ten model zagrożeń opiera się na [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), frameworku zaprojektowanym specjalnie dla zagrożeń AI/ML, takich jak prompt injection, niewłaściwe użycie narzędzi i wykorzystanie agentów. Nie musisz znać ATLAS, aby wnosić wkład — podczas przeglądu mapujemy zgłoszenia do tego frameworka.

### Identyfikatory zagrożeń

Każde zagrożenie otrzymuje identyfikator taki jak `T-EXEC-003`. Kategorie to:

| Kod     | Kategoria                                  |
| ------- | ------------------------------------------ |
| RECON   | Rozpoznanie — zbieranie informacji         |
| ACCESS  | Dostęp początkowy — uzyskiwanie wejścia    |
| EXEC    | Wykonanie — uruchamianie złośliwych działań |
| PERSIST | Utrzymywanie dostępu                       |
| EVADE   | Omijanie zabezpieczeń — unikanie wykrycia  |
| DISC    | Odkrywanie — poznawanie środowiska         |
| EXFIL   | Eksfiltracja — kradzież danych             |
| IMPACT  | Wpływ — szkoda lub zakłócenie              |

Identyfikatory są przypisywane przez maintainerów podczas przeglądu. Nie musisz żadnego wybierać.

### Poziomy ryzyka

| Poziom       | Znaczenie                                                          |
| ------------ | ------------------------------------------------------------------ |
| **Krytyczny** | Pełna kompromitacja systemu albo wysokie prawdopodobieństwo + krytyczny wpływ |
| **Wysoki**    | Prawdopodobne znaczne szkody albo średnie prawdopodobieństwo + krytyczny wpływ |
| **Średni**    | Umiarkowane ryzyko albo niskie prawdopodobieństwo + wysoki wpływ |
| **Niski**     | Mało prawdopodobne i o ograniczonym wpływie                      |

Jeśli nie masz pewności co do poziomu ryzyka, po prostu opisz wpływ, a my go ocenimy.

## Proces przeglądu

1. **Triage** — przeglądamy nowe zgłoszenia w ciągu 48 godzin
2. **Ocena** — weryfikujemy wykonalność, przypisujemy mapowanie ATLAS i identyfikator zagrożenia, potwierdzamy poziom ryzyka
3. **Dokumentacja** — upewniamy się, że wszystko jest poprawnie sformatowane i kompletne
4. **Scalenie** — dodanie do modelu zagrożeń i wizualizacji

## Zasoby

- [Witryna ATLAS](https://atlas.mitre.org/)
- [Techniki ATLAS](https://atlas.mitre.org/techniques/)
- [Studia przypadków ATLAS](https://atlas.mitre.org/studies/)
- [Model zagrożeń OpenClaw](/security/THREAT-MODEL-ATLAS)

## Kontakt

- **Podatności bezpieczeństwa:** instrukcje zgłaszania znajdziesz na naszej [stronie Trust](https://trust.openclaw.ai)
- **Pytania dotyczące modelu zagrożeń:** otwórz issue w [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Ogólny czat:** kanał #security na Discord

## Uznanie

Osoby wnoszące wkład do modelu zagrożeń są wyróżniane w podziękowaniach modelu zagrożeń, informacjach o wydaniu oraz w galerii sław bezpieczeństwa OpenClaw za znaczący wkład.
