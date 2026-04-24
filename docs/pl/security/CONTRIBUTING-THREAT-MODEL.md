---
read_when:
    - Chcesz zgłosić ustalenia dotyczące bezpieczeństwa lub scenariusze zagrożeń
    - Przeglądanie lub aktualizowanie modelu zagrożeń
summary: Jak wnosić wkład do modelu zagrożeń OpenClaw
title: Wnoszenie wkładu do modelu zagrożeń
x-i18n:
    generated_at: "2026-04-24T09:33:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 21cf130c2d8641b66b87de86a3ea718cd7c751c29ed9bf5e0bd76b43d65d0964
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 15
---

# Wnoszenie wkładu do modelu zagrożeń OpenClaw

Dziękujemy za pomoc w zwiększaniu bezpieczeństwa OpenClaw. Ten model zagrożeń jest żywym dokumentem i chętnie przyjmujemy wkład od każdego — nie musisz być ekspertem ds. bezpieczeństwa.

## Sposoby wnoszenia wkładu

### Dodaj zagrożenie

Wypatrzyłeś wektor ataku lub ryzyko, którego nie uwzględniliśmy? Otwórz zgłoszenie w [openclaw/trust](https://github.com/openclaw/trust/issues) i opisz je własnymi słowami. Nie musisz znać żadnych frameworków ani wypełniać każdego pola — po prostu opisz scenariusz.

**Warto uwzględnić (ale nie jest to wymagane):**

- Scenariusz ataku i sposób, w jaki mógłby zostać wykorzystany
- Których części OpenClaw dotyczy problem (CLI, Gateway, kanały, ClawHub, serwery MCP itd.)
- Jak poważne Twoim zdaniem jest to zagrożenie (niskie / średnie / wysokie / krytyczne)
- Linki do powiązanych badań, CVE lub przykładów z rzeczywistego świata

Mapowanie do ATLAS, identyfikatory zagrożeń i ocenę ryzyka przeprowadzimy podczas przeglądu. Jeśli chcesz uwzględnić te szczegóły, świetnie — ale nie jest to oczekiwane.

> **To służy do dodawania treści do modelu zagrożeń, a nie do zgłaszania aktywnych luk bezpieczeństwa.** Jeśli znalazłeś podatność możliwą do wykorzystania, zobacz naszą [stronę Trust](https://trust.openclaw.ai), aby uzyskać instrukcje dotyczące odpowiedzialnego ujawniania.

### Zaproponuj środek zaradczy

Masz pomysł, jak przeciwdziałać istniejącemu zagrożeniu? Otwórz zgłoszenie lub PR z odniesieniem do tego zagrożenia. Użyteczne środki zaradcze są konkretne i możliwe do wdrożenia — na przykład „ograniczanie liczby wiadomości do 10 na minutę dla każdego nadawcy w Gateway” jest lepsze niż „wdrożyć rate limiting”.

### Zaproponuj łańcuch ataku

Łańcuchy ataku pokazują, jak wiele zagrożeń łączy się w realistyczny scenariusz ataku. Jeśli widzisz niebezpieczne połączenie, opisz kroki i sposób, w jaki atakujący mógłby połączyć je w całość. Krótka narracja pokazująca, jak atak przebiega w praktyce, jest bardziej wartościowa niż formalny szablon.

### Popraw lub ulepsz istniejącą treść

Literówki, doprecyzowania, nieaktualne informacje, lepsze przykłady — PR są mile widziane, nie trzeba wcześniej otwierać zgłoszenia.

## Czego używamy

### MITRE ATLAS

Ten model zagrożeń opiera się na [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), frameworku zaprojektowanym specjalnie z myślą o zagrożeniach AI/ML, takich jak prompt injection, niewłaściwe użycie narzędzi i wykorzystanie agentów. Nie musisz znać ATLAS, aby wnieść wkład — podczas przeglądu mapujemy zgłoszenia do tego frameworka.

### Identyfikatory zagrożeń

Każde zagrożenie otrzymuje identyfikator taki jak `T-EXEC-003`. Kategorie to:

| Code    | Category                                    |
| ------- | ------------------------------------------- |
| RECON   | Rozpoznanie — gromadzenie informacji        |
| ACCESS  | Dostęp początkowy — uzyskiwanie wejścia     |
| EXEC    | Wykonanie — uruchamianie złośliwych działań |
| PERSIST | Utrzymanie — zachowanie dostępu             |
| EVADE   | Unikanie obrony — omijanie wykrywania       |
| DISC    | Odkrywanie — poznawanie środowiska          |
| EXFIL   | Eksfiltracja — kradzież danych              |
| IMPACT  | Wpływ — szkody lub zakłócenia               |

Identyfikatory są przypisywane przez maintainerów podczas przeglądu. Nie musisz wybierać żadnego samodzielnie.

### Poziomy ryzyka

| Level        | Meaning                                                             |
| ------------ | ------------------------------------------------------------------- |
| **Critical** | Pełna kompromitacja systemu albo wysokie prawdopodobieństwo + krytyczny wpływ |
| **High**     | Prawdopodobne znaczne szkody albo średnie prawdopodobieństwo + krytyczny wpływ |
| **Medium**   | Umiarkowane ryzyko albo niskie prawdopodobieństwo + wysoki wpływ    |
| **Low**      | Mało prawdopodobne i o ograniczonym wpływie                         |

Jeśli nie masz pewności co do poziomu ryzyka, po prostu opisz wpływ, a my go ocenimy.

## Proces przeglądu

1. **Triage** — nowe zgłoszenia przeglądamy w ciągu 48 godzin
2. **Ocena** — weryfikujemy wykonalność, przypisujemy mapowanie ATLAS i identyfikator zagrożenia, potwierdzamy poziom ryzyka
3. **Dokumentacja** — upewniamy się, że wszystko jest poprawnie sformatowane i kompletne
4. **Scalenie** — treść zostaje dodana do modelu zagrożeń i wizualizacji

## Zasoby

- [Strona ATLAS](https://atlas.mitre.org/)
- [Techniki ATLAS](https://atlas.mitre.org/techniques/)
- [Studia przypadków ATLAS](https://atlas.mitre.org/studies/)
- [Model zagrożeń OpenClaw](/pl/security/THREAT-MODEL-ATLAS)

## Kontakt

- **Luki bezpieczeństwa:** instrukcje zgłaszania znajdziesz na naszej [stronie Trust](https://trust.openclaw.ai)
- **Pytania dotyczące modelu zagrożeń:** otwórz zgłoszenie w [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Ogólna rozmowa:** kanał #security na Discord

## Uznanie

Osoby wnoszące wkład do modelu zagrożeń są wymieniane w podziękowaniach do modelu zagrożeń, informacjach o wydaniu oraz w galerii sław bezpieczeństwa OpenClaw za znaczący wkład.

## Powiązane

- [Model zagrożeń](/pl/security/THREAT-MODEL-ATLAS)
- [Formalna weryfikacja](/pl/security/formal-verification)
