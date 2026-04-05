---
read_when:
    - Chcesz znaleźć zewnętrzne pluginy OpenClaw
    - Chcesz opublikować lub dodać do listy własny plugin
summary: 'Pluginy społeczności OpenClaw: przeglądanie, instalacja i zgłaszanie własnych'
title: Pluginy społeczności
x-i18n:
    generated_at: "2026-04-05T14:00:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01804563a63399fe564b0cd9b9aadef32e5211b63d8467fdbbd1f988200728de
    source_path: plugins/community.md
    workflow: 15
---

# Pluginy społeczności

Pluginy społeczności to pakiety zewnętrzne, które rozszerzają OpenClaw o nowe
kanały, narzędzia, providery lub inne możliwości. Są tworzone i utrzymywane
przez społeczność, publikowane na [ClawHub](/tools/clawhub) lub npm, i
można je zainstalować jednym poleceniem.

ClawHub to kanoniczna powierzchnia odkrywania pluginów społeczności. Nie otwieraj
PR-ów tylko do dokumentacji tylko po to, aby dodać tutaj swój plugin dla większej wykrywalności; opublikuj go
zamiast tego na ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw najpierw sprawdza ClawHub, a następnie automatycznie przechodzi do npm.

## Wymienione pluginy

### Codex App Server Bridge

Niezależny most OpenClaw dla rozmów Codex App Server. Powiąż czat z
wątkiem Codex, rozmawiaj z nim zwykłym tekstem i steruj nim za pomocą natywnych dla czatu
poleceń do wznawiania, planowania, przeglądu, wyboru modelu, kompaktowania i nie tylko.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integracja robota korporacyjnego z użyciem trybu Stream. Obsługuje tekst, obrazy i
wiadomości plikowe przez dowolnego klienta DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin Lossless Context Management dla OpenClaw. Oparte na DAG podsumowywanie
rozmów z przyrostowym kompaktowaniem — zachowuje pełną wierność kontekstu
przy jednoczesnym zmniejszeniu zużycia tokenów.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Oficjalny plugin eksportujący ślady agenta do Opik. Monitoruj zachowanie agenta,
koszt, tokeny, błędy i nie tylko.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### QQbot

Połącz OpenClaw z QQ przez QQ Bot API. Obsługuje prywatne czaty, wzmianki w grupach,
wiadomości kanałowe oraz rozbudowane media, w tym głos, obrazy, wideo
i pliki.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin kanału WeCom dla OpenClaw od zespołu Tencent WeCom. Oparty na
trwałych połączeniach WebSocket WeCom Bot, obsługuje wiadomości bezpośrednie i czaty grupowe,
strumieniowane odpowiedzi, proaktywne wiadomości, przetwarzanie obrazów/plików, formatowanie Markdown,
wbudowaną kontrolę dostępu oraz Skills do dokumentów/spotkań/wiadomości.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Zgłoś swój plugin

Chętnie przyjmujemy pluginy społeczności, które są użyteczne, udokumentowane i bezpieczne w eksploatacji.

<Steps>
  <Step title="Opublikuj na ClawHub lub npm">
    Twój plugin musi być możliwy do zainstalowania przez `openclaw plugins install \<package-name\>`.
    Opublikuj go na [ClawHub](/tools/clawhub) (zalecane) lub npm.
    Pełny przewodnik znajdziesz w [Tworzenie pluginów](/plugins/building-plugins).

  </Step>

  <Step title="Hostuj na GitHub">
    Kod źródłowy musi znajdować się w publicznym repozytorium z dokumentacją konfiguracji i
    systemem zgłoszeń.

  </Step>

  <Step title="Używaj PR-ów do dokumentacji tylko przy zmianach dokumentacji źródłowej">
    Nie potrzebujesz PR-a do dokumentacji tylko po to, aby Twój plugin był wykrywalny. Opublikuj go
    zamiast tego na ClawHub.

    Otwórz PR do dokumentacji tylko wtedy, gdy dokumentacja źródłowa OpenClaw wymaga rzeczywistej zmiany
    treści, na przykład poprawienia wskazówek instalacji lub dodania dokumentacji
    międzyrepozytoryjnej, która należy do głównego zestawu dokumentacji.

  </Step>
</Steps>

## Wymagany poziom jakości

| Wymaganie                 | Dlaczego                                      |
| ------------------------- | --------------------------------------------- |
| Publikacja na ClawHub lub npm | Użytkownicy muszą mieć działające `openclaw plugins install` |
| Publiczne repozytorium GitHub | Przegląd źródeł, śledzenie zgłoszeń, przejrzystość |
| Dokumentacja konfiguracji i użycia | Użytkownicy muszą wiedzieć, jak to skonfigurować |
| Aktywne utrzymanie        | Ostatnie aktualizacje lub szybka obsługa zgłoszeń |

Wrappery niskiego wysiłku, niejasna własność albo nieutrzymywane pakiety mogą zostać odrzucone.

## Powiązane

- [Instalacja i konfiguracja pluginów](/tools/plugin) — jak zainstalować dowolny plugin
- [Tworzenie pluginów](/plugins/building-plugins) — utwórz własny
- [Manifest pluginu](/plugins/manifest) — schemat manifestu
