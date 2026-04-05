---
read_when:
    - Vuoi usare GitHub Copilot come provider di modelli
    - Hai bisogno del flusso `openclaw models auth login-github-copilot`
summary: Accedi a GitHub Copilot da OpenClaw usando il device flow
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-05T14:01:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92857c119c314e698f922dbdbbc15d21b64d33a25979a2ec0ac1e82e586db6d6
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

## Cos'è GitHub Copilot?

GitHub Copilot è l'assistente di coding AI di GitHub. Fornisce accesso ai
modelli Copilot per il tuo account e piano GitHub. OpenClaw può usare Copilot come
provider di modelli in due modi diversi.

## Due modi per usare Copilot in OpenClaw

### 1) Provider GitHub Copilot integrato (`github-copilot`)

Usa il flusso di login nativo del dispositivo per ottenere un token GitHub, poi scambialo con
token API Copilot quando OpenClaw è in esecuzione. Questo è il percorso **predefinito** e più semplice
perché non richiede VS Code.

### 2) Plugin Copilot Proxy (`copilot-proxy`)

Usa l'estensione VS Code **Copilot Proxy** come bridge locale. OpenClaw comunica con
l'endpoint `/v1` del proxy e usa l'elenco di modelli che configuri lì. Scegli questa opzione
se esegui già Copilot Proxy in VS Code o devi instradare il traffico attraverso di esso.
Devi abilitare il plugin e mantenere in esecuzione l'estensione VS Code.

Usa GitHub Copilot come provider di modelli (`github-copilot`). Il comando di login esegue
il device flow di GitHub, salva un profilo auth e aggiorna la tua config per usare quel
profilo.

## Configurazione CLI

```bash
openclaw models auth login-github-copilot
```

Ti verrà chiesto di visitare un URL e inserire un codice monouso. Tieni il terminale
aperto fino al completamento.

### Flag facoltativi

```bash
openclaw models auth login-github-copilot --yes
```

Per applicare anche in un solo passaggio il modello predefinito consigliato dal provider, usa invece
il comando auth generico:

```bash
openclaw models auth login --provider github-copilot --method device --set-default
```

## Imposta un modello predefinito

```bash
openclaw models set github-copilot/gpt-4o
```

### Frammento di config

```json5
{
  agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
}
```

## Note

- Richiede una TTY interattiva; eseguilo direttamente in un terminale.
- La disponibilità dei modelli Copilot dipende dal tuo piano; se un modello viene rifiutato, prova
  un altro ID (ad esempio `github-copilot/gpt-4.1`).
- Gli ID modello Claude usano automaticamente il trasporto Anthropic Messages; i modelli GPT, serie o
  e Gemini mantengono il trasporto OpenAI Responses.
- Il login memorizza un token GitHub nell'archivio dei profili auth e lo scambia con un
  token API Copilot quando OpenClaw è in esecuzione.
