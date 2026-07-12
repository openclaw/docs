---
read_when:
    - Chcesz zgłosić odkryte problemy z bezpieczeństwem lub scenariusze zagrożeń
    - Przeglądanie lub aktualizowanie modelu zagrożeń
summary: Jak wnieść wkład w model zagrożeń OpenClaw
title: Wkład w model zagrożeń
x-i18n:
    generated_at: "2026-07-12T15:36:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e2e5cd95e8a2bf5ee4bd167afedfadf9aa876e4260e2d0bfb5f414cd4255410
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

[Model zagrożeń](/pl/security/THREAT-MODEL-ATLAS) jest stale rozwijanym dokumentem. Zachęcamy wszystkich do współtworzenia go; wiedza z zakresu bezpieczeństwa ani MITRE ATLAS nie jest wymagana.

<Note>
Ta sekcja służy do uzupełniania modelu zagrożeń, a nie do zgłaszania aktywnych podatności. Jeśli znajdziesz podatność możliwą do wykorzystania, postępuj zgodnie z instrukcjami odpowiedzialnego ujawniania na [stronie zaufania](https://trust.openclaw.ai).
</Note>

## Sposoby wnoszenia wkładu

**Dodaj zagrożenie.** Otwórz zgłoszenie w repozytorium [openclaw/trust](https://github.com/openclaw/trust/issues), opisując scenariusz ataku własnymi słowami. Pomocne, ale niewymagane informacje:

- Scenariusz ataku i sposób, w jaki można go wykorzystać.
- Komponenty, których dotyczy zagrożenie (CLI, Gateway, kanały, ClawHub, serwery MCP itp.).
- Twoja ocena dotkliwości (niska / średnia / wysoka / krytyczna).
- Odnośniki do powiązanych badań, podatności CVE lub rzeczywistych przykładów.

Opiekunowie przypisują mapowanie ATLAS, identyfikator zagrożenia i poziom ryzyka podczas przeglądu.

**Zaproponuj środek zaradczy.** Otwórz zgłoszenie lub PR z odniesieniem do zagrożenia. Propozycja powinna być konkretna i możliwa do wdrożenia: „ograniczenie liczby wiadomości na nadawcę do 10 na minutę na poziomie Gateway” jest bardziej użyteczne niż „wdrożyć ograniczanie liczby żądań”.

**Zaproponuj łańcuch ataków.** Łańcuchy ataków pokazują, jak wiele zagrożeń może połączyć się w realistyczny scenariusz. Opisz kroki i sposób, w jaki atakujący mógłby je połączyć; krótki opis jest lepszy niż formalny szablon.

**Popraw lub ulepsz istniejącą treść.** Literówki, doprecyzowania, nieaktualne informacje, lepsze przykłady — zachęcamy do przesyłania PR-ów, bez konieczności wcześniejszego otwierania zgłoszenia.

## Informacje o strukturze

Zagrożenia są mapowane na [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), strukturę zagrożeń specyficznych dla AI/ML, takich jak wstrzykiwanie poleceń, niewłaściwe użycie narzędzi i wykorzystywanie agentów. Znajomość ATLAS nie jest wymagana do wniesienia wkładu; opiekunowie mapują zgłoszenia podczas przeglądu.

**Identyfikatory zagrożeń.** Każde zagrożenie otrzymuje identyfikator, taki jak `T-EXEC-003`, przypisywany przez opiekunów podczas przeglądu.

| Kod     | Kategoria                                     |
| ------- | --------------------------------------------- |
| RECON   | Rozpoznanie — zbieranie informacji            |
| ACCESS  | Uzyskanie początkowego dostępu                 |
| EXEC    | Wykonanie — uruchamianie złośliwych działań   |
| PERSIST | Utrzymywanie dostępu                           |
| EVADE   | Omijanie zabezpieczeń — unikanie wykrycia     |
| DISC    | Odkrywanie — poznawanie środowiska            |
| EXFIL   | Eksfiltracja — wykradanie danych              |
| IMPACT  | Wpływ — wyrządzanie szkód lub zakłóceń        |

**Poziomy ryzyka.** Jeśli nie masz pewności co do poziomu, po prostu opisz skutki; opiekunowie dokonają oceny.

| Poziom        | Znaczenie                                                                  |
| ------------- | -------------------------------------------------------------------------- |
| **Krytyczny** | Pełne przejęcie systemu albo wysokie prawdopodobieństwo i krytyczne skutki |
| **Wysoki**    | Prawdopodobne znaczne szkody albo średnie prawdopodobieństwo i krytyczne skutki |
| **Średni**    | Umiarkowane ryzyko albo niskie prawdopodobieństwo i poważne skutki         |
| **Niski**     | Mało prawdopodobne i ograniczone skutki                                    |

## Proces przeglądu

1. **Wstępna kwalifikacja** — nowe zgłoszenia są przeglądane w ciągu 48 godzin.
2. **Ocena** — opiekunowie weryfikują wykonalność, przypisują mapowanie ATLAS i identyfikator zagrożenia oraz zatwierdzają poziom ryzyka.
3. **Dokumentacja** — kontrola formatowania i kompletności.
4. **Scalenie** — dodanie do modelu zagrożeń i wizualizacji.

## Zasoby

- [Witryna ATLAS](https://atlas.mitre.org/)
- [Techniki ATLAS](https://atlas.mitre.org/techniques/)
- [Studia przypadków ATLAS](https://atlas.mitre.org/studies/)

## Kontakt

- **Podatności bezpieczeństwa:** instrukcje zgłaszania znajdują się na [stronie zaufania](https://trust.openclaw.ai); można też napisać na adres `security@openclaw.ai`.
- **Pytania dotyczące modelu zagrożeń:** otwórz zgłoszenie w repozytorium [openclaw/trust](https://github.com/openclaw/trust/issues).
- **Czat ogólny:** kanał Discord `#security`.

## Uznanie

Autorzy wkładu w model zagrożeń są wymieniani w podziękowaniach w modelu zagrożeń i informacjach o wydaniu, a w przypadku znaczącego wkładu także w galerii sław bezpieczeństwa OpenClaw.

## Powiązane materiały

- [Model zagrożeń](/pl/security/THREAT-MODEL-ATLAS)
- [Reagowanie na incydenty](/pl/security/incident-response)
- [Weryfikacja formalna](/pl/security/formal-verification)
