---
read_when:
    - Chcesz znaleźć zewnętrzne pluginy OpenClaw
    - Chcesz opublikować lub dodać do listy własny Plugin
summary: 'Pluginy OpenClaw utrzymywane przez społeczność: przeglądaj, instaluj i zgłaszaj własne'
title: Pluginy społeczności
x-i18n:
    generated_at: "2026-04-30T10:06:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9685aaf141b739a2a745a6184201ac86689e4284bec6eb068ffbd0d53fb4ecf1
    source_path: plugins/community.md
    workflow: 16
---

Pluginy społecznościowe to pakiety innych firm, które rozszerzają OpenClaw o nowe
kanały, narzędzia, dostawców lub inne możliwości. Są tworzone i utrzymywane
przez społeczność, zwykle publikowane w [ClawHub](/pl/tools/clawhub), i możliwe do
zainstalowania jednym poleceniem. Npm pozostaje obsługiwanym rozwiązaniem
awaryjnym dla pakietów, które nie zostały jeszcze przeniesione do ClawHub.

ClawHub to kanoniczne miejsce odkrywania pluginów społecznościowych. Nie otwieraj
PR-ów dotyczących tylko dokumentacji wyłącznie po to, aby dodać tutaj swój plugin
dla lepszej widoczności; zamiast tego opublikuj go w ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw najpierw sprawdza ClawHub, a następnie automatycznie przechodzi awaryjnie do npm.

## Wymienione pluginy

### Apify

Pobieraj dane z dowolnej witryny za pomocą ponad 20 000 gotowych scraperów.
Pozwól agentowi wyodrębniać dane z Instagram, Facebook, TikTok, YouTube, Google
Maps, Google Search, witryn e-commerce i nie tylko — po prostu przez zapytanie.

- **npm:** `@apify/apify-openclaw-plugin`
- **repozytorium:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Niezależny most OpenClaw dla konwersacji Codex App Server. Powiąż czat z wątkiem
Codex, rozmawiaj z nim zwykłym tekstem i steruj nim za pomocą natywnych dla czatu
poleceń do wznawiania, planowania, przeglądu, wyboru modelu, Compaction i nie tylko.

- **npm:** `openclaw-codex-app-server`
- **repozytorium:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integracja robota korporacyjnego używająca trybu Stream. Obsługuje wiadomości
tekstowe, obrazy i pliki przez dowolnego klienta DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repozytorium:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin Lossless Context Management dla OpenClaw. Oparte na DAG podsumowywanie
konwersacji z przyrostową kompresją — zachowuje pełną wierność kontekstu,
zmniejszając jednocześnie użycie tokenów.

- **npm:** `@martian-engineering/lossless-claw`
- **repozytorium:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Oficjalny plugin, który eksportuje ślady agentów do Opik. Monitoruj zachowanie
agenta, koszt, tokeny, błędy i nie tylko.

- **npm:** `@opik/opik-openclaw`
- **repozytorium:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Nadaj swojemu agentowi OpenClaw awatar Live2D z synchronizacją ruchu ust w czasie
rzeczywistym, ekspresjami emocji i syntezą mowy. Zawiera narzędzia twórcze do
generowania zasobów AI i wdrożenia jednym kliknięciem w Prometheus Marketplace.
Obecnie w wersji alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repozytorium:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Połącz OpenClaw z QQ przez QQ Bot API. Obsługuje czaty prywatne, wzmianki
grupowe, wiadomości kanałowe oraz multimedia, w tym głos, obrazy, filmy i pliki.

Bieżące wydania OpenClaw zawierają QQ Bot. Użyj wbudowanej konfiguracji w
[QQ Bot](/pl/channels/qqbot) dla normalnych instalacji; zainstaluj ten zewnętrzny
plugin tylko wtedy, gdy celowo chcesz samodzielny pakiet utrzymywany przez Tencent.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repozytorium:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin kanału WeCom dla OpenClaw od zespołu Tencent WeCom. Działa w oparciu o
trwałe połączenia WeCom Bot WebSocket i obsługuje wiadomości bezpośrednie oraz
czaty grupowe, odpowiedzi strumieniowe, proaktywne wiadomości, przetwarzanie
obrazów/plików, formatowanie Markdown, wbudowaną kontrolę dostępu oraz Skills
dotyczące dokumentów, spotkań i wiadomości.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repozytorium:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Plugin kanału Yuanbao dla OpenClaw od zespołu Tencent Yuanbao. Działa w oparciu
o trwałe połączenia WebSocket i obsługuje wiadomości bezpośrednie oraz czaty
grupowe, odpowiedzi strumieniowe, proaktywne wiadomości, przetwarzanie
obrazów/plików/audio/wideo, formatowanie Markdown, wbudowaną kontrolę dostępu
oraz menu poleceń ukośnikowych.

- **npm:** `openclaw-plugin-yuanbao`
- **repozytorium:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Zgłoś swój plugin

Przyjmujemy pluginy społecznościowe, które są użyteczne, udokumentowane i bezpieczne w obsłudze.

<Steps>
  <Step title="Opublikuj w ClawHub lub npm">
    Twój plugin musi dać się zainstalować przez `openclaw plugins install \<package-name\>`.
    Opublikuj go w [ClawHub](/pl/tools/clawhub), chyba że konkretnie potrzebujesz
    dystrybucji tylko przez npm.
    Zobacz [Tworzenie pluginów](/pl/plugins/building-plugins), aby poznać pełny przewodnik.

  </Step>

  <Step title="Hostuj na GitHub">
    Kod źródłowy musi znajdować się w publicznym repozytorium z dokumentacją
    konfiguracji i systemem śledzenia zgłoszeń.

  </Step>

  <Step title="Używaj PR-ów do dokumentacji tylko dla zmian w dokumentacji źródłowej">
    Nie potrzebujesz PR-a do dokumentacji tylko po to, aby Twój plugin był
    odkrywalny. Zamiast tego opublikuj go w ClawHub.

    Otwórz PR do dokumentacji tylko wtedy, gdy dokumentacja źródłowa OpenClaw
    wymaga rzeczywistej zmiany treści, takiej jak poprawienie wskazówek
    instalacyjnych lub dodanie dokumentacji międzyrepozytoryjnej, która należy
    do głównego zestawu dokumentacji.

  </Step>
</Steps>

## Poziom jakości

| Wymaganie                  | Dlaczego                                     |
| -------------------------- | -------------------------------------------- |
| Opublikowany w ClawHub lub npm | Użytkownicy potrzebują działającego `openclaw plugins install` |
| Publiczne repozytorium GitHub | Przegląd źródeł, śledzenie zgłoszeń, przejrzystość |
| Dokumentacja konfiguracji i użycia | Użytkownicy muszą wiedzieć, jak go skonfigurować |
| Aktywne utrzymanie         | Ostatnie aktualizacje lub responsywna obsługa zgłoszeń |

Niskiej jakości wrappery, niejasna własność lub nieutrzymywane pakiety mogą zostać odrzucone.

## Powiązane

- [Instalowanie i konfigurowanie pluginów](/pl/tools/plugin) — jak zainstalować dowolny plugin
- [Tworzenie pluginów](/pl/plugins/building-plugins) — utwórz własny
- [Manifest Plugin](/pl/plugins/manifest) — schemat manifestu
