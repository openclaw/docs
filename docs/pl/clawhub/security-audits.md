---
read_when:
    - Zrozumienie wyników audytu bezpieczeństwa ClawHub
    - Decydowanie, czy zainstalować skill, czy plugin
    - Wyjaśnianie statusu audytu ClawHub, poziomu ryzyka lub ustaleń
sidebarTitle: Security Audits
summary: Jak rozumieć wyniki audytu bezpieczeństwa ClawHub przed zainstalowaniem skill lub pluginu.
title: Audyty bezpieczeństwa
x-i18n:
    generated_at: "2026-07-01T08:32:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Audyty bezpieczeństwa

Audyty bezpieczeństwa ClawHub pomagają zdecydować, czy umiejętność lub plugin są wystarczająco bezpieczne
do zainstalowania. Pokazują, co robi wydanie, o jakie uprawnienia prosi oraz
czy coś wymaga dodatkowej uwagi, zanim uzyska dostęp do plików, kont,
poświadczeń, kodu lub usług zewnętrznych.

Audyty są silnymi sygnałami bezpieczeństwa, ale nie gwarantują, że wydanie jest
wolne od ryzyka. Zawsze kieruj się własną oceną przed przyznaniem wrażliwego dostępu.

Zobacz też [Bezpieczeństwo](/clawhub/security), [Dopuszczalne użycie](/pl/clawhub/acceptable-usage)
oraz [Moderacja i bezpieczeństwo konta](/clawhub/moderation).

## Co sprawdzić przed instalacją

Przed instalacją przejrzyj:

- ogólny status audytu
- poziom ryzyka
- wszystkie wymienione ustalenia
- wymagane poświadczenia, uprawnienia lub zmienne środowiskowe
- właściciela, źródło, wersję, dziennik zmian, pobrania, gwiazdki i inne sygnały zaufania

Instaluj tylko treści, które rozumiesz i którym ufasz.

## Status audytu

Status audytu mówi, jak zareagować na wynik audytu:

| Status      | Znaczenie                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Nie znaleziono widocznego problemu powyżej niskiego ryzyka.                                |
| `Review`    | Przeczytaj ustalenia przed instalacją. Wydanie nadal może być prawidłowe. |
| `Warn`      | Zachowaj szczególną ostrożność. ClawHub znalazł problem o dużym wpływie lub sygnał ostrzegawczy. |
| `Malicious` | Nie instaluj.                                                           |
| `Pending`   | Audyty nie zostały jeszcze zakończone.                                             |
| `Error`     | Nie udało się ukończyć audytu.                                         |

`Pass` uspokaja, ale nie zastępuje własnej oceny. Ma to największe znaczenie
w przypadku narzędzi, które mogą publikować treści, edytować dane, uruchamiać polecenia, czytać pliki lub
uzyskiwać dostęp do systemów produkcyjnych.

## Poziom ryzyka

Poziom ryzyka opisuje zasięg oddziaływania: jak dużą moc wydanie wydaje się mieć, jeśli
używasz go zgodnie z przeznaczeniem.

| Poziom ryzyka | Znaczenie                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Wykryto niewiele wrażliwych uprawnień lub wpływu na użytkownika.                          |
| `Medium`   | Wydanie ma istotne uprawnienia, takie jak dostęp do konta lub zmiany danych. |
| `High`     | Wydanie ma uprawnienia o dużym wpływie, poważne ustalenia lub złośliwe sygnały. |

Poziom ryzyka i status audytu odpowiadają na różne pytania:

- Poziom ryzyka pyta: „Ile mocy tu jest?”
- Status audytu pyta: „Co mam zrobić z tym wynikiem?”

Na przykład umiejętność publikowania może pokazywać `Review` z ryzykiem `Medium`. To
nie znaczy, że jest złośliwa. Oznacza, że umiejętność wygląda na zgodną z celem, ale może
działać z istotnymi uprawnieniami konta.

## Ustalenia

Ustalenia wyjaśniają, dlaczego pokazano dany wynik audytu. Każde ustalenie zwykle zawiera:

- co oznacza
- dlaczego zostało oznaczone
- odpowiednią treść umiejętności lub pluginu
- rekomendację

Ustalenia mogą być oznaczone jako `Info`, `Low`, `Medium`, `High` lub `Critical`. Ustalenia o wyższej
wadze silniej wpływają na poziom ryzyka i status audytu.

Ustalenia o niskiej pewności są ukrywane przed publicznym podsumowaniem audytu, aby strona
pozostała skupiona na użytecznych dowodach.

## Co sprawdza ClawHub

ClawHub audytuje przesłane artefakty wydań, w tym:

- instrukcje umiejętności lub metadane pluginu
- zadeklarowane zmienne środowiskowe i uprawnienia
- instrukcje instalacji i metadane pakietu
- dołączone pliki i manifesty plików
- metadane zgodności i możliwości

Główne pytanie dotyczy spójności: czy nazwa, podsumowanie, metadane, żądane
uprawnienia i rzeczywista treść zgadzają się z tym, czego użytkownicy mogliby rozsądnie oczekiwać?

Potężne zachowanie nie jest automatycznie złe. Wiele użytecznych narzędzi potrzebuje poświadczeń,
lokalnych poleceń, interfejsów API dostawców lub instalacji pakietów. Audyt sprawdza, czy ta
moc jest oczekiwana, ujawniona i proporcjonalna.

Strony artefaktów prowadzą do pełnego audytu pod adresem:

```text
/<owner>/skills/<slug>/security-audit
```

Strona audytu łączy:

1. SkillSpector
2. VirusTotal
3. analizę ryzyka

## VirusTotal

ClawHub używa VirusTotal jako telemetrii złośliwego oprogramowania w stosie audytu. VirusTotal jest
zaufanym standardem branżowym do reputacji plików i skanowania złośliwego oprogramowania, a nasze
partnerstwo pozwala ClawHub dodać szerszą analizę bezpieczeństwa do przeglądu umiejętności i pluginów.

VirusTotal jest szczególnie przydatny przy znanych złośliwych artefaktach, trafieniach silników oraz
sygnałach reputacji, które uzupełniają przegląd ClawHub świadomy agentów. Gdy dostępne są
liczby silników dostawców, audyt podsumowuje je prostym językiem, na przykład:

```text
62/62 dostawców oznaczyło tę umiejętność jako czystą.
```

lub:

```text
2/64 dostawców oznaczyło tę umiejętność jako złośliwą, 1/64 oznaczył ją jako podejrzaną, a 61/64 oznaczyło ją jako czystą.
```

Gdy ClawHub nie ma telemetrii liczby dostawców do podsumowania, audyt mówi:

```text
Brak ustaleń VirusTotal
```

VirusTotal pozostaje telemetrią. Nie zastępuje własnej, świadomej artefaktów
analizy ryzyka ClawHub.

## Analiza ryzyka

Analiza ryzyka jest wewnętrznie obsługiwana przez ClawScan, własny system audytów bezpieczeństwa
ClawHub. Przegląda każde wydanie jako artefakt skierowany do agenta: instrukcje,
metadane, zadeklarowane uprawnienia, pliki, sygnały możliwości, sygnały skanowania statycznego,
ustalenia SkillSpector, telemetrię VirusTotal oraz kontekst podany przez wydawcę.
Sygnały skanowania statycznego są wewnętrznym kontekstem dla tego przeglądu; nie są
samodzielną publiczną sekcją audytu ani werdyktem blokującym instalację.

Analiza ryzyka używa
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
jako perspektywy dla ryzyk takich jak wstrzykiwanie promptów, niewłaściwe użycie narzędzi, ujawnienie poświadczeń,
niebezpieczne wykonywanie, zatruwanie pamięci lub kontekstu oraz nadmierna sprawczość.

ClawScan nie traktuje groźnie wyglądającej możliwości jako automatycznie złośliwej.
Pyta, czy możliwość jest ujawniona, zgodna z celem i wspierana przez
deklarowany przypadek użycia wydania.
