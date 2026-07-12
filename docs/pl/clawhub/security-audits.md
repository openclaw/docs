---
read_when:
    - Interpretowanie wyników audytu bezpieczeństwa ClawHub
    - Podejmowanie decyzji o instalacji Skills lub Pluginu
    - Wyjaśnianie statusu audytu ClawHub, poziomu ryzyka lub ustaleń
sidebarTitle: Security Audits
summary: Jak interpretować wyniki audytu bezpieczeństwa ClawHub przed zainstalowaniem Skills lub pluginu.
title: Audyty bezpieczeństwa
x-i18n:
    generated_at: "2026-07-12T14:58:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Audyty bezpieczeństwa

Audyty bezpieczeństwa ClawHub pomagają zdecydować, czy dana umiejętność lub Plugin są wystarczająco bezpieczne
do zainstalowania. Pokazują, co robi wydanie, o jakie uprawnienia prosi oraz
czy przed uzyskaniem dostępu do plików, kont, danych uwierzytelniających, kodu lub usług zewnętrznych
cokolwiek wymaga dodatkowej uwagi.

Audyty stanowią istotny sygnał dotyczący bezpieczeństwa, ale nie gwarantują, że wydanie jest
pozbawione ryzyka. Przed przyznaniem dostępu do zasobów wrażliwych zawsze kieruj się własnym osądem.

Zobacz także [Bezpieczeństwo](/clawhub/security), [Dopuszczalne użytkowanie](/clawhub/acceptable-usage)
oraz [Moderowanie i bezpieczeństwo konta](/clawhub/moderation).

## Co sprawdzić przed instalacją

Przed instalacją sprawdź:

- ogólny stan audytu
- poziom ryzyka
- wszystkie wymienione ustalenia
- wymagane dane uwierzytelniające, uprawnienia lub zmienne środowiskowe
- właściciela, źródło, wersję, dziennik zmian, liczbę pobrań, gwiazdki i inne sygnały zaufania

Instaluj wyłącznie treści, które rozumiesz i którym ufasz.

## Stan audytu

Stan audytu wskazuje, jak zareagować na jego wynik:

| Stan        | Znaczenie                                                                        |
| ----------- | -------------------------------------------------------------------------------- |
| `Pass`      | Nie wykryto widocznego problemu o ryzyku wyższym niż niskie.                     |
| `Review`    | Przed instalacją przeczytaj ustalenia. Wydanie nadal może być prawidłowe.         |
| `Warn`      | Zachowaj szczególną ostrożność. ClawHub wykrył poważny problem lub sygnał ostrzegawczy. |
| `Malicious` | Nie instaluj.                                                                    |
| `Pending`   | Audyty nie zostały jeszcze ukończone.                                            |
| `Error`     | Nie udało się ukończyć audytu.                                                   |

Wynik `Pass` jest uspokajający, ale nie zastępuje własnej oceny. Ma to szczególne
znaczenie w przypadku narzędzi, które mogą publikować treści, edytować dane, uruchamiać polecenia, odczytywać pliki lub
uzyskiwać dostęp do systemów produkcyjnych.

## Poziom ryzyka

Poziom ryzyka opisuje zasięg potencjalnych skutków: jak duże możliwości wydaje się mieć wydanie, jeśli
używasz go zgodnie z przeznaczeniem.

| Poziom ryzyka | Znaczenie                                                                          |
| ------------- | ---------------------------------------------------------------------------------- |
| `Low`         | Wykryto niewielkie uprawnienia do zasobów wrażliwych lub niewielki wpływ na użytkownika. |
| `Medium`      | Wydanie ma istotne uprawnienia, takie jak dostęp do konta lub możliwość zmiany danych. |
| `High`        | Wydanie ma uprawnienia o dużym wpływie, poważne ustalenia lub sygnały złośliwości. |

Poziom ryzyka i stan audytu odpowiadają na różne pytania:

- Poziom ryzyka odpowiada na pytanie: „Jak duże możliwości są tutaj dostępne?”
- Stan audytu odpowiada na pytanie: „Co należy zrobić z tym wynikiem?”

Na przykład umiejętność publikowania może mieć stan `Review` i ryzyko `Medium`. Nie
oznacza to, że jest złośliwa. Oznacza to, że umiejętność wydaje się zgodna z przeznaczeniem, ale może
działać z istotnymi uprawnieniami do konta.

## Ustalenia

Ustalenia wyjaśniają, dlaczego wyświetlono dany wynik audytu. Każde ustalenie zwykle obejmuje:

- co oznacza
- dlaczego zostało oznaczone
- odpowiednią treść umiejętności lub Pluginu
- zalecenie

Ustalenia mogą mieć etykiety `Info`, `Low`, `Medium`, `High` lub `Critical`. Ustalenia o wyższej
wadze mają większy wpływ na poziom ryzyka i stan audytu.

Ustalenia o niskim poziomie pewności są ukrywane w publicznym podsumowaniu audytu, aby strona
koncentrowała się na przydatnych dowodach.

## Co sprawdza ClawHub

ClawHub audytuje przesłane artefakty wydań, w tym:

- instrukcje umiejętności lub metadane Pluginu
- zadeklarowane zmienne środowiskowe i uprawnienia
- instrukcje instalacji i metadane pakietu
- dołączone pliki i manifesty plików
- metadane zgodności i możliwości

Główne pytanie dotyczy spójności: czy nazwa, podsumowanie, metadane, żądane
uprawnienia i rzeczywista zawartość odpowiadają temu, czego użytkownicy mogliby rozsądnie oczekiwać?

Rozbudowane możliwości nie są automatycznie czymś złym. Wiele przydatnych narzędzi potrzebuje danych uwierzytelniających,
lokalnych poleceń, interfejsów API dostawców lub instalacji pakietów. Audyt sprawdza, czy takie
możliwości są oczekiwane, ujawnione i proporcjonalne.

Strony artefaktów zawierają odsyłacz do pełnego audytu pod adresem:

```text
/<owner>/skills/<slug>/security-audit
```

Strona audytu łączy wyniki:

1. SkillSpector
2. VirusTotal
3. Analizy ryzyka

## VirusTotal

ClawHub używa VirusTotal jako źródła telemetrii dotyczącej złośliwego oprogramowania w systemie audytów. VirusTotal jest
zaufanym standardem branżowym w zakresie reputacji plików i skanowania złośliwego oprogramowania, a nasze
partnerstwo pozwala ClawHub uwzględniać szersze dane analityczne dotyczące bezpieczeństwa podczas oceny umiejętności i Pluginów.

VirusTotal jest szczególnie przydatny w przypadku znanych złośliwych artefaktów, wykryć przez silniki oraz
sygnałów reputacji, które uzupełniają ocenę ClawHub uwzględniającą specyfikę agentów. Gdy dostępne są
wyniki poszczególnych silników dostawców, audyt podsumowuje je prostym językiem, na przykład:

```text
62/62 vendors flagged this skill as clean.
```

lub:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Gdy ClawHub nie ma danych telemetrycznych o liczbie wyników dostawców, które można podsumować, audyt informuje:

```text
No VirusTotal findings
```

VirusTotal pozostaje źródłem telemetrii. Nie zastępuje własnej analizy ryzyka ClawHub,
która uwzględnia specyfikę artefaktów.

## Analiza ryzyka

Analizę ryzyka wewnętrznie obsługuje ClawScan, własny system audytów bezpieczeństwa
ClawHub. Ocenia on każde wydanie jako artefakt przeznaczony dla agenta: instrukcje,
metadane, zadeklarowane uprawnienia, pliki, sygnały możliwości, sygnały skanowania statycznego,
ustalenia SkillSpector, telemetrię VirusTotal oraz kontekst przekazany przez wydawcę.
Sygnały skanowania statycznego stanowią wewnętrzny kontekst tej oceny; nie są
samodzielną publiczną sekcją audytu ani werdyktem blokującym instalację.

Analiza ryzyka wykorzystuje
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
jako punkt odniesienia dla zagrożeń takich jak wstrzykiwanie instrukcji, niewłaściwe użycie narzędzi, ujawnienie danych uwierzytelniających,
niebezpieczne wykonywanie kodu, zatruwanie pamięci lub kontekstu oraz nadmierna samodzielność.

ClawScan nie uznaje groźnie wyglądającej możliwości za automatycznie złośliwą.
Sprawdza, czy możliwość została ujawniona, jest zgodna z przeznaczeniem i znajduje uzasadnienie
w zadeklarowanym przypadku użycia wydania.
