---
read_when:
    - Chcesz używać GitHub Copilot jako providera modeli
    - Potrzebujesz przepływu `openclaw models auth login-github-copilot`
summary: Zaloguj się do GitHub Copilot z OpenClaw za pomocą przepływu device flow
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-05T14:03:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92857c119c314e698f922dbdbbc15d21b64d33a25979a2ec0ac1e82e586db6d6
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

## Czym jest GitHub Copilot?

GitHub Copilot to asystent programowania AI od GitHub. Zapewnia dostęp do modeli
Copilot dla Twojego konta i planu GitHub. OpenClaw może używać Copilot jako
providera modeli na dwa różne sposoby.

## Dwa sposoby używania Copilot w OpenClaw

### 1) Wbudowany provider GitHub Copilot (`github-copilot`)

Użyj natywnego przepływu logowania urządzenia, aby uzyskać token GitHub, a następnie wymienić go na
tokeny API Copilot podczas działania OpenClaw. To **domyślna** i najprostsza ścieżka,
ponieważ nie wymaga VS Code.

### 2) Wtyczka Copilot Proxy (`copilot-proxy`)

Użyj rozszerzenia VS Code **Copilot Proxy** jako lokalnego mostu. OpenClaw komunikuje się z
endpointem `/v1` proxy i używa listy modeli skonfigurowanej w tym miejscu. Wybierz tę opcję,
jeśli już używasz Copilot Proxy w VS Code lub musisz kierować ruch przez nie.
Musisz włączyć wtyczkę i utrzymywać uruchomione rozszerzenie VS Code.

Używaj GitHub Copilot jako providera modeli (`github-copilot`). Polecenie logowania uruchamia
przepływ device flow GitHub, zapisuje profil uwierzytelniania i aktualizuje konfigurację tak, aby używała tego
profilu.

## Konfiguracja CLI

```bash
openclaw models auth login-github-copilot
```

Pojawi się prośba o odwiedzenie adresu URL i wprowadzenie jednorazowego kodu. Pozostaw terminal
otwarty do czasu zakończenia procesu.

### Opcjonalne skrypty

```bash
openclaw models auth login-github-copilot --yes
```

Aby w jednym kroku zastosować również zalecany domyślny model providera, użyj zamiast tego
ogólnego polecenia uwierzytelniania:

```bash
openclaw models auth login --provider github-copilot --method device --set-default
```

## Ustaw model domyślny

```bash
openclaw models set github-copilot/gpt-4o
```

### Fragment konfiguracji

```json5
{
  agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
}
```

## Uwagi

- Wymaga interaktywnego TTY; uruchom polecenie bezpośrednio w terminalu.
- Dostępność modeli Copilot zależy od Twojego planu; jeśli model zostanie odrzucony, spróbuj
  innego identyfikatora (na przykład `github-copilot/gpt-4.1`).
- Identyfikatory modeli Claude automatycznie używają transportu Anthropic Messages; modele GPT, o-series
  i Gemini nadal używają transportu OpenAI Responses.
- Logowanie zapisuje token GitHub w magazynie profili uwierzytelniania i wymienia go na
  token API Copilot podczas działania OpenClaw.
