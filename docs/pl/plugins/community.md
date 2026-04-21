---
read_when:
    - Chcesz znaleźć zewnętrzne pluginy OpenClaw
    - Chcesz opublikować albo dodać swój własny Plugin do listy
summary: 'Pluginy OpenClaw utrzymywane przez społeczność: przeglądanie, instalacja i zgłaszanie własnych'
title: Pluginy społecznościowe
x-i18n:
    generated_at: "2026-04-21T09:57:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59be629cc5e271cec459eaaaa587487a4225a12f721ec22a3fefa3f29ac057fa
    source_path: plugins/community.md
    workflow: 15
---

# Pluginy społecznościowe

Pluginy społecznościowe to pakiety firm trzecich, które rozszerzają OpenClaw o nowe
kanały, narzędzia, dostawców albo inne możliwości. Są tworzone i utrzymywane
przez społeczność, publikowane w [ClawHub](/pl/tools/clawhub) albo npm i
instalowane jednym poleceniem.

ClawHub jest kanoniczną powierzchnią odkrywania pluginów społecznościowych. Nie otwieraj
PR-ów tylko do dokumentacji wyłącznie po to, aby dodać tutaj swój Plugin dla większej wykrywalności; opublikuj go
zamiast tego w ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw najpierw sprawdza ClawHub i automatycznie przechodzi zapasowo do npm.

## Wymienione pluginy

### Apify

Zbieraj dane z dowolnej strony internetowej przy użyciu ponad 20 000 gotowych scraperów. Pozwól swojemu agentowi
wyodrębniać dane z Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, serwisów e-commerce i nie tylko — po prostu o to prosząc.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Niezależny mostek OpenClaw do rozmów Codex App Server. Powiąż czat z
wątkiem Codex, rozmawiaj z nim zwykłym tekstem i steruj nim za pomocą natywnych
dla czatu poleceń do wznawiania, planowania, review, wyboru modelu, Compaction i nie tylko.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integracja robota korporacyjnego przy użyciu trybu Stream. Obsługuje tekst, obrazy i
wiadomości plikowe przez dowolnego klienta DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin Lossless Context Management dla OpenClaw. Oparte na DAG
podsumowywanie rozmów z przyrostową Compaction — zachowuje pełną wierność kontekstu
przy jednoczesnym zmniejszaniu użycia tokenów.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Oficjalny Plugin, który eksportuje ślady agentów do Opik. Monitoruj zachowanie agenta,
koszt, tokeny, błędy i nie tylko.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Nadaj swojemu agentowi OpenClaw awatar Live2D z synchronizacją ust w czasie rzeczywistym, ekspresją
emocji i syntezą mowy. Zawiera narzędzia twórcy do generowania zasobów AI
oraz wdrażanie jednym kliknięciem do Prometheus Marketplace. Obecnie w wersji alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Połącz OpenClaw z QQ przez QQ Bot API. Obsługuje czaty prywatne, wzmianki grupowe,
wiadomości kanałowe oraz rozbudowane multimedia, w tym głos, obrazy, wideo
i pliki.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin kanału WeCom dla OpenClaw od zespołu Tencent WeCom. Oparty na
trwałych połączeniach WebSocket WeCom Bot, obsługuje wiadomości bezpośrednie i czaty grupowe,
odpowiedzi strumieniowe, proaktywne wiadomości, przetwarzanie obrazów/plików, formatowanie Markdown,
wbudowaną kontrolę dostępu oraz Skills do dokumentów/spotkań/wiadomości.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Zgłoś swój Plugin

Zapraszamy pluginy społecznościowe, które są przydatne, udokumentowane i bezpieczne w obsłudze.

<Steps>
  <Step title="Publikuj w ClawHub albo npm">
    Twój Plugin musi dać się zainstalować przez `openclaw plugins install \<package-name\>`.
    Opublikuj go w [ClawHub](/pl/tools/clawhub) (preferowane) albo npm.
    Zobacz [Tworzenie pluginów](/pl/plugins/building-plugins), aby uzyskać pełny przewodnik.

  </Step>

  <Step title="Hostuj na GitHub">
    Kod źródłowy musi znajdować się w publicznym repozytorium z dokumentacją konfiguracji i
    trackerem zgłoszeń.

  </Step>

  <Step title="Używaj PR-ów do dokumentacji tylko przy zmianach w dokumentach źródłowych">
    Nie potrzebujesz PR-a do dokumentacji tylko po to, aby Twój Plugin był łatwiejszy do znalezienia. Opublikuj go
    zamiast tego w ClawHub.

    Otwórz PR do dokumentacji tylko wtedy, gdy dokumenty źródłowe OpenClaw wymagają rzeczywistej
    zmiany treści, na przykład poprawienia instrukcji instalacji albo dodania międzyrepozytoryjnej
    dokumentacji, która należy do głównego zestawu dokumentów.

  </Step>
</Steps>

## Próg jakości

| Wymaganie                 | Dlaczego                                      |
| ------------------------- | --------------------------------------------- |
| Opublikowany w ClawHub albo npm | Użytkownicy muszą mieć działające `openclaw plugins install` |
| Publiczne repozytorium GitHub | Przegląd kodu źródłowego, śledzenie zgłoszeń, przejrzystość |
| Dokumentacja konfiguracji i użycia | Użytkownicy muszą wiedzieć, jak to skonfigurować |
| Aktywne utrzymanie        | Ostatnie aktualizacje albo responsywna obsługa zgłoszeń |

Niskonakładowe wrappery, niejasna własność albo nieutrzymywane pakiety mogą zostać odrzucone.

## Powiązane

- [Instalowanie i konfigurowanie pluginów](/pl/tools/plugin) — jak zainstalować dowolny Plugin
- [Tworzenie pluginów](/pl/plugins/building-plugins) — stwórz własny
- [Manifest Pluginu](/pl/plugins/manifest) — schemat manifestu
